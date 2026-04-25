// Tipos compartidos entre frontend, backend y módulos de pricing.

export type TipoMueble = 'mesa' | 'estanteria' | 'espejo' | 'otro';

export type Material = {
  id: string;
  nombre: string;
  tipo: 'madera' | 'tablero';
  precio_m2: number;
  grosor_opciones: string;
  foto: string | null;
  descripcion: string;
  aplicable_a: TipoMueble[];
  orden: number;
  activo: boolean;
};

export type Componente = {
  id: string;
  nombre: string;
  categoria: 'pata' | 'soporte' | 'marco';
  precio_unidad: number;
  unidad_default: number;
  unidad_opciones: string;
  foto: string | null;
  descripcion: string;
  aplicable_a: TipoMueble[];
  orden: number;
  activo: boolean;
};

export type Extra = {
  id: string;
  nombre: string;
  categoria: 'acabado' | 'servicio';
  precio: number;
  modificador: 'fijo' | 'porcentaje';
  descripcion: string;
  aplicable_a: TipoMueble[];
  orden: number;
  activo: boolean;
};

export type ConfiguracionMueble = {
  tipo: TipoMueble;
  material?: Material;
  grosor?: number;
  componentes: Array<Componente & { cantidad: number }>;
  acabado?: Extra;
  servicios: Extra[];
  medidas: { largo: number; ancho: number; alto: number };
  descripcion_libre: string;
};

export type Desglose = {
  concepto: string;
  cantidad: string;
  importe: number;
};

export type Estimacion = {
  total: number;
  desglose: Desglose[];
};

export type SolicitudInput = ConfiguracionMueble & {
  imagenes: string[];
  nombre: string;
  email: string;
  telefono?: string;
  canal_preferido: 'email' | 'whatsapp' | 'cualquiera';
  notas_adicionales?: string;
  presupuesto_estimado: number;
  desglose: Desglose[];
};
