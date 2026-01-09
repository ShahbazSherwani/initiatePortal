-- Comprehensive Migration: Add ALL Missing KYC and Profile Fields
-- This migration adds all fields identified in the audit that are missing from the database
-- Execute this AFTER migration 007_add_phone_number_to_users.sql

BEGIN;

-- ==========================================
-- PART 1: users TABLE - Add Missing Fields
-- ==========================================

-- Critical fields for user identification and categorization
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS group_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS profile_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS street VARCHAR(255),
ADD COLUMN IF NOT EXISTS barangay VARCHAR(100);

-- Create index for username lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_group_type ON users(group_type);

-- ====================================================
-- PART 2: borrower_profiles TABLE - Add Missing Fields
-- ====================================================

ALTER TABLE borrower_profiles
-- Group and categorization
ADD COLUMN IF NOT EXISTS group_type VARCHAR(100),

-- Contact information
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS country_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS barangay VARCHAR(100),

-- Secondary identification
ADD COLUMN IF NOT EXISTS secondary_id_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS secondary_id_number VARCHAR(100),

-- Emergency contact (CRITICAL for KYC compliance)
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100),
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS emergency_contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS emergency_contact_address TEXT,

-- Personal information
ADD COLUMN IF NOT EXISTS mother_maiden_name VARCHAR(255),

-- Employment and income
ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(15, 2),

-- Business/Entity information
ADD COLUMN IF NOT EXISTS business_registration_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS business_address TEXT,

-- Principal office address (detailed components)
ADD COLUMN IF NOT EXISTS principal_office_municipality VARCHAR(100),
ADD COLUMN IF NOT EXISTS principal_office_province VARCHAR(100),

-- General Information Sheet (GIS) fields - CRITICAL for business accounts
ADD COLUMN IF NOT EXISTS gis_total_assets DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS gis_total_liabilities DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS gis_paid_up_capital DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS gis_number_of_stockholders INTEGER,
ADD COLUMN IF NOT EXISTS gis_number_of_employees INTEGER,

-- PEP (Politically Exposed Person) details
ADD COLUMN IF NOT EXISTS pep_details TEXT,

-- Authorized signatory
ADD COLUMN IF NOT EXISTS authorized_signatory_id_type VARCHAR(100);

-- Create indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_borrower_profiles_group_type ON borrower_profiles(group_type);
CREATE INDEX IF NOT EXISTS idx_borrower_profiles_secondary_id ON borrower_profiles(secondary_id_type, secondary_id_number);
CREATE INDEX IF NOT EXISTS idx_borrower_profiles_emergency_contact ON borrower_profiles(emergency_contact_phone);

-- Add comments to document field purposes
COMMENT ON COLUMN borrower_profiles.group_type IS 'User group categorization (Farmer/Fisherfolk, LGU Officer, Teacher, etc.)';
COMMENT ON COLUMN borrower_profiles.contact_email IS 'Alternative contact email (different from main email)';
COMMENT ON COLUMN borrower_profiles.secondary_id_type IS 'Type of secondary government ID (Drivers License, Postal ID, etc.)';
COMMENT ON COLUMN borrower_profiles.secondary_id_number IS 'Number on secondary government ID';
COMMENT ON COLUMN borrower_profiles.emergency_contact_name IS 'Name of emergency contact person';
COMMENT ON COLUMN borrower_profiles.emergency_contact_relationship IS 'Relationship to emergency contact';
COMMENT ON COLUMN borrower_profiles.emergency_contact_phone IS 'Phone number of emergency contact';
COMMENT ON COLUMN borrower_profiles.emergency_contact_email IS 'Email of emergency contact';
COMMENT ON COLUMN borrower_profiles.emergency_contact_address IS 'Address of emergency contact';
COMMENT ON COLUMN borrower_profiles.gis_total_assets IS 'Total assets (PHP) from General Information Sheet - required for business entities';
COMMENT ON COLUMN borrower_profiles.gis_total_liabilities IS 'Total liabilities (PHP) from General Information Sheet';
COMMENT ON COLUMN borrower_profiles.gis_paid_up_capital IS 'Paid-up capital (PHP) from General Information Sheet';
COMMENT ON COLUMN borrower_profiles.gis_number_of_stockholders IS 'Number of stockholders - required for business entities';
COMMENT ON COLUMN borrower_profiles.gis_number_of_employees IS 'Number of employees - required for business entities';
COMMENT ON COLUMN borrower_profiles.pep_details IS 'Details about Politically Exposed Person status (position, duration, etc.)';
COMMENT ON COLUMN borrower_profiles.authorized_signatory_id_type IS 'Type of ID for authorized signatory';
COMMENT ON COLUMN borrower_profiles.mother_maiden_name IS 'Mother''s maiden name (security verification)';
COMMENT ON COLUMN borrower_profiles.monthly_income IS 'Monthly income amount (PHP)';
COMMENT ON COLUMN borrower_profiles.business_registration_number IS 'SEC/CDA/DTI business registration number';
COMMENT ON COLUMN borrower_profiles.business_address IS 'Main business address';
COMMENT ON COLUMN borrower_profiles.principal_office_municipality IS 'Municipality/City of principal office';
COMMENT ON COLUMN borrower_profiles.principal_office_province IS 'Province of principal office';

-- ===================================================
-- PART 3: investor_profiles TABLE - Add Missing Fields
-- ===================================================

ALTER TABLE investor_profiles
-- Group and categorization
ADD COLUMN IF NOT EXISTS group_type VARCHAR(100),

-- Contact information
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS country_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS barangay VARCHAR(100),

-- Secondary identification
ADD COLUMN IF NOT EXISTS secondary_id_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS secondary_id_number VARCHAR(100),

-- Emergency contact (CRITICAL for KYC compliance)
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100),
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS emergency_contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS emergency_contact_address TEXT,

-- Personal information
ADD COLUMN IF NOT EXISTS mother_maiden_name VARCHAR(255),

-- Employment and income
ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(15, 2),

-- Business/Entity information
ADD COLUMN IF NOT EXISTS business_registration_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS business_address TEXT,

-- Principal office address (detailed components)
ADD COLUMN IF NOT EXISTS principal_office_municipality VARCHAR(100),
ADD COLUMN IF NOT EXISTS principal_office_province VARCHAR(100),

-- General Information Sheet (GIS) fields - CRITICAL for business accounts
ADD COLUMN IF NOT EXISTS gis_total_assets DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS gis_total_liabilities DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS gis_paid_up_capital DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS gis_number_of_stockholders INTEGER,
ADD COLUMN IF NOT EXISTS gis_number_of_employees INTEGER,

-- PEP (Politically Exposed Person) details
ADD COLUMN IF NOT EXISTS pep_details TEXT,

-- Authorized signatory
ADD COLUMN IF NOT EXISTS authorized_signatory_id_type VARCHAR(100),

-- Investment-specific fields
ADD COLUMN IF NOT EXISTS investment_preference VARCHAR(100),
ADD COLUMN IF NOT EXISTS portfolio_value DECIMAL(15, 2);

-- Create indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_investor_profiles_group_type ON investor_profiles(group_type);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_secondary_id ON investor_profiles(secondary_id_type, secondary_id_number);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_emergency_contact ON investor_profiles(emergency_contact_phone);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_investment_pref ON investor_profiles(investment_preference);

-- Add comments to document field purposes
COMMENT ON COLUMN investor_profiles.group_type IS 'User group categorization (Farmer/Fisherfolk, LGU Officer, Teacher, etc.)';
COMMENT ON COLUMN investor_profiles.contact_email IS 'Alternative contact email (different from main email)';
COMMENT ON COLUMN investor_profiles.secondary_id_type IS 'Type of secondary government ID (Drivers License, Postal ID, etc.)';
COMMENT ON COLUMN investor_profiles.secondary_id_number IS 'Number on secondary government ID';
COMMENT ON COLUMN investor_profiles.emergency_contact_name IS 'Name of emergency contact person';
COMMENT ON COLUMN investor_profiles.emergency_contact_relationship IS 'Relationship to emergency contact';
COMMENT ON COLUMN investor_profiles.emergency_contact_phone IS 'Phone number of emergency contact';
COMMENT ON COLUMN investor_profiles.emergency_contact_email IS 'Email of emergency contact';
COMMENT ON COLUMN investor_profiles.emergency_contact_address IS 'Address of emergency contact';
COMMENT ON COLUMN investor_profiles.gis_total_assets IS 'Total assets (PHP) from General Information Sheet - required for business entities';
COMMENT ON COLUMN investor_profiles.gis_total_liabilities IS 'Total liabilities (PHP) from General Information Sheet';
COMMENT ON COLUMN investor_profiles.gis_paid_up_capital IS 'Paid-up capital (PHP) from General Information Sheet';
COMMENT ON COLUMN investor_profiles.gis_number_of_stockholders IS 'Number of stockholders - required for business entities';
COMMENT ON COLUMN investor_profiles.gis_number_of_employees IS 'Number of employees - required for business entities';
COMMENT ON COLUMN investor_profiles.pep_details IS 'Details about Politically Exposed Person status (position, duration, etc.)';
COMMENT ON COLUMN investor_profiles.authorized_signatory_id_type IS 'Type of ID for authorized signatory';
COMMENT ON COLUMN investor_profiles.mother_maiden_name IS 'Mother''s maiden name (security verification)';
COMMENT ON COLUMN investor_profiles.monthly_income IS 'Monthly income amount (PHP)';
COMMENT ON COLUMN investor_profiles.business_registration_number IS 'SEC/CDA/DTI business registration number';
COMMENT ON COLUMN investor_profiles.business_address IS 'Main business address';
COMMENT ON COLUMN investor_profiles.principal_office_municipality IS 'Municipality/City of principal office';
COMMENT ON COLUMN investor_profiles.principal_office_province IS 'Province of principal office';
COMMENT ON COLUMN investor_profiles.investment_preference IS 'Investment type preference (equity, lending, both, etc.)';
COMMENT ON COLUMN investor_profiles.portfolio_value IS 'Current investment portfolio value (PHP)';

-- Record this migration
INSERT INTO schema_migrations (migration_name, rollback_sql)
VALUES ('013_add_comprehensive_kyc_fields', 
'-- Rollback script
ALTER TABLE users DROP COLUMN IF EXISTS username, DROP COLUMN IF EXISTS group_type, DROP COLUMN IF EXISTS profile_type, DROP COLUMN IF EXISTS street, DROP COLUMN IF EXISTS barangay;
ALTER TABLE borrower_profiles DROP COLUMN IF EXISTS group_type, DROP COLUMN IF EXISTS contact_email, DROP COLUMN IF EXISTS country_code, DROP COLUMN IF EXISTS barangay, DROP COLUMN IF EXISTS secondary_id_type, DROP COLUMN IF EXISTS secondary_id_number, DROP COLUMN IF EXISTS emergency_contact_name, DROP COLUMN IF EXISTS emergency_contact_relationship, DROP COLUMN IF EXISTS emergency_contact_phone, DROP COLUMN IF EXISTS emergency_contact_email, DROP COLUMN IF EXISTS emergency_contact_address, DROP COLUMN IF EXISTS mother_maiden_name, DROP COLUMN IF EXISTS monthly_income, DROP COLUMN IF EXISTS business_registration_number, DROP COLUMN IF EXISTS business_address, DROP COLUMN IF EXISTS principal_office_municipality, DROP COLUMN IF EXISTS principal_office_province, DROP COLUMN IF EXISTS gis_total_assets, DROP COLUMN IF EXISTS gis_total_liabilities, DROP COLUMN IF EXISTS gis_paid_up_capital, DROP COLUMN IF EXISTS gis_number_of_stockholders, DROP COLUMN IF EXISTS gis_number_of_employees, DROP COLUMN IF EXISTS pep_details, DROP COLUMN IF EXISTS authorized_signatory_id_type;
ALTER TABLE investor_profiles DROP COLUMN IF EXISTS group_type, DROP COLUMN IF EXISTS contact_email, DROP COLUMN IF EXISTS country_code, DROP COLUMN IF EXISTS barangay, DROP COLUMN IF EXISTS secondary_id_type, DROP COLUMN IF EXISTS secondary_id_number, DROP COLUMN IF EXISTS emergency_contact_name, DROP COLUMN IF EXISTS emergency_contact_relationship, DROP COLUMN IF EXISTS emergency_contact_phone, DROP COLUMN IF EXISTS emergency_contact_email, DROP COLUMN IF EXISTS emergency_contact_address, DROP COLUMN IF EXISTS mother_maiden_name, DROP COLUMN IF EXISTS monthly_income, DROP COLUMN IF EXISTS business_registration_number, DROP COLUMN IF EXISTS business_address, DROP COLUMN IF EXISTS principal_office_municipality, DROP COLUMN IF EXISTS principal_office_province, DROP COLUMN IF EXISTS gis_total_assets, DROP COLUMN IF EXISTS gis_total_liabilities, DROP COLUMN IF EXISTS gis_paid_up_capital, DROP COLUMN IF EXISTS gis_number_of_stockholders, DROP COLUMN IF EXISTS gis_number_of_employees, DROP COLUMN IF EXISTS pep_details, DROP COLUMN IF EXISTS authorized_signatory_id_type, DROP COLUMN IF EXISTS investment_preference, DROP COLUMN IF EXISTS portfolio_value;')
ON CONFLICT (migration_name) DO NOTHING;

COMMIT;

-- Verify columns were added successfully
SELECT 
    'users' as table_name,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name IN ('username', 'group_type', 'profile_type', 'street', 'barangay')
UNION ALL
SELECT 
    'borrower_profiles' as table_name,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'borrower_profiles' 
AND table_schema = 'public'
AND column_name IN ('group_type', 'contact_email', 'secondary_id_type', 'secondary_id_number', 
    'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone', 
    'emergency_contact_email', 'gis_total_assets', 'gis_total_liabilities', 'gis_paid_up_capital',
    'gis_number_of_stockholders', 'gis_number_of_employees', 'pep_details', 
    'authorized_signatory_id_type', 'mother_maiden_name', 'monthly_income')
UNION ALL
SELECT 
    'investor_profiles' as table_name,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'investor_profiles' 
AND table_schema = 'public'
AND column_name IN ('group_type', 'contact_email', 'secondary_id_type', 'secondary_id_number', 
    'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone', 
    'emergency_contact_email', 'gis_total_assets', 'gis_total_liabilities', 'gis_paid_up_capital',
    'gis_number_of_stockholders', 'gis_number_of_employees', 'pep_details', 
    'authorized_signatory_id_type', 'investment_preference', 'portfolio_value')
ORDER BY table_name, column_name;

-- Display summary
SELECT 
    table_name,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'borrower_profiles', 'investor_profiles')
GROUP BY table_name
ORDER BY table_name;
