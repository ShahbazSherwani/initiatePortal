-- Fix account flags for users who have profiles but flags are not set correctly
-- This script will identify users who have borrower/investor profiles 
-- and update their account flags accordingly

-- Fix borrower account flags
UPDATE users 
SET has_borrower_account = TRUE 
WHERE firebase_uid IN (
    SELECT DISTINCT firebase_uid 
    FROM borrower_profiles 
    WHERE firebase_uid IS NOT NULL
) 
AND has_borrower_account = FALSE;

-- Fix investor account flags  
UPDATE users 
SET has_investor_account = TRUE 
WHERE firebase_uid IN (
    SELECT DISTINCT firebase_uid 
    FROM investor_profiles 
    WHERE firebase_uid IS NOT NULL
) 
AND has_investor_account = FALSE;

-- Alternative: Fix based on users who have created projects (borrower indication)
UPDATE users 
SET has_borrower_account = TRUE 
WHERE firebase_uid IN (
    SELECT DISTINCT created_by 
    FROM projects 
    WHERE created_by IS NOT NULL
) 
AND has_borrower_account = FALSE;

-- Show results
SELECT 
    firebase_uid,
    full_name,
    has_borrower_account,
    has_investor_account,
    current_account_type,
    (SELECT COUNT(*) FROM borrower_profiles bp WHERE bp.firebase_uid = users.firebase_uid) as borrower_profiles_count,
    (SELECT COUNT(*) FROM investor_profiles ip WHERE ip.firebase_uid = users.firebase_uid) as investor_profiles_count,
    (SELECT COUNT(*) FROM projects p WHERE p.created_by = users.firebase_uid) as projects_count
FROM users 
WHERE firebase_uid = 'hfAt4L2H4Pgzchk2Xcw15IKcMYJ2';
