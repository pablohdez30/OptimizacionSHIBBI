// Persistencia del FileSystemDirectoryHandle en IndexedDB.
// Los handles no son serializables (no caben en localStorage) pero sí en IDB.

const DB_NAME = "shibbi";
const STORE_NAME = "handles";
const DB_VERSION = 1;
const HANDLE_KEY = "exportDir";

type AnyHandle = FileSystemDirectoryHandle;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDirHandle(handle: AnyHandle): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getDirHandle(): Promise<AnyHandle | null> {
  const db = await openDb();
  const handle = await new Promise<AnyHandle | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
    req.onsuccess = () => resolve((req.result as AnyHandle) || null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return handle;
}

export async function clearDirHandle(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/**
 * Verifica (y solicita si hace falta) permiso readwrite sobre el handle.
 * Devuelve true si el permiso está concedido.
 */
export async function verifyPermission(
  handle: AnyHandle,
  readWrite = true
): Promise<boolean> {
  const opts = { mode: readWrite ? "readwrite" : "read" } as const;
  // @ts-expect-error — queryPermission/requestPermission no están en los tipos base de TS
  if ((await handle.queryPermission(opts)) === "granted") return true;
  // @ts-expect-error — idem
  if ((await handle.requestPermission(opts)) === "granted") return true;
  return false;
}

/** Crea (o reutiliza) una subcarpeta recursiva dentro del handle. */
export async function ensureSubDir(
  root: AnyHandle,
  parts: string[]
): Promise<AnyHandle> {
  let current = root;
  for (const p of parts) {
    current = await current.getDirectoryHandle(p, { create: true });
  }
  return current;
}

/** True si el error delata que un archivo está abierto/bloqueado por otra app. */
function looksLikeLockedFile(e: unknown): boolean {
  const err = e as Error;
  const msg = err?.message || "";
  const name = err?.name || "";
  return (
    name === "NotAllowedError" ||
    name === "NoModificationAllowedError" ||
    name === "InvalidStateError" ||
    /open|in use|sharing|locked|busy|state cached|changed since it was read/i.test(
      msg
    )
  );
}

function lockedFileError(filenames: string[]): Error {
  const list = filenames.length === 1 ? `"${filenames[0]}"` : filenames.map((f) => `"${f}"`).join(", ");
  return new Error(
    `No se pudo escribir ${list}. Es probable que alguno esté abierto en otra aplicación (Excel, Adobe Reader…). Ciérralo e inténtalo de nuevo.`
  );
}

/** Escribe un Blob a {root}/{subParts}/{filename}. Sobrescribe si ya existe. */
export async function writeBlob(
  root: AnyHandle,
  subParts: string[],
  filename: string,
  blob: Blob
): Promise<void> {
  const dir = await ensureSubDir(root, subParts);
  const fileHandle = await dir.getFileHandle(filename, { create: true });
  let writable: FileSystemWritableFileStream;
  try {
    writable = await fileHandle.createWritable();
  } catch (e) {
    if (looksLikeLockedFile(e)) throw lockedFileError([filename]);
    throw e;
  }
  try {
    await writable.write(blob);
    await writable.close();
  } catch (e) {
    try {
      await writable.abort();
    } catch {
      /* noop */
    }
    if (looksLikeLockedFile(e)) throw lockedFileError([filename]);
    throw e;
  }
}

export type AtomicTarget = {
  subParts: string[];
  filename: string;
  blob: Blob;
};

/**
 * Escribe varios archivos de forma "all-or-nothing":
 *   1) Abre writables para todos (fail-fast si alguno está bloqueado).
 *   2) Si algún open falla, aborta los ya abiertos → ningún archivo queda modificado.
 *   3) Sólo si todos se abrieron OK, escribe y commit.
 *
 * Es la granularidad máxima que permite el File System Access API sin
 * soporte de operaciones multi-archivo atómicas.
 */
export async function writeManyAtomic(
  root: AnyHandle,
  targets: AtomicTarget[]
): Promise<void> {
  // Fase 1: obtener FileHandle de todos
  const prepared: Array<{
    fh: FileSystemFileHandle;
    filename: string;
    blob: Blob;
  }> = [];
  for (const t of targets) {
    const dir = await ensureSubDir(root, t.subParts);
    const fh = await dir.getFileHandle(t.filename, { create: true });
    prepared.push({ fh, filename: t.filename, blob: t.blob });
  }

  // Fase 2: abrir writables. Si alguno falla → abortar todos los abiertos.
  const writables: Array<{
    w: FileSystemWritableFileStream;
    blob: Blob;
  }> = [];
  const blocked: string[] = [];
  for (const p of prepared) {
    try {
      const w = await p.fh.createWritable();
      writables.push({ w, blob: p.blob });
    } catch (e) {
      // Rollback
      for (const { w } of writables) {
        try {
          await w.abort();
        } catch {
          /* noop */
        }
      }
      if (looksLikeLockedFile(e)) {
        blocked.push(p.filename);
        throw lockedFileError(blocked);
      }
      throw e;
    }
  }

  // Fase 3: escribir y cerrar. Si algo falla, abortar el resto.
  try {
    for (const { w, blob } of writables) {
      await w.write(blob);
    }
    for (const { w } of writables) {
      await w.close();
    }
  } catch (e) {
    for (const { w } of writables) {
      try {
        await w.abort();
      } catch {
        /* noop */
      }
    }
    if (looksLikeLockedFile(e)) throw lockedFileError(targets.map((t) => t.filename));
    throw e;
  }
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}
