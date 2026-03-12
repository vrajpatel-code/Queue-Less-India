-- Create Service Documents Table
create table public.service_documents (
  id uuid primary key default uuid_generate_v4(),
  service_id uuid not null references public.services(id) on delete cascade,
  name text not null,
  is_required boolean default true,
  created_at timestamptz default now()
);

-- Enable RLS and Realtime (optional based on your setup)
-- alter table public.service_documents enable row level security;
alter publication supabase_realtime add table public.service_documents;

-- Insert some dummy documents (Optional)
-- INSERT INTO public.service_documents (service_id, name, is_required)
-- SELECT id, 'Aadhaar Card', true FROM public.services LIMIT 1;
