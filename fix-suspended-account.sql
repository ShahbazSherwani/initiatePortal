-- Fix Account Suspension Issue
-- This script will unsuspend your user account

-- First, let's see all suspended accounts
SELECT 
  firebase_uid,
  email,
  full_name,
  suspension_scope,
  created_at
FROM users
WHERE suspension_scope IS NOT NULL AND suspension_scope != 'none';

-- To unsuspend a specific account, replace 'YOUR_FIREBASE_UID' with your actual Firebase UID
-- You can find it by checking the most recent user:
SELECT 
  firebase_uid,
  email,
  full_name,
  suspension_scope,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;

-- Unsuspend the account (uncomment and run after finding your UID)
-- UPDATE users 
-- SET suspension_scope = 'none'
-- WHERE email = 'your_email@example.com';

-- Or unsuspend ALL accounts if needed for testing
-- UPDATE users SET suspension_scope = 'none' WHERE suspension_scope IS NOT NULL;
