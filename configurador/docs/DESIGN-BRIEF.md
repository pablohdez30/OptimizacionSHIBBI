# Brief de diseño — Configurador de presupuestos Shibbi

> Documento para pasar a una herramienta de generación de UI (v0, Claude
> Design, Lovable, etc.). El stack técnico ya está fijado; solo se
> necesita la capa visual y la composición de componentes.

---

## 1. Marca y contexto

**Shibbi** (shibbishop.com) es un taller artesano español que fabrica
muebles a medida — mesas, estanterías, espejos. Madera maciza, hierro
forjado, acabados nobles. Piezas pensadas para durar décadas.

**Audiencia**: clientes adultos (30–55 años) que ya han descartado IKEA
y buscan calidad. No buscan "lo más barato", buscan lo correcto.

**Voz de marca**: serena, segura, sin esfuerzo. Cercana sin ser
informal. Confianza por sobriedad, no por entusiasmo.

---

## 2. Filosofía de diseño

El objetivo es **alejarse del aspecto "AI-generado típico"**. Nada de
gradientes lila/rosa, glassmorphism, iconos flotantes, emojis de
decoración o blobs abstractos.

La inspiración estética viene de **tres referencias concretas**:

| Referencia | Qué tomamos |
|---|---|
| **apple.com** (configuradores Mac/iPad) | Restraint absoluto, tipografía como protagonista, total sticky lateral, fotografía de producto edge-to-edge, jerarquía sin decoración |
| **hem.com** | Mostrar la madera/material como protagonista, layout editorial, espacio en blanco generoso |
| **carlhansen.com** | Microtipografía perfecta, formularios sin estridencia, fotografía artesanal |

**Principio rector**: cada elemento que aparece tiene que ganarse el
sitio. Si dudas si añadir algo, no lo añadas.

---

## 3. Lenguaje visual

### Paleta (estricta — solo estos colores)

```
--background:  #FAFAFA   /* casi blanco, NO crema */
--surface:     #FFFFFF
--text:        #1D1D1F   /* casi negro Apple, NO #000 puro */
--text-muted:  #6E6E73
--border:      #D2D2D7   /* gris frío Apple */
--border-soft: #E8E8ED
--accent:      #1D1D1F   /* el acento es el propio negro */
--accent-bg:   #F5F5F7
--error:       #B42318
--success:     #027A48
```

**No introducir más colores.** No usar verde "marca", azules, ni
naranjas. La calidez la aporta la fotografía de la madera, no la UI.

### Tipografía

```
display:  "Fraunces"        /* serif moderno con personalidad — para titulares y números */
sans:     "Inter Tight"     /* sans neutra para cuerpo y UI */
mono:     "JetBrains Mono"  /* únicamente para precios y métricas */
```

Tamaños:
- **Hero / titulares de paso**: 56–80 px, Fraunces, weight 300, tracking ajustado
- **Subtítulos**: 18–20 px, Inter Tight, weight 400, color muted
- **Cuerpo**: 15–16 px, Inter Tight, weight 400
- **Etiquetas/captions**: 12–13 px, Inter Tight, weight 500, uppercase tracking 0.06em
- **Precio total**: 40–56 px, Fraunces, weight 300 (como en apple.com)
- **Métricas (m², ud)**: JetBrains Mono, 14 px

### Espaciado

Generoso. Múltiplos de 8. El margen vertical entre secciones es
**al menos 96 px** en desktop. La página debería respirar como una
revista.

### Bordes y elevación

- Bordes de **1 px**, color `--border-soft`. Nunca borders gruesos.
- **Sin sombras de caja** salvo en el panel sticky de precio (sombra
  sutilísima `0 1px 0 rgba(0,0,0,0.04)`).
- Radios: `0` (cero) por defecto. Solo los inputs y botones llevan
  `4 px`. Nada de pill-shape ni cards redondeadas.

### Imágenes

- **Edge-to-edge**, sin marco, sin sombra, sin radio.
- Fondo neutro o transparente.
- Las maderas y patas se enseñan como si fueran piezas de un
  catálogo de diseño: un objeto, espacio en blanco alrededor, luz
  natural. NO collage, NO mockup-on-mockup.
- Si la imagen falta, mostrar un cuadrado con `--accent-bg` y el
  nombre del material centrado en mayúsculas espaciadas. Mejor eso
  que un placeholder genérico.

---

## 4. Lo que NO debe existir en esta UI

Lista explícita para evitar el "look AI":

- ❌ Gradientes (de cualquier color)
- ❌ Glassmorphism / blur backgrounds
- ❌ Sombras drop-shadow grandes
- ❌ Cards redondeadas con sombra "flotando"
- ❌ Iconos de emoji como decoración (✨🚀💫)
- ❌ Icon set redondeado tipo Heroicons-solid en colorines
- ❌ Botones con gradiente o borde animado
- ❌ Animaciones tipo "shimmer" o efectos de carga juguetones
- ❌ Frases tipo "Trusted by 1,000+ customers", testimonios falsos,
  estrellitas, badges
- ❌ Modo oscuro vistoso (no hace falta — claro es suficiente)
- ❌ Confeti, stickers, SVG abstractos de fondo
- ❌ Tipografías "round" tipo Comfortaa, Quicksand
- ❌ Ilustraciones vectoriales sintéticas
- ❌ "Get started" / "Let's go" / microcopy pseudoinglesa
- ❌ Iconos dentro de los botones por defecto

---

## 5. Estructura de la página

URL: `presupuesto.shibbishop.com`. Página única, scroll vertical o
wizard en pasos (la decisión técnica queda en manos del implementador,
ver "Modelo de interacción" abajo).

### 5.1 Header

- Logo Shibbi (texto en Fraunces, weight 400) a la izquierda.
- Nada en el centro.
- Pequeña etiqueta "Presupuesto a medida" en mayúsculas, tracking
  amplio, a la derecha.
- Borde inferior 1 px `--border-soft`. Altura ~64 px.

### 5.2 Hero (visible al cargar)

```
Diseña tu mueble.
A medida.
```

(Salto de línea real, dos sentencias rotundas. Fraunces, weight 300,
70 px en desktop. Sin botón CTA — el usuario empieza a configurar
directamente debajo.)

Subtítulo único, 1 frase:
> "Elige el material, las medidas y el acabado.
> Te damos una estimación al instante."

Bajo el subtítulo, una **línea fina horizontal** y luego empieza la
sección 1.

### 5.3 Modelo de interacción — preferido: scroll continuo, no wizard

**Recomendación fuerte**: en vez de un wizard de 5 pasos clásico
(con botones "Atrás/Siguiente"), proponer un **scroll continuo**
estilo apple.com configurador:

- Cada sección ocupa ~80 vh.
- El usuario hace scroll hacia abajo a su ritmo.
- El **panel de precio sticky** acompaña a la derecha (desktop) o
  abajo (móvil).
- Solo en el último paso (datos del cliente) hay un botón de
  envío explícito.

Justificación: percepción mucho más premium, el usuario controla
el ritmo, no se siente "interrogado". Los wizards multi-paso suelen
verse más AI/SaaS.

Si el implementador prefiere wizard, el resto del brief sigue
aplicando.

### 5.4 Sección 1 — Categoría

Eyebrow text en mayúsculas: `01 — Empieza por aquí`

Pregunta en Fraunces grande:
> "¿Qué quieres construir?"

Cuatro opciones presentadas como **una grid de 4 columnas en desktop,
2x2 en tablet, lista vertical en móvil**. Cada opción NO es una card
redondeada — es:

```
┌──────────────────────────┐
│                          │
│     [foto edge-to-edge]  │
│                          │
├──────────────────────────┤
│ Mesa                     │   ← Fraunces 24px
│ A medida en madera       │   ← Inter Tight 14px muted
│ Desde 180 €              │   ← JetBrains Mono 13px
└──────────────────────────┘
```

Borde 1 px en hover. Borde 1 px más oscuro y fondo `--accent-bg` en
selected. Transición 150 ms. Sin sombra. Sin scale-up.

### 5.5 Sección 2 — Material (si aplica)

Eyebrow: `02 — El material`

Pregunta:
> "Elige la madera o tablero."

**Layout editorial**: a la izquierda, foto enorme del material
seleccionado (full-bleed, ~600 px de alto). A la derecha, lista
vertical de opciones tipo:

```
Roble macizo                            180 €/m²
Pino macizo                              95 €/m²
Nogal macizo                            280 €/m²
─────────────────────────────────────────────────
Haya macizo                             140 €/m²
Contrachapado abedul                     90 €/m²
MDF chapado roble                        75 €/m²
```

(Tipografía mixta: nombre en Inter Tight 18px regular, precio en
JetBrains Mono 14px. Selected: subrayado fino bajo el nombre.)

Al cambiar el material, la imagen grande hace cross-fade de
~250 ms.

Debajo, un selector de **grosor** como segmented control horizontal
mínimo (texto, no botones):

```
3 cm  │  5 cm  │  8 cm
       ─────
```

### 5.6 Sección 3 — Patas / Componentes

Eyebrow: `03 — Las patas`

Mismo patrón visual que material. Foto grande de la pata, lista a
la derecha. Selector de cantidad debajo.

### 5.7 Sección 4 — Medidas

Eyebrow: `04 — Las medidas`

Tres inputs grandes en línea horizontal (en móvil, apilados).
Estilo Apple: input sin borde, solo línea inferior fina, label
flotante.

```
LARGO          ANCHO          ALTO
150 cm         80 cm          —
─────          ────           ───
```

Bajo los inputs, un texto sutil:
> 1.20 m² de superficie

(JetBrains Mono, 14 px, color muted.)

### 5.8 Sección 5 — Acabado y servicios

Eyebrow: `05 — El acabado`

Acabados como **lista vertical** (no grid de cards). Cada fila es
una línea con el nombre, descripción corta a la derecha y precio
al final. Selección con un pequeño círculo a la izquierda (no
checkbox tradicional).

Servicios extra como **toggles tipo Apple** (switch sutil), no
checkboxes.

### 5.9 Sección 6 — Tus datos

Eyebrow: `06 — Cuéntanos quién eres`

Inputs estilo Apple — sin borde, línea inferior, label que sube al
hacer focus. Un input por fila.

```
NOMBRE
Pablo Hernández
─────────────────────────────────────

EMAIL
pablo@correo.com
─────────────────────────────────────

TELÉFONO (OPCIONAL)
─────────────────────────────────────
```

Drop zone para fotos de inspiración: rectángulo con borde
discontinuo 1 px y texto centrado:
> Arrastra fotos de inspiración aquí
> JPG, PNG, WEBP — hasta 5 archivos

Sin iconos de cloud, sin animaciones de fondo.

### 5.10 Panel de precio (sticky lateral / inferior)

El elemento más importante visualmente. Vive a la derecha en
desktop (320 px de ancho fijo, sticky top con offset del header) y
abajo en móvil (sticky bottom, expandible al tocar).

```
┌─────────────────────────────────┐
│ TU MUEBLE                       │
│ ─────────────────────────────── │
│                                 │
│ Roble macizo (5 cm)             │
│ 1.20 m²                  216,00 │
│                                 │
│ Pata Hairpin                    │
│ 4 ud × 30 €              120,00 │
│                                 │
│ Aceite natural            35,00 │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ Estimación              371 €   │
│                                 │
│ Estimación orientativa.         │
│ Confirmamos el precio final     │
│ tras revisar tu solicitud.      │
└─────────────────────────────────┘
```

- Eyebrow "TU MUEBLE" en mayúsculas tracking 0.08em, 11 px.
- Cada partida en dos líneas: nombre + descriptor (Inter Tight
  14 px), importe a la derecha en JetBrains Mono.
- Total en Fraunces 48 px, weight 300, alineado a la izquierda.
  El símbolo "€" en tamaño 60% del número.
- Disclaimer en 12 px color muted.

Cuando el usuario añade/quita algo, las líneas hacen un fade-in
sutil (200 ms). Nada espectacular.

### 5.11 Botón final de envío

Único botón "fuerte" de la página. Negro sólido, texto blanco,
tipografía Inter Tight 16 px medium. Sin icono. Sin efecto hover
exagerado (solo cambio sutil de opacidad).

```
┌─────────────────────────────────┐
│       Enviar solicitud          │
└─────────────────────────────────┘
```

Estado loading: el texto cambia a `Enviando…` y el botón pasa a
opacidad 0.6, sin spinner.

### 5.12 Pantalla de confirmación

Tras envío exitoso, **scroll lock + fade del contenido a una nueva
"página"** (no modal, no overlay). Centrado vertical:

```
                Recibido.

         Te respondemos en menos
              de 24 horas.

   ─────────────────────────────────

   Mientras tanto, sígueme el rollo
            en Instagram.
            
              @shibbishop
```

(Sin tick verde gigante, sin confeti. La sobriedad transmite
profesionalidad.)

---

## 6. Mobile

70%+ del tráfico será móvil. Diseñar primero para 375 px de ancho.

- Texto del hero baja a 36–44 px.
- Las grids 4-col se vuelven listas verticales.
- El panel de precio se vuelve una **barra sticky inferior** de
  64 px de alto que muestra solo `Total: 371 €` + flecha. Al
  tocar la flecha se expande a pantalla completa con el desglose.
- Inputs aumentan a 48 px de alto mínimo.
- Espaciado entre secciones se reduce a 64 px.

---

## 7. Microinteracciones

Todas suaves, cortas, deliberadas.

| Acción | Animación |
|---|---|
| Selección de opción | Cambio de color de borde, 150 ms |
| Cambio de imagen de material | Cross-fade, 250 ms |
| Aparición de partida en el panel | Fade-in + slide 4 px desde abajo, 200 ms |
| Scroll entre secciones | Nativo del navegador, sin librerías |
| Botón hover | Opacidad 0.85, 100 ms |
| Apertura del panel mobile | Slide vertical, 300 ms ease-out |

**Nada de scroll snap obligatorio**. **Nada de parallax**. **Nada
de typewriter**.

---

## 8. Microcopy — tono

Frases cortas, declarativas. Cero exclamaciones decorativas. Tutea
sin ser cool.

Ejemplos:
- ✅ "¿Qué quieres construir?"
- ✅ "Elige el material."
- ✅ "Te damos una estimación al instante."
- ✅ "Recibido. Te respondemos en menos de 24 horas."

Evitar:
- ❌ "¡Empecemos! 🚀"
- ❌ "¿Listo para crear algo increíble?"
- ❌ "Tu mueble de ensueño está a un click"
- ❌ "Hazlo realidad hoy"

---

## 9. Accesibilidad

- Contraste mínimo AA en todos los textos.
- Navegación con teclado: Tab y Enter funcionan en todos los
  selectores. Las opciones de material son `<button role="radio">`
  semánticamente.
- `prefers-reduced-motion`: desactivar todas las animaciones.
- Labels visibles en formularios (no solo placeholder).
- Focus ring visible: outline 2 px `--text` con offset 2 px.

---

## 10. Stack técnico esperado

- **Next.js 14 App Router** (carpeta `configurador/` del repo)
- **Tailwind CSS** con tokens del paso 3 mapeados a CSS vars
- **shadcn/ui** SOLO como base — todos los componentes deben
  customizarse al lenguaje visual de arriba. NO usar el look
  por defecto de shadcn.
- **Framer Motion** para las pocas transiciones especificadas
- **React Hook Form** + **Zod** para el formulario final
- **Inter Tight** y **Fraunces** desde Google Fonts. **JetBrains
  Mono** desde Google Fonts.
- **next/image** con `placeholder="blur"` para todas las fotos

No introducir otras librerías sin justificación.

---

## 11. Contrato con el backend

El backend está siendo desarrollado en paralelo (en este mismo
repositorio, carpeta `configurador/`). Expone:

```ts
// GET /api/materiales?tipo=mesa
type Material = {
  id: string;
  nombre: string;
  tipo: 'madera' | 'tablero';
  precio_m2: number;
  grosor_opciones: string;     // "3,5,8"
  foto: string | null;
  descripcion: string;
  aplicable_a: string[];        // ['mesa', 'estanteria']
};

// GET /api/componentes?tipo=mesa
type Componente = {
  id: string;
  nombre: string;
  categoria: 'pata' | 'soporte' | 'marco';
  precio_unidad: number;
  unidad_default: number;
  unidad_opciones: string;      // "2,4,6"
  foto: string | null;
  descripcion: string;
};

// GET /api/extras?tipo=mesa[&categoria=acabado]
type Extra = {
  id: string;
  nombre: string;
  categoria: 'acabado' | 'servicio';
  precio: number;
  modificador: 'fijo' | 'porcentaje';
  descripcion: string;
};

// POST /api/solicitudes
type SolicitudInput = {
  tipo: 'mesa' | 'estanteria' | 'espejo' | 'otro';
  material_id?: string;
  grosor?: number;
  medidas: { largo: number; ancho: number; alto?: number };
  componentes: Array<{ id: string; cantidad: number }>;
  acabado_id?: string;
  servicios_ids: string[];
  descripcion_libre?: string;
  imagenes: string[];           // URLs ya subidas a Supabase Storage
  nombre: string;
  email: string;
  telefono?: string;
  canal_preferido: 'email' | 'whatsapp' | 'cualquiera';
  notas_adicionales?: string;
};

// Cálculo cliente-side:
import { calcularEstimacion } from '@/lib/pricing';
const { total, desglose } = calcularEstimacion(config, materiales, componentes, extras);
```

El front debe usar `lib/pricing.ts` (ya existe) para calcular el
precio en vivo. No re-implementar la lógica.

---

## 12. Entregable esperado

- `app/page.tsx` con la página completa
- `components/configurador/*.tsx` con cada sección como componente
  separado y reutilizable
- `components/ui/*.tsx` con primitivas customizadas (Button, Input,
  Radio, Switch, Section)
- `app/globals.css` con CSS vars y carga de fuentes
- `tailwind.config.ts` con los tokens mapeados

Todos los componentes deben aceptar las props que conecten con el
backend (lista de materiales, callback de selección, etc.). El
implementador NO necesita preocuparse del fetch — solo de la
presentación. El cableado lo hago yo desde el backend.
