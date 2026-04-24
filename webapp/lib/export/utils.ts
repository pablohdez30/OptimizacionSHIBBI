import {
  getPresupuesto,
  getLineasPresupuesto,
  getDetallesCoste,
  getFactura,
  getLineasFactura,
  getConfiguracion,
} from "@/lib/supabase";

export type ConfigMap = Record<string, string>;

export type DetalleCarga = {
  id: number;
  categoria_nombre: string;
  proveedor_nombre: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
};

export type LineaPresupuestoCarga = {
  id: number;
  nombre_producto: string;
  descripcion: string;
  cantidad: number;
  precio_unitario_final: number;
  margen_porcentaje: number;
  orden: number;
  categoria_mueble_nombre: string;
  detalles: DetalleCarga[];
};

export type PresupuestoCarga = {
  id: number;
  numero_presupuesto: string;
  cliente_nombre: string;
  cliente_direccion: string;
  cliente_nif: string;
  proyecto: string;
  fecha: string; // YYYY-MM-DD
  condiciones_pago: string;
  dias_validez: number;
  incluye_instalacion: boolean;
  porte_importe: number;
  notas_internas: string;
  lineas: LineaPresupuestoCarga[];
};

export type FacturaCarga = {
  id: number;
  numero_factura: string;
  cliente_nombre: string;
  cliente_direccion: string;
  cliente_nif: string;
  proyecto: string;
  fecha: string;
  adelanto_descripcion: string;
  adelanto_importe: number;
  lineas: {
    id: number;
    concepto: string;
    descripcion: string;
    unidades: number;
    precio_unitario: number;
    es_porte: number;
    orden: number;
  }[];
};

/** Carga un presupuesto con todas sus líneas y detalles de coste. */
export async function cargarPresupuesto(
  presupuestoId: number
): Promise<PresupuestoCarga> {
  const pres = (await getPresupuesto(presupuestoId)) as any;
  const lineas = await getLineasPresupuesto(presupuestoId);
  const lineasCarga: LineaPresupuestoCarga[] = [];
  for (const l of lineas) {
    const dets = await getDetallesCoste(l.id);
    lineasCarga.push({
      id: l.id,
      nombre_producto: l.nombre_producto,
      descripcion: l.descripcion || "",
      cantidad: l.cantidad || 0,
      precio_unitario_final: l.precio_unitario_final || 0,
      margen_porcentaje: l.margen_porcentaje || 0,
      orden: l.orden || 0,
      categoria_mueble_nombre: l.categorias_mueble?.nombre || "",
      detalles: dets.map((d: any) => ({
        id: d.id,
        categoria_nombre: d.categorias_material?.nombre || "",
        proveedor_nombre: d.proveedores?.nombre || "",
        descripcion: d.descripcion || "",
        cantidad: d.cantidad || 0,
        precio_unitario: d.precio_unitario || 0,
        precio_total: d.precio_total || 0,
      })),
    });
  }
  return {
    id: pres.id,
    numero_presupuesto: pres.numero_presupuesto,
    cliente_nombre: pres.clientes?.nombre || "",
    cliente_direccion: pres.clientes?.direccion || "",
    cliente_nif: pres.clientes?.nif_cif || "",
    proyecto: pres.proyecto || "",
    fecha: pres.fecha,
    condiciones_pago: pres.condiciones_pago || "",
    dias_validez: pres.dias_validez || 15,
    incluye_instalacion: !!pres.incluye_instalacion,
    porte_importe: pres.porte_importe || 0,
    notas_internas: pres.notas_internas || "",
    lineas: lineasCarga,
  };
}

export async function cargarFactura(facturaId: number): Promise<FacturaCarga> {
  const fac = (await getFactura(facturaId)) as any;
  const lineas = await getLineasFactura(facturaId);
  return {
    id: fac.id,
    numero_factura: fac.numero_factura,
    cliente_nombre: fac.clientes?.nombre || "",
    cliente_direccion: fac.clientes?.direccion || "",
    cliente_nif: fac.clientes?.nif_cif || "",
    proyecto: fac.proyecto || "",
    fecha: fac.fecha,
    adelanto_descripcion: fac.adelanto_descripcion || "",
    adelanto_importe: fac.adelanto_importe || 0,
    lineas: lineas.map((l: any) => ({
      id: l.id,
      concepto: l.concepto,
      descripcion: l.descripcion || "",
      unidades: l.unidades || 0,
      precio_unitario: l.precio_unitario || 0,
      es_porte: l.es_porte || 0,
      orden: l.orden || 0,
    })),
  };
}

export async function cargarConfig(): Promise<ConfigMap> {
  const all = await getConfiguracion();
  const map: ConfigMap = {};
  all.forEach((c) => (map[c.clave] = c.valor));
  return map;
}

// Sanitiza un nombre de cliente para incluirlo en un filename.
// Permite cualquier letra/número Unicode (tildes, ñ, etc.) y solo escapa
// los caracteres que realmente rompen filesystems (/ \ : * ? " < > |).
export function sanitizeName(name: string): string {
  return name
    .split("")
    .map((c) => (/[\p{L}\p{N} \-_.()]/u.test(c) ? c : "_"))
    .join("")
    .replace(/_+/g, "_")
    .trim();
}

// Formatea un número como "1.234,56"
export function fmtNum(v: number): string {
  return v.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Tipo de documento → carpeta + prefijo de nombre (idéntico al Python output_path.py)
export type Tipo = "FACTURAS" | "PRESUPUESTOS" | "DESGLOSES";
export const PREFIJO: Record<Tipo, string> = {
  FACTURAS: "FACTURA",
  PRESUPUESTOS: "Presupuesto",
  DESGLOSES: "Desglose",
};

export function buildFilename(
  tipo: Tipo,
  numero: string,
  clienteNombre: string,
  ext: string
): string {
  return `${PREFIJO[tipo]}_${numero}_${sanitizeName(clienteNombre)}.${ext}`;
}

/** Partes de la subruta dentro del handle raíz: CAESPAN {año}/{tipo}. */
export function buildSubPath(tipo: Tipo): string[] {
  const year = new Date().getFullYear();
  return [`CAESPAN ${year}`, tipo];
}

/** Convierte 'YYYY-MM-DD' a 'DD/MM/YYYY'. Silencioso si no cuadra. */
export function fechaEs(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return iso;
}

/** Devuelve ArrayBuffer de un asset servido desde /public. */
export async function fetchAsset(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo cargar ${url}: ${res.status}`);
  return res.arrayBuffer();
}

/** Si el presupuesto lleva porte activo (checkbox marcado). */
export function tienePorte(pres: PresupuestoCarga): boolean {
  return pres.incluye_instalacion;
}
