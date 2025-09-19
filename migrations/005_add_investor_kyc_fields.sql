-- Add missing KYC fields to investor_profiles table
-- This migration adds the detailed KYC fields that are being sent from the frontend

BEGIN;

-- Add all the KYC fields that are missing from investor_profiles table
ALTER TABLE investor_profiles 
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(255), 
    ADD COLUMN IF NOT EXISTS middle_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS suffix_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS place_of_birth VARCHAR(255),
    ADD COLUMN IF NOT EXISTS nationality VARCHAR(100),
    ADD COLUMN IF NOT EXISTS gender VARCHAR(50),
    ADD COLUMN IF NOT EXISTS civil_status VARCHAR(100),
    
    -- Contact Information
    ADD COLUMN IF NOT EXISTS email_address VARCHAR(255),
    ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS country_code VARCHAR(10),
    
    -- Address Information
    ADD COLUMN IF NOT EXISTS present_address TEXT,
    ADD COLUMN IF NOT EXISTS permanent_address TEXT,
    ADD COLUMN IF NOT EXISTS city VARCHAR(100),
    ADD COLUMN IF NOT EXISTS state VARCHAR(100),
    ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS country VARCHAR(100),
    
    -- Identification
    ADD COLUMN IF NOT EXISTS national_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS passport VARCHAR(100),
    ADD COLUMN IF NOT EXISTS tin_number VARCHAR(100),
    
    -- Employment and Income
    ADD COLUMN IF NOT EXISTS occupation VARCHAR(255),
    ADD COLUMN IF NOT EXISTS employer_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS employer_address TEXT,
    ADD COLUMN IF NOT EXISTS employment_status VARCHAR(100),
    ADD COLUMN IF NOT EXISTS gross_annual_income VARCHAR(100),
    ADD COLUMN IF NOT EXISTS source_of_income TEXT,
    
    -- Investment Information  
    ADD COLUMN IF NOT EXISTS investment_experience VARCHAR(100),
    ADD COLUMN IF NOT EXISTS investment_objectives TEXT,
    ADD COLUMN IF NOT EXISTS risk_tolerance VARCHAR(100),
    ADD COLUMN IF NOT EXISTS investment_horizon VARCHAR(100),
    ADD COLUMN IF NOT EXISTS liquid_net_worth VARCHAR(100),
    
    -- PEP Information
    ADD COLUMN IF NOT EXISTS pep_status VARCHAR(10) DEFAULT 'no',
    ADD COLUMN IF NOT EXISTS pep_details TEXT,
    ADD COLUMN IF NOT EXISTS pep_country VARCHAR(100),
    ADD COLUMN IF NOT EXISTS pep_position VARCHAR(255),
    
    -- Related PEP Information
    ADD COLUMN IF NOT EXISTS related_pep_status VARCHAR(10) DEFAULT 'no',
    ADD COLUMN IF NOT EXISTS related_pep_details TEXT,
    ADD COLUMN IF NOT EXISTS related_pep_relationship VARCHAR(100),
    ADD COLUMN IF NOT EXISTS related_pep_country VARCHAR(100),
    ADD COLUMN IF NOT EXISTS related_pep_position VARCHAR(255),
    
    -- Entity Information (for non-individual accounts)
    ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS entity_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS registration_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS registration_date DATE,
    ADD COLUMN IF NOT EXISTS business_address TEXT,
    ADD COLUMN IF NOT EXISTS authorized_person_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS authorized_person_position VARCHAR(255),
    
    -- File uploads (store file paths/URLs)
    ADD COLUMN IF NOT EXISTS national_id_file VARCHAR(500),
    ADD COLUMN IF NOT EXISTS passport_file VARCHAR(500),
    ADD COLUMN IF NOT EXISTS employment_certificate_file VARCHAR(500),
    ADD COLUMN IF NOT EXISTS income_document_file VARCHAR(500),
    ADD COLUMN IF NOT EXISTS signature_file VARCHAR(500),
    
    -- Direct Lender specific fields
    ADD COLUMN IF NOT EXISTS lender_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS requirements_criteria TEXT,
    ADD COLUMN IF NOT EXISTS doc_requirements TEXT,
    ADD COLUMN IF NOT EXISTS max_facility DECIMAL(15, 2),
    ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(5, 2);

-- Record this migration
INSERT INTO schema_migrations (migration_name, rollback_sql)
VALUES ('005_add_investor_kyc_fields', 
'ALTER TABLE investor_profiles DROP COLUMN IF EXISTS first_name, DROP COLUMN IF EXISTS last_name, DROP COLUMN IF EXISTS middle_name, DROP COLUMN IF EXISTS suffix_name, DROP COLUMN IF EXISTS date_of_birth, DROP COLUMN IF EXISTS place_of_birth, DROP COLUMN IF EXISTS nationality, DROP COLUMN IF EXISTS gender, DROP COLUMN IF EXISTS civil_status, DROP COLUMN IF EXISTS email_address, DROP COLUMN IF EXISTS mobile_number, DROP COLUMN IF EXISTS country_code, DROP COLUMN IF EXISTS present_address, DROP COLUMN IF EXISTS permanent_address, DROP COLUMN IF EXISTS city, DROP COLUMN IF EXISTS state, DROP COLUMN IF EXISTS postal_code, DROP COLUMN IF EXISTS country, DROP COLUMN IF EXISTS national_id, DROP COLUMN IF EXISTS passport, DROP COLUMN IF EXISTS tin_number, DROP COLUMN IF EXISTS occupation, DROP COLUMN IF EXISTS employer_name, DROP COLUMN IF EXISTS employer_address, DROP COLUMN IF EXISTS employment_status, DROP COLUMN IF EXISTS gross_annual_income, DROP COLUMN IF EXISTS source_of_income, DROP COLUMN IF EXISTS investment_experience, DROP COLUMN IF EXISTS investment_objectives, DROP COLUMN IF EXISTS risk_tolerance, DROP COLUMN IF EXISTS investment_horizon, DROP COLUMN IF EXISTS liquid_net_worth, DROP COLUMN IF EXISTS pep_status, DROP COLUMN IF EXISTS pep_details, DROP COLUMN IF EXISTS pep_country, DROP COLUMN IF EXISTS pep_position, DROP COLUMN IF EXISTS related_pep_status, DROP COLUMN IF EXISTS related_pep_details, DROP COLUMN IF EXISTS related_pep_relationship, DROP COLUMN IF EXISTS related_pep_country, DROP COLUMN IF EXISTS related_pep_position, DROP COLUMN IF EXISTS entity_type, DROP COLUMN IF EXISTS entity_name, DROP COLUMN IF EXISTS registration_number, DROP COLUMN IF EXISTS registration_type, DROP COLUMN IF EXISTS registration_date, DROP COLUMN IF EXISTS business_address, DROP COLUMN IF EXISTS authorized_person_name, DROP COLUMN IF EXISTS authorized_person_position, DROP COLUMN IF EXISTS national_id_file, DROP COLUMN IF EXISTS passport_file, DROP COLUMN IF EXISTS employment_certificate_file, DROP COLUMN IF EXISTS income_document_file, DROP COLUMN IF EXISTS signature_file, DROP COLUMN IF EXISTS lender_type, DROP COLUMN IF EXISTS requirements_criteria, DROP COLUMN IF EXISTS doc_requirements, DROP COLUMN IF EXISTS max_facility, DROP COLUMN IF EXISTS interest_rate;')
ON CONFLICT (migration_name) DO NOTHING;

COMMIT;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'investor_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;