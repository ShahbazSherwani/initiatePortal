# Admin Panel Testing Guide - Complete Data Visibility

## What Was Changed

### ✅ Completed Changes (All Deployed):

1. **Database Schema** - 58 new fields added to 3 tables
2. **Backend Save Logic** - All form data now saves to database
3. **Backend Display Logic** - Admin endpoint fetches ALL fields
4. **Frontend Interface** - TypeScript types for all new fields
5. **Frontend UI** - New sections to display all data

## Quick Test Steps

### Test 1: Check Backend Endpoint (5 minutes)

1. **Get Your Admin Auth Token:**
   - Log in to https://initiate-portal.vercel.app/owner/login
   - Open Browser DevTools (F12)
   - Go to Network tab
   - Refresh the page or click any menu item
   - Find any API request (e.g., GET users)
   - Click on it → Headers tab
   - Copy the `Authorization` header value (starts with "Bearer ")

2. **Test the Updated Endpoint:**
   ```bash
   # Replace [TOKEN] with your auth token
   # Replace [USER_ID] with any user ID from your system
   
   curl -H "Authorization: Bearer [TOKEN]" \
        https://initiate-portal.onrender.com/api/owner/users/[USER_ID]
   ```

3. **Verify Response Includes:**
   - `emergencyContact` object with: name, relationship, phone, email, address
   - `gisFields` object with: totalAssets, totalLiabilities, paidUpCapital, numberOfStockholders, numberOfEmployees
   - `personalProfile.motherMaidenName`
   - `personalProfile.groupType`
   - `businessRegistration.authorizedSignatoryIdType` (for business accounts)
   - `principalOffice.municipality` and `principalOffice.province` (for business accounts)

### Test 2: Check Admin Panel UI (10 minutes)

1. **Log In:**
   - Go to: https://initiate-portal.vercel.app/owner/login
   - Enter owner/admin credentials

2. **Navigate to User Details:**
   - Click "Users" in sidebar (or Owner → Users)
   - Select any user from the list
   - Click to view user details

3. **Verify Individual Account Display:**
   - **Personal Information Section:**
     - ✅ Should see "Mother's Maiden Name" field
     - ✅ Should see "Group Type" field
   
   - **Emergency Contact Section (NEW):**
     - ✅ Should see entire section with heading "Emergency Contact"
     - ✅ Should display: Name, Relationship, Phone, Email, Address
   
   - **Employment Information:**
     - ✅ Should see "Monthly Income" field between Annual Income and Source of Income
   
   - **Identifications:**
     - ✅ Should see "Secondary ID Type" field
     - ✅ Should see "Secondary ID Number" field

4. **Verify Business Account Display:**
   - Select a business/entity account user
   
   - **Business Registration Section:**
     - ✅ Should see "ID Type" field for Authorized Signatory
   
   - **GIS Section (NEW):**
     - ✅ Should see entire section with heading "General Information Sheet (GIS)"
     - ✅ Should display 5 fields with currency formatting:
       - Total Assets (₱ XX,XXX)
       - Total Liabilities (₱ XX,XXX)
       - Paid-Up Capital (₱ XX,XXX)
       - Number of Stockholders
       - Number of Employees
   
   - **Principal Office Address:**
     - ✅ Should see "Municipality" field
     - ✅ Should see "Province" field (may be in same field as State)

### Test 3: End-to-End Data Flow (20 minutes)

1. **Register New Test User:**
   - Go to: https://initiate-portal.vercel.app/register
   - Fill in ALL fields including:
     - Emergency Contact Information:
       - Name: "John Doe"
       - Relationship: "Brother"
       - Phone: "+639123456789"
       - Email: "john.doe@example.com"
       - Address: "123 Main St, Manila"
     
     - For Business Accounts, also fill:
       - GIS Fields:
         - Total Assets: 5000000
         - Total Liabilities: 2000000
         - Paid-Up Capital: 3000000
         - Number of Stockholders: 5
         - Number of Employees: 10
       - Secondary ID Type: "Driver's License"
       - Secondary ID Number: "N01-12-123456"
       - Authorized Signatory ID Type: "Passport"
   
   - Submit registration

2. **Verify in Supabase:**
   - Go to Supabase dashboard
   - Open SQL Editor
   - Run query:
     ```sql
     SELECT 
       emergency_contact_name,
       emergency_contact_relationship,
       emergency_contact_phone,
       secondary_id_type,
       secondary_id_number,
       gis_total_assets,
       gis_total_liabilities,
       monthly_income,
       mother_maiden_name
     FROM borrower_profiles 
     WHERE user_id = '[NEW_USER_ID]';
     ```
   - ✅ Verify all fields populated

3. **Verify in Admin Panel:**
   - Log in as admin
   - Find the newly registered user
   - ✅ Verify Emergency Contact section shows all data
   - ✅ Verify GIS section shows all data (for business accounts)
   - ✅ Verify all new fields display correctly

4. **Test Updates:**
   - As the test user, log in
   - Go to Settings/Profile
   - Update Emergency Contact information
   - Save changes
   - Log back in as admin
   - ✅ Verify changes appear in admin panel

## What to Look For

### ✅ Success Indicators:
- All new sections visible in admin panel
- Currency formatting works (₱ symbol, commas)
- "Not provided" shows for empty fields (not blank or undefined)
- Emergency Contact section ONLY shows if data exists
- GIS section ONLY shows if at least one GIS field has data
- No console errors in browser DevTools
- No layout breaking or UI glitches

### ❌ Issues to Report:
- Missing sections (Emergency Contact, GIS)
- Fields showing "undefined" or blank instead of "Not provided"
- Currency not formatted (shows raw numbers)
- Console errors in DevTools
- Layout broken or overlapping text
- Sections showing when they shouldn't (for accounts without that data)

## Common Issues & Solutions

### Issue: Emergency Contact section not showing
**Solution:** Make sure the user has emergency contact data. Check the API response.

### Issue: GIS section not showing for business account
**Solution:** Verify the account is marked as non-individual and has GIS data in database.

### Issue: "Not provided" showing instead of actual data
**Solution:** Check the backend endpoint response - data might not be mapped correctly.

### Issue: Currency not formatted
**Solution:** Verify formatCurrency function is being called. Check browser console for errors.

## Quick Verification Checklist

### Backend ✅:
- [ ] Render deployment successful
- [ ] GET /api/owner/users/:userId returns emergencyContact object
- [ ] GET /api/owner/users/:userId returns gisFields object
- [ ] Response includes all 58 new fields

### Frontend ✅:
- [ ] Vercel deployment successful
- [ ] No TypeScript compilation errors
- [ ] Personal Info shows mother's maiden name & group type
- [ ] Emergency Contact section visible (when data exists)
- [ ] GIS section visible for business accounts (when data exists)
- [ ] Employment shows monthly income
- [ ] Business Registration shows signatory ID type
- [ ] Principal Office shows municipality & province

### Data Flow ✅:
- [ ] New registration saves all fields to database
- [ ] Admin panel displays all saved data
- [ ] Updates from Settings page persist
- [ ] Changes appear in admin panel after refresh

## Test User Accounts

### For Testing Individual Accounts:
- Test with existing users who have filled emergency contact
- Or create new individual account with all fields

### For Testing Business Accounts:
- Test with existing business/entity accounts
- Look for users with account_type = 'non-individual'
- Or register new corporate/partnership/sole proprietorship account

## Expected Results

### Individual Accounts Should Show:
- Personal Information (12 fields including mother's maiden name, group type)
- Emergency Contact (5 fields)
- Employment Information (7 fields including monthly income)
- Identifications (5 fields including secondary ID)

### Business Accounts Should Show:
- Entity Information (8 fields)
- Business Registration (11 fields including signatory ID type)
- GIS Fields (5 fields with currency formatting)
- Principal Office Address (8 fields including municipality, province)
- Emergency Contact (5 fields)
- Identifications (5 fields including secondary ID)

## Support

If you encounter any issues:
1. Check browser console for errors (F12 → Console tab)
2. Check Network tab to see API responses
3. Verify Render deployment succeeded
4. Verify Vercel deployment succeeded
5. Check Supabase to confirm data exists in database

## Deployment URLs

- **Frontend:** https://initiate-portal.vercel.app
- **Backend:** https://initiate-portal.onrender.com
- **Admin Login:** https://initiate-portal.vercel.app/owner/login
- **Render Dashboard:** https://dashboard.render.com/web/srv-cvqt7gbqf0us73atfvfg

## Summary

All code changes are complete and deployed:
- ✅ Backend endpoint updated (Commit 68420de)
- ✅ Frontend UI updated (Commit b3cd61b)
- ✅ Documentation created (Commit 2446ebb)
- ✅ All deployments successful

Next step: **Test in production** using the steps above!
