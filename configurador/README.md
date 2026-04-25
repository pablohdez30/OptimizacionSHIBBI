# Configurador público de Shibbi

App pública para que clientes diseñen un mueble Shibbi a medida y reciban
una estimación al instante.

> **Importante**: este proyecto es **público** y **NO comparte datos** con
> la app interna del taller (`webapp/`). Cada uno tiene su propio Supabase.

## Stack

- **Next.js 14** (App Router, TypeScript, Tailwind)
- **Supabase** (Postgres, Storage para imágenes, RLS)
- **Resend** para emails transaccionales
- **Vercel** para deploy
- **Subdominio**: `presupuesto.shibbishop.com`

## Estado actual

| Capa | Estado |
|---|---|
| Brief de diseño | ✅ `docs/DESIGN-BRIEF.md` |
| Frontend completo (Next.js + TS) | ✅ `app/` + `components/` |
| Lógica de pricing | ✅ `lib/pricing.ts` |
| Datos del catálogo (mock) | ✅ `lib/catalogo.ts` |
| Schema + RLS Supabase | ✅ `supabase/*.sql` |
| Seed data placeholder | ✅ `supabase/seed.sql` |
| Validación con Zod | ✅ `lib/validation.ts` |
| Helpers Supabase + Resend | ✅ `lib/*` |
| **Supabase proyecto real** | ⏳ pendiente |
| **API routes** (`/api/solicitudes`) | ⏳ pendiente (cuando Supabase) |
| **Cableado submit real** | ⏳ pendiente |
| **Subida imágenes a Storage** | ⏳ pendiente |
| **Deploy Vercel** | ⏳ pendiente |
| **DNS subdominio** | ⏳ pendiente |

> Hoy mismo puedes hacer `npm run dev` y ver la página completa funcionando
> con datos de ejemplo. El submit por ahora solo loguea en consola
> (`console.log('[stub]')`) — no envía nada real porque Supabase y Resend
> aún no están configurados.

## Estructura

```
configurador/
├── README.md                ← este archivo
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── postcss.config.js
├── .env.example             ← copiar a .env.local con valores reales
├── .gitignore
│
├── docs/
│   └── DESIGN-BRIEF.md      ← brief para herramienta de diseño AI
│
├── app/
│   ├── layout.tsx           ← shell con fuentes (Fraunces, Inter Tight, JetBrains Mono)
│   ├── page.tsx             ← página única del configurador
│   └── globals.css          ← CSS vars + responsive
│
├── components/
│   ├── Header.tsx, Hero.tsx, ProgressRail.tsx, Confirmation.tsx
│   ├── PricePanel.tsx, MobilePricePanel.tsx
│   ├── primitives/          ← Container, Section, LineInput, Switch…
│   └── sections/            ← 6 secciones del configurador
│
├── lib/
│   ├── types.ts             ← tipos compartidos
│   ├── catalogo.ts          ← datos mock (materiales, patas, acabados…)
│   ├── pricing.ts           ← cálculo de estimación
│   ├── format.ts            ← formato EUR español
│   ├── validation.ts        ← schemas Zod
│   ├── email.ts             ← envío con Resend
│   └── supabase/
│       ├── server.ts        ← clientes server-side
│       └── client.ts        ← cliente browser
│
└── supabase/
    ├── schema.sql           ← tablas + triggers
    ├── rls.sql              ← row level security
    └── seed.sql             ← datos placeholder
```

## Desarrollo local

```bash
cd configurador
npm install
cp .env.example .env.local   # luego rellenar con valores reales
npm run dev                  # → http://localhost:3000
```

## Setup de Supabase (pendiente, lo haremos juntos)

1. Crear nuevo proyecto en supabase.com (NO el del taller — uno nuevo).
2. Region: West EU (Ireland).
3. SQL Editor → ejecutar en orden:
   - `supabase/schema.sql`
   - `supabase/rls.sql`
   - `supabase/seed.sql`
4. Storage → crear bucket `inspiracion` (público).
5. Settings → API → copiar URL y claves a `.env.local`.

## Setup de Resend (pendiente)

1. Crear cuenta en resend.com (free tier: 3000 emails/mes).
2. Verificar dominio shibbishop.com (añadir registros DNS desde Wix).
3. Copiar API key a `RESEND_API_KEY` en `.env.local`.

## Deploy a Vercel (pendiente)

1. vercel.com/new → importar repo `OptimizacionSHIBBI`.
2. **Root Directory**: `configurador` ⚠️ (igual que la app interna).
3. **Framework Preset**: Next.js.
4. Añadir las env vars de `.env.example`.
5. Deploy.
6. Settings → Domains → añadir `presupuesto.shibbishop.com`.
7. Wix Dashboard → Domain → añadir registro CNAME `presupuesto`
   apuntando a `cname.vercel-dns.com`.

---

## Filosofía de precios placeholder

Los precios del seed son **estimaciones razonables del sector** (España
2026). Se pueden actualizar editando filas desde el panel de Supabase
sin tocar código.

Lógica:
- **€/m² maderas** = coste proveedor × 3-4 (margen taller artesano).
- **€/ud patas** = precios de mercado para piezas comparables.
- **Acabados** = fijos típicos para mesa media.
- **Montaje Madrid** = 50 € fijo.
