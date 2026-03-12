-- Run this in your Supabase SQL Editor to fix the users table so that mock users can be inserted

-- 1. Remove the foreign key constraint that requires a user to be in Supabase Auth (auth.users)
-- This is necessary because the application uses local mock authentication to bypass rate limits.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 2. Add the missing email column
-- The API attempts to insert 'email' into the users table, but the column was not in the original schema.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text;
