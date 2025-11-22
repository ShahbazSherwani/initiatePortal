-- Migration 010: Add encryption support columns
-- Description: Adds encryption_version column to track encryption status of sensitive fields
--              and extends column sizes to accommodate encrypted data

-- Extend column sizes for encrypted data (encrypted data is ~100-200 chars)
-- Note: Only extend columns that exist in the actual tables

-- Topup requests table (has account_number)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'topup_requests' AND column_name = 'account_number') THEN
    ALTER TABLE topup_requests ALTER COLUMN account_number TYPE VARCHAR(255);
  END IF;
END $$;

-- Investor profiles table (has national_id, passport, tin_number, account_number)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'investor_profiles' AND column_name = 'national_id') THEN
    ALTER TABLE investor_profiles ALTER COLUMN national_id TYPE VARCHAR(255);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'investor_profiles' AND column_name = 'passport') THEN
    ALTER TABLE investor_profiles ALTER COLUMN passport TYPE VARCHAR(255);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'investor_profiles' AND column_name = 'tin_number') THEN
    ALTER TABLE investor_profiles ALTER COLUMN tin_number TYPE VARCHAR(255);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'investor_profiles' AND column_name = 'account_number') THEN
    ALTER TABLE investor_profiles ALTER COLUMN account_number TYPE VARCHAR(255);
  END IF;
END $$;

-- Borrower profiles table (has national_id, passport, tin_number, account_number)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'borrower_profiles' AND column_name = 'national_id') THEN
    ALTER TABLE borrower_profiles ALTER COLUMN national_id TYPE VARCHAR(255);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'borrower_profiles' AND column_name = 'passport') THEN
    ALTER TABLE borrower_profiles ALTER COLUMN passport TYPE VARCHAR(255);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'borrower_profiles' AND column_name = 'tin_number') THEN
    ALTER TABLE borrower_profiles ALTER COLUMN tin_number TYPE VARCHAR(255);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'borrower_profiles' AND column_name = 'account_number') THEN
    ALTER TABLE borrower_profiles ALTER COLUMN account_number TYPE VARCHAR(255);
  END IF;
END $$;

-- Add encryption_version to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 0;

COMMENT ON COLUMN users.encryption_version IS 'Version of encryption applied: 0 = unencrypted, 1 = AES-256-GCM';

-- Add encryption_version to topup_requests table
ALTER TABLE topup_requests 
ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 0;

COMMENT ON COLUMN topup_requests.encryption_version IS 'Version of encryption applied: 0 = unencrypted, 1 = AES-256-GCM';

-- Add encryption_version to investor_profiles table
ALTER TABLE investor_profiles 
ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 0;

COMMENT ON COLUMN investor_profiles.encryption_version IS 'Version of encryption applied: 0 = unencrypted, 1 = AES-256-GCM';

-- Add encryption_version to borrower_profiles table
ALTER TABLE borrower_profiles 
ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 0;

COMMENT ON COLUMN borrower_profiles.encryption_version IS 'Version of encryption applied: 0 = unencrypted, 1 = AES-256-GCM';

-- Create index for efficient querying of unencrypted records
CREATE INDEX IF NOT EXISTS idx_users_encryption_version ON users(encryption_version) WHERE encryption_version = 0;
CREATE INDEX IF NOT EXISTS idx_topup_encryption_version ON topup_requests(encryption_version) WHERE encryption_version = 0;
CREATE INDEX IF NOT EXISTS idx_investor_encryption_version ON investor_profiles(encryption_version) WHERE encryption_version = 0;
CREATE INDEX IF NOT EXISTS idx_borrower_encryption_version ON borrower_profiles(encryption_version) WHERE encryption_version = 0;

-- Track migration (if schema_migrations table exists)
-- Note: This project may not use schema_migrations tracking

-- Rollback instructions
-- ALTER TABLE users 
--   ALTER COLUMN national_id TYPE VARCHAR(100),
--   ALTER COLUMN passport TYPE VARCHAR(100),
--   ALTER COLUMN tin_number TYPE VARCHAR(100),
--   DROP COLUMN IF EXISTS encryption_version;
-- ALTER TABLE topup_requests 
--   ALTER COLUMN account_number TYPE VARCHAR(50),
--   DROP COLUMN IF EXISTS encryption_version;
-- ALTER TABLE investor_profiles 
--   ALTER COLUMN account_number TYPE VARCHAR(100),
--   DROP COLUMN IF EXISTS encryption_version;
-- ALTER TABLE borrower_profiles 
--   ALTER COLUMN account_number TYPE VARCHAR(100),
--   DROP COLUMN IF EXISTS encryption_version;
