-- Create missing borrower_profiles and investor_profiles tables with bank account fields
-- This migration creates the tables that other migrations expect to exist

BEGIN;

-- Create borrower_profiles table
CREATE TABLE IF NOT EXISTS borrower_profiles (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    
    -- Basic profile fields
    is_individual_account BOOLEAN DEFAULT TRUE,
    
    -- Bank account fields
    bank_name VARCHAR(255),
    account_number VARCHAR(50),
    account_name VARCHAR(255),
    iban VARCHAR(100),
    swift_code VARCHAR(50),
    preferred BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key constraint
    FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
);

-- Create investor_profiles table
CREATE TABLE IF NOT EXISTS investor_profiles (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    
    -- Basic profile fields
    is_individual_account BOOLEAN DEFAULT TRUE,
    
    -- Bank account fields
    bank_name VARCHAR(255),
    account_number VARCHAR(50),
    account_name VARCHAR(255),
    iban VARCHAR(100),
    swift_code VARCHAR(50),
    preferred BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key constraint
    FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_borrower_profiles_firebase_uid ON borrower_profiles(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_firebase_uid ON investor_profiles(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_borrower_profiles_bank_name ON borrower_profiles(bank_name);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_bank_name ON investor_profiles(bank_name);

-- Insert profiles for existing users who have borrower/investor accounts
INSERT INTO borrower_profiles (firebase_uid, is_individual_account, created_at, updated_at)
SELECT 
    firebase_uid, 
    CASE WHEN account_type = 'individual' THEN TRUE ELSE FALSE END,
    created_at,
    updated_at
FROM users 
WHERE has_borrower_account = TRUE
ON CONFLICT (firebase_uid) DO NOTHING;

INSERT INTO investor_profiles (firebase_uid, is_individual_account, created_at, updated_at)
SELECT 
    firebase_uid, 
    CASE WHEN account_type = 'individual' THEN TRUE ELSE FALSE END,
    created_at,
    updated_at
FROM users 
WHERE has_investor_account = TRUE
ON CONFLICT (firebase_uid) DO NOTHING;

-- Record this migration
INSERT INTO schema_migrations (migration_name, rollback_sql)
VALUES ('004_create_profile_tables', 
'DROP TABLE IF EXISTS investor_profiles; DROP TABLE IF EXISTS borrower_profiles;')
ON CONFLICT (migration_name) DO NOTHING;

COMMIT;

-- Verify tables were created
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('borrower_profiles', 'investor_profiles');