-- Migration: Add Email Verification Support
-- Created: 2025-10-17
-- Purpose: Add email verification system for user registration

-- Create email_verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
  id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_verifications_token 
  ON email_verifications(token);

CREATE INDEX IF NOT EXISTS idx_email_verifications_uid 
  ON email_verifications(firebase_uid);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email 
  ON email_verifications(email);

-- Add email verification columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;

-- Create index on email_verified for faster queries
CREATE INDEX IF NOT EXISTS idx_users_email_verified 
  ON users(email_verified);

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Email verification migration completed successfully';
END $$;
