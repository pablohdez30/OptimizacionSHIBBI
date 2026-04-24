import {
  getDirHandle,
  verifyPermission,
  writeManyAtomic,
  isFileSystemAccessSupported,
  type AtomicTarget,
} from "@/lib/dirHandle";
import {
  buildFilename,
  buildSubPath,
  cargarConfig,
  cargarFactura,
  cargarPresupuesto,
} from "./utils";
import { generarPdfPresupuesto } from "./presupuestoPdf";
import { generarExcelPresupuesto } from "./presupuestoExcel";
import { generarExcelDesglose } from "./presupuestoDesglose";
import { generarPdfFactura } from "./facturaPdf";
import { generarExcelFactura } from "./facturaExcel";

export type ExportResult = {
  archivos: string[];
  errores: string[];
};

async function obtenerCarpetaEscritura() {
  if (!isFileSystemAccessSupported()) {
    throw new Error(
      "Tu navegador no soporta la API de carpetas. Usa Chrome, Edge u Opera."
    );
  }
  const root = await getDirHandle();
  if (!root) {
    throw new Error(
      "No hay carpeta de exportación configurada. Ve a Configuración → Ruta de Salida y elige una carpeta."
    );
  }
  const ok = await verifyPermission(root, true);
  if (!ok) throw new Error("Permiso de escritura denegado sobre la carpeta.");
  return root;
}

/**
 * Exporta un presupuesto a los 3 archivos (Excel plantilla, PDF, Excel desglose)
 * dentro de {ruta}/CAESPAN {año}/PRESUPUESTOS|DESGLOSES/.
 *
 * Comportamiento: si algún archivo falla (p. ej. porque está abierto), NO se
 * escribe ninguno. "All or nothing".
 */
export async function exportPresupuesto(
  presupuestoId: number
): Promise<ExportResult> {
  const root = await obtenerCarpetaEscritura();

  const [pres, config] = await Promise.all([
    cargarPresupuesto(presupuestoId),
    cargarConfig(),
  ]);

  const subPres = buildSubPath("PRESUPUESTOS");
  const subDesg = buildSubPath("DESGLOSES");

  // Generar todos los blobs en memoria (no tocamos el disco todavía)
  let excelPres: Blob, pdf: Blob, desglose: Blob;
  try {
    [excelPres, pdf, desglose] = await Promise.all([
      generarExcelPresupuesto(pres, config),
      generarPdfPresupuesto(pres, config),
      generarExcelDesglose(pres, config),
    ]);
  } catch (e) {
    throw new Error(
      "No se pudo generar los archivos del presupuesto: " + (e as Error).message
    );
  }

  const targets: AtomicTarget[] = [
    {
      subParts: subPres,
      filename: buildFilename(
        "PRESUPUESTOS",
        pres.numero_presupuesto,
        pres.cliente_nombre,
        "xlsx"
      ),
      blob: excelPres,
    },
    {
      subParts: subPres,
      filename: buildFilename(
        "PRESUPUESTOS",
        pres.numero_presupuesto,
        pres.cliente_nombre,
        "pdf"
      ),
      blob: pdf,
    },
    {
      subParts: subDesg,
      filename: buildFilename(
        "DESGLOSES",
        pres.numero_presupuesto,
        pres.cliente_nombre,
        "xlsx"
      ),
      blob: desglose,
    },
  ];

  // Escritura atómica: fail-fast, rollback si hay bloqueos
  await writeManyAtomic(root, targets);

  return {
    archivos: targets.map((t) => `${t.subParts.join("/")}/${t.filename}`),
    errores: [],
  };
}

/**
 * Exporta una factura a los 2 archivos (Excel plantilla, PDF)
 * dentro de {ruta}/CAESPAN {año}/FACTURAS/. All-or-nothing.
 */
export async function exportFactura(facturaId: number): Promise<ExportResult> {
  const root = await obtenerCarpetaEscritura();

  const [factura, config] = await Promise.all([
    cargarFactura(facturaId),
    cargarConfig(),
  ]);

  const subFac = buildSubPath("FACTURAS");

  let excel: Blob, pdf: Blob;
  try {
    [excel, pdf] = await Promise.all([
      generarExcelFactura(factura, config),
      generarPdfFactura(factura, config),
    ]);
  } catch (e) {
    throw new Error(
      "No se pudo generar los archivos de la factura: " + (e as Error).message
    );
  }

  const targets: AtomicTarget[] = [
    {
      subParts: subFac,
      filename: buildFilename(
        "FACTURAS",
        factura.numero_factura,
        factura.cliente_nombre,
        "xlsx"
      ),
      blob: excel,
    },
    {
      subParts: subFac,
      filename: buildFilename(
        "FACTURAS",
        factura.numero_factura,
        factura.cliente_nombre,
        "pdf"
      ),
      blob: pdf,
    },
  ];

  await writeManyAtomic(root, targets);

  return {
    archivos: targets.map((t) => `${t.subParts.join("/")}/${t.filename}`),
    errores: [],
  };
}
