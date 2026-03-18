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
  break_start time default '12:30:00',
  break_end time default '14:00:00',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Backfill pre-created departments with the requested break time (just in case)
-- UPDATE public.departments SET break_start = '12:30:00', break_end = '14:00:00' WHERE break_start IS NULL;

-- 3. Create Users / Profiles table extending auth.users
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text,
  role text not null check (role in ('citizen', 'worker', 'admin')),
  department_id uuid references public.departments(id) on delete set null,
  counter text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- The foreign key constraint requires a user to be in Supabase Auth (auth.users)
-- We remove it so mock users can be inserted for local dev
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 4. Create Services Table
create table public.services (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  department_id uuid not null references public.departments(id) on delete cascade,
  estimate integer default 5, -- Estimated time in minutes
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Create Service Documents Table
create table public.service_documents (
  id uuid primary key default uuid_generate_v4(),
  service_id uuid not null references public.services(id) on delete cascade,
  name text not null,
  is_required boolean default true,
  created_at timestamptz default now()
);

-- 6. Create Tokens / Queue table
create table public.tokens (
  id uuid primary key default uuid_generate_v4(),
  number text not null, -- E.g., 'A001', 'B012'
  department_id uuid not null references public.departments(id) on delete cascade,
  citizen_id uuid not null references public.users(id) on delete cascade,
  citizen_name text not null,
  worker_id uuid references public.users(id) on delete set null,
  status text not null default 'waiting' check (status in ('waiting', 'called', 'serving', 'done', 'skipped', 'cancelled')),
  service_id uuid references public.services(id) on delete set null,
  service_name text,
  service_estimate integer default 5,
  estimated_wait integer default 0, -- Estimated wait time in minutes
  position integer default 0,       -- Position in the queue
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. Set up Row Level Security (RLS)
-- We are disabling strict RLS for this custom demo implementation
alter table public.departments disable row level security;
alter table public.users disable row level security;
alter table public.tokens disable row level security;
alter table public.services disable row level security;
alter table public.service_documents disable row level security;

-- 8. Trigger to automatically update `updated_at` timestamps
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

create trigger set_updated_at_services
before update on public.services
for each row execute function update_updated_at_column();

-- 9. Realtime Support
-- Enables realtime notifications for tokens and departments
alter publication supabase_realtime add table public.departments;
alter publication supabase_realtime add table public.tokens;
alter publication supabase_realtime add table public.services;
alter publication supabase_realtime add table public.service_documents;

-- 10. Seed Initial Data
-- Create default services for Mamlatdar departments
INSERT INTO public.services (name, department_id, estimate)
SELECT 'Income Certificate', id, 15
FROM public.departments
WHERE name ILIKE '%Mamlatdar%';

INSERT INTO public.services (name, department_id, estimate)
SELECT 'Non Creamy Layer', id, 20
FROM public.departments
WHERE name ILIKE '%Mamlatdar%';

-- Create default services for Post Office departments
INSERT INTO public.services (name, department_id, estimate)
SELECT 'Speed Post', id, 5
FROM public.departments
WHERE name ILIKE '%Post Office%';
