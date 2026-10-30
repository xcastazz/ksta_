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
