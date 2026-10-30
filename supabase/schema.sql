-- Ejecuta esto en Supabase > SQL Editor
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) <= 100),
  email text not null check (char_length(email) <= 150),
  phone text check (char_length(phone) <= 30),
  business text check (char_length(business) <= 120),
  service text not null,
  message text check (char_length(message) <= 20000),
  status text not null default 'nuevo',
  details jsonb -- respuestas completas del cotizador guiado
);

alter table public.leads enable row level security;

-- El público solo puede INSERTAR (no leer, editar ni borrar)
create policy "public can insert leads"
  on public.leads for insert
  to anon, authenticated -- también si el navegador tiene sesión de admin
  with check (true);

-- ===== Panel de administración =====
alter table public.leads add column if not exists notes text;     -- notas internas del asesor
alter table public.leads add column if not exists template text;  -- plantilla web elegida

create table if not exists public.admins (email text primary key);
alter table public.admins enable row level security;
insert into public.admins(email) values ('jc.casta00@gmail.com') on conflict do nothing;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.admins where email = (auth.jwt() ->> 'email'));
$$;

create policy "admins read admins" on public.admins for select to authenticated using (public.is_admin());
create policy "admins read leads" on public.leads for select to authenticated using (public.is_admin());
create policy "admins update leads" on public.leads for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete leads" on public.leads for delete to authenticated using (public.is_admin());

-- Notificaciones en tiempo real
alter publication supabase_realtime add table public.leads;

-- Cotización automática
alter table public.leads add column if not exists quote jsonb;        -- líneas, descuentos y totales
alter table public.leads add column if not exists quote_total bigint;  -- total único (COP)


-- ===== Panel completo: seguimiento, prioridad e historial =====
alter table public.leads add column if not exists follow_up date;
alter table public.leads add column if not exists priority text default 'media';
alter table public.leads add column if not exists updated_at timestamptz default now();

create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  type text not null,
  text text,
  actor text default (auth.jwt() ->> 'email')
);
alter table public.lead_events enable row level security;
drop policy if exists "admins all events" on public.lead_events;
create policy "admins all events" on public.lead_events for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage admins" on public.admins;
create policy "admins manage admins" on public.admins for all to authenticated using (public.is_admin()) with check (public.is_admin());

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='lead_events') then
    alter publication supabase_realtime add table public.lead_events;
  end if;
end $$;
