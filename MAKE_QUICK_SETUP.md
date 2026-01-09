# Quick Setup Script for Make.com Integration

## Step 1: Create Make.com Account (5 minutes)
1. Go to https://www.make.com/en/register
2. Sign up (free tier is fine)
3. Verify email

## Step 2: Create Scenario 1 - PH → Global (15 minutes)

### In Make.com:
1. Click **"Create a new scenario"**
2. Name it: **"InitiatePH to InitiateGlobal User Sync"**

### Add Modules:
1. **Webhooks → Custom Webhook**
   - Create new webhook
   - Copy the webhook URL (looks like: `https://hook.us1.make.com/abc123...`)
   - Save this URL - you'll need it for InitiatePH backend

2. **Router** 
   - Click the + after webhook
   - Add Router

3. **Filter on Route 1: "Only if from PH"**
   - Condition: `source_system` = "PH"
   
4. **HTTP → Make a Request** (Check if user exists)
   - URL: `https://initiateglobal.org/wp-json/wp/v2/users`
   - Method: GET
   - Query String:
     - Key: `search`
     - Value: `{{1.user.email}}` (from webhook)
   - Headers:
     - Authorization: `Basic [YOUR_WP_APP_PASSWORD_BASE64]`

5. **Router** (Based on user exists)
   - Route A: If response is empty array → CREATE
   - Route B: If response has data → UPDATE

6. **HTTP → Make a Request** (Create User - Route A)
   - URL: `https://initiateglobal.org/wp-json/wp/v2/users`
   - Method: POST
   - Headers:
     - Authorization: `Basic [YOUR_WP_APP_PASSWORD_BASE64]`
     - Content-Type: `application/json`
   - Body type: Raw
   - Request content:
   ```json
   {
     "username": "{{1.user.email}}",
     "email": "{{1.user.email}}",
     "first_name": "{{1.user.first_name}}",
     "last_name": "{{1.user.last_name}}",
     "password": "{{random(16)}}",
     "roles": ["subscriber"],
     "meta": {
       "phone_number": "{{1.user.phone_number}}",
       "firebase_uid": "{{1.user.firebase_uid}}",
       "ph_user_id": "{{1.user.ph_user_id}}",
       "synced_from": "PH"
     }
   }
   ```

7. **Save** scenario
8. **Turn ON** scenario (toggle in top right)

## Step 3: Create Scenario 2 - Global → PH (15 minutes)

### In Make.com:
1. Click **"Create a new scenario"**
2. Name it: **"InitiateGlobal to InitiatePH User Sync"**

### Add Modules:
1. **Webhooks → Custom Webhook**
   - Create new webhook
   - Copy the webhook URL
   - Save this URL - you'll need it for WordPress snippet

2. **Router**
   - Add after webhook

3. **Filter: "Only if from GLOBAL"**
   - Condition: `source_system` = "GLOBAL"

4. **HTTP → Make a Request** (Sync to InitiatePH)
   - URL: `https://initiateph.com/api/sync-user`
   - Method: POST
   - Headers:
     - X-API-Key: `YOUR_SECRET_KEY` (generate a random string)
     - Content-Type: `application/json`
   - Body type: Raw
   - Request content:
   ```json
   {
     "email": "{{1.user.email}}",
     "first_name": "{{1.user.first_name}}",
     "last_name": "{{1.user.last_name}}",
     "phone_number": "{{1.user.phone_number}}",
     "global_user_id": "{{1.user.global_user_id}}",
     "source_system": "{{1.source_system}}",
     "source_event_id": "{{1.source_event_id}}"
   }
   ```

5. **Save** scenario
6. **Turn ON** scenario

## Step 4: Update InitiatePH Backend (20 minutes)

### 1. Add to .env file:
```bash
MAKE_API_KEY=your-generated-secret-key-here
MAKE_WEBHOOK_URL=https://hook.us1.make.com/[YOUR_WEBHOOK_FROM_SCENARIO_1]
```

### 2. Add make-integration.js to backend folder
- File already created: `backend/make-integration.js`

### 3. Update backend/server.js:

Add at the top (after imports):
```javascript
import { notifyMakeOfNewUser, verifyMakeRequest } from './make-integration.js';

// Add these routes BEFORE any other routes
app.post('/api/check-user', verifyMakeRequest, async (req, res) => { /* See make-integration.js */ });
app.post('/api/sync-user', verifyMakeRequest, async (req, res) => { /* See make-integration.js */ });
```

### 4. Find the registration endpoint (profileRouter.post) and add:

After successful user creation (around line where you insert into users table):
```javascript
// After: const result = await db.query('INSERT INTO users...')
const userId = result.rows[0].id;

// Add this:
await notifyMakeOfNewUser({
  id: userId,
  email: userData.email,
  first_name: userData.firstName,
  last_name: userData.lastName,
  phone_number: userData.phoneNumber,
  role: userData.role,
  firebase_uid: firebaseUser.uid
});
```

### 5. Deploy to Render
```bash
git add .
git commit -m "Add Make.com integration"
git push origin main
```

## Step 5: Update WordPress (10 minutes)

### 1. Add the snippet:
- Go to WordPress Admin → Snippets → Add New
- Title: "Sync Users to Make.com"
- Code: Paste content from `wordpress-sync-to-make.php`

### 2. Update the webhook URL in the snippet:
Replace line 35:
```php
$make_webhook_url = 'https://hook.us1.make.com/[YOUR_WEBHOOK_FROM_SCENARIO_2]';
```

### 3. Activate the snippet

### 4. Optional: Add to wp-config.php for security
```php
define('MAKE_WEBHOOK_URL_GLOBAL_TO_PH', 'https://hook.us1.make.com/...');
```

## Step 6: Test Everything (30 minutes)

### Test 1: PH → Global
1. Register a NEW user on InitiatePH.com
   - Email: test1@example.com
   - Password: Test123!
2. Check Make.com scenario history (should show execution)
3. Check InitiateGlobal WordPress Users (should see new user)
4. Verify user meta has `ph_user_id` and `synced_from=PH`

### Test 2: Global → PH
1. Create a NEW user in WordPress (Users → Add New)
   - Email: test2@example.com
   - Username: test2@example.com
2. Check Make.com scenario history
3. Check InitiatePH Supabase users table (should see new user)
4. Verify user has `global_user_id`

### Test 3: Loop Protection
1. Register test3@example.com on PH
2. Wait for sync to complete on Global
3. Check WordPress error log - should see "Loop protection" message
4. Verify no duplicate attempts

### Test 4: Update Existing User
1. Update test1@example.com phone number in PH
2. Trigger sync manually or wait for webhook
3. Verify phone updated in Global

## Step 7: WordPress Application Password (for Make → WP API)

1. Go to WordPress Admin → Users → Your Profile
2. Scroll to "Application Passwords"
3. Name: "Make.com Integration"
4. Click "Add New Application Password"
5. Copy the generated password (format: `xxxx xxxx xxxx xxxx`)
6. Encode for Basic Auth:
   ```bash
   echo -n "username:xxxx xxxx xxxx xxxx" | base64
   ```
7. Use this in Make.com HTTP requests as:
   ```
   Authorization: Basic [base64_encoded_string]
   ```

## Troubleshooting

### Webhook not triggering:
- Check Make scenario is turned ON
- Check webhook URL is correct in code
- Check error logs (WordPress error.log, InitiatePH console)

### Authentication errors:
- Verify X-API-Key matches in both places
- Verify WordPress Application Password is correct
- Check base64 encoding

### Loop detected:
- Good! Check logs show "Loop protection"
- Verify `synced_from` meta is being set

### User not syncing:
- Test webhook manually with Postman
- Check Make.com execution history for errors
- Verify API endpoints are accessible (no firewall blocking)

## Monitoring

### Make.com Dashboard:
- Go to Scenarios → [Your Scenario]
- Click "History" tab
- See all executions, errors, data processed

### Set up email alerts:
- In Make scenario settings
- Add "Error Handler" module
- Send email notification on error

## Costs

- Make.com Free Tier: 1,000 operations/month
- If you exceed: $9/month for 10,000 operations
- Each user sync = 3-5 operations (webhook + API calls + router)

## Timeline Summary
- Make.com setup: 30 minutes
- Backend code: Already done ✅
- WordPress snippet: Already done ✅
- Integration and testing: 1 hour
- **Total: ~2 hours to fully working**

## What You Get
✅ User registers on PH → Automatically created on Global
✅ User registers on Global → Automatically created on PH  
✅ Loop protection (won't sync back and forth infinitely)
✅ Updates work (not just registration)
✅ Error handling and logging
✅ No passwords synced (security)
✅ Can extend to sync profile updates, roles, etc.
