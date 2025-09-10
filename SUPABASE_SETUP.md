# Supabase Setup Guide for KYC Portal

## Step 1: Get Your Supabase Connection String

1. Go to your Supabase project dashboard
2. Click on **Settings** (gear icon) in the left sidebar
3. Click on **Database**
4. Scroll down to **Connection string**
5. Copy the **URI** format connection string

It should look like:
```
postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

## Step 2: Update Backend Environment

1. Open `backend/.env` file
2. Replace the DATABASE_URL with your Supabase connection string:

```env
# Replace [YOUR-PASSWORD] and [YOUR-PROJECT-REF] with actual values
DATABASE_URL=postgresql://postgres:your_actual_password@db.your_project_ref.supabase.co:5432/postgres

# Other settings
NODE_ENV=development
PORT=4000
```

## Step 3: Set Up Database Schema

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Create a new query
4. Copy and paste the contents of `migrations/000_initial_schema_with_kyc.sql`
5. Click **Run** to execute the script

This will create:
- `users` table with all 34 KYC fields
- `wallets` table for user balances
- `projects` table for borrower projects
- `schema_migrations` table for tracking changes

## Step 4: Verify Setup

1. In Supabase dashboard, go to **Table Editor**
2. You should see these tables:
   - ✅ users
   - ✅ wallets  
   - ✅ projects
   - ✅ schema_migrations

3. Check the `users` table structure - it should have columns like:
   - firebase_uid, email, full_name
   - first_name, last_name, date_of_birth
   - present_address, permanent_address
   - national_id, passport, tin_number
   - employment_status, occupation
   - investment_experience, risk_tolerance
   - pep_status, pep_details, etc.

## Step 5: Test the Connection

1. Restart your backend server:
   ```powershell
   cd backend
   node server.js
   ```

2. You should see:
   ```
   ✅ Database connected successfully
   API listening on port 4000
   ```

3. Test the API:
   ```powershell
   # Test if settings endpoint works
   curl http://localhost:4000/api/settings
   ```

## Step 6: Test KYC Functionality

1. Open http://localhost:5173/
2. Register/Login with Firebase Auth
3. Go to Registration forms (Borrower/Investor)
4. Fill out KYC fields and submit
5. Go to Settings page
6. Verify that your data was saved and displays correctly

## Troubleshooting

### "Database error" or connection issues:
- Double-check your DATABASE_URL format
- Ensure password doesn't contain special characters that need URL encoding
- Verify your Supabase project is not paused
- Check Supabase dashboard for connection limits

### Data not saving:
- Check browser console for error messages
- Verify API is calling correct port (4000)
- Check backend logs for database errors
- Ensure schema was created correctly in Supabase

### Old data showing:
- Clear browser cache and cookies
- Do a hard refresh (Ctrl+F5)
- Check if you're using correct API endpoints

### Still need help?
- Check Supabase logs in the dashboard
- Verify all tables exist with correct columns
- Test direct database connection in Supabase SQL editor

## Quick Test Query

Run this in Supabase SQL Editor to test:
```sql
-- Test that tables exist and have data
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('firebase_uid', 'first_name', 'pep_status')
ORDER BY column_name;
```

Should return 3 rows showing these columns exist.
