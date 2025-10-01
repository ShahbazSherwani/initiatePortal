-- Migration: Add document file columns to borrower_profiles and investor_profiles
-- This migration adds columns to store base64-encoded document images (National ID and Passport)

-- Add document file columns to borrower_profiles
ALTER TABLE borrower_profiles 
ADD COLUMN IF NOT EXISTS national_id_file TEXT,
ADD COLUMN IF NOT EXISTS passport_file TEXT;

-- Add document file columns to investor_profiles
ALTER TABLE investor_profiles 
ADD COLUMN IF NOT EXISTS national_id_file TEXT,
ADD COLUMN IF NOT EXISTS passport_file TEXT;

-- Add comments to describe the columns
COMMENT ON COLUMN borrower_profiles.national_id_file IS 'Base64-encoded National ID document image';
COMMENT ON COLUMN borrower_profiles.passport_file IS 'Base64-encoded Passport document image';
COMMENT ON COLUMN investor_profiles.national_id_file IS 'Base64-encoded National ID document image';
COMMENT ON COLUMN investor_profiles.passport_file IS 'Base64-encoded Passport document image';
