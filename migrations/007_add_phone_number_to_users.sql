-- Add phone_number column to users table if it doesn't exist
-- This is needed for registration phone number storage

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);

-- Add index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
