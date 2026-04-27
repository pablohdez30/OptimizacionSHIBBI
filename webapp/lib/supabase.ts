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
  Presupuesto,
  EventoCalendario,
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

// Devuelve un mapa cliente_id → número de presupuestos
export async function contarPresupuestosPorCliente() {
  const { data, error } = await supabase()
    .from("presupuestos")
    .select("cliente_id");
  if (error) throw error;
  const map: Record<number, number> = {};
  (data || []).forEach((r: any) => {
    if (r.cliente_id != null) {
      map[r.cliente_id] = (map[r.cliente_id] || 0) + 1;
    }
  });
  return map;
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

export async function actualizarFactura(
  id: number,
  campos: Partial<Factura>
) {
  const { error } = await supabase().from("facturas").update(campos).eq("id", id);
  if (error) throw error;
}

export async function agregarLineaFactura(
  linea: Omit<LineaFactura, "id">
) {
  const { data, error } = await supabase()
    .from("lineas_factura")
    .insert(linea)
    .select()
    .single();
  if (error) throw error;
  return data as LineaFactura;
}

export async function actualizarLineaFactura(
  id: number,
  campos: Partial<LineaFactura>
) {
  const { error } = await supabase()
    .from("lineas_factura")
    .update(campos)
    .eq("id", id);
  if (error) throw error;
}

export async function eliminarLineaFactura(id: number) {
  const { error } = await supabase()
    .from("lineas_factura")
    .delete()
    .eq("id", id);
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

// Próximo número de factura "YY-NNN"
export async function previewNumeroFactura() {
  const year = new Date().getFullYear().toString().slice(-2);

  const confValor = await getConfigValue("ultimo_num_factura");
  let confSeq = 0;
  if (confValor) {
    const parts = confValor.split("-");
    const n = parseInt(parts[1] || "0", 10);
    if (!isNaN(n)) confSeq = n;
  }

  const { data } = await supabase()
    .from("facturas")
    .select("numero_factura")
    .like("numero_factura", `${year}-%`)
    .order("id", { ascending: false })
    .limit(1);

  let dbSeq = 0;
  if (data && data.length > 0) {
    const parts = data[0].numero_factura.split("-");
    const n = parseInt(parts[1] || "0", 10);
    if (!isNaN(n)) dbSeq = n;
  }

  const seq = Math.max(confSeq, dbSeq) + 1;
  return `${year}-${String(seq).padStart(3, "0")}`;
}

// Presupuestos aceptados que todavía no tienen factura asociada
export async function getPresupuestosAceptadosSinFactura() {
  const { data: pres, error } = await supabase()
    .from("presupuestos")
    .select("*, clientes(nombre, nif_cif)")
    .in("estado", ["Aceptado", "En producción", "Entregado"])
    .order("id", { ascending: false });
  if (error) throw error;

  const { data: facs } = await supabase()
    .from("facturas")
    .select("presupuesto_id")
    .not("presupuesto_id", "is", null);
  const usados = new Set<number>(
    (facs || []).map((f: any) => f.presupuesto_id as number)
  );
  return (pres || []).filter((p: any) => !usados.has(p.id));
}

// Devuelve un mapa { presupuesto_id → { id, numero_factura } } para todos los
// presupuestos que ya tienen una factura asociada. Lo usa el listado de
// presupuestos para sustituir el botón "Crear factura" por un enlace.
export async function getFacturasPorPresupuesto(): Promise<
  Record<number, { id: number; numero_factura: string }>
> {
  const { data, error } = await supabase()
    .from("facturas")
    .select("id, numero_factura, presupuesto_id")
    .not("presupuesto_id", "is", null);
  if (error) throw error;
  const map: Record<number, { id: number; numero_factura: string }> = {};
  for (const f of data || []) {
    const pid = (f as any).presupuesto_id as number;
    map[pid] = {
      id: (f as any).id as number,
      numero_factura: (f as any).numero_factura as string,
    };
  }
  return map;
}

// Crea factura a partir de un presupuesto (equivalente a FacturaModel.crear_desde_presupuesto)
export async function crearFacturaDesdePresupuesto(presupuestoId: number) {
  const pres = await getPresupuesto(presupuestoId);
  if (!pres) throw new Error("Presupuesto no encontrado");

  const numero = await previewNumeroFactura();
  const { data: fac, error } = await supabase()
    .from("facturas")
    .insert({
      numero_factura: numero,
      presupuesto_id: presupuestoId,
      cliente_id: pres.cliente_id,
      proyecto: pres.proyecto || "",
      fecha: new Date().toISOString().slice(0, 10),
      notas_internas: "",
      adelanto_descripcion: "",
      adelanto_importe: 0,
    })
    .select()
    .single();
  if (error) throw error;

  const lineas = await getLineasPresupuesto(presupuestoId);
  let orden = 0;
  for (const linea of lineas) {
    await supabase().from("lineas_factura").insert({
      factura_id: fac.id,
      concepto: linea.nombre_producto,
      descripcion: linea.descripcion || "",
      unidades: linea.cantidad,
      precio_unitario:
        Math.round((linea.precio_unitario_final || 0) * 100) / 100,
      es_porte: 0,
      orden: orden++,
    });
  }

  // Porte unificado: si está marcado en el presupuesto, va como línea aparte
  const porteImporte = (pres as any).porte_importe || 0;
  if ((pres as any).incluye_instalacion && porteImporte > 0) {
    await supabase().from("lineas_factura").insert({
      factura_id: fac.id,
      concepto: "Porte / Instalación",
      descripcion: "",
      unidades: 1,
      precio_unitario: Math.round(porteImporte * 100) / 100,
      es_porte: 1,
      orden: orden++,
    });
  }

  return fac as Factura;
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

export async function actualizarHistoricoMueble(
  id: number,
  campos: Partial<HistoricoMueble>
) {
  const { error } = await supabase()
    .from("historico_muebles")
    .update(campos)
    .eq("id", id);
  if (error) throw error;
}

export async function eliminarHistoricoMueble(id: number) {
  const { error } = await supabase()
    .from("historico_muebles")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ============================================================
// Presupuestos
// ============================================================
export async function getPresupuestos(filtros?: {
  estado?: string | null;
  texto?: string | null;
}) {
  let q = supabase()
    .from("presupuestos")
    .select("*, clientes(nombre, nif_cif, email)");

  if (filtros?.estado) {
    q = q.eq("estado", filtros.estado);
  }
  const { data, error } = await q.order("id", { ascending: false });
  if (error) throw error;
  return data as (Presupuesto & {
    clientes: { nombre: string; nif_cif: string; email: string } | null;
  })[];
}

export async function actualizarEstadoPresupuesto(id: number, estado: string) {
  const now = new Date().toISOString().slice(0, 10);
  const update: Record<string, string> = { estado };
  if (estado === "Enviado") update.fecha_envio = now;
  else if (estado === "Aceptado") update.fecha_aceptacion = now;
  else if (estado === "Entregado") update.fecha_entrega_real = now;

  const { error } = await supabase()
    .from("presupuestos")
    .update(update)
    .eq("id", id);
  if (error) throw error;
}

export async function eliminarPresupuesto(id: number) {
  // Borrar detalles y líneas primero (por si acaso los CASCADE no están)
  const { data: lineas } = await supabase()
    .from("lineas_presupuesto")
    .select("id")
    .eq("presupuesto_id", id);
  if (lineas) {
    for (const l of lineas) {
      await supabase()
        .from("detalles_coste")
        .delete()
        .eq("linea_presupuesto_id", l.id);
    }
  }
  await supabase().from("lineas_presupuesto").delete().eq("presupuesto_id", id);
  await supabase()
    .from("presupuestos")
    .update({ presupuesto_padre_id: null })
    .eq("presupuesto_padre_id", id);
  const { error } = await supabase().from("presupuestos").delete().eq("id", id);
  if (error) throw error;
}

export async function getTotalPresupuesto(id: number) {
  const { data } = await supabase()
    .from("lineas_presupuesto")
    .select("cantidad, precio_unitario_final")
    .eq("presupuesto_id", id);
  if (!data) return 0;
  return data.reduce(
    (s: number, l: any) => s + (l.cantidad || 0) * (l.precio_unitario_final || 0),
    0
  );
}

// ---------- Editor: cargar / guardar un presupuesto completo ----------
export async function getPresupuesto(id: number) {
  const { data, error } = await supabase()
    .from("presupuestos")
    .select("*, clientes(id, nombre, nif_cif, direccion)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Presupuesto & {
    clientes: { id: number; nombre: string; nif_cif: string; direccion: string } | null;
  };
}

export async function getLineasPresupuesto(presupuestoId: number) {
  const { data, error } = await supabase()
    .from("lineas_presupuesto")
    .select("*, categorias_mueble(nombre)")
    .eq("presupuesto_id", presupuestoId)
    .order("orden");
  if (error) throw error;
  return data as any[];
}

export async function getDetallesCoste(lineaId: number) {
  const { data, error } = await supabase()
    .from("detalles_coste")
    .select(
      "*, categorias_material(nombre), proveedores(nombre)"
    )
    .eq("linea_presupuesto_id", lineaId)
    .order("id");
  if (error) throw error;
  return data as any[];
}

// Genera el próximo número "YY-NNN" mirando la configuración y el último en DB
export async function previewNumeroPresupuesto() {
  const year = new Date().getFullYear().toString().slice(-2);

  const confValor = await getConfigValue("ultimo_num_presupuesto");
  let confSeq = 0;
  if (confValor) {
    const parts = confValor.split("-");
    const n = parseInt(parts[1] || "0", 10);
    if (!isNaN(n)) confSeq = n;
  }

  const { data } = await supabase()
    .from("presupuestos")
    .select("numero_presupuesto")
    .like("numero_presupuesto", `${year}-%`)
    .order("id", { ascending: false })
    .limit(1);

  let dbSeq = 0;
  if (data && data.length > 0) {
    const parts = data[0].numero_presupuesto.split("-");
    const n = parseInt(parts[1] || "0", 10);
    if (!isNaN(n)) dbSeq = n;
  }

  const seq = Math.max(confSeq, dbSeq) + 1;
  return `${year}-${String(seq).padStart(3, "0")}`;
}

export async function crearPresupuesto(args: {
  cliente_id: number;
  proyecto?: string;
  fecha?: string;
  notas_internas?: string;
  condiciones_pago?: string;
  incluye_instalacion?: boolean;
  porte_importe?: number;
  dias_validez?: number;
  numero_presupuesto?: string;
}) {
  const numero =
    args.numero_presupuesto?.trim() || (await previewNumeroPresupuesto());
  const fecha = args.fecha || new Date().toISOString().slice(0, 10);

  let condiciones = args.condiciones_pago;
  if (!condiciones) {
    condiciones = (await getConfigValue("condiciones_pago_default")) || "";
  }
  let dias = args.dias_validez;
  if (dias == null) {
    const v = await getConfigValue("dias_validez_default");
    dias = v ? parseInt(v, 10) : 15;
  }

  const { data, error } = await supabase()
    .from("presupuestos")
    .insert({
      numero_presupuesto: numero,
      cliente_id: args.cliente_id,
      proyecto: args.proyecto || "",
      fecha,
      estado: "Borrador",
      notas_internas: args.notas_internas || "",
      condiciones_pago: condiciones,
      dias_validez: dias,
      incluye_instalacion: args.incluye_instalacion ? 1 : 0,
      porte_importe: args.porte_importe ?? 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Presupuesto;
}

export async function actualizarPresupuesto(
  id: number,
  campos: Partial<Presupuesto>
) {
  const { error } = await supabase()
    .from("presupuestos")
    .update(campos)
    .eq("id", id);
  if (error) throw error;
}

export async function agregarLineaPresupuesto(linea: {
  presupuesto_id: number;
  nombre_producto: string;
  descripcion?: string;
  cantidad?: number;
  precio_unitario_final?: number;
  margen_porcentaje?: number;
  orden?: number;
  categoria_mueble_id?: number | null;
}) {
  const { data, error } = await supabase()
    .from("lineas_presupuesto")
    .insert({
      presupuesto_id: linea.presupuesto_id,
      nombre_producto: linea.nombre_producto,
      descripcion: linea.descripcion || "",
      cantidad: linea.cantidad ?? 1,
      precio_unitario_final: linea.precio_unitario_final ?? 0,
      margen_porcentaje: linea.margen_porcentaje ?? 100,
      orden: linea.orden ?? 0,
      categoria_mueble_id: linea.categoria_mueble_id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as { id: number };
}

export async function agregarDetalleCoste(detalle: {
  linea_presupuesto_id: number;
  proveedor_id?: number | null;
  categoria_material_id?: number | null;
  descripcion?: string;
  cantidad?: number;
  precio_unitario?: number;
  notas?: string;
}) {
  const cantidad = detalle.cantidad ?? 1;
  const precio = detalle.precio_unitario ?? 0;
  const { error } = await supabase()
    .from("detalles_coste")
    .insert({
      linea_presupuesto_id: detalle.linea_presupuesto_id,
      proveedor_id: detalle.proveedor_id ?? null,
      categoria_material_id: detalle.categoria_material_id ?? null,
      descripcion: detalle.descripcion || "",
      cantidad,
      precio_unitario: precio,
      precio_total: cantidad * precio,
      notas: detalle.notas || "",
    });
  if (error) throw error;
}

export async function eliminarLineasPresupuesto(presupuestoId: number) {
  const { data: lineas } = await supabase()
    .from("lineas_presupuesto")
    .select("id")
    .eq("presupuesto_id", presupuestoId);
  if (lineas && lineas.length > 0) {
    const ids = lineas.map((l: any) => l.id);
    await supabase()
      .from("detalles_coste")
      .delete()
      .in("linea_presupuesto_id", ids);
  }
  await supabase()
    .from("lineas_presupuesto")
    .delete()
    .eq("presupuesto_id", presupuestoId);
}

// Últimos precios (uno por material) de un proveedor
export async function getMaterialesActualesProveedor(proveedorId: number) {
  const { data, error } = await supabase()
    .from("historico_precios_proveedor")
    .select("*, categorias_material(nombre)")
    .eq("proveedor_id", proveedorId)
    .order("fecha_precio", { ascending: false });
  if (error) throw error;
  const seen = new Map<string, any>();
  (data || []).forEach((r: any) => {
    if (!seen.has(r.descripcion_material)) seen.set(r.descripcion_material, r);
  });
  return Array.from(seen.values());
}

// Replica HistoricoMueblesModel.sincronizar_presupuesto
export async function sincronizarHistoricoMuebles(presupuestoId: number) {
  const { data: pres } = await supabase()
    .from("presupuestos")
    .select("cliente_id, fecha")
    .eq("id", presupuestoId)
    .single();
  if (!pres) return;

  await supabase()
    .from("historico_muebles")
    .delete()
    .eq("presupuesto_id", presupuestoId);

  const { data: lineas } = await supabase()
    .from("lineas_presupuesto")
    .select("*")
    .eq("presupuesto_id", presupuestoId)
    .order("orden");

  if (!lineas || lineas.length === 0) return;

  const rows = lineas.map((l: any) => ({
    linea_presupuesto_id: l.id,
    presupuesto_id: presupuestoId,
    cliente_id: pres.cliente_id,
    categoria_mueble_id: l.categoria_mueble_id || null,
    nombre: l.nombre_producto || "",
    descripcion: l.descripcion || "",
    fecha: pres.fecha,
    precio_unitario: l.precio_unitario_final || 0,
    cantidad: l.cantidad || 1,
  }));
  await supabase().from("historico_muebles").insert(rows);
}

// ============================================================
// Calendario
// ============================================================
export async function getEventosCalendario(year: number, month: number) {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const { data, error } = await supabase()
    .from("eventos_calendario")
    .select("*")
    .like("fecha", `${prefix}%`)
    .order("fecha");
  if (error) throw error;
  return data as EventoCalendario[];
}

export async function crearEventoCalendario(ev: {
  fecha: string;
  titulo: string;
  descripcion?: string;
  color?: string;
  presupuesto_id?: number | null;
}) {
  const { error } = await supabase()
    .from("eventos_calendario")
    .insert({
      fecha: ev.fecha,
      titulo: ev.titulo,
      descripcion: ev.descripcion || "",
      color: ev.color || "#FAC51C",
      presupuesto_id: ev.presupuesto_id || null,
    });
  if (error) throw error;
}

export async function actualizarEventoCalendario(
  id: number,
  campos: Partial<EventoCalendario>
) {
  const { error } = await supabase()
    .from("eventos_calendario")
    .update(campos)
    .eq("id", id);
  if (error) throw error;
}

// ============================================================
// Dashboard stats
// ============================================================
export async function eliminarEventoCalendario(id: number) {
  const { error } = await supabase()
    .from("eventos_calendario")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function getDashboardStats() {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;

  // Presupuestos creados este mes y el anterior
  const [presThis, presPrev] = await Promise.all([
    supabase()
      .from("presupuestos")
      .select("id, estado")
      .like("fecha", `${thisMonth}%`),
    supabase()
      .from("presupuestos")
      .select("id, estado")
      .like("fecha", `${prevMonth}%`),
  ]);

  // Facturas este mes y el anterior (con líneas para calcular totales)
  const [facThis, facPrev] = await Promise.all([
    supabase()
      .from("facturas")
      .select("id, adelanto_importe")
      .like("fecha", `${thisMonth}%`),
    supabase()
      .from("facturas")
      .select("id, adelanto_importe")
      .like("fecha", `${prevMonth}%`),
  ]);

  const sumFacturas = async (facturas: any[] | null) => {
    if (!facturas || !facturas.length) return 0;
    const ids = facturas.map((f) => f.id);
    const { data } = await supabase()
      .from("lineas_factura")
      .select("factura_id, unidades, precio_unitario")
      .in("factura_id", ids);
    const byF: Record<number, number> = {};
    (data || []).forEach((l: any) => {
      byF[l.factura_id] = (byF[l.factura_id] || 0) + l.unidades * l.precio_unitario;
    });
    return facturas.reduce(
      (s, f) => s + ((byF[f.id] || 0) - (f.adelanto_importe || 0)),
      0
    );
  };

  const [facturadoThis, facturadoPrev] = await Promise.all([
    sumFacturas(facThis.data),
    sumFacturas(facPrev.data),
  ]);

  // Tasa de aceptación
  const aceptThis = (presThis.data || []).filter(
    (p: any) => p.estado === "Aceptado" || p.estado === "En producción" || p.estado === "Entregado"
  ).length;
  const aceptPrev = (presPrev.data || []).filter(
    (p: any) => p.estado === "Aceptado" || p.estado === "En producción" || p.estado === "Entregado"
  ).length;
  const tasaThis = (presThis.data?.length || 0) > 0
    ? Math.round((aceptThis / presThis.data!.length) * 100)
    : 0;
  const tasaPrev = (presPrev.data?.length || 0) > 0
    ? Math.round((aceptPrev / presPrev.data!.length) * 100)
    : 0;

  // Pendientes de entrega (Aceptado o En producción)
  const { data: pendientes } = await supabase()
    .from("presupuestos")
    .select("id")
    .in("estado", ["Aceptado", "En producción"]);

  return {
    presupuestosMes: presThis.data?.length || 0,
    presupuestosPrevMes: presPrev.data?.length || 0,
    facturadoMes: facturadoThis,
    facturadoPrevMes: facturadoPrev,
    tasaAceptacion: tasaThis,
    tasaAceptacionPrev: tasaPrev,
    pendientesEntrega: pendientes?.length || 0,
  };
}

export async function getPresupuestosRecientes(limit = 6) {
  const { data, error } = await supabase()
    .from("presupuestos")
    .select("*, clientes(nombre, nif_cif)")
    .order("id", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as any[];
}

export async function getProximasEntregas(limit = 4) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase()
    .from("eventos_calendario")
    .select("*")
    .gte("fecha", today)
    .order("fecha")
    .limit(limit);
  if (error) throw error;
  return data as EventoCalendario[];
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
