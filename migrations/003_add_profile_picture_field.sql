-- Add profile picture field to users table
-- Migration: 003_add_profile_picture_field.sql

BEGIN;

-- Add profile_picture column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Create index for profile picture column
CREATE INDEX IF NOT EXISTS idx_users_profile_picture ON users(profile_picture);

-- Insert migration record
INSERT INTO schema_migrations (migration_name, rollback_sql)
VALUES (
    '003_add_profile_picture_field',
    'ALTER TABLE users DROP COLUMN IF EXISTS profile_picture;'
) ON CONFLICT (migration_name) DO NOTHING;

COMMIT;
