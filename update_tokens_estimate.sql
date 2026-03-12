-- Update Tokens Table to store the estimate
ALTER TABLE public.tokens 
ADD COLUMN service_estimate integer DEFAULT 5;

-- Optionally, backfill existing tokens so they don't break queries (sets all old tokens to 5 minutes)
UPDATE public.tokens SET service_estimate = 5 WHERE service_estimate IS NULL;
