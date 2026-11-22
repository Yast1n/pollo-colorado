-- =====================================================================
-- Pollo Colorado · Esquema completo para Supabase
-- Pega TODO este archivo en Supabase > SQL Editor > New query > Run.
-- Es idempotente: puedes ejecutarlo más de una vez sin romper nada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Lista blanca de administradores (dueños)
--    RLS "solo autenticados" no basta: si el registro público de Supabase
--    está activo, cualquiera podría crearse una cuenta con la anon key y
--    editar el menú. Por eso solo los emails de esta tabla pueden escribir.
-- ---------------------------------------------------------------------
create table if not exists public.admin_users (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
-- Sin políticas: nadie puede leerla ni editarla desde la app (solo desde el panel de Supabase).

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Productos
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id           text primary key default gen_random_uuid()::text,
  name         text not null check (char_length(name) between 1 and 120),
  description  text not null default '',
  category     text not null default 'pollos'
               check (category in ('pollos', 'combos', 'acompanamientos', 'bebidas')),
  price        integer not null check (price >= 0),
  weight_label text not null default '',
  portions     text not null default '',
  image_url    text not null default '',
  tags         text[] not null default '{}',
  available    boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Configuración del sitio (una sola fila, id = 1, datos en JSON)
-- ---------------------------------------------------------------------
create table if not exists public.site_config (
  id         smallint primary key default 1 check (id = 1),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- updated_at automático en products
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 4. Row Level Security: todos leen, solo administradores escriben
-- ---------------------------------------------------------------------
alter table public.products    enable row level security;
alter table public.site_config enable row level security;

drop policy if exists "products: lectura publica"   on public.products;
drop policy if exists "products: admin inserta"     on public.products;
drop policy if exists "products: admin actualiza"   on public.products;
drop policy if exists "products: admin elimina"     on public.products;
create policy "products: lectura publica" on public.products
  for select to anon, authenticated using (true);
create policy "products: admin inserta" on public.products
  for insert to authenticated with check (public.is_admin());
create policy "products: admin actualiza" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "products: admin elimina" on public.products
  for delete to authenticated using (public.is_admin());

drop policy if exists "config: lectura publica" on public.site_config;
drop policy if exists "config: admin inserta"   on public.site_config;
drop policy if exists "config: admin actualiza" on public.site_config;
create policy "config: lectura publica" on public.site_config
  for select to anon, authenticated using (true);
create policy "config: admin inserta" on public.site_config
  for insert to authenticated with check (public.is_admin());
create policy "config: admin actualiza" on public.site_config
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 5. Realtime: el estado del local y el menú cambian en vivo en el sitio
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'products') then
    alter publication supabase_realtime add table public.products;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'site_config') then
    alter publication supabase_realtime add table public.site_config;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 6. Storage: bucket público "menu-images" (fotos de platos)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-images', 'menu-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "menu-images: lectura publica" on storage.objects;
drop policy if exists "menu-images: admin sube"      on storage.objects;
drop policy if exists "menu-images: admin actualiza" on storage.objects;
drop policy if exists "menu-images: admin elimina"   on storage.objects;
create policy "menu-images: lectura publica" on storage.objects
  for select to anon, authenticated using (bucket_id = 'menu-images');
create policy "menu-images: admin sube" on storage.objects
  for insert to authenticated with check (bucket_id = 'menu-images' and public.is_admin());
create policy "menu-images: admin actualiza" on storage.objects
  for update to authenticated using (bucket_id = 'menu-images' and public.is_admin());
create policy "menu-images: admin elimina" on storage.objects
  for delete to authenticated using (bucket_id = 'menu-images' and public.is_admin());

-- ---------------------------------------------------------------------
-- 7. Datos semilla (precios y textos DE EJEMPLO: cámbialos en /#/admin)
-- ---------------------------------------------------------------------
insert into public.products (id, name, description, category, price, weight_label, portions, image_url, tags, available, sort_order) values
  ('p-entero', 'Pollo entero a las brasas', 'Adobo de la casa, 12 horas de reposo y piel dorada a fuego lento de carbón.', 'pollos', 13990, '2.4 – 2.5 kg', '4 personas', 'images/productos/pollo-entero.svg', '{mas-pedido}', true, 1),
  ('p-medio', 'Medio pollo a las brasas', 'La misma receta en formato para dos. Elige pechuga o trutro al retirar.', 'pollos', 7490, '1.2 kg aprox.', '2 personas', 'images/productos/medio-pollo.svg', '{}', true, 2),
  ('p-cuarto', 'Cuarto de pollo', 'Trutro entero con piel crujiente. Ideal para almuerzo individual.', 'pollos', 4290, '600 g aprox.', '1 persona', 'images/productos/cuarto-pollo.svg', '{ultimas}', true, 3),
  ('c-familiar', 'Combo Familiar', 'Pollo entero, papas fritas familiares, ensalada chilena y bebida 1.5 L.', 'combos', 21990, 'Pollo 2.4 – 2.5 kg', '4 – 5 personas', 'images/productos/combo-familiar.svg', '{mas-pedido,promo}', true, 1),
  ('c-pareja', 'Combo Pareja', 'Medio pollo, papas fritas medianas y dos bebidas en lata.', 'combos', 12490, 'Pollo 1.2 kg aprox.', '2 personas', 'images/productos/combo-pareja.svg', '{}', true, 2),
  ('c-domingo', 'Combo Domingo Largo', 'Dos pollos enteros, papas familiares dobles, arroz graneado y bebida 3 L.', 'combos', 38990, '2 pollos de 2.4 kg', '8 – 10 personas', 'images/productos/combo-familiar.svg', '{nuevo}', false, 3),
  ('a-papas-fam', 'Papas fritas familiares', 'Papa cortada en casa, doble fritura y sal de mar.', 'acompanamientos', 4990, '800 g', '3 – 4 personas', 'images/productos/papas-fritas.svg', '{mas-pedido}', true, 1),
  ('a-papas-med', 'Papas fritas medianas', 'La porción justa para acompañar un cuarto o medio pollo.', 'acompanamientos', 2990, '400 g', '1 – 2 personas', 'images/productos/papas-fritas.svg', '{}', true, 2),
  ('a-chilena', 'Ensalada chilena', 'Tomate, cebolla pluma amortiguada y cilantro. Aliño aparte.', 'acompanamientos', 2490, '500 g', '3 personas', 'images/productos/ensalada.svg', '{}', true, 3),
  ('a-arroz', 'Arroz graneado', 'Arroz con zanahoria y un toque de ajo, cocinado cada mañana.', 'acompanamientos', 2290, '500 g', '3 personas', 'images/productos/arroz.svg', '{}', true, 4),
  ('b-bebida15', 'Bebida 1.5 L', 'Cola, cola zero, naranja o pomelo según disponibilidad.', 'bebidas', 2190, '1.5 L', '', 'images/productos/bebida.svg', '{}', true, 1),
  ('b-salsas', 'Pack de salsas de la casa', 'Ají pebre, mayonesa casera y salsa de ajo. Tres potes de 100 ml.', 'bebidas', 1490, '3 × 100 ml', '', 'images/productos/salsas.svg', '{}', true, 2)
on conflict (id) do nothing;

insert into public.site_config (id, data) values (1, '{
  "status": "open",
  "announcement": "¡Nueva tanda de pollos saliendo de las brasas a las 13:30 hrs!",
  "announcement_enabled": true,
  "whatsapp": "56900000000",
  "greeting": "Hola Pollo Colorado 👋 Quiero consultar disponibilidad para este pedido:",
  "hero_title": "Pollos asados a las brasas",
  "hero_subtitle": "Calibrados 2.4 – 2.5 kg, adobados la noche anterior y dorados a carbón en Pirque.",
  "address": "Pirque, Región Metropolitana",
  "maps_query": "Pirque, Región Metropolitana, Chile",
  "delivery_note": "Delivery solo dentro de Pirque. El costo de envío se confirma por WhatsApp.",
  "hours": [
    {"open": "12:00", "close": "17:00", "closed": false},
    {"open": "12:00", "close": "20:00", "closed": true},
    {"open": "12:00", "close": "20:00", "closed": false},
    {"open": "12:00", "close": "20:00", "closed": false},
    {"open": "12:00", "close": "20:00", "closed": false},
    {"open": "12:00", "close": "21:00", "closed": false},
    {"open": "12:00", "close": "21:00", "closed": false}
  ],
  "socials": {"instagram": "", "facebook": "", "tiktok": ""}
}'::jsonb)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 8. ÚLTIMO PASO (manual): autoriza al dueño.
--    Primero crea el usuario en Authentication > Users > Add user,
--    luego descomenta y ejecuta esta línea con SU email (en minúsculas):
-- ---------------------------------------------------------------------
-- insert into public.admin_users (email) values ('dueno@tu-dominio.cl') on conflict do nothing;
