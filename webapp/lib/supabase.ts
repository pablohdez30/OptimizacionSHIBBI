import { createClient } from "@/utils/supabase/client";
import type {
  Cliente,
  Proveedor,
  HistoricoPrecioProveedor,
  Configuracion,
  CategoriaMaterial,
  CategoriaMueble,
  Factura,
  LineaFactura,
  HistoricoMueble,
} from "./types";

const supabase = () => createClient();

// ============================================================
// Clientes
// ============================================================
export async function getClientes(soloActivos = true) {
  let query = supabase().from("clientes").select("*").order("nombre");
  if (soloActivos) {
    query = query.eq("activo", 1);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as Cliente[];
}

export async function getCliente(id: number) {
  const { data, error } = await supabase()
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Cliente;
}

export async function crearCliente(
  cliente: Omit<Cliente, "id" | "fecha_alta" | "activo">
) {
  const { data, error } = await supabase()
    .from("clientes")
    .insert({
      ...cliente,
      fecha_alta: new Date().toISOString(),
      activo: 1,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Cliente;
}

export async function actualizarCliente(
  id: number,
  campos: Partial<Cliente>
) {
  const { error } = await supabase()
    .from("clientes")
    .update(campos)
    .eq("id", id);
  if (error) throw error;
}

export async function eliminarCliente(id: number) {
  const { error } = await supabase()
    .from("clientes")
    .update({ activo: 0 })
    .eq("id", id);
  if (error) throw error;
}

// ============================================================
// Proveedores
// ============================================================
export async function getProveedores(soloActivos = true) {
  let query = supabase().from("proveedores").select("*").order("nombre");
  if (soloActivos) {
    query = query.eq("activo", 1);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as Proveedor[];
}

export async function crearProveedor(
  prov: Omit<Proveedor, "id" | "fecha_alta" | "activo">
) {
  const { data, error } = await supabase()
    .from("proveedores")
    .insert({ ...prov, fecha_alta: new Date().toISOString(), activo: 1 })
    .select()
    .single();
  if (error) throw error;
  return data as Proveedor;
}

export async function actualizarProveedor(
  id: number,
  campos: Partial<Proveedor>
) {
  const { error } = await supabase()
    .from("proveedores")
    .update(campos)
    .eq("id", id);
  if (error) throw error;
}

export async function eliminarProveedor(id: number) {
  const { error } = await supabase()
    .from("proveedores")
    .update({ activo: 0 })
    .eq("id", id);
  if (error) throw error;
}

export async function getMaterialesProveedor(proveedorId: number) {
  const { data, error } = await supabase()
    .from("historico_precios_proveedor")
    .select("*, categorias_material(nombre)")
    .eq("proveedor_id", proveedorId)
    .order("fecha_precio", { ascending: false });
  if (error) throw error;
  return data;
}

export async function crearMaterialProveedor(material: {
  proveedor_id: number;
  categoria_material_id: number;
  descripcion_material: string;
  precio: number;
  unidad: string;
  notas?: string;
}) {
  const { error } = await supabase()
    .from("historico_precios_proveedor")
    .insert({
      ...material,
      notas: material.notas || "",
      fecha_precio: new Date().toISOString(),
    });
  if (error) throw error;
}

export async function actualizarMaterialProveedor(
  id: number,
  campos: Partial<HistoricoPrecioProveedor>
) {
  const { error } = await supabase()
    .from("historico_precios_proveedor")
    .update(campos)
    .eq("id", id);
  if (error) throw error;
}

export async function eliminarMaterialProveedor(id: number) {
  const { error } = await supabase()
    .from("historico_precios_proveedor")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ============================================================
// Configuración
// ============================================================
export async function getConfiguracion() {
  const { data, error } = await supabase()
    .from("configuracion")
    .select("*")
    .order("clave");
  if (error) throw error;
  return data as Configuracion[];
}

export async function getConfigValue(clave: string) {
  const { data, error } = await supabase()
    .from("configuracion")
    .select("valor")
    .eq("clave", clave)
    .single();
  if (error) return null;
  return data?.valor ?? null;
}

// ============================================================
// Categorías de material
// ============================================================
export async function getCategoriasMaterial() {
  const { data, error } = await supabase()
    .from("categorias_material")
    .select("*")
    .order("orden");
  if (error) throw error;
  return data as CategoriaMaterial[];
}

export async function crearCategoriaMaterial(nombre: string) {
  const { data: maxRow } = await supabase()
    .from("categorias_material")
    .select("orden")
    .order("orden", { ascending: false })
    .limit(1)
    .single();
  const orden = (maxRow?.orden || 0) + 1;
  const { error } = await supabase()
    .from("categorias_material")
    .insert({ nombre, orden, es_personalizada: 1 });
  if (error) throw error;
}

export async function eliminarCategoriaMaterial(id: number) {
  const { error } = await supabase()
    .from("categorias_material")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ============================================================
// Categorías de mueble
// ============================================================
export async function getCategoriasMueble() {
  const { data, error } = await supabase()
    .from("categorias_mueble")
    .select("*")
    .order("orden");
  if (error) throw error;
  return data as CategoriaMueble[];
}

export async function crearCategoriaMueble(nombre: string) {
  const { data: maxRow } = await supabase()
    .from("categorias_mueble")
    .select("orden")
    .order("orden", { ascending: false })
    .limit(1)
    .single();
  const orden = (maxRow?.orden || 0) + 1;
  const { error } = await supabase()
    .from("categorias_mueble")
    .insert({ nombre, orden, es_personalizada: 1 });
  if (error) throw error;
}

export async function eliminarCategoriaMueble(id: number) {
  const { error } = await supabase()
    .from("categorias_mueble")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ============================================================
// Facturas
// ============================================================
export async function getFacturas() {
  const { data, error } = await supabase()
    .from("facturas")
    .select("*, clientes(nombre)")
    .order("fecha", { ascending: false });
  if (error) throw error;
  return data as (Factura & { clientes: { nombre: string } | null })[];
}

export async function getFactura(id: number) {
  const { data, error } = await supabase()
    .from("facturas")
    .select("*, clientes(nombre, direccion, nif_cif)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getLineasFactura(facturaId: number) {
  const { data, error } = await supabase()
    .from("lineas_factura")
    .select("*")
    .eq("factura_id", facturaId)
    .order("orden");
  if (error) throw error;
  return data as LineaFactura[];
}

export async function eliminarFactura(id: number) {
  const { error } = await supabase().from("facturas").delete().eq("id", id);
  if (error) throw error;
}

export async function calcularTotalFactura(facturaId: number) {
  const { data: factura } = await supabase()
    .from("facturas")
    .select("adelanto_importe")
    .eq("id", facturaId)
    .single();
  const { data: lineas } = await supabase()
    .from("lineas_factura")
    .select("unidades,precio_unitario")
    .eq("factura_id", facturaId);
  if (!lineas) return 0;
  const base = lineas.reduce(
    (sum: number, l: any) => sum + l.unidades * l.precio_unitario,
    0
  );
  return base - (factura?.adelanto_importe || 0);
}

// ============================================================
// Histórico muebles
// ============================================================
export async function getHistoricoMuebles(filters?: {
  categoriaId?: number | null;
  clienteId?: number | null;
  texto?: string;
}) {
  let q = supabase()
    .from("historico_muebles")
    .select(
      "*, categorias_mueble(nombre), clientes(nombre), presupuestos(numero_presupuesto)"
    );

  if (filters?.categoriaId) {
    q = q.eq("categoria_mueble_id", filters.categoriaId);
  }
  if (filters?.clienteId) {
    q = q.eq("cliente_id", filters.clienteId);
  }
  if (filters?.texto) {
    q = q.or(
      `nombre.ilike.%${filters.texto}%,descripcion.ilike.%${filters.texto}%`
    );
  }

  const { data, error } = await q.order("fecha", { ascending: false }).limit(500);
  if (error) throw error;
  return data;
}

export async function setConfigValue(
  clave: string,
  valor: string,
  descripcion?: string
) {
  const existing = await supabase()
    .from("configuracion")
    .select("id")
    .eq("clave", clave)
    .single();

  const now = new Date().toISOString();
  if (existing.data) {
    const update: Record<string, string> = { valor, fecha_modificacion: now };
    if (descripcion) update.descripcion = descripcion;
    const { error } = await supabase()
      .from("configuracion")
      .update(update)
      .eq("clave", clave);
    if (error) throw error;
  } else {
    const { error } = await supabase()
      .from("configuracion")
      .insert({ clave, valor, descripcion: descripcion || "", fecha_modificacion: now });
    if (error) throw error;
  }
}
