-- Ejecuta esto en Supabase > SQL Editor
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) <= 100),
  email text not null check (char_length(email) <= 150),
  phone text check (char_length(phone) <= 30),
  business text check (char_length(business) <= 120),
  service text not null,
  message text check (char_length(message) <= 2000),
  status text not null default 'nuevo',
  details jsonb -- respuestas completas del cotizador guiado
);

alter table public.leads enable row level security;

-- El público solo puede INSERTAR (no leer, editar ni borrar)
create policy "public can insert leads"
  on public.leads for insert
  to anon
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
