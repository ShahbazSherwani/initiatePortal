-- Fix suspension_scope default for new registrations
-- Migration: 008_fix_suspension_scope_default.sql

-- Add suspension_scope column if it doesn't exist with proper default
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS suspension_scope VARCHAR(50) DEFAULT 'none';

-- Set existing NULL values to 'none' (not suspended)
UPDATE users 
SET suspension_scope = 'none' 
WHERE suspension_scope IS NULL OR suspension_scope = '';

-- Update any accidentally suspended new accounts
UPDATE users
SET suspension_scope = 'none'
WHERE suspension_scope = 'full_account' 
  AND created_at > NOW() - INTERVAL '1 hour'
  AND has_completed_registration = false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_suspension_scope 
  ON users(suspension_scope);

-- Log results
DO $$
DECLARE
  unsuspended_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unsuspended_count
  FROM users
  WHERE suspension_scope = 'none';
  
  RAISE NOTICE 'Suspension scope fixed. Active accounts: %', unsuspended_count;
END $$;
