export type Cliente = {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  codigo_postal: string;
  telefono: string;
  email: string;
  nif_cif: string;
  notas: string;
  fecha_alta: string;
  activo: number;
};

export type Proveedor = {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  notas: string;
  activo: number;
  fecha_alta: string;
};

export type CategoriaMaterial = {
  id: number;
  nombre: string;
  orden: number;
  es_personalizada: number;
};

export type CategoriaMueble = {
  id: number;
  nombre: string;
  orden: number;
  es_personalizada: number;
};

export type Presupuesto = {
  id: number;
  numero_presupuesto: string;
  cliente_id: number;
  proyecto: string;
  fecha: string;
  estado: string;
  version: number;
  presupuesto_padre_id: number | null;
  notas_internas: string;
  condiciones_pago: string;
  dias_validez: number;
  incluye_instalacion: number; // checkbox "Porte" (0/1)
  porte_importe: number;       // importe del porte (€, sin margen)
  fecha_envio: string | null;
  fecha_aceptacion: string | null;
  fecha_entrega_estimada: string | null;
  fecha_entrega_real: string | null;
};

export type LineaPresupuesto = {
  id: number;
  presupuesto_id: number;
  nombre_producto: string;
  descripcion: string;
  cantidad: number;
  precio_unitario_final: number;
  margen_porcentaje: number;
  orden: number;
  categoria_mueble_id: number | null;
};

export type DetalleCoste = {
  id: number;
  linea_presupuesto_id: number;
  proveedor_id: number | null;
  categoria_material_id: number | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  notas: string;
};

export type Configuracion = {
  id: number;
  clave: string;
  valor: string;
  descripcion: string;
  fecha_modificacion: string;
};

export type Factura = {
  id: number;
  numero_factura: string;
  presupuesto_id: number | null;
  cliente_id: number;
  proyecto: string;
  fecha: string;
  notas_internas: string;
  adelanto_descripcion: string;
  adelanto_importe: number;
};

export type LineaFactura = {
  id: number;
  factura_id: number;
  concepto: string;
  descripcion: string;
  unidades: number;
  precio_unitario: number;
  es_porte: number;
  orden: number;
};

export type EventoCalendario = {
  id: number;
  fecha: string;
  titulo: string;
  descripcion: string;
  color: string;
  presupuesto_id: number | null;
};

export type HistoricoMueble = {
  id: number;
  linea_presupuesto_id: number | null;
  presupuesto_id: number | null;
  cliente_id: number | null;
  categoria_mueble_id: number | null;
  nombre: string;
  descripcion: string;
  fecha: string;
  precio_unitario: number;
  cantidad: number;
};

export type HistoricoPrecioProveedor = {
  id: number;
  proveedor_id: number;
  categoria_material_id: number;
  descripcion_material: string;
  precio: number;
  unidad: string;
  fecha_precio: string;
  notas: string;
};
