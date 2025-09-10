-- Complete Database Setup for Supabase
-- This script creates all necessary tables with KYC fields
-- Run this in your Supabase SQL editor

BEGIN;

-- Create schema_migrations table for tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT NOW(),
    rollback_sql TEXT
);

-- Create users table with comprehensive KYC fields
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255),
    phone_number VARCHAR(50),
    role VARCHAR(50),
    account_type VARCHAR(50) DEFAULT 'individual',
    is_admin BOOLEAN DEFAULT FALSE,
    has_completed_registration BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Individual Information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    middle_name VARCHAR(100),
    date_of_birth DATE,
    place_of_birth VARCHAR(255),
    nationality VARCHAR(100),
    gender VARCHAR(20),
    marital_status VARCHAR(50),
    
    -- Contact Information
    email_address VARCHAR(255),
    mobile_number VARCHAR(50),
    
    -- Address Information
    present_address TEXT,
    permanent_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- Identification
    national_id VARCHAR(100),
    passport VARCHAR(100),
    drivers_license VARCHAR(100),
    tin_number VARCHAR(100),
    
    -- Employment Information
    employment_status VARCHAR(100),
    occupation VARCHAR(255),
    employer_name VARCHAR(255),
    employer_address TEXT,
    monthly_income DECIMAL(15, 2),
    income_source VARCHAR(255),
    
    -- Non-Individual specific fields
    company_name VARCHAR(255),
    business_type VARCHAR(255),
    business_registration_number VARCHAR(100),
    tax_identification_number VARCHAR(100),
    business_address TEXT,
    authorized_person_name VARCHAR(255),
    authorized_person_position VARCHAR(255),
    
    -- Investment Information
    investment_experience VARCHAR(100),
    risk_tolerance VARCHAR(100),
    investment_goals TEXT,
    liquid_net_worth DECIMAL(15, 2),
    annual_income DECIMAL(15, 2),
    investment_horizon VARCHAR(100),
    
    -- PEP (Politically Exposed Person) Information
    pep_status VARCHAR(10) DEFAULT 'no',
    pep_details TEXT,
    pep_country VARCHAR(100),
    pep_position VARCHAR(255),
    
    -- Related Persons PEP Information
    related_pep_status VARCHAR(10) DEFAULT 'no',
    related_pep_details TEXT,
    related_pep_relationship VARCHAR(100),
    related_pep_country VARCHAR(100),
    related_pep_position VARCHAR(255)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);

-- Create wallets table if it doesn't exist
CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid)
);

-- Create projects table if it doesn't exist (basic structure)
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid)
);

-- Record this migration
INSERT INTO schema_migrations (migration_name, rollback_sql)
VALUES ('000_initial_schema_with_kyc', 
'DROP TABLE IF EXISTS projects; DROP TABLE IF EXISTS wallets; DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS schema_migrations;')
ON CONFLICT (migration_name) DO NOTHING;

COMMIT;

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'wallets', 'projects', 'schema_migrations');
