import { createClient } from "@/utils/supabase/client";
import type { Cliente } from "./types";

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
