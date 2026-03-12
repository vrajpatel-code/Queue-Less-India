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
