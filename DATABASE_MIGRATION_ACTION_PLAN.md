# Database Migration Action Plan - Complete Data Capture

## 📊 Summary

**Total Missing Fields Identified:** 58 unique fields across all tables
- **users table:** 5 fields
- **borrower_profiles table:** 26 fields  
- **investor_profiles table:** 28 fields

**Files Created:**
1. [MISSING_DATABASE_FIELDS_AUDIT.md](MISSING_DATABASE_FIELDS_AUDIT.md) - Comprehensive analysis of all missing fields
2. [migrations/013_add_comprehensive_kyc_fields.sql](migrations/013_add_comprehensive_kyc_fields.sql) - Migration script to add all missing fields

---

## ⚡ Critical Fields That MUST Be Added

### 1. **phone_number** (users table)
- **Status:** Migration 007 already created, needs execution
- **Impact:** Registration currently failing without this
- **File:** migrations/007_add_phone_number_to_users.sql

### 2. **Emergency Contact Fields** (borrower_profiles & investor_profiles)
- emergency_contact_name
- emergency_contact_relationship
- emergency_contact_phone
- emergency_contact_email
- emergency_contact_address
- **Impact:** Required for KYC compliance, currently referenced in backend code but not in database

### 3. **GIS Fields** (borrower_profiles & investor_profiles)
- gis_total_assets
- gis_total_liabilities
- gis_paid_up_capital
- gis_number_of_stockholders
- gis_number_of_employees
- **Impact:** Required for business/corporate accounts (regulatory requirement in Philippines)

### 4. **Secondary ID Fields** (borrower_profiles & investor_profiles)
- secondary_id_type
- secondary_id_number
- **Impact:** Required for full KYC compliance

### 5. **username** (users table)
- **Impact:** Essential for user identification and login

---

## 📋 Step-by-Step Execution Plan

### STEP 1: Execute phone_number Migration
```sql
-- In Supabase SQL Editor, run:
-- migrations/007_add_phone_number_to_users.sql

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
```

**Expected Result:** users table now has phone_number column

---

### STEP 2: Execute Comprehensive KYC Fields Migration
```sql
-- In Supabase SQL Editor, run:
-- migrations/013_add_comprehensive_kyc_fields.sql

-- This will add all 58 missing fields to:
-- - users table (5 fields)
-- - borrower_profiles table (26 fields)
-- - investor_profiles table (28 fields)
```

**Expected Result:** 
- 5 new columns in users
- 26 new columns in borrower_profiles
- 28 new columns in investor_profiles
- All indexes created
- All column comments added

**Verification Query:**
```sql
-- Check that all columns were added
SELECT 
    table_name,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'borrower_profiles', 'investor_profiles')
GROUP BY table_name;
```

---

### STEP 3: Update Backend Queries

**Files to Review:**
- src/server/server.js (KYC save endpoint around line 5870-6200)

**Changes Needed:**

1. **Add missing fields to borrower_profiles INSERT** (line ~5873):
```javascript
// Add these to the INSERT columns list:
group_type, country_code, barangay,
secondary_id_type, secondary_id_number,
emergency_contact_address,
mother_maiden_name, monthly_income,
business_registration_number, business_address,
principal_office_municipality, principal_office_province,
gis_total_assets, gis_total_liabilities, gis_paid_up_capital,
gis_number_of_stockholders, gis_number_of_employees,
pep_details, authorized_signatory_id_type

// And corresponding values from kycData
```

2. **Add missing fields to investor_profiles INSERT** (line ~6076):
```javascript
// Add these to the INSERT columns list:
group_type, country_code, barangay,
secondary_id_type, secondary_id_number,
emergency_contact_address,
mother_maiden_name, monthly_income,
business_registration_number, business_address,
principal_office_municipality, principal_office_province,
gis_total_assets, gis_total_liabilities, gis_paid_up_capital,
gis_number_of_stockholders, gis_number_of_employees,
pep_details, authorized_signatory_id_type,
investment_preference, portfolio_value

// And corresponding values from kycData
```

3. **Add to ON CONFLICT DO UPDATE** clauses to update these fields on existing records

---

### STEP 4: Frontend Verification

**Files to Check:**
- src/components/KYCForm.tsx (all fields captured)
- src/screens/Settings.tsx (all fields captured)

**Verification:**
- All formData fields have corresponding database columns ✅
- No field will be lost when user saves ✅

---

### STEP 5: Test Registration Flow

1. Open https://initiate-portal.vercel.app/register
2. Register a new test user:
   - Email: test-complete-data@example.com
   - Fill ALL fields in KYC form:
     - Individual fields (place of birth, gender, civil status, etc.)
     - Emergency contact
     - Secondary ID
     - For business accounts: GIS fields, authorized signatory
3. Submit registration
4. Check Supabase:
```sql
-- Verify data was saved
SELECT * FROM users WHERE email = 'test-complete-data@example.com';
SELECT * FROM borrower_profiles WHERE firebase_uid = (SELECT firebase_uid FROM users WHERE email = 'test-complete-data@example.com');
-- OR
SELECT * FROM investor_profiles WHERE firebase_uid = (SELECT firebase_uid FROM users WHERE email = 'test-complete-data@example.com');
```

**Expected Result:** 
- All fields populated in database
- No NULL values for required fields
- Emergency contact info saved
- GIS fields saved (if business account)
- Secondary ID saved
- Group type saved

---

### STEP 6: Test Settings Update

1. Log in with test user
2. Go to Settings page
3. Update various fields:
   - Change emergency contact info
   - Update GIS fields (if business)
   - Change secondary ID
   - Update investment preferences (if investor)
4. Save
5. Refresh page - verify all changes persisted

---

### STEP 7: Test Make.com Sync

1. Register new user on InitiatePH → should sync to WordPress ✅
2. Create user in WordPress → should sync to InitiatePH ✅
3. Verify Make.com History shows successful execution
4. Verify loop protection working (no infinite syncs)

---

## 🔍 Field Mapping Reference

### KYCForm → Database Mapping

| Frontend Field (KYCForm.tsx) | Database Column | Table |
|------------------------------|----------------|-------|
| groupType | group_type | borrower_profiles, investor_profiles |
| contactEmail | contact_email | borrower_profiles, investor_profiles |
| secondaryIdType | secondary_id_type | borrower_profiles, investor_profiles |
| secondaryIdNumber | secondary_id_number | borrower_profiles, investor_profiles |
| emergencyContactName | emergency_contact_name | borrower_profiles, investor_profiles |
| emergencyContactRelationship | emergency_contact_relationship | borrower_profiles, investor_profiles |
| emergencyContactPhone | emergency_contact_phone | borrower_profiles, investor_profiles |
| emergencyContactEmail | emergency_contact_email | borrower_profiles, investor_profiles |
| businessRegistrationNumber | business_registration_number | borrower_profiles, investor_profiles |
| principalOfficeMunicipality | principal_office_municipality | borrower_profiles, investor_profiles |
| principalOfficeProvince | principal_office_province | borrower_profiles, investor_profiles |
| gisTotalAssets | gis_total_assets | borrower_profiles, investor_profiles |
| gisTotalLiabilities | gis_total_liabilities | borrower_profiles, investor_profiles |
| gisPaidUpCapital | gis_paid_up_capital | borrower_profiles, investor_profiles |
| gisNumberOfStockholders | gis_number_of_stockholders | borrower_profiles, investor_profiles |
| gisNumberOfEmployees | gis_number_of_employees | borrower_profiles, investor_profiles |
| pepDetails | pep_details | borrower_profiles, investor_profiles |
| authorizedSignatoryIdType | authorized_signatory_id_type | borrower_profiles, investor_profiles |

### Settings → Database Mapping

| Frontend Field (Settings.tsx) | Database Column | Table |
|-------------------------------|----------------|-------|
| username | username | users |
| address.street | street | users |
| address.barangay | barangay | users |
| personalInfo.motherMaidenName | mother_maiden_name | borrower_profiles, investor_profiles |
| employmentInfo.monthlyIncome | monthly_income | borrower_profiles, investor_profiles |
| businessInfo.businessAddress | business_address | borrower_profiles, investor_profiles |
| investmentInfo.preference | investment_preference | investor_profiles |
| investmentInfo.portfolioValue | portfolio_value | investor_profiles |
| profileType | profile_type | users |

---

## ⚠️ Important Notes

### Backend Code Already References These Fields:
The backend at line 5903-5907 already tries to save:
- emergency_contact_name
- emergency_contact_relationship
- emergency_contact_phone
- emergency_contact_email
- emergency_contact_address

**BUT these columns don't exist yet!** That's why we need this migration.

### Naming Consistency:
Some fields have slight naming differences:
- Frontend: `businessRegistrationNumber` → Backend: `business_registration_number`
- Frontend: `gisPaidUpCapital` → Backend: `gis_paid_up_capital`

The migration uses snake_case (database convention) which matches the backend.

### Optional vs Required:
- Some fields are optional in forms but should still be stored when provided
- The migration uses `IF NOT EXISTS` so it's safe to run multiple times
- All new columns are nullable by default (no data loss risk)

---

## 🎯 Success Criteria

After completing all steps:

✅ No "column does not exist" errors in Render logs
✅ All form fields save to database successfully
✅ Registration completes without 500 errors
✅ Settings page saves all changes
✅ Make.com sync works bidirectionally
✅ Loop protection prevents infinite syncs
✅ All KYC data persists across sessions
✅ Business accounts can save GIS fields
✅ Emergency contact info always saved

---

## 📊 Before vs After Comparison

### BEFORE (Current State):
- users table: ~95 columns (missing 5)
- borrower_profiles table: ~40 columns (missing 26)
- investor_profiles table: ~65 columns (missing 28)
- **Total missing:** 59 columns
- **Data loss:** Emergency contacts, GIS info, secondary IDs, group types not saved

### AFTER (With Migrations):
- users table: 100 columns ✅
- borrower_profiles table: 66 columns ✅
- investor_profiles table: 93 columns ✅
- **Total missing:** 0 columns ✅
- **Data loss:** NONE - 100% data capture ✅

---

## 🚀 Deployment Checklist

- [ ] Execute migration 007_add_phone_number_to_users.sql in Supabase
- [ ] Execute migration 013_add_comprehensive_kyc_fields.sql in Supabase
- [ ] Verify all columns added with verification query
- [ ] Update backend INSERT queries to include new fields
- [ ] Commit and push backend changes
- [ ] Wait for Render auto-deploy (~5-10 min)
- [ ] Check Render logs for "Make.com integration: Enabled ✅"
- [ ] Test registration with complete KYC data
- [ ] Test settings update
- [ ] Test Make.com bidirectional sync
- [ ] Verify no errors in production logs
- [ ] Deploy WordPress sync snippet (if not already done)
- [ ] Final end-to-end validation

---

## 📞 Next Actions

**IMMEDIATE (Do This First):**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run migration 007_add_phone_number_to_users.sql
4. Run migration 013_add_comprehensive_kyc_fields.sql
5. Verify with the provided verification queries

**THEN:**
1. Review and update backend INSERT queries
2. Test locally if possible
3. Deploy to Render
4. Test registration flow
5. Celebrate complete data capture! 🎉

---

## 💡 Tips

- Run migrations during low-traffic time if possible
- Keep a backup or snapshot before migrations (Supabase has automatic backups)
- The migrations use `IF NOT EXISTS` so they're safe to re-run
- If a column already exists, it will be skipped (no error)
- Check Render logs after deployment for any SQL errors
- Test with a fresh test account to ensure clean data flow

---

## 📝 Files Created in This Session

1. **MISSING_DATABASE_FIELDS_AUDIT.md** - Full analysis with 58 missing fields documented
2. **migrations/007_add_phone_number_to_users.sql** - Already existed, needs execution
3. **migrations/013_add_comprehensive_kyc_fields.sql** - NEW - Comprehensive migration for all missing fields
4. **DATABASE_MIGRATION_ACTION_PLAN.md** - THIS FILE - Step-by-step guide

All files ready for execution. No code changes needed before running migrations.
