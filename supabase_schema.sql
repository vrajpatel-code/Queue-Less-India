-- QueueLess India - Supabase Schema Definition
-- Run this query in your Supabase SQL Editor

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create Departments table
create table public.departments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  queue_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Create Users / Profiles table extending auth.users
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('citizen', 'worker', 'admin')),
  department_id uuid references public.departments(id) on delete set null,
  counter text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Create Tokens / Queue table
create table public.tokens (
  id uuid primary key default uuid_generate_v4(),
  number text not null, -- E.g., 'A001', 'B012'
  department_id uuid not null references public.departments(id) on delete cascade,
  citizen_id uuid not null references public.users(id) on delete cascade,
  citizen_name text not null,
  worker_id uuid references public.users(id) on delete set null,
  status text not null default 'waiting' check (status in ('waiting', 'called', 'serving', 'done', 'skipped', 'cancelled')),
  estimated_wait integer default 0, -- Estimated wait time in minutes
  position integer default 0,       -- Position in the queue
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Set up Row Level Security (RLS)
-- We are disabling strict RLS for this custom demo implementation
alter table public.departments disable row level security;
alter table public.users disable row level security;
alter table public.tokens disable row level security;

-- 6. Trigger to automatically update `updated_at` timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_updated_at_departments
before update on public.departments
for each row execute function update_updated_at_column();

create trigger set_updated_at_users
before update on public.users
for each row execute function update_updated_at_column();

create trigger set_updated_at_tokens
before update on public.tokens
for each row execute function update_updated_at_column();

-- 7. Realtime Support
-- Enables realtime notifications for tokens and departments
alter publication supabase_realtime add table public.departments;
alter publication supabase_realtime add table public.tokens;


