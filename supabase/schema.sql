-- Run in Supabase Dashboard → SQL Editor
-- Enable Anonymous sign-in: Authentication → Providers → Anonymous → ON

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  business_type text not null,
  language text not null,
  completed_at timestamptz not null default now()
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric not null,
  quantity integer,
  item text,
  created_at timestamptz not null default now()
);

create index if not exists sales_user_id_created_at_idx on sales (user_id, created_at desc);

alter table profiles enable row level security;
alter table sales enable row level security;

create policy "Users read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users read own sales"
  on sales for select using (auth.uid() = user_id);

create policy "Users insert own sales"
  on sales for insert with check (auth.uid() = user_id);

create policy "Users delete own sales"
  on sales for delete using (auth.uid() = user_id);
