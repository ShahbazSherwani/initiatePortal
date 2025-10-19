-- Migration: Add password reset tokens table
-- Created: October 19, 2025
-- Purpose: Store password reset tokens for email-based password reset

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_firebase_uid ON password_reset_tokens(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Add comment to table
COMMENT ON TABLE password_reset_tokens IS 'Stores password reset tokens for email-based password reset. Tokens expire after 1 hour.';

COMMENT ON COLUMN password_reset_tokens.firebase_uid IS 'Firebase UID of the user requesting password reset';
COMMENT ON COLUMN password_reset_tokens.email IS 'Email address where reset link was sent';
COMMENT ON COLUMN password_reset_tokens.token IS 'Unique reset token (32-byte hex string)';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Timestamp when token expires (1 hour from creation)';
COMMENT ON COLUMN password_reset_tokens.used IS 'Whether token has been used already';
COMMENT ON COLUMN password_reset_tokens.created_at IS 'When the reset request was created';
