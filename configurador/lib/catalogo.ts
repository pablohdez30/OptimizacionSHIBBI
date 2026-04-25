// Datos mock del catálogo. Mientras Supabase no esté configurado, los
// componentes leen de aquí. Cuando enchufemos Supabase, sustituimos
// estas constantes por consultas a las tablas correspondientes y los
// componentes no necesitan cambiar.

import type { Categoria, Material, Componente, Acabado, Servicio } from './types';

export const CATEGORIAS: Categoria[] = [
  { id: 'mesa',       nombre: 'Mesa',       descripcion: 'A medida en madera maciza',  desde: 180,  placeholder: 'MESA' },
  { id: 'estanteria', nombre: 'Estantería', descripcion: 'Modular, hierro y madera',   desde: 240,  placeholder: 'ESTANTERÍA' },
  { id: 'espejo',     nombre: 'Espejo',     descripcion: 'Marco de madera maciza',     desde: 120,  placeholder: 'ESPEJO' },
  { id: 'otro',       nombre: 'Otro',       descripcion: 'Cuéntanos qué tienes en mente', desde: null, placeholder: 'PIEZA ÚNICA' }
];

export const MATERIALES: Material[] = [
  { id: 'roble',     nombre: 'Roble macizo',          tipo: 'madera',  precio_m2: 180, grosor_opciones: [3, 5, 8], descripcion: 'Veta marcada, tono cálido, gran dureza.', aplicable_a: ['mesa', 'estanteria', 'espejo'], placeholder: 'ROBLE' },
  { id: 'nogal',     nombre: 'Nogal macizo',          tipo: 'madera',  precio_m2: 280, grosor_opciones: [3, 5],    descripcion: 'Tono oscuro, veta fina, noble.',         aplicable_a: ['mesa', 'estanteria', 'espejo'], placeholder: 'NOGAL' },
  { id: 'haya',      nombre: 'Haya maciza',           tipo: 'madera',  precio_m2: 140, grosor_opciones: [3, 5, 8], descripcion: 'Color claro, grano cerrado.',            aplicable_a: ['mesa', 'estanteria'],           placeholder: 'HAYA' },
  { id: 'pino',      nombre: 'Pino macizo',           tipo: 'madera',  precio_m2:  95, grosor_opciones: [3, 5, 8], descripcion: 'Cálido, ligero, económico.',             aplicable_a: ['mesa', 'estanteria'],           placeholder: 'PINO' },
  { id: 'abedul',    nombre: 'Contrachapado abedul',  tipo: 'tablero', precio_m2:  90, grosor_opciones: [3, 5],    descripcion: 'Canto visto, estética nórdica.',         aplicable_a: ['mesa', 'estanteria'],           placeholder: 'ABEDUL' },
  { id: 'mdf-roble', nombre: 'MDF chapado roble',     tipo: 'tablero', precio_m2:  75, grosor_opciones: [3, 5],    descripcion: 'Acabado uniforme, opción contenida.',    aplicable_a: ['mesa', 'estanteria'],           placeholder: 'MDF ROBLE' }
];

export const COMPONENTES: Componente[] = [
  { id: 'hairpin',   nombre: 'Pata Hairpin',  categoria: 'pata', precio_unidad:  30, unidad_default: 4, unidad_opciones: [2, 4, 6], descripcion: 'Hierro forjado, 3 varillas. Industrial.', placeholder: 'HAIRPIN' },
  { id: 'trapezio',  nombre: 'Pata Trapecio', categoria: 'pata', precio_unidad:  65, unidad_default: 2, unidad_opciones: [2],       descripcion: 'Hierro plano negro mate. Sobria.',         placeholder: 'TRAPECIO' },
  { id: 'torneada',  nombre: 'Pata torneada', categoria: 'pata', precio_unidad:  48, unidad_default: 4, unidad_opciones: [4, 6],    descripcion: 'Madera maciza al tono.',                   placeholder: 'TORNEADA' },
  { id: 'caballete', nombre: 'Caballete',     categoria: 'pata', precio_unidad: 120, unidad_default: 2, unidad_opciones: [2],       descripcion: 'Madera maciza, ensamble en cruz.',         placeholder: 'CABALLETE' }
];

export const ACABADOS: Acabado[] = [
  { id: 'aceite',     nombre: 'Aceite natural',       categoria: 'acabado', precio: 35, descripcion: 'Realza la veta. Tacto cálido.' },
  { id: 'cera',       nombre: 'Cera de abeja',        categoria: 'acabado', precio: 45, descripcion: 'Acabado satinado, mantenimiento manual.' },
  { id: 'barniz-mate', nombre: 'Barniz mate al agua', categoria: 'acabado', precio: 60, descripcion: 'Protección alta, tacto neutro.' },
  { id: 'jabon',      nombre: 'Tratamiento al jabón', categoria: 'acabado', precio: 55, descripcion: 'Estilo escandinavo. Aclara la madera.' }
];

export const SERVICIOS: Servicio[] = [
  { id: 'envio',     nombre: 'Envío a domicilio',  categoria: 'servicio', precio:  80, descripcion: 'Península. Plazo 3–5 semanas.' },
  { id: 'montaje',   nombre: 'Montaje en casa',    categoria: 'servicio', precio: 120, descripcion: 'Equipo propio Shibbi.' },
  { id: 'embalaje',  nombre: 'Embalaje protegido', categoria: 'servicio', precio:  25, descripcion: 'Cantoneras y manta.' }
];
