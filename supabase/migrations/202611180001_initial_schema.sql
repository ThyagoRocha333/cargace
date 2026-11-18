create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  make text not null check (length(btrim(make)) between 1 and 80),
  model text not null check (length(btrim(model)) between 1 and 100),
  year integer not null check (year between 1990 and 2100),
  battery_capacity_kwh numeric(8, 2) not null check (battery_capacity_kwh > 0 and battery_capacity_kwh <= 500),
  estimated_consumption_kwh_100km numeric(8, 2) check (estimated_consumption_kwh_100km > 0 and estimated_consumption_kwh_100km <= 200),
  connector_type text check (connector_type is null or length(connector_type) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicles_id_user_id_key unique (id, user_id)
);

create table if not exists public.home_energy_tariffs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  price_brl_kwh numeric(10, 4) not null check (price_brl_kwh >= 0 and price_brl_kwh <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fuel_comparison_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  gasoline_price_brl_liter numeric(10, 3) not null check (gasoline_price_brl_liter >= 0 and gasoline_price_brl_liter <= 100),
  gasoline_efficiency_km_liter numeric(8, 2) not null check (gasoline_efficiency_km_liter > 0 and gasoline_efficiency_km_liter <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.charging_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vehicle_id uuid not null,
  charged_at timestamptz not null,
  charging_type text not null check (charging_type in ('home', 'public')),
  location_name text check (location_name is null or length(location_name) <= 180),
  station_id bigint check (station_id is null or station_id > 0),
  energy_kwh numeric(10, 3) not null check (energy_kwh > 0 and energy_kwh <= 1000),
  total_cost_brl numeric(12, 2) not null check (total_cost_brl >= 0),
  distance_km numeric(12, 2) check (distance_km is null or distance_km >= 0),
  notes text check (notes is null or length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint charging_sessions_vehicle_owner
    foreign key (vehicle_id, user_id)
    references public.vehicles (id, user_id)
    on delete restrict
);

create index if not exists vehicles_user_created_idx on public.vehicles (user_id, created_at desc);
create index if not exists charging_sessions_user_date_idx on public.charging_sessions (user_id, charged_at desc);
create index if not exists charging_sessions_vehicle_idx on public.charging_sessions (vehicle_id, user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists vehicles_set_updated_at on public.vehicles;
create trigger vehicles_set_updated_at before update on public.vehicles
for each row execute function public.set_updated_at();
drop trigger if exists home_energy_tariffs_set_updated_at on public.home_energy_tariffs;
create trigger home_energy_tariffs_set_updated_at before update on public.home_energy_tariffs
for each row execute function public.set_updated_at();
drop trigger if exists fuel_comparison_settings_set_updated_at on public.fuel_comparison_settings;
create trigger fuel_comparison_settings_set_updated_at before update on public.fuel_comparison_settings
for each row execute function public.set_updated_at();
drop trigger if exists charging_sessions_set_updated_at on public.charging_sessions;
create trigger charging_sessions_set_updated_at before update on public.charging_sessions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.home_energy_tariffs enable row level security;
alter table public.fuel_comparison_settings enable row level security;
alter table public.charging_sessions enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles for delete to authenticated using ((select auth.uid()) = id);

drop policy if exists "vehicles_select_own" on public.vehicles;
create policy "vehicles_select_own" on public.vehicles for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "vehicles_insert_own" on public.vehicles;
create policy "vehicles_insert_own" on public.vehicles for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "vehicles_update_own" on public.vehicles;
create policy "vehicles_update_own" on public.vehicles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "vehicles_delete_own" on public.vehicles;
create policy "vehicles_delete_own" on public.vehicles for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "tariffs_select_own" on public.home_energy_tariffs;
create policy "tariffs_select_own" on public.home_energy_tariffs for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "tariffs_insert_own" on public.home_energy_tariffs;
create policy "tariffs_insert_own" on public.home_energy_tariffs for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "tariffs_update_own" on public.home_energy_tariffs;
create policy "tariffs_update_own" on public.home_energy_tariffs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "tariffs_delete_own" on public.home_energy_tariffs;
create policy "tariffs_delete_own" on public.home_energy_tariffs for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "fuel_settings_select_own" on public.fuel_comparison_settings;
create policy "fuel_settings_select_own" on public.fuel_comparison_settings for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "fuel_settings_insert_own" on public.fuel_comparison_settings;
create policy "fuel_settings_insert_own" on public.fuel_comparison_settings for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "fuel_settings_update_own" on public.fuel_comparison_settings;
create policy "fuel_settings_update_own" on public.fuel_comparison_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "fuel_settings_delete_own" on public.fuel_comparison_settings;
create policy "fuel_settings_delete_own" on public.fuel_comparison_settings for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "charges_select_own" on public.charging_sessions;
create policy "charges_select_own" on public.charging_sessions for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "charges_insert_own" on public.charging_sessions;
create policy "charges_insert_own" on public.charging_sessions for insert to authenticated with check (
  (select auth.uid()) = user_id and exists (
    select 1 from public.vehicles v where v.id = vehicle_id and v.user_id = (select auth.uid())
  )
);
drop policy if exists "charges_update_own" on public.charging_sessions;
create policy "charges_update_own" on public.charging_sessions for update to authenticated using ((select auth.uid()) = user_id) with check (
  (select auth.uid()) = user_id and exists (
    select 1 from public.vehicles v where v.id = vehicle_id and v.user_id = (select auth.uid())
  )
);
drop policy if exists "charges_delete_own" on public.charging_sessions;
create policy "charges_delete_own" on public.charging_sessions for delete to authenticated using ((select auth.uid()) = user_id);
