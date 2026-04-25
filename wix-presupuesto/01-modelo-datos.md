# 1. Modelo de datos — Colecciones de Wix Data

Vamos a crear **4 colecciones** en el CMS de Wix Studio. Una para cada tipo
de dato. Editas precios, añades patas o materiales nuevos directamente
desde la tabla del CMS, sin tocar código.

## Cómo abrir el CMS en Wix Studio

1. Editor de Wix Studio → barra izquierda → icono de **CMS** (cilindros).
2. Si nunca has usado CMS: pulsa **"Start Now"** o **"Add CMS"**.
3. Botón **"+ Create Collection"** para cada una de las 4 colecciones.

Para cada colección, después de crearla:
- Pestaña **Permissions** → poner **"Anyone"** en Read (la página pública necesita leer materiales). Write solo para Admin.
- Pestaña **Import** → subir el CSV correspondiente de `data/`.

---

## Colección 1 — `Materiales`

Maderas y tableros que el cliente puede elegir para el tablón.

| Campo (ID interno) | Tipo | Descripción |
|---|---|---|
| `nombre` | Text | Ej: "Roble macizo" |
| `tipo` | Text | `madera` \| `tablero` |
| `precioM2` | Number | €/m² retail (con margen Shibbi) |
| `grosorOpciones` | Text | Ej: `3,5,8` (cm separados por coma) |
| `foto` | Image | Foto del material |
| `descripcion` | Text | Descripción corta visible al cliente |
| `aplicableA` | Tags | `mesa`, `estanteria` (multi-select) |
| `orden` | Number | Para ordenar en la UI |
| `activo` | Boolean | Si está visible en el configurador |

**Permisos**:
- Read: **Anyone** (la página pública necesita leerlo)
- Write: **Admin only**

---

## Colección 2 — `Componentes`

Patas, soportes y otros elementos secundarios del mueble.

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | Text | Ej: "Pata Hairpin (horquilla)" |
| `categoria` | Text | `pata` \| `soporte` \| `marco` |
| `precioUnidad` | Number | €/ud retail |
| `unidadDefault` | Number | Cuántas se ponen por defecto (4 patas, 2 patas X, etc.) |
| `unidadOpciones` | Text | Opciones permitidas, ej: `2,4,6` |
| `foto` | Image | |
| `descripcion` | Text | |
| `aplicableA` | Tags | `mesa`, `estanteria`, `espejo` |
| `orden` | Number | |
| `activo` | Boolean | |

**Permisos**: igual que Materiales.

---

## Colección 3 — `Extras`

Acabados (aceite, barniz, lacado…) y servicios (montaje, urgencia, embalaje).

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | Text | Ej: "Aceite natural" |
| `categoria` | Text | `acabado` \| `servicio` |
| `precio` | Number | Importe (en € si fijo, en % si modificador) |
| `modificador` | Text | `fijo` \| `porcentaje` |
| `descripcion` | Text | |
| `aplicableA` | Tags | A qué muebles aplica |
| `orden` | Number | |
| `activo` | Boolean | |

**Permisos**: igual.

---

## Colección 4 — `SolicitudesPresupuesto`

Aquí se guardan las solicitudes que envían los clientes. **No hay seed** —
se llena sola conforme reciba peticiones.

| Campo | Tipo | Descripción |
|---|---|---|
| `tipo` | Text | `mesa` \| `estanteria` \| `espejo` \| `otro` |
| `materialId` | Reference → Materiales | (solo si aplica) |
| `materialNombre` | Text | Snapshot del nombre por si cambia luego |
| `grosor` | Number | cm |
| `medidasLargo` | Number | cm |
| `medidasAncho` | Number | cm |
| `medidasAlto` | Number | cm (estanterías/espejos) |
| `componentes` | Object | Array `[{id, nombre, precioUnidad, cantidad}]` |
| `acabadoId` | Reference → Extras | |
| `extrasIds` | Multi-Reference → Extras | Servicios extra |
| `descripcionLibre` | Text | Lo que ha escrito el cliente |
| `imagenes` | Gallery | Fotos de inspiración subidas |
| `presupuestoEstimado` | Number | El total que vio el cliente |
| `desglose` | Object | JSON con el desglose completo |
| `nombre` | Text | Cliente |
| `email` | Text | |
| `telefono` | Text | |
| `canalPreferido` | Text | `email` \| `whatsapp` \| `cualquiera` |
| `estado` | Text | `pendiente` \| `contactado` \| `presupuestado` \| `cerrado` \| `descartado` |
| `notasInternas` | Text | Para vuestro uso, no lo ve el cliente |
| `contactId` | Text | ID del contacto en Wix CRM |

**Permisos**:
- Read: **Admin only** (¡importante! son datos de clientes)
- Write: **Anyone** *con* la opción "Insert via form/Velo" (porque el formulario público escribe aquí). Si no encuentras esta opción, déjalo en "Site Member" — el código backend usará permisos elevados.

> **Nota Wix Studio**: en colecciones nuevas la pestaña de permisos puede
> aparecer como "Custom Permissions". Si lo ves, marca:
> - Read: Admin only
> - Create: Anyone
> - Update / Delete: Admin only

---

## Importar los CSVs

Para `Materiales`, `Componentes` y `Extras`:

1. CMS → abre la colección.
2. Botón **"⋯"** (más opciones) → **"Import items from CSV"**.
3. Sube el CSV correspondiente de `data/`.
4. **Mapear columnas**: Wix te enseña una preview. Verifica que cada columna del CSV se mapea al campo correcto.
5. **Import**.

> Las columnas `foto` en los CSVs vienen vacías. Después de importar, edita
> cada fila y sube la foto desde el Media Manager. El código del configurador
> ya usa `foto` como referencia.

---

## Verificación rápida

Tras importar, abre cada colección y comprueba:

- ✅ `Materiales` tiene ~6 filas (roble, pino, nogal, haya, contrachapado, MDF chapado).
- ✅ `Componentes` tiene ~9 filas (7 tipos de patas + 2 soportes de estantería).
- ✅ `Extras` tiene ~8 filas (5 acabados + 3 servicios).
- ✅ `SolicitudesPresupuesto` está vacía (es lo correcto).

Si todo está bien, sigue a `02-elementos-pagina.md`.
