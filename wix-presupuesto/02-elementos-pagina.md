# 2. Elementos de la página `/presupuesto`

Aquí tienes la **lista de elementos** que tienes que arrastrar al editor de
Wix Studio en la página `/presupuesto`, con los **IDs exactos** que el código
espera. Si pones un ID distinto, el código no encontrará el elemento.

> **Cómo poner un ID en Wix Studio**: selecciona el elemento → panel
> derecho **"Properties & Events"** → campo **"ID"** (arriba). Cambia el ID
> que Wix asigna por defecto (ej: `text12`) por el que pongo abajo (ej: `txtTotalPrecio`).

## Crear la página

1. Editor → **Pages** → **+ Add Page** → **Blank Page**.
2. Nombre: `Presupuesto`.
3. URL (SEO settings): `/presupuesto`.
4. Layout: **full width**, fondo `#FAF7F2` (crema cálido).

## Estructura general (de arriba a abajo)

```
[ HEADER global de Shibbi ]
┌───────────────────────────────────────────────┐
│ HERO                                          │
│  - Título grande                              │
│  - Subtítulo                                  │
│  - Barra de progreso                          │
├───────────────────────────────────────────────┤
│ MULTISTATEBOX (el wizard)                     │
│  ├─ Estado: paso1                             │
│  ├─ Estado: paso2                             │
│  ├─ Estado: paso3                             │
│  ├─ Estado: paso4                             │
│  ├─ Estado: paso5                             │
│  └─ Estado: confirmacion                      │
├───────────────────────────────────────────────┤
│ FOOTER global de Shibbi                       │
└───────────────────────────────────────────────┘
```

A la derecha del wizard (en desktop) o sticky abajo (en móvil), el **panel
de precio en vivo**.

---

## Elementos exactos con IDs

### HERO (siempre visible, fuera del MultiStateBox)

| Elemento | ID | Texto/contenido |
|---|---|---|
| Title (h1) | — | "¿Tienes una idea en la cabeza?" |
| Subtitle | — | "Diseña tu mueble Shibbi a medida y te damos una estimación al instante." |
| ProgressBar | `#progressBar` | min=0, max=100, valor inicial=20 |
| Text | `#txtPasoActual` | "Paso 1 de 5" |

---

### MULTISTATEBOX

Arrastra un **MultiStateBox** y dale 6 estados (botón **"+"** dentro del componente):

| Estado (ID del estado) |
|---|
| `paso1` |
| `paso2` |
| `paso3` |
| `paso4` |
| `paso5` |
| `confirmacion` |

ID del MultiStateBox: `#wizard`.

---

### Estado `paso1` — Categoría de mueble

4 tarjetas grandes (Box → con imagen + texto + botón invisible cubriendo todo).

| Elemento | ID |
|---|---|
| Card Mesa | `#cardMesa` |
| Card Estantería | `#cardEstanteria` |
| Card Espejo | `#cardEspejo` |
| Card Otro | `#cardOtro` |
| Texto descripción categoría seleccionada | `#txtCategoriaSeleccionada` |
| Botón Siguiente | `#btnSiguiente1` |

> El "Atrás" no existe en paso 1 (es el primero).

**Estilo de tarjetas seleccionables**:
- Borde 2px gris claro normal
- Borde 2px color de marca cuando `selected = true` (lo gestiona el código)

---

### Estado `paso2` — Configurar tablón + patas (caso mesa)

Este paso es **condicional**: si el cliente eligió `mesa` o `estanteria`, ve
configurador de material + componentes. Si eligió `espejo`, ve configurador
de marco. Si eligió `otro`, ve un textarea grande.

#### Sub-bloque: Selector de material (Repeater)

| Elemento | ID |
|---|---|
| Repeater de materiales | `#repeaterMateriales` |
| Dentro del repeater — imagen | `#imgMaterial` |
| Dentro del repeater — nombre | `#txtNombreMaterial` |
| Dentro del repeater — precio | `#txtPrecioMaterial` |
| Dentro del repeater — caja clickable | `#tarjetaMaterial` |

#### Sub-bloque: Grosor

| Elemento | ID |
|---|---|
| RadioButtonGroup grosor | `#rbGrosor` |

> Las opciones del radio se rellenan dinámicamente desde el material elegido.

#### Sub-bloque: Selector de componentes (Repeater)

| Elemento | ID |
|---|---|
| Repeater de componentes | `#repeaterComponentes` |
| Imagen | `#imgComponente` |
| Nombre | `#txtNombreComponente` |
| Precio | `#txtPrecioComponente` |
| Caja clickable | `#tarjetaComponente` |
| RadioButtonGroup cantidad | `#rbCantidadComponente` |

#### Sub-bloque: caso "otro" (form libre)

| Elemento | ID |
|---|---|
| Container form libre | `#contFormLibre` |
| TextArea descripción libre | `#taDescripcionLibre` |

#### Navegación paso 2

| Elemento | ID |
|---|---|
| Botón Atrás | `#btnAtras2` |
| Botón Siguiente | `#btnSiguiente2` |

---

### Estado `paso3` — Medidas

| Elemento | ID |
|---|---|
| Input largo (number) | `#inpLargo` |
| Input ancho (number) | `#inpAncho` |
| Input alto (number) | `#inpAlto` |
| Texto m² calculados | `#txtMetrosCuadrados` |
| Botón Atrás | `#btnAtras3` |
| Botón Siguiente | `#btnSiguiente3` |

> El input `#inpAlto` solo se muestra para estanterías y espejos. El código
> lo oculta automáticamente.

---

### Estado `paso4` — Acabado y extras

| Elemento | ID |
|---|---|
| Repeater acabados | `#repeaterAcabados` |
| Imagen acabado | `#imgAcabado` |
| Nombre acabado | `#txtNombreAcabado` |
| Precio acabado | `#txtPrecioAcabado` |
| Caja clickable | `#tarjetaAcabado` |
| Repeater servicios extra (checkboxes) | `#repeaterServicios` |
| Checkbox dentro repeater | `#chkServicio` |
| Nombre servicio | `#txtNombreServicio` |
| Precio servicio | `#txtPrecioServicio` |
| Botón Atrás | `#btnAtras4` |
| Botón Siguiente | `#btnSiguiente4` |

---

### Estado `paso5` — Datos del cliente

| Elemento | ID |
|---|---|
| Input nombre | `#inpNombre` |
| Input email | `#inpEmail` |
| Input teléfono | `#inpTelefono` |
| RadioButtonGroup canal preferido | `#rbCanal` |
| TextArea notas adicionales | `#taNotas` |
| UploadButton imágenes inspiración | `#uploadImagenes` |
| Checkbox aceptar privacidad | `#chkPrivacidad` |
| Container resumen final | `#contResumen` |
| Repeater desglose final | `#repeaterDesgloseFinal` |
| Texto total final | `#txtTotalFinal` |
| Botón Atrás | `#btnAtras5` |
| Botón Enviar solicitud | `#btnEnviar` |
| Texto mensaje de error | `#txtErrorEnvio` |
| Loader spinner mientras envía | `#loaderEnvio` |

> El campo de upload de imágenes acepta hasta 5 archivos, max 10MB cada uno.

---

### Estado `confirmacion` — Pantalla final

| Elemento | ID |
|---|---|
| Texto principal "¡Recibido!" | `#txtConfirmacion` |
| Texto con nombre del cliente | `#txtConfirmacionNombre` |
| Botón WhatsApp | `#btnWhatsapp` |
| Botón Instagram | `#btnInstagram` |
| Botón "Volver al inicio" | `#btnVolverInicio` |

> El botón WhatsApp lleva a `https://wa.me/<número>` (lo configuras tú).
> Instagram a `https://instagram.com/shibbishop`.

---

### Panel de precio en vivo (sticky, fuera del MultiStateBox)

Container fijo a la derecha en desktop, abajo en móvil.

| Elemento | ID |
|---|---|
| Container panel | `#panelPrecio` |
| Repeater desglose | `#repeaterDesglose` |
| Concepto (dentro repeater) | `#txtConcepto` |
| Cantidad (dentro repeater) | `#txtCantidad` |
| Importe (dentro repeater) | `#txtImporte` |
| Texto total | `#txtTotalPrecio` |
| Texto disclaimer | `#txtDisclaimer` |

Disclaimer: *"Estimación orientativa. Confirmamos el precio final tras revisar tu solicitud."*

---

## Ajustes de responsive (móvil)

En el editor de Wix Studio, cambia al **Mobile view** y:

- El panel de precio (`#panelPrecio`) → posición **Fixed bottom**, comprimible.
- Las tarjetas grandes → apiladas verticalmente, ancho 100%.
- Los repeaters → 1 columna en móvil, 2-3 columnas en desktop.

---

## Verificación

Al terminar este paso, deberías tener:

- ✅ Página `/presupuesto` creada
- ✅ MultiStateBox con 6 estados nombrados correctamente
- ✅ Todos los elementos con los IDs exactos de arriba
- ✅ Hero arriba, panel de precio sticky a la derecha/abajo
- ✅ Todo se ve correctamente en preview (aunque sin lógica todavía)

Si todo está, sigue a `03-instalacion-codigo.md`.
