-- Listings table
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  price integer,
  status text check (status in ('active','sold')) default 'active',
  views integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listings enable row level security;

create policy "Listings readable by everyone"
  on public.listings for select using (true);

create policy "Users can insert their own listings"
  on public.listings for insert with check (auth.uid() = user_id);

create policy "Users can update their own listings"
  on public.listings for update using (auth.uid() = user_id);

create policy "Users can delete their own listings"
  on public.listings for delete using (auth.uid() = user_id);

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_listings_updated_at
  before update on public.listings
  for each row execute function public.update_updated_at_column();

-- Favorites table
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.favorites enable row level security;

create policy "Favorites readable by owner"
  on public.favorites for select using (auth.uid() = user_id);

create policy "Users can manage their favorites"
  on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Activities table
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.activities enable row level security;

create policy "Activities readable by owner"
  on public.activities for select using (auth.uid() = user_id);

create policy "Users can insert their activities"
  on public.activities for insert with check (auth.uid() = user_id);

