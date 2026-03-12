-- Update Departments Table to store break times
ALTER TABLE public.departments 
ADD COLUMN break_start time DEFAULT '12:30:00',
ADD COLUMN break_end time DEFAULT '14:00:00';

-- Backfill pre-created departments with the requested break time
UPDATE public.departments SET break_start = '12:30:00', break_end = '14:00:00' WHERE break_start IS NULL;
