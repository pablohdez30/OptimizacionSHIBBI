# Configurador de presupuestos — Shibbi

Página `/presupuesto` para shibbishop.com. Wizard multi-paso donde el cliente
configura su mueble (mesa / estantería / espejo / otro), ve una **estimación
orientativa en vivo**, sube fotos de inspiración y manda la solicitud.

> **Importante**: el precio que ve el cliente se llama "estimación
> orientativa", **no presupuesto**. Vosotros confirmáis después con el
> presupuesto real (defectos de madera, transporte real, etc.).

## Stack

- **Wix Studio** + **Velo** (JavaScript en el editor de Wix)
- **Wix Data** (CMS) → 4 colecciones para materiales, componentes, extras y solicitudes
- **Wix CRM** → contactos automáticos al recibir solicitud
- **Triggered Emails** → email a `shibbishop@gmail.com` y al cliente

## Estructura de la carpeta

```
wix-presupuesto/
├── README.md                     ← este archivo (visión general)
├── 01-modelo-datos.md            ← qué colecciones crear y con qué campos
├── 02-elementos-pagina.md        ← qué elementos arrastrar al editor + IDs
├── 03-instalacion-codigo.md      ← cómo pegar el código Velo
│
├── data/
│   ├── materiales.csv            ← maderas (placeholder)
│   ├── componentes.csv           ← patas/soportes (placeholder)
│   └── extras.csv                ← acabados/servicios (placeholder)
│
└── code/
    ├── page-presupuesto.js       ← código del wizard (frontend Velo)
    ├── public/pricing.js         ← cálculos compartidos
    └── backend/quotes.web.js     ← submit + email + CRM
```

## Orden de instalación recomendado

Sigue los `.md` en orden. Cada uno es un paso completo:

1. **`01-modelo-datos.md`** → Crear las 4 colecciones en Wix Data e importar los CSV.
2. **`02-elementos-pagina.md`** → Diseñar la página `/presupuesto` en el editor con los IDs correctos.
3. **`03-instalacion-codigo.md`** → Activar Velo, pegar los 3 ficheros de `code/`, configurar emails.

Tiempo estimado primera vez: **2-3 horas**. La mayor parte es montar la UI en
el editor de Wix; el código se pega en 5 minutos.

## Filosofía de precios placeholder

Los precios de los CSV son **estimaciones razonables del sector mueble en España
(2026)**. Sirven para que el configurador funcione desde el día 1 y veáis cómo
queda. Cuando tengáis los precios reales, los ajustáis editando las
colecciones desde el dashboard de Wix (sin tocar código).

| Concepto | Lógica del placeholder |
|---|---|
| **Maderas (€/m²)** | Coste proveedor × ~3.5 (margen sector mueble artesano) |
| **Patas (€/ud)** | Precio de mercado para patas comparables |
| **Acabados** | Precios fijos típicos para mesa pequeña-media |
| **Montaje Madrid** | 50 € fijo (luego ajustáis según tamaño) |

## Después del MVP — ideas para v2

Cuando esta primera versión esté en producción y tengáis feedback real:

- **Visualizador 3D** del mueble configurado (con Three.js, embebido)
- **Cálculo de envío automático** por código postal
- **Webhook a la app interna** del taller cuando llega una solicitud
- **Galería "Hechos en Shibbi"** con proyectos previos como inspiración
- **Login con Google** para que el cliente pueda guardar diseños y volver

Ninguna de estas es necesaria ahora. El MVP debe validar que el formato
funciona y mejora la calidad de los leads que recibís.
