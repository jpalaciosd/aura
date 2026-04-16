-- ============================================================================
-- AURA Bienestar Estético — Esquema inicial
-- Aplicar en Supabase SQL Editor (proyecto NUEVO de AURA, no compartido).
-- Idempotente donde es seguro. Asume que Google OAuth ya está habilitado.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensiones
-- ----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Tabla: users (perfil de aplicación, vinculada a auth.users por email/google_id)
-- ----------------------------------------------------------------------------
create table if not exists public.users (
  id            uuid primary key default uuid_generate_v4(),
  google_id     text unique,
  email         text unique not null,
  name          text,
  phone         text,
  avatar_url    text,
  role          text not null default 'client' check (role in ('client','admin')),
  medical_notes text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists users_email_idx on public.users(email);
create index if not exists users_role_idx  on public.users(role);

-- ----------------------------------------------------------------------------
-- Tabla: services (catálogo)
-- ----------------------------------------------------------------------------
create table if not exists public.services (
  id               uuid primary key default uuid_generate_v4(),
  slug             text unique not null,
  name             text not null,
  description      text,
  duration_minutes int not null default 60,
  base_price       int not null default 0,                -- COP
  icon             text,
  active           boolean not null default true,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists services_active_idx on public.services(active);

-- ----------------------------------------------------------------------------
-- Tabla: availability (horario semanal)
-- ----------------------------------------------------------------------------
create table if not exists public.availability (
  id                     uuid primary key default uuid_generate_v4(),
  day_of_week            int  not null check (day_of_week between 0 and 6), -- 0=domingo
  start_time             time not null,
  end_time               time not null,
  slot_duration_minutes  int  not null default 60,
  active                 boolean not null default true,
  check (end_time > start_time)
);

-- ----------------------------------------------------------------------------
-- Tabla: blocked_slots (bloqueos puntuales: vacaciones, festivos, almuerzos)
-- ----------------------------------------------------------------------------
create table if not exists public.blocked_slots (
  id         uuid primary key default uuid_generate_v4(),
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  reason     text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists blocked_slots_range_idx on public.blocked_slots(starts_at, ends_at);

-- ----------------------------------------------------------------------------
-- Tabla: appointments
-- ----------------------------------------------------------------------------
create table if not exists public.appointments (
  id               uuid primary key default uuid_generate_v4(),
  customer_id      uuid not null references public.users(id) on delete cascade,
  service_id       uuid not null references public.services(id) on delete restrict,
  scheduled_at     timestamptz not null,
  duration_minutes int not null,
  status           text not null default 'pending_payment'
                   check (status in ('pending_payment','confirmed','completed','cancelled','no_show')),
  notes            text,
  total_price      int not null,
  discount_amount  int not null default 0,
  coupon_code      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists appointments_customer_idx  on public.appointments(customer_id);
create index if not exists appointments_scheduled_idx on public.appointments(scheduled_at);
create index if not exists appointments_status_idx    on public.appointments(status);

-- Anti doble-booking: una sola cita activa por (servicio, scheduled_at)
create unique index if not exists appointments_no_double_booking
  on public.appointments(service_id, scheduled_at)
  where status in ('pending_payment','confirmed');

-- ----------------------------------------------------------------------------
-- Tabla: payments
-- ----------------------------------------------------------------------------
create table if not exists public.payments (
  id               uuid primary key default uuid_generate_v4(),
  appointment_id   uuid not null references public.appointments(id) on delete cascade,
  customer_id      uuid not null references public.users(id) on delete cascade,
  amount_expected  int  not null,
  receipt_url      text,
  ai_data          jsonb,
  status           text not null default 'pending_ai'
                   check (status in ('pending_ai','auto_approved','manual_review','manual_approved','rejected')),
  decision_reason  text,
  reviewer_id      uuid references public.users(id),
  redemption_code  text unique,
  coupon_code      text,
  discount_applied int not null default 0,
  original_price   int,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists payments_appointment_idx on public.payments(appointment_id);
create index if not exists payments_customer_idx    on public.payments(customer_id);
create index if not exists payments_status_idx      on public.payments(status);

-- ----------------------------------------------------------------------------
-- Tabla: payment_refs (anti-duplicados de comprobantes Nequi)
-- ----------------------------------------------------------------------------
create table if not exists public.payment_refs (
  reference_hash text primary key,
  payment_id     uuid not null references public.payments(id) on delete cascade,
  created_at     timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Tabla: coupons
-- ----------------------------------------------------------------------------
create table if not exists public.coupons (
  code             text primary key,                       -- siempre upper-case
  description      text,
  discount_percent int not null check (discount_percent between 1 and 99),
  valid_from       timestamptz not null default now(),
  valid_until      timestamptz,
  max_uses         int,                                    -- null = ilimitado
  current_uses     int not null default 0,
  one_per_user     boolean not null default false,
  active           boolean not null default true,
  created_by       uuid references public.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists coupons_active_idx on public.coupons(active);

-- ----------------------------------------------------------------------------
-- Tabla: coupon_uses
-- ----------------------------------------------------------------------------
create table if not exists public.coupon_uses (
  id              uuid primary key default uuid_generate_v4(),
  code            text not null references public.coupons(code) on delete cascade,
  customer_id     uuid not null references public.users(id) on delete cascade,
  payment_id      uuid not null references public.payments(id) on delete cascade,
  discount_amount int not null,
  created_at      timestamptz not null default now()
);
-- Cuando el cupón es one_per_user, se garantiza unicidad por (code, customer_id) vía índice parcial:
create unique index if not exists coupon_uses_one_per_user
  on public.coupon_uses(code, customer_id)
  where exists (
    select 1 -- placeholder, la lógica real se valida server-side; este índice es defensivo
  );
-- (Postgres no permite subconsulta en `where` de índice; en su lugar la app valida y este índice
--  se reemplaza por uno simple no-único:)
drop index if exists public.coupon_uses_one_per_user;
create index if not exists coupon_uses_code_user_idx on public.coupon_uses(code, customer_id);

-- ----------------------------------------------------------------------------
-- Tabla: before_after (galería de resultados, administrable)
-- ----------------------------------------------------------------------------
create table if not exists public.before_after (
  id              uuid primary key default uuid_generate_v4(),
  service_id      uuid references public.services(id) on delete set null,
  title           text not null,
  description     text,
  before_url      text not null,
  after_url       text not null,
  sessions_count  int,
  sort_order      int not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);
create index if not exists before_after_active_idx on public.before_after(active, sort_order);

-- ----------------------------------------------------------------------------
-- Tabla: testimonials
-- ----------------------------------------------------------------------------
create table if not exists public.testimonials (
  id                  uuid primary key default uuid_generate_v4(),
  customer_name       text not null,
  customer_avatar_url text,
  service_id          uuid references public.services(id) on delete set null,
  text                text not null,
  rating              int not null default 5 check (rating between 1 and 5),
  photo_url           text,
  sort_order          int not null default 0,
  featured            boolean not null default false,
  created_at          timestamptz not null default now()
);
create index if not exists testimonials_featured_idx on public.testimonials(featured, sort_order);

-- ----------------------------------------------------------------------------
-- Trigger: updated_at automático
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  for t in select unnest(array['users','appointments','payments','coupons']) loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I; create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at();',
      t, t);
  end loop;
end$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.users         enable row level security;
alter table public.services      enable row level security;
alter table public.availability  enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.appointments  enable row level security;
alter table public.payments      enable row level security;
alter table public.payment_refs  enable row level security;
alter table public.coupons       enable row level security;
alter table public.coupon_uses   enable row level security;
alter table public.before_after  enable row level security;
alter table public.testimonials  enable row level security;

-- ---- Helper para chequear admin desde JWT ----
create or replace function public.is_admin() returns boolean as $$
  select exists (
    select 1 from public.users u
    where u.id::text = auth.uid()::text and u.role = 'admin'
  );
$$ language sql stable;

-- ---- Lectura pública del catálogo y galería ----
drop policy if exists services_read on public.services;
create policy services_read on public.services for select using (active = true);

drop policy if exists before_after_read on public.before_after;
create policy before_after_read on public.before_after for select using (active = true);

drop policy if exists testimonials_read on public.testimonials;
create policy testimonials_read on public.testimonials for select using (true);

drop policy if exists availability_read on public.availability;
create policy availability_read on public.availability for select using (active = true);

drop policy if exists blocked_slots_read on public.blocked_slots;
create policy blocked_slots_read on public.blocked_slots for select using (true);

-- ---- Users: cada quien lee/edita su propio perfil ----
drop policy if exists users_self_read on public.users;
create policy users_self_read on public.users
  for select using (auth.uid()::text = id::text or public.is_admin());

drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users
  for update using (auth.uid()::text = id::text);

-- ---- Appointments: el cliente ve/crea/edita las suyas; admin ve todas ----
drop policy if exists appointments_self on public.appointments;
create policy appointments_self on public.appointments
  for select using (auth.uid()::text = customer_id::text or public.is_admin());

drop policy if exists appointments_insert on public.appointments;
create policy appointments_insert on public.appointments
  for insert with check (auth.uid()::text = customer_id::text);

drop policy if exists appointments_update_self on public.appointments;
create policy appointments_update_self on public.appointments
  for update using (auth.uid()::text = customer_id::text or public.is_admin());

-- ---- Payments: el cliente ve/crea los suyos; admin ve y decide todos ----
drop policy if exists payments_self on public.payments;
create policy payments_self on public.payments
  for select using (auth.uid()::text = customer_id::text or public.is_admin());

drop policy if exists payments_insert on public.payments;
create policy payments_insert on public.payments
  for insert with check (auth.uid()::text = customer_id::text);

-- ---- Coupons: lectura sólo de activos vigentes; escritura = admin (vía service role) ----
drop policy if exists coupons_read_active on public.coupons;
create policy coupons_read_active on public.coupons
  for select using (active = true and (valid_until is null or valid_until > now()));

-- (coupon_uses, payment_refs y mutaciones admin se hacen siempre con service role
--  desde API routes; no se necesitan policies adicionales.)

-- ============================================================================
-- SEED: servicios iniciales (precios placeholder, editables desde /admin/servicios)
-- ============================================================================
insert into public.services (slug, name, description, duration_minutes, base_price, icon, sort_order)
values
  ('maderoterapia',   'Maderoterapia',          'Técnica con instrumentos de madera que moldea tu cuerpo, reduce medidas y combate la celulitis de forma natural.', 60, 80000,  '🪵', 1),
  ('masajes-reductores','Masajes Reductores',   'Masajes especializados que trabajan zonas específicas para reducir grasa localizada y mejorar el contorno corporal.', 60, 70000,  '💆‍♀️', 2),
  ('masajes-relajantes','Masajes Relajantes',   'Sesiones terapéuticas que liberan tensión, reducen el estrés y te devuelven la energía para el día a día.', 60, 70000,  '🧘‍♀️', 3),
  ('mesoterapia',     'Mesoterapia',            'Microinyecciones con sustancias activas que reducen grasa, celulitis y mejoran la calidad de la piel.', 45, 120000, '💉', 4),
  ('inyectologia',    'Inyectología & Curaciones','Servicio profesional de enfermería: aplicación de inyecciones, curaciones y procedimientos ambulatorios.', 30, 30000,  '🏥', 5),
  ('plasma-capilar',  'Plasma Capilar',         'Inyección de plasma rico en plaquetas en el cuero cabelludo para estimular el crecimiento y regeneración del cabello.', 60, 250000, '✨', 6),
  ('plasma-facial',   'Plasma Facial',          'Tratamiento con plasma rico en plaquetas que rejuvenece la piel, reduce arrugas y restaura la luminosidad del rostro.', 60, 250000, '🌟', 7),
  ('cejas-pestanas',  'Cejas & Pestañas',       'Diseño y perfilado de cejas, extensiones de pestañas y técnicas de embellecimiento para resaltar tu mirada.', 60, 60000,  '👁️', 8)
on conflict (slug) do nothing;

-- ============================================================================
-- SEED: disponibilidad por defecto (lun-sáb 9am-6pm, slots de 60min)
-- ============================================================================
insert into public.availability (day_of_week, start_time, end_time, slot_duration_minutes)
select dow, time '09:00', time '18:00', 60
from generate_series(1, 6) as dow
where not exists (select 1 from public.availability);

-- ============================================================================
-- SEED: cupón de bienvenida 20%
-- ============================================================================
insert into public.coupons (code, description, discount_percent, one_per_user, active)
values ('BIENVENIDA20', 'Descuento de bienvenida 20% en tu primera cita', 20, true, true)
on conflict (code) do nothing;

-- ============================================================================
-- BOOTSTRAP: promover al admin inicial (configurar ADMIN_EMAIL_SEED en .env)
-- ----------------------------------------------------------------------------
-- Ejecutar manualmente DESPUÉS de que el usuario haya hecho login al menos una vez:
--   update public.users set role = 'admin'
--   where email = 'juandiegopalaciosdelgado@gmail.com';
-- ============================================================================
