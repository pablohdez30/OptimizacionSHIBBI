// Tipos compartidos entre frontend, backend y módulos de pricing.

export type TipoMueble = 'mesa' | 'estanteria' | 'espejo' | 'otro';

export type Categoria = {
  id: TipoMueble;
  nombre: string;
  descripcion: string;
  desde: number | null;
  placeholder: string;
};

export type Material = {
  id: string;
  nombre: string;
  tipo: 'madera' | 'tablero';
  precio_m2: number;
  grosor_opciones: number[];
  descripcion: string;
  aplicable_a: TipoMueble[];
  placeholder: string;
};

export type Componente = {
  id: string;
  nombre: string;
  categoria: 'pata' | 'soporte' | 'marco';
  precio_unidad: number;
  unidad_default: number;
  unidad_opciones: number[];
  descripcion: string;
  placeholder: string;
};

export type Acabado = {
  id: string;
  nombre: string;
  categoria: 'acabado';
  precio: number;
  descripcion: string;
};

export type Servicio = {
  id: string;
  nombre: string;
  categoria: 'servicio';
  precio: number;
  modificador?: 'fijo' | 'porcentaje';
  descripcion: string;
};

export type ComponenteSeleccionado = {
  id: string;
  cantidad: number;
};

export type Configuracion = {
  tipo: TipoMueble;
  material_id: string | null;
  grosor: number | null;
  medidas: { largo: number | ''; ancho: number | ''; alto: number | '' };
  componentes: ComponenteSeleccionado[];
  acabado_id: string | null;
  servicios_ids: string[];
  nombre: string;
  email: string;
  telefono: string;
  canal_preferido: 'email' | 'whatsapp' | 'cualquiera';
  notas_adicionales: string;
  imagenes: string[];
};

export type DesgloseItem = {
  id: string;
  titulo: string;
  subtitulo: string | null;
  importe: number;
};

export type Estimacion = {
  total: number;
  desglose: DesgloseItem[];
};

export type SolicitudPayload = Configuracion & {
  presupuesto_estimado: number;
  desglose: DesgloseItem[];
};
