-- Migration: Add KYC Compliance Fields
-- Date: 2025-01-27
-- Description: Add comprehensive KYC fields for Individual and Non-Individual accounts
-- to meet regulatory compliance requirements

BEGIN;

-- Log this migration
INSERT INTO schema_migrations (migration_name, rollback_sql)
VALUES ('002_add_kyc_compliance_fields', 
'-- Rollback script for 002_add_kyc_compliance_fields
ALTER TABLE borrower_profiles 
DROP COLUMN IF EXISTS place_of_birth,
DROP COLUMN IF EXISTS gender,
DROP COLUMN IF EXISTS civil_status,
DROP COLUMN IF EXISTS nationality,
DROP COLUMN IF EXISTS contact_email,
DROP COLUMN IF EXISTS secondary_id_type,
DROP COLUMN IF EXISTS secondary_id_number,
DROP COLUMN IF EXISTS emergency_contact_name,
DROP COLUMN IF EXISTS emergency_contact_relationship,
DROP COLUMN IF EXISTS emergency_contact_phone,
DROP COLUMN IF EXISTS emergency_contact_email,
DROP COLUMN IF EXISTS is_individual_account,
DROP COLUMN IF EXISTS business_registration_type,
DROP COLUMN IF EXISTS business_registration_number,
DROP COLUMN IF EXISTS business_registration_date,
DROP COLUMN IF EXISTS corporate_tin,
DROP COLUMN IF EXISTS nature_of_business,
DROP COLUMN IF EXISTS principal_office_street,
DROP COLUMN IF EXISTS principal_office_barangay,
DROP COLUMN IF EXISTS principal_office_municipality,
DROP COLUMN IF EXISTS principal_office_province,
DROP COLUMN IF EXISTS principal_office_country,
DROP COLUMN IF EXISTS principal_office_postal_code,
DROP COLUMN IF EXISTS gis_total_assets,
DROP COLUMN IF EXISTS gis_total_liabilities,
DROP COLUMN IF EXISTS gis_paid_up_capital,
DROP COLUMN IF EXISTS gis_number_of_stockholders,
DROP COLUMN IF EXISTS gis_number_of_employees,
DROP COLUMN IF EXISTS is_politically_exposed_person,
DROP COLUMN IF EXISTS pep_details,
DROP COLUMN IF EXISTS authorized_signatory_name,
DROP COLUMN IF EXISTS authorized_signatory_position,
DROP COLUMN IF EXISTS authorized_signatory_id_type,
DROP COLUMN IF EXISTS authorized_signatory_id_number;

ALTER TABLE investor_profiles 
DROP COLUMN IF EXISTS place_of_birth,
DROP COLUMN IF EXISTS gender,
DROP COLUMN IF EXISTS civil_status,
DROP COLUMN IF EXISTS nationality,
DROP COLUMN IF EXISTS contact_email,
DROP COLUMN IF EXISTS secondary_id_type,
DROP COLUMN IF EXISTS secondary_id_number,
DROP COLUMN IF EXISTS emergency_contact_name,
DROP COLUMN IF EXISTS emergency_contact_relationship,
DROP COLUMN IF EXISTS emergency_contact_phone,
DROP COLUMN IF EXISTS emergency_contact_email,
DROP COLUMN IF EXISTS is_individual_account,
DROP COLUMN IF EXISTS business_registration_type,
DROP COLUMN IF EXISTS business_registration_number,
DROP COLUMN IF EXISTS business_registration_date,
DROP COLUMN IF EXISTS corporate_tin,
DROP COLUMN IF EXISTS nature_of_business,
DROP COLUMN IF EXISTS principal_office_street,
DROP COLUMN IF EXISTS principal_office_barangay,
DROP COLUMN IF EXISTS principal_office_municipality,
DROP COLUMN IF EXISTS principal_office_province,
DROP COLUMN IF EXISTS principal_office_country,
DROP COLUMN IF EXISTS principal_office_postal_code,
DROP COLUMN IF EXISTS gis_total_assets,
DROP COLUMN IF EXISTS gis_total_liabilities,
DROP COLUMN IF EXISTS gis_paid_up_capital,
DROP COLUMN IF EXISTS gis_number_of_stockholders,
DROP COLUMN IF EXISTS gis_number_of_employees,
DROP COLUMN IF EXISTS is_politically_exposed_person,
DROP COLUMN IF EXISTS pep_details,
DROP COLUMN IF EXISTS authorized_signatory_name,
DROP COLUMN IF EXISTS authorized_signatory_position,
DROP COLUMN IF EXISTS authorized_signatory_id_type,
DROP COLUMN IF EXISTS authorized_signatory_id_number;'
) ON CONFLICT (migration_name) DO NOTHING;

-- Check if this migration has already been run
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE migration_name = '002_add_kyc_compliance_fields') THEN
        RAISE NOTICE 'Migration 002_add_kyc_compliance_fields has already been executed. Skipping.';
    ELSE
        -- Add KYC fields to borrower_profiles table
        ALTER TABLE borrower_profiles 
        -- Individual Account Fields (Additional)
        ADD COLUMN IF NOT EXISTS place_of_birth VARCHAR(255),
        ADD COLUMN IF NOT EXISTS gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
        ADD COLUMN IF NOT EXISTS civil_status VARCHAR(50) CHECK (civil_status IN ('Single', 'Married', 'Divorced', 'Widowed', 'Separated')),
        ADD COLUMN IF NOT EXISTS nationality VARCHAR(100),
        ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS secondary_id_type VARCHAR(50) CHECK (secondary_id_type IN ('Drivers License', 'Postal ID', 'Voters ID', 'PhilHealth ID', 'SSS ID', 'GSIS ID', 'PRC ID', 'OFW ID', 'Senior Citizen ID', 'PWD ID')),
        ADD COLUMN IF NOT EXISTS secondary_id_number VARCHAR(100),
        
        -- Emergency Contact Information
        ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100),
        ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
        ADD COLUMN IF NOT EXISTS emergency_contact_email VARCHAR(255),
        
        -- Account Type Flag
        ADD COLUMN IF NOT EXISTS is_individual_account BOOLEAN DEFAULT TRUE,
        
        -- Non-Individual/Business Account Fields
        ADD COLUMN IF NOT EXISTS business_registration_type VARCHAR(50) CHECK (business_registration_type IN ('SEC', 'CDA', 'DTI')),
        ADD COLUMN IF NOT EXISTS business_registration_number VARCHAR(100),
        ADD COLUMN IF NOT EXISTS business_registration_date DATE,
        ADD COLUMN IF NOT EXISTS corporate_tin VARCHAR(50),
        ADD COLUMN IF NOT EXISTS nature_of_business VARCHAR(255),
        
        -- Principal Office Address (separate from owner's address)
        ADD COLUMN IF NOT EXISTS principal_office_street VARCHAR(255),
        ADD COLUMN IF NOT EXISTS principal_office_barangay VARCHAR(255),
        ADD COLUMN IF NOT EXISTS principal_office_municipality VARCHAR(255),
        ADD COLUMN IF NOT EXISTS principal_office_province VARCHAR(255),
        ADD COLUMN IF NOT EXISTS principal_office_country VARCHAR(100) DEFAULT 'Philippines',
        ADD COLUMN IF NOT EXISTS principal_office_postal_code VARCHAR(10),
        
        -- General Information Sheet Details
        ADD COLUMN IF NOT EXISTS gis_total_assets DECIMAL(15,2),
        ADD COLUMN IF NOT EXISTS gis_total_liabilities DECIMAL(15,2),
        ADD COLUMN IF NOT EXISTS gis_paid_up_capital DECIMAL(15,2),
        ADD COLUMN IF NOT EXISTS gis_number_of_stockholders INTEGER,
        ADD COLUMN IF NOT EXISTS gis_number_of_employees INTEGER,
        
        -- Politically Exposed Person (PEP) Information
        ADD COLUMN IF NOT EXISTS is_politically_exposed_person BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS pep_details TEXT,
        
        -- Authorized Signatory Information (for non-individual accounts)
        ADD COLUMN IF NOT EXISTS authorized_signatory_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS authorized_signatory_position VARCHAR(100),
        ADD COLUMN IF NOT EXISTS authorized_signatory_id_type VARCHAR(50),
        ADD COLUMN IF NOT EXISTS authorized_signatory_id_number VARCHAR(100);

        -- Add same KYC fields to investor_profiles table
        ALTER TABLE investor_profiles 
        -- Individual Account Fields (Additional)
        ADD COLUMN IF NOT EXISTS place_of_birth VARCHAR(255),
        ADD COLUMN IF NOT EXISTS gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
        ADD COLUMN IF NOT EXISTS civil_status VARCHAR(50) CHECK (civil_status IN ('Single', 'Married', 'Divorced', 'Widowed', 'Separated')),
        ADD COLUMN IF NOT EXISTS nationality VARCHAR(100),
        ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS secondary_id_type VARCHAR(50) CHECK (secondary_id_type IN ('Drivers License', 'Postal ID', 'Voters ID', 'PhilHealth ID', 'SSS ID', 'GSIS ID', 'PRC ID', 'OFW ID', 'Senior Citizen ID', 'PWD ID')),
        ADD COLUMN IF NOT EXISTS secondary_id_number VARCHAR(100),
        
        -- Emergency Contact Information
        ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100),
        ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
        ADD COLUMN IF NOT EXISTS emergency_contact_email VARCHAR(255),
        
        -- Account Type Flag
        ADD COLUMN IF NOT EXISTS is_individual_account BOOLEAN DEFAULT TRUE,
        
        -- Non-Individual/Business Account Fields
        ADD COLUMN IF NOT EXISTS business_registration_type VARCHAR(50) CHECK (business_registration_type IN ('SEC', 'CDA', 'DTI')),
        ADD COLUMN IF NOT EXISTS business_registration_number VARCHAR(100),
        ADD COLUMN IF NOT EXISTS business_registration_date DATE,
        ADD COLUMN IF NOT EXISTS corporate_tin VARCHAR(50),
        ADD COLUMN IF NOT EXISTS nature_of_business VARCHAR(255),
        
        -- Principal Office Address (separate from owner's address)
        ADD COLUMN IF NOT EXISTS principal_office_street VARCHAR(255),
        ADD COLUMN IF NOT EXISTS principal_office_barangay VARCHAR(255),
        ADD COLUMN IF NOT EXISTS principal_office_municipality VARCHAR(255),
        ADD COLUMN IF NOT EXISTS principal_office_province VARCHAR(255),
        ADD COLUMN IF NOT EXISTS principal_office_country VARCHAR(100) DEFAULT 'Philippines',
        ADD COLUMN IF NOT EXISTS principal_office_postal_code VARCHAR(10),
        
        -- General Information Sheet Details
        ADD COLUMN IF NOT EXISTS gis_total_assets DECIMAL(15,2),
        ADD COLUMN IF NOT EXISTS gis_total_liabilities DECIMAL(15,2),
        ADD COLUMN IF NOT EXISTS gis_paid_up_capital DECIMAL(15,2),
        ADD COLUMN IF NOT EXISTS gis_number_of_stockholders INTEGER,
        ADD COLUMN IF NOT EXISTS gis_number_of_employees INTEGER,
        
        -- Politically Exposed Person (PEP) Information
        ADD COLUMN IF NOT EXISTS is_politically_exposed_person BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS pep_details TEXT,
        
        -- Authorized Signatory Information (for non-individual accounts)
        ADD COLUMN IF NOT EXISTS authorized_signatory_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS authorized_signatory_position VARCHAR(100),
        ADD COLUMN IF NOT EXISTS authorized_signatory_id_type VARCHAR(50),
        ADD COLUMN IF NOT EXISTS authorized_signatory_id_number VARCHAR(100);

        -- Create additional indexes for the new fields
        CREATE INDEX IF NOT EXISTS idx_borrower_profiles_account_type ON borrower_profiles(is_individual_account);
        CREATE INDEX IF NOT EXISTS idx_borrower_profiles_business_reg ON borrower_profiles(business_registration_type, business_registration_number);
        CREATE INDEX IF NOT EXISTS idx_borrower_profiles_pep ON borrower_profiles(is_politically_exposed_person);
        
        CREATE INDEX IF NOT EXISTS idx_investor_profiles_account_type ON investor_profiles(is_individual_account);
        CREATE INDEX IF NOT EXISTS idx_investor_profiles_business_reg ON investor_profiles(business_registration_type, business_registration_number);
        CREATE INDEX IF NOT EXISTS idx_investor_profiles_pep ON investor_profiles(is_politically_exposed_person);

        RAISE NOTICE 'Migration 002_add_kyc_compliance_fields completed successfully.';
        RAISE NOTICE 'Added comprehensive KYC fields for Individual and Non-Individual accounts to both borrower_profiles and investor_profiles tables.';
    END IF;
END $$;

COMMIT;
