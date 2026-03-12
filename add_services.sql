-- Create Services Table Query
create table public.services (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  department_id uuid not null references public.departments(id) on delete cascade,
  estimate integer default 5, -- Estimated time in minutes
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Realtime support
alter publication supabase_realtime add table public.services;

-- Add updated_at trigger
create trigger set_updated_at_services
before update on public.services
for each row execute function update_updated_at_column();

-- Modify tokens Table
alter table public.tokens 
add column service_id uuid references public.services(id) on delete set null,
add column service_name text;

-- Insert some default services for testing (Optional)
-- INSERT INTO public.services (name, department_id, estimate)
-- SELECT 'Income Certificate', id, 10 FROM public.departments WHERE name LIKE '%Mamlatdar%' LIMIT 1;
-- INSERT INTO public.services (name, department_id, estimate)
-- SELECT 'Aadhaar Update', id, 15 FROM public.departments WHERE name LIKE '%Post Office%' LIMIT 1;
