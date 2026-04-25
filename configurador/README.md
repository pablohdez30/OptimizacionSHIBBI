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

🚧 En construcción.

| Capa | Estado |
|---|---|
| Brief de diseño | ✅ `docs/DESIGN-BRIEF.md` |
| Estructura del proyecto | ✅ |
| Lógica de pricing | ✅ `lib/pricing.ts` |
| Schema + RLS Supabase | ✅ `supabase/*.sql` |
| Seed data placeholder | ✅ `supabase/seed.sql` |
| Tipos compartidos | ✅ `lib/types.ts` |
| Validación con Zod | ✅ `lib/validation.ts` |
| Helpers Supabase | ✅ `lib/supabase/*` |
| Helper Resend | ✅ `lib/email.ts` |
| Setup Supabase real | ⏳ pendiente |
| API routes | ⏳ pendiente (después de Supabase) |
| Frontend (componentes) | ⏳ pendiente (Claude Design) |
| Cableado front ↔ API | ⏳ pendiente |
| Deploy Vercel | ⏳ pendiente |
| DNS subdominio | ⏳ pendiente |

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
├── lib/
│   ├── types.ts             ← tipos compartidos
│   ├── pricing.ts           ← cálculo de estimación
│   ├── validation.ts        ← schemas Zod
│   ├── email.ts             ← envío con Resend
│   └── supabase/
│       ├── server.ts        ← clientes server-side
│       └── client.ts        ← cliente browser
│
├── supabase/
│   ├── schema.sql           ← tablas + triggers
│   ├── rls.sql              ← row level security
│   └── seed.sql             ← datos placeholder
│
└── app/                     ← (pendiente) páginas y API routes
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
