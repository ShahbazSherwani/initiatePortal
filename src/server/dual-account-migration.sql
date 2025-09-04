-- Dual Account Support Migration
-- Add this to your existing database or run as a migration

-- Create borrower_profiles table
CREATE TABLE IF NOT EXISTS borrower_profiles (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    occupation VARCHAR(255),
    business_type VARCHAR(255),
    location VARCHAR(255),
    phone_number VARCHAR(20),
    date_of_birth DATE,
    national_id VARCHAR(50),
    passport_no VARCHAR(50),
    tin VARCHAR(50),
    street VARCHAR(255),
    barangay VARCHAR(255),
    municipality VARCHAR(255),
    province VARCHAR(255),
    country VARCHAR(255),
    postal_code VARCHAR(10),
    experience VARCHAR(50),
    is_complete BOOLEAN DEFAULT FALSE,
    has_active_project BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
);

-- Create investor_profiles table
CREATE TABLE IF NOT EXISTS investor_profiles (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    location VARCHAR(255),
    phone_number VARCHAR(20),
    date_of_birth DATE,
    investment_experience VARCHAR(50),
    investment_preference VARCHAR(50), -- 'lending', 'equity', 'both'
    risk_tolerance VARCHAR(50), -- 'conservative', 'moderate', 'aggressive'
    portfolio_value DECIMAL(12,2) DEFAULT 0.00,
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
);

-- Update users table to support multiple account types
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS has_borrower_account BOOLEAN DEFAULT FALSE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS has_investor_account BOOLEAN DEFAULT FALSE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS current_account_type VARCHAR(20) DEFAULT 'borrower';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_borrower_profiles_firebase_uid ON borrower_profiles(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_firebase_uid ON investor_profiles(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_borrower_profiles_active_project ON borrower_profiles(has_active_project);
CREATE INDEX IF NOT EXISTS idx_users_account_types ON users(has_borrower_account, has_investor_account);
