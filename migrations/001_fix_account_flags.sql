-- Migration: Fix account flags for existing users
-- Date: 2025-09-03
-- Description: Update has_borrower_account and has_investor_account flags for users who have profiles/projects

BEGIN;

-- Create migration log table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rollback_sql TEXT
);

-- Check if this migration has already been run
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE migration_name = '001_fix_account_flags') THEN
        RAISE NOTICE 'Migration 001_fix_account_flags has already been executed. Skipping.';
    ELSE
        -- Log current state for rollback
        CREATE TEMP TABLE pre_migration_state AS
        SELECT firebase_uid, has_borrower_account, has_investor_account
        FROM users 
        WHERE has_completed_registration = true;

        -- Update borrower flags for users who have borrower profiles
        UPDATE users 
        SET has_borrower_account = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE firebase_uid IN (
            SELECT DISTINCT firebase_uid 
            FROM borrower_profiles
            WHERE firebase_uid IS NOT NULL
        ) AND has_borrower_account = false;

        -- Get count of borrower updates
        GET DIAGNOSTICS borrower_count = ROW_COUNT;

        -- Update investor flags for users who have investor profiles  
        UPDATE users 
        SET has_investor_account = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE firebase_uid IN (
            SELECT DISTINCT firebase_uid 
            FROM investor_profiles
            WHERE firebase_uid IS NOT NULL
        ) AND has_investor_account = false;

        -- Get count of investor updates
        GET DIAGNOSTICS investor_count = ROW_COUNT;

        -- Update borrower flags for users who have projects (indicates borrower account)
        UPDATE users 
        SET has_borrower_account = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE firebase_uid IN (
            SELECT DISTINCT firebase_uid 
            FROM projects
            WHERE firebase_uid IS NOT NULL
        ) AND has_borrower_account = false;

        -- Get count of projects updates
        GET DIAGNOSTICS projects_count = ROW_COUNT;

        -- Log the migration
        INSERT INTO schema_migrations (migration_name, rollback_sql)
        VALUES (
            '001_fix_account_flags',
            'UPDATE users SET (has_borrower_account, has_investor_account) = (pms.has_borrower_account, pms.has_investor_account) FROM pre_migration_state pms WHERE users.firebase_uid = pms.firebase_uid;'
        );

        -- Log results
        RAISE NOTICE 'Migration 001_fix_account_flags completed successfully';
        RAISE NOTICE 'Updated borrower flags for % users with profiles', borrower_count;
        RAISE NOTICE 'Updated investor flags for % users with profiles', investor_count;
        RAISE NOTICE 'Updated borrower flags for % users with projects', projects_count;
    END IF;
END $$;

COMMIT;
