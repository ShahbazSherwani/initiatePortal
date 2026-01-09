-- Add first_name and last_name columns to users table
-- Run this in Supabase SQL Editor

BEGIN;

-- Add columns if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);

-- Update existing records: split full_name into first and last
UPDATE users
SET 
  first_name = CASE 
    WHEN full_name IS NOT NULL AND full_name != '' 
    THEN SPLIT_PART(TRIM(full_name), ' ', 1)
    ELSE NULL
  END,
  last_name = CASE 
    WHEN full_name IS NOT NULL AND full_name != '' AND ARRAY_LENGTH(STRING_TO_ARRAY(TRIM(full_name), ' '), 1) > 1
    THEN SUBSTRING(TRIM(full_name) FROM POSITION(' ' IN TRIM(full_name)) + 1)
    ELSE NULL
  END,
  updated_at = NOW()
WHERE (first_name IS NULL OR first_name = '')
  AND (last_name IS NULL OR last_name = '')
  AND full_name IS NOT NULL
  AND full_name != '';

COMMIT;

-- Verify the update
SELECT 
  id,
  full_name,
  first_name,
  last_name,
  CASE 
    WHEN first_name IS NOT NULL AND first_name != '' THEN '✓'
    ELSE '✗'
  END as has_first_name
FROM users
WHERE full_name IS NOT NULL AND full_name != ''
ORDER BY id
LIMIT 20;
