# AURA Bienestar Estético

Landing + dashboard de clientas + panel admin para un centro de estética en Pasto, Colombia.

**Stack:** Next.js 14 (App Router), TypeScript, Tailwind, Framer Motion, Supabase (Postgres + Auth + Storage), OpenAI (chat + OCR de comprobantes), ElevenLabs (voz del chat).

---

## Setup

### 1. Dependencias

```bash
npm install
```

### 2. Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores. Como mínimo necesitas un proyecto Supabase y una API key de OpenAI.

```bash
cp .env.example .env.local
```

### 3. Supabase

1. Crea un **proyecto nuevo** en [supabase.com](https://supabase.com) (no compartir con otros productos).
2. **Authentication → Providers → Google**: habilítalo. Sigue [esta guía](https://supabase.com/docs/guides/auth/social-login/auth-google) para crear el OAuth client en Google Cloud y pegar `Client ID` + `Client Secret` en Supabase. La URL de callback la copia el dashboard.
3. **Storage → Buckets**: crea dos buckets:
   - `receipts` — **privado** (comprobantes de pago)
   - `gallery`  — **público** (fotos antes/después y testimonios)
4. **SQL Editor**: pega y ejecuta el contenido de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
5. Copia `Project URL` y `anon`/`service_role` keys a `.env.local`.

### 4. Promover tu admin inicial

Tras hacer login con Google una primera vez, ejecuta en el SQL Editor de Supabase:

```sql
update public.users set role = 'admin'
where email = 'tu-email@gmail.com';
```

(Reemplaza con el valor de `ADMIN_EMAIL_SEED`.)

### 5. Correr en local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Scripts

- `npm run dev` — desarrollo
- `npm run build` — build de producción
- `npm run start` — servir build
- `npm run lint` — ESLint

---

## Estructura

```
src/
├── app/
│   ├── page.tsx                  ← landing pública
│   ├── login/                    ← login Google
│   ├── auth/                     ← callback OAuth
│   ├── dashboard/                ← área cliente (protegida)
│   ├── admin/                    ← panel admin (role=admin)
│   └── api/                      ← chat, tts, booking, payments, coupons, admin
├── components/
├── contexts/AuthContext.tsx
├── lib/                          ← supabase clients, OCR, cupones, slots
└── middleware.ts                 ← refresh de sesión
supabase/migrations/              ← esquema SQL
```

---

## Flujos principales

**Cliente**: Landing → `Agendar online` → Login Google → Wizard (servicio → fecha/hora → cupón → subir comprobante Nequi) → confirmación automática con código de canje.

**Admin**: `/admin` → KPIs, cola de pagos en revisión, CRUD de cupones, servicios, disponibilidad, galería y citas.

---

## Despliegue

Vercel-ready. Configura las mismas variables de entorno en el dashboard de Vercel y añade la URL de producción al callback de Google OAuth en Supabase.

---

Powered by [AINovaX](https://ainovax.vercel.app).
