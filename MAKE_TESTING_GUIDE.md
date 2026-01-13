# Make.com Integration - Testing Guide

**Date:** January 11, 2026  
**Status:** Ready to test both scenarios

---

## ✅ Pre-Flight Checklist

### Backend (InitiatePH)
- ✅ Make.com endpoints added to `server.js`
  - `/api/check-user` 
  - `/api/sync-user`
  - `notifyMakeOfNewUser()` function
- ✅ Environment variables configured in `.env`:
  - `MAKE_WEBHOOK_URL`: https://hook.us2.make.com/h7eu3gskcy9nddouq7k6kylqdxd8ury9
  - `MAKE_API_KEY`: 19dec8BE4b3605F2fAaD7C3496b7E10a... ✅

### Make.com Scenarios
- ⏳ **Scenario 1:** InitiatePH → InitiateGlobal (verify it's ON)
- ⏳ **Scenario 2:** InitiateGlobal → InitiatePH (verify it's ON)

### WordPress (InitiateGlobal)
- ⏳ WordPress snippet installed? (check Code Snippets)
- ⏳ WordPress snippet activated?
- ⏳ Webhook URL configured in snippet: https://hook.us2.make.com/x449d7ngzxgye64638dc9yqle76z49pk

### Deployment
- ⏳ Backend deployed to Render with environment variables?

---

## 🧪 Test Plan

### Test 1: PH → Global (New User Registration)

**Objective:** Register a new user on InitiatePH and verify it syncs to InitiateGlobal.

**Steps:**

1. **Open Make.com Dashboard**
   - Go to: https://us2.make.com/
   - Navigate to **Scenarios**
   - Find: "InitiatePH to InitiateGlobal" (or similar name)
   - **Turn ON** the scenario (if not already)
   - Click **"Run once"** or ensure auto-run is enabled

2. **Register New User on InitiatePH**
   - Go to: https://initiateph.com/register (or wherever registration is)
   - Use a **test email you haven't used before**:
     ```
     Email: maketest1@test.com
     Password: Test123!@#
     First Name: Make
     Last Name: Test1
     Phone: +1234567890
     Role: borrower
     ```
   - Complete registration

3. **Check Backend Logs (Render)**
   - Go to: https://dashboard.render.com
   - Open your InitiatePH service
   - Click **"Logs"**
   - Look for:
     ```
     🔔 Notifying Make.com of new user: maketest1@test.com
     ✅ Make webhook called successfully
     ```
   - If you see errors, note them down

4. **Check Make.com Execution**
   - Go back to Make.com
   - Click on the scenario
   - Click **"History"** tab
   - You should see a new execution (within last minute)
   - Click on it to see details:
     - ✅ Webhook received data
     - ✅ Router filtered correctly (source_system = "PH")
     - ✅ HTTP checked WordPress for user
     - ✅ Router detected "user doesn't exist"
     - ✅ HTTP created WordPress user
   - If any step failed, click on it to see the error

5. **Verify in WordPress**
   - Go to: https://initiateglobal.org/wp-admin
   - Navigate to **Users → All Users**
   - Search for: `maketest1@test.com`
   - **Expected result:**
     - User exists ✅
     - Email: maketest1@test.com
     - First Name: Make
     - Last Name: Test1
   - Click **"Edit"** on the user
   - Scroll to **"User Meta"** or check custom fields:
     - `synced_from`: PH ✅
     - `ph_user_id`: (some number) ✅
     - `firebase_uid`: (some ID) ✅
     - `phone_number`: +1234567890 ✅

6. **Check WordPress Error Logs** (Loop Protection Test)
   - Go to: https://initiateglobal.org/wp-admin
   - Navigate to **Tools → Site Health → Info → File Permissions**
   - Or access via FTP/cPanel: `/wp-content/debug.log`
   - Look for:
     ```
     InitiateGlobal Sync: Loop protection - User came from PH, not syncing back
     ```
   - This confirms the loop protection is working! ✅

**✅ Test 1 Passes If:**
- User created in WordPress
- Has correct data (name, email, phone)
- Has meta fields: `synced_from=PH`, `ph_user_id`, `firebase_uid`
- Loop protection message appears in logs

---

### Test 2: Global → PH (WordPress User Creation)

**Objective:** Create a user in WordPress and verify it syncs to InitiatePH.

**Steps:**

1. **Open Make.com Dashboard**
   - Find: "InitiateGlobal to InitiatePH" scenario
   - **Turn ON** the scenario
   - Click **"Run once"** or ensure auto-run is enabled

2. **Create User in WordPress**
   - Go to: https://initiateglobal.org/wp-admin
   - Navigate to **Users → Add New**
   - Fill in:
     ```
     Username: maketest2
     Email: maketest2@test.com
     First Name: Make
     Last Name: Test2
     Website: (leave blank)
     Password: (generate one, doesn't matter)
     Role: Subscriber
     ```
   - Click **"Add New User"**

3. **Check WordPress Error Logs** (Webhook Call)
   - Check: `/wp-content/debug.log`
   - Look for:
     ```
     InitiateGlobal Sync: Sending user to Make.com - Email: maketest2@test.com
     ```

4. **Check Make.com Execution**
   - Go to Make.com scenario: "InitiateGlobal to InitiatePH"
   - Click **"History"** tab
   - Should see new execution
   - Click to see details:
     - ✅ Webhook received from WordPress
     - ✅ Router filtered (source_system = "GLOBAL")
     - ✅ HTTP called `/api/sync-user` on InitiatePH
     - ✅ User created in InitiatePH

5. **Verify in Supabase**
   - Go to: https://supabase.com/dashboard
   - Open InitiatePH project
   - Navigate to **Table Editor → users**
   - Search for: `maketest2@test.com`
   - **Expected result:**
     - User exists ✅
     - Email: maketest2@test.com
     - First Name: Make
     - Last Name: Test2
     - Full Name: Make Test2
     - Firebase UID: (some ID)

6. **Verify in Firebase**
   - Go to: https://console.firebase.google.com
   - Select InitiatePH project
   - Navigate to **Authentication → Users**
   - Search for: `maketest2@test.com`
   - User should exist with temp password

7. **Check InitiatePH Backend Logs** (Loop Protection)
   - Go to Render dashboard
   - Check logs for:
     ```
     ⚠️  Loop protection: Ignoring PH-originated sync
     ```
   - This means if InitiatePH tried to sync back, it was blocked ✅

**✅ Test 2 Passes If:**
- User created in Supabase
- User created in Firebase Auth
- Has correct data (name, email)
- Loop protection working (no infinite loop)

---

### Test 3: Update Existing User (Optional)

**Objective:** Update a user's phone number on one platform and verify it syncs.

**Steps:**

1. **Update Phone in InitiatePH**
   - Login to InitiatePH as maketest1@test.com
   - Go to profile settings
   - Update phone number to: `+9876543210`
   - Save

2. **Check if Make webhook is called**
   - (This depends on if you added update triggers)
   - Check Render logs for webhook call
   - Check Make.com execution history

3. **Verify in WordPress**
   - Check if phone number updated in WordPress user meta
   - Go to: Users → Edit maketest1@test.com
   - Check `phone_number` meta field

**Note:** This test only works if you've added update triggers. For now, sync only works on user **creation**.

---

## 🔍 Troubleshooting

### Issue: "Webhook not triggering"

**Symptoms:** Make.com shows no execution history

**Solutions:**
1. Check scenario is **ON** (toggle in top right)
2. Verify webhook URL in code matches Make.com webhook URL
3. Check backend logs for webhook call attempts
4. Test webhook manually with curl:
   ```bash
   curl -X POST "https://hook.us2.make.com/h7eu3gskcy9nddouq7k6kylqdxd8ury9" \
   -H "Content-Type: application/json" \
   -d '{"source_system":"PH","user":{"email":"test@example.com","first_name":"Test","last_name":"User"}}'
   ```

### Issue: "401 Unauthorized" in Make.com

**Symptoms:** Make.com HTTP request fails with 401

**Solutions:**
1. Check WordPress Application Password is correct
2. Verify Basic Auth keychain in Make.com
3. Test WordPress API manually:
   ```bash
   curl -u "username:app-password" \
   "https://initiateglobal.org/wp-json/wp/v2/users?search=test@example.com"
   ```

### Issue: "User not created in WordPress"

**Symptoms:** Make.com execution succeeds but no user in WordPress

**Solutions:**
1. Check Make.com execution details - click on failed HTTP module
2. Look for WordPress error response (email exists, invalid role, etc.)
3. Check WordPress error logs for PHP errors
4. Verify user doesn't already exist with that email

### Issue: "User not created in Supabase"

**Symptoms:** Make.com execution succeeds but no user in InitiatePH

**Solutions:**
1. Check Render logs for `/api/sync-user` errors
2. Verify `MAKE_API_KEY` matches in both places
3. Check Supabase connection in backend
4. Test endpoint manually:
   ```bash
   curl -X POST "https://initiateph.com/api/sync-user" \
   -H "X-API-Key: YOUR_MAKE_API_KEY" \
   -H "Content-Type: application/json" \
   -d '{"email":"test@example.com","first_name":"Test","last_name":"User","source_system":"GLOBAL","source_event_id":"test-123"}'
   ```

### Issue: "Infinite loop detected"

**Symptoms:** User created multiple times, duplicate records

**Solutions:**
1. Check loop protection is working:
   - WordPress: Check for `synced_from` meta field
   - InitiatePH: Check logs for "Loop protection" message
2. Verify Router filters in Make.com:
   - Scenario 1: Only runs if `source_system = "PH"`
   - Scenario 2: Only runs if `source_system = "GLOBAL"`
3. Check WordPress snippet checks `synced_from` before calling webhook
4. Check backend `/api/sync-user` checks `source_system` parameter

---

## 📊 Expected Results Summary

| Test | Action | Expected Result | Verification |
|------|--------|----------------|--------------|
| **Test 1** | Register on PH | User created in WordPress | Check WP Users list |
| **Test 1** | (same) | User has meta: `synced_from=PH` | Check user meta fields |
| **Test 1** | (same) | Loop protection triggered | Check WP error log |
| **Test 2** | Create in WordPress | User created in Supabase | Check Supabase users table |
| **Test 2** | (same) | User created in Firebase | Check Firebase Auth |
| **Test 2** | (same) | Loop protection triggered | Check Render logs |

---

## 📝 Testing Checklist

### Before Testing
- [ ] Backend deployed to Render with latest code
- [ ] Environment variables set in Render:
  - [ ] `MAKE_API_KEY`
  - [ ] `MAKE_WEBHOOK_URL`
- [ ] WordPress snippet installed and activated
- [ ] WordPress snippet has correct webhook URL (Scenario 2)
- [ ] Both Make.com scenarios turned ON
- [ ] WordPress Application Password created and added to Make.com

### Test 1: PH → Global
- [ ] Register new user on InitiatePH
- [ ] Check Render logs for webhook call
- [ ] Check Make.com execution history
- [ ] Verify user exists in WordPress
- [ ] Verify user has correct meta fields
- [ ] Verify loop protection in WordPress logs

### Test 2: Global → PH
- [ ] Create new user in WordPress
- [ ] Check WordPress logs for webhook call
- [ ] Check Make.com execution history
- [ ] Verify user exists in Supabase
- [ ] Verify user exists in Firebase
- [ ] Verify loop protection in Render logs

### After Testing
- [ ] Document any issues encountered
- [ ] Update environment variables if needed
- [ ] Monitor Make.com execution history for next 24 hours
- [ ] Test with real user if all tests pass

---

## 🚀 Next Steps After Successful Testing

1. **Monitor for 1 week:**
   - Check Make.com execution history daily
   - Look for failed executions
   - Verify all new users are syncing

2. **Set up alerts:**
   - Make.com: Configure email alerts for failed scenarios
   - Render: Set up log monitoring
   - WordPress: Monitor error log size

3. **Extend functionality:**
   - Add profile update sync (not just creation)
   - Sync password changes
   - Sync role changes
   - Sync profile pictures

4. **Optimize:**
   - Add caching to reduce API calls
   - Implement retry logic for failed syncs
   - Add deduplication via event IDs

5. **Document:**
   - Create user-facing documentation
   - Add architecture diagrams
   - Document troubleshooting steps

---

## 🎯 Success Criteria

✅ **System is working if:**
- Test 1 passes (PH → Global sync works)
- Test 2 passes (Global → PH sync works)
- Loop protection prevents infinite syncing
- No duplicate users created
- All user data syncs correctly (name, email, phone)
- Make.com execution history shows all successes
- No errors in backend logs

❌ **System needs fixing if:**
- Users not syncing to other platform
- Duplicate users created
- Make.com shows failed executions
- 401/403 authentication errors
- Missing user data after sync
- Loop protection not working

---

**Ready to start testing?** Follow Test 1 first, then Test 2!
