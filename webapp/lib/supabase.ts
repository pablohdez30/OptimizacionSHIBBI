import { createClient } from "@/utils/supabase/client";
import type {
  Cliente,
  Proveedor,
  HistoricoPrecioProveedor,
  Configuracion,
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
