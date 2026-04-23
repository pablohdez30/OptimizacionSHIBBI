# ShibbiShop Manager — Web

Versión web de la aplicación, migrada desde Python/CustomTkinter.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + design system en `app/globals.css`
- **Supabase** (PostgreSQL + Auth)
- **Vercel** (despliegue)

## Desarrollo local

```bash
cd webapp
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura

```
webapp/
├── app/
│   ├── (app)/               # Grupo de rutas con sidebar
│   │   ├── layout.tsx       # Layout con sidebar
│   │   ├── dashboard/
│   │   ├── presupuestos/
│   │   ├── nuevo-presupuesto/
│   │   ├── facturas/
│   │   ├── historico-muebles/
│   │   ├── calendario/
│   │   ├── clientes/
│   │   ├── proveedores/
│   │   └── configuracion/
│   ├── layout.tsx           # Root layout (Inter + JetBrains Mono)
│   ├── globals.css          # Design system tokens
│   └── page.tsx             # Redirige a /dashboard
├── components/
│   ├── Sidebar.tsx
│   └── PageStub.tsx
├── utils/supabase/
│   ├── client.ts            # Supabase client (browser)
│   ├── server.ts            # Supabase client (server)
│   └── middleware.ts        # Auth session refresh
├── middleware.ts            # Next middleware → refresca sesión Supabase
├── tailwind.config.ts       # Paleta dark mode + dorado
└── .env.local               # Credenciales Supabase (no se sube)
```

## Fases

- **Fase A (hecha)**: scaffolding Next.js + Tailwind + Supabase + stubs
- **Fase B**: migrar schema SQLite → Supabase + volcar datos
- **Fase C**: convertir los diseños de Claude Design a páginas con datos reales
