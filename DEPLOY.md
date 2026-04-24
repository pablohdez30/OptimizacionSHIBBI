# Deploy / Operación — ShibbiShop webapp

Guía rápida para desplegar cambios y arrancar desde cero si hiciera falta.
La app vive en `webapp/` (el resto del repo es la app Python antigua).

**URL producción**: https://optimizacion-shibbi.vercel.app

---

## Flujo diario (cambios en el código)

```bash
# 1. Editar en tu editor
# 2. Probar local
cd webapp
npm run dev          # → http://localhost:3000

# 3. Cuando funciona
git add webapp/
git commit -m "descripción breve"
git push origin main

# 4. Vercel despliega en 1-2 min automáticamente
```

Vercel detecta el push y hace deploy. Si el build rompe, recibes email y
la versión anterior sigue activa (no se rompe prod).

### Doble red de seguridad antes de push

Si el cambio es grande o tocas cosas raras:

```bash
cd webapp
npm run build        # mismo comando que ejecuta Vercel
```

Si pasa en local, pasa en Vercel.

---

## Rollback rápido

Si un deploy rompe algo en producción:

1. Vercel → Deployments
2. Busca un deploy verde anterior sano
3. Menú `···` → **Promote to Production**
4. En 10 segundos la URL vuelve al estado anterior

El código local no cambia — el rollback solo mueve el alias.

---

## Configuración crítica de Vercel

Si alguna vez hay que re-crear el proyecto en Vercel, **estos settings son obligatorios**:

| Setting | Valor |
|---|---|
| **Root Directory** | `webapp` ⚠️ (la app Next.js no está en la raíz del repo) |
| **Framework Preset** | **Next.js** ⚠️ (si queda en "Other" todas las rutas devuelven 404) |
| **Build Command** | autodetect `next build` |
| **Install Command** | autodetect `npm install` |
| **Node.js Version** | 20.x o 24.x |

### Variables de entorno (Settings → Environment Variables)

| Key | Scope | Valor |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production + Preview + Development | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production + Preview + Development | clave publishable `sb_publishable_...` |

Ambas deben estar marcadas en los 3 entornos.

---

## Stack + arquitectura de auth

- Next.js 14 App Router, TypeScript, Tailwind
- Supabase (Postgres + Auth)
- `@supabase/ssr` 0.5.2 + `@supabase/supabase-js` 2.47.10 (pineados)
- La auth se hace en **server component** `app/(app)/layout.tsx` (no en middleware)
  porque el middleware corre en Edge Runtime e incompatibiliza con Supabase
  (`__dirname is not defined`). Si hay que volver a tocar la auth, **no** uses
  middleware.ts — usa un server component en el layout.
- Seguridad en 2 capas:
  1. Layout redirige a `/login` si no hay sesión (UX)
  2. RLS activada en Supabase (`webapp/supabase/enable_rls.sql`) — defensa en profundidad

---

## Exportación de PDFs/Excel

Usa la **File System Access API** (solo Chromium: Chrome, Edge, Opera). El
handle de carpeta se guarda en IndexedDB **por origen**. Esto significa:

- El localhost:3000 y la URL de producción son orígenes distintos → hay que
  **re-elegir la carpeta** la primera vez que se entra a prod.
- Configuración → "Carpeta de Exportación" → Elegir carpeta.

---

## Crear usuarios nuevos en Supabase

Este es un sistema cerrado, no hay registro público. Para dar acceso:

1. Supabase Dashboard → Authentication → **Users** → **Add user** → **Create new user**
2. Email + contraseña + **Auto Confirm User** marcado
3. Create

Para quitar acceso: Users → click en la fila → **Delete**.

---

## Cambiar env vars en Vercel

Añadir/modificar env vars **no redespliega automáticamente**. Tras guardar:

1. Deployments → último deploy → menú `···` → **Redeploy**
2. O haz un commit vacío para forzar:
   ```bash
   git commit --allow-empty -m "chore: refresh env vars"
   git push origin main
   ```

---

## Re-crear el proyecto en Vercel desde cero (por si se corrompe)

1. Vercel → proyecto → Settings → General → scroll al fondo → **Delete Project**
2. vercel.com/new → importar `OptimizacionSHIBBI`
3. **Elegir `webapp` como Root Directory** (sin esto nada funciona)
4. Framework Preset: **Next.js** (crítico)
5. Añadir las 2 env vars
6. Deploy

---

## Schema / base de datos

- Schema principal: [`webapp/supabase/schema.sql`](webapp/supabase/schema.sql)
- Activar RLS: [`webapp/supabase/enable_rls.sql`](webapp/supabase/enable_rls.sql)

Para migraciones nuevas (alter tables, nuevas columnas, etc.), crea un archivo
`.sql` en `webapp/supabase/` y ejecútalo manualmente en el **SQL Editor** de
Supabase. Commitéalo al repo como histórico.

---

## Costes actuales

| Servicio | Plan | Coste |
|---|---|---|
| Vercel | Hobby | 0 €/mes |
| Supabase | Free | 0 €/mes |
| Dominio (opcional) | — | ~10 €/año |

Plan gratuito aguanta de sobra para 1-5 usuarios activos del taller.
