-- Add email column to public.users table
-- This is needed for Make.com integration to find users by email

-- Add email column if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Add additional fields needed for Make.com sync
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS global_user_id VARCHAR(255);

-- Index for global user ID lookups
CREATE INDEX IF NOT EXISTS idx_users_global_user_id ON public.users(global_user_id);
