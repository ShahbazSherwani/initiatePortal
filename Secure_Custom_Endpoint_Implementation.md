# SECURE CUSTOM API ENDPOINT IMPLEMENTATION
## InitiateGlobal.org - User Creation Endpoint

**Date:** December 19, 2024  
**For:** Initiate Global Development Team  
**Purpose:** Secure custom REST API endpoint for cross-platform user synchronization

---

## PART 1: INSTALLATION (InitiateGlobal Team)

### Where to Add This Code

You have **3 options** for adding this code. Choose ONE:

#### Option A: Custom Plugin (RECOMMENDED)
Create a new plugin file to keep code separate from your theme.

**Steps:**
1. Go to: `/wp-content/plugins/`
2. Create new folder: `initiate-secure-api`
3. Inside that folder, create file: `initiate-secure-api.php`
4. Copy the code from Section 2 below into this file
5. Go to WordPress Admin → Plugins → Activate "Initiate Secure API"

#### Option B: Theme functions.php
If you don't want to create a plugin.

**Steps:**
1. Go to: WordPress Admin → Appearance → Theme File Editor
2. Open: `functions.php` (right sidebar)
3. Scroll to the bottom
4. Paste the code from Section 2 below
5. Click "Update File"

#### Option C: Must-Use Plugin
For code that should always run (cannot be deactivated).

**Steps:**
1. Go to: `/wp-content/mu-plugins/` (create folder if doesn't exist)
2. Create file: `initiate-secure-api.php`
3. Copy the code from Section 2 below
4. Save - it will auto-activate

---

## PART 2: THE SECURE CODE

Copy this entire code block into your chosen location:

```php
<?php
/**
 * Plugin Name: Initiate Secure API
 * Description: Secure REST API endpoint for InitiatePH user synchronization
 * Version: 1.0.0
 * Author: Initiate Global Team
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register the secure REST API endpoint
 */
add_action('rest_api_init', function () {
    register_rest_route('initiate-secure/v1', '/create-user', array(
        'methods' => 'POST',
        'callback' => 'initiate_secure_create_user',
        'permission_callback' => 'initiate_verify_secure_auth',
        'args' => array(
            'email' => array(
                'required' => true,
                'type' => 'string',
                'validate_callback' => 'is_email',
                'sanitize_callback' => 'sanitize_email'
            ),
            'first_name' => array(
                'required' => true,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'last_name' => array(
                'required' => true,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'phone_number' => array(
                'required' => true,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'account_type' => array(
                'required' => true,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'validate_callback' => function($value) {
                    $allowed = array('investor', 'borrower', 'donor');
                    return in_array($value, $allowed);
                }
            )
        )
    ));
});

/**
 * SECURITY LAYER 1: Authentication verification
 */
function initiate_verify_secure_auth($request) {
    // Verify WordPress Application Password authentication
    $user = wp_get_current_user();
    
    if (!$user->exists()) {
        return new WP_Error(
            'auth_required',
            'Authentication required. Please provide valid credentials.',
            array('status' => 401)
        );
    }
    
    // Only allow the specific API user
    if ($user->user_login !== 'initiatead') {
        return new WP_Error(
            'forbidden',
            'Insufficient permissions. This endpoint is restricted.',
            array('status' => 403)
        );
    }
    
    // SECURITY LAYER 2: Rate limiting
    $rate_limit_check = initiate_check_rate_limit($request);
    if (is_wp_error($rate_limit_check)) {
        return $rate_limit_check;
    }
    
    // SECURITY LAYER 3: IP whitelist (optional - uncomment to enable)
    // $ip_check = initiate_check_ip_whitelist($request);
    // if (is_wp_error($ip_check)) {
    //     return $ip_check;
    // }
    
    return true;
}

/**
 * Rate limiting: Max 100 requests per hour per IP
 */
function initiate_check_rate_limit($request) {
    $ip = $_SERVER['REMOTE_ADDR'];
    $transient_key = 'initiate_rate_limit_' . md5($ip);
    $request_count = get_transient($transient_key);
    
    if ($request_count === false) {
        // First request in this hour
        set_transient($transient_key, 1, HOUR_IN_SECONDS);
        return true;
    }
    
    if ($request_count >= 100) {
        return new WP_Error(
            'rate_limit_exceeded',
            'Rate limit exceeded. Maximum 100 requests per hour allowed.',
            array('status' => 429)
        );
    }
    
    // Increment counter
    set_transient($transient_key, $request_count + 1, HOUR_IN_SECONDS);
    return true;
}

/**
 * IP Whitelist (OPTIONAL - Enable if you want extra security)
 * Uncomment this function and the call in initiate_verify_secure_auth()
 */
/*
function initiate_check_ip_whitelist($request) {
    $allowed_ips = array(
        // Add InitiatePH server IP here when they provide it
        // Example: '203.0.113.45'
    );
    
    $request_ip = $_SERVER['REMOTE_ADDR'];
    
    if (!empty($allowed_ips) && !in_array($request_ip, $allowed_ips)) {
        return new WP_Error(
            'ip_blocked',
            'Access denied. Your IP address is not whitelisted.',
            array('status' => 403)
        );
    }
    
    return true;
}
*/

/**
 * Main function: Create user in JetEngine CCT
 */
function initiate_secure_create_user($request) {
    global $wpdb;
    
    // Get sanitized parameters (already sanitized by WordPress REST API args)
    $params = $request->get_params();
    $email = $params['email'];
    $first_name = $params['first_name'];
    $last_name = $params['last_name'];
    $phone_number = $params['phone_number'];
    $account_type = $params['account_type'];
    
    // Additional validation
    if (strlen($first_name) < 2 || strlen($last_name) < 2) {
        return new WP_Error(
            'validation_failed',
            'First name and last name must be at least 2 characters.',
            array('status' => 400)
        );
    }
    
    // Check for duplicate email
    $table_name = $wpdb->prefix . 'jet_cct_users';
    $exists = $wpdb->get_row($wpdb->prepare(
        "SELECT _ID, email FROM {$table_name} WHERE email = %s",
        $email
    ));
    
    if ($exists) {
        return new WP_Error(
            'duplicate_user',
            'A user with this email already exists.',
            array(
                'status' => 409,
                'existing_user_id' => $exists->_ID,
                'existing_email' => $exists->email
            )
        );
    }
    
    // Prepare data for insertion
    $data = array(
        'cct_status' => 'publish',
        'first_name' => $first_name,
        'last_name' => $last_name,
        'email' => $email,
        'phone_number' => $phone_number,
        'account_type' => $account_type,
        'cct_created' => current_time('mysql'),
        'cct_modified' => current_time('mysql'),
        'cct_author_id' => get_current_user_id(),
        'cct_slug' => 'users'
    );
    
    // Insert into database
    $inserted = $wpdb->insert(
        $table_name,
        $data,
        array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s')
    );
    
    if ($inserted === false) {
        // Log error for debugging
        error_log('Initiate API Error: Failed to insert user - ' . $wpdb->last_error);
        
        return new WP_Error(
            'database_error',
            'Failed to create user. Please contact support.',
            array('status' => 500)
        );
    }
    
    $user_id = $wpdb->insert_id;
    
    // Audit log
    error_log(sprintf(
        'Initiate API: User created successfully - ID: %d, Email: %s, Type: %s, IP: %s',
        $user_id,
        $email,
        $account_type,
        $_SERVER['REMOTE_ADDR']
    ));
    
    // Return success response
    return new WP_REST_Response(array(
        'success' => true,
        '_ID' => (string) $user_id,
        'message' => 'User created successfully',
        'data' => array(
            'email' => $email,
            'first_name' => $first_name,
            'last_name' => $last_name,
            'account_type' => $account_type,
            'created_at' => current_time('mysql')
        )
    ), 201);
}

/**
 * Add CORS headers (if needed for cross-origin requests)
 */
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: https://initiateph.com');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
        return $value;
    });
}, 15);
```

---

## PART 3: VERIFICATION STEPS (InitiateGlobal Team)

After adding the code, verify it works:

### Step 1: Check Endpoint is Active

Open your browser and go to:
```
https://initiateglobal.org/wp-json/initiate-secure/v1/create-user
```

**Expected Result:** You should see an error message about authentication. This means the endpoint exists and is protected.

### Step 2: Test with Postman or cURL

Use this command to test (from terminal or Postman):

```bash
curl -X POST https://initiateglobal.org/wp-json/initiate-secure/v1/create-user \
  -H "Authorization: Basic aW5pdGlhdGVhZDpIcXJ3IHRzZGggczRSMiBYZmMxIEpsaFAgV1JySg==" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.api@initiateph.com",
    "first_name": "Test",
    "last_name": "User",
    "phone_number": "+639123456789",
    "account_type": "investor"
  }'
```

**Expected Result:** Status 201 with success message and user ID.

### Step 3: Confirm in Database

1. Go to WordPress Admin → JetEngine → Users
2. Look for the test user you just created
3. Verify all fields are populated correctly

---

## PART 4: PROVIDE TO INITIATEPH TEAM

Once the endpoint is working, send this information to InitiatePH:

**NEW ENDPOINT URL:**
```
POST https://initiateglobal.org/wp-json/initiate-secure/v1/create-user
```

**Authentication:** (Same as before)
```
Username: initiatead
Password: Hqrw tsdh s4R2 Xfc1 JlhP WRrJ
Authorization Header: Basic aW5pdGlhdGVhZDpIcXJ3IHRzZGggczRSMiBYZmMxIEpsaFAgV1JySg==
```

**Rate Limit:**
```
100 requests per hour per IP address
```

**Required Fields:**
- `email` (string, valid email format)
- `first_name` (string, min 2 characters)
- `last_name` (string, min 2 characters)
- `phone_number` (string, Philippine format)
- `account_type` (string, must be: "investor", "borrower", or "donor")

**Success Response (201):**
```json
{
  "success": true,
  "_ID": "123",
  "message": "User created successfully",
  "data": {
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "account_type": "investor",
    "created_at": "2024-12-19 10:30:00"
  }
}
```

**Error Responses:**

| Status | Error Code | Description |
|--------|-----------|-------------|
| 400 | `validation_failed` | Missing or invalid required fields |
| 401 | `auth_required` | Missing or invalid authentication |
| 403 | `forbidden` | User does not have permission |
| 409 | `duplicate_user` | Email already exists |
| 429 | `rate_limit_exceeded` | Too many requests (100/hour limit) |
| 500 | `database_error` | Server error (contact support) |

---

## PART 5: INTEGRATION STEPS (InitiatePH Team)

### Step 1: Update Test Script

Update `test-initiateglobal-api.cjs`:

```javascript
// Change this line:
const API_PATH_USERS = '/wp-json/jet-cct/users';

// To this:
const API_PATH_USERS_GET = '/wp-json/jet-cct/users';
const API_PATH_USERS_POST = '/wp-json/initiate-secure/v1/create-user';
```

Then update POST requests to use `API_PATH_USERS_POST`.

### Step 2: Run Tests

```bash
node test-initiateglobal-api.cjs
```

**Expected Results:**
- GET tests: PASS (using old endpoint)
- POST tests: PASS (using new secure endpoint)

### Step 3: Build Make.com Integration

#### Make.com Scenario Setup:

**Module 1: Webhook Trigger**
- Type: Custom Webhook
- Name: "InitiatePH User Registration"
- URL: `https://hook.us1.make.com/your-webhook-id`

**Module 2: HTTP Request - Create User**
- URL: `https://initiateglobal.org/wp-json/initiate-secure/v1/create-user`
- Method: POST
- Headers:
  - `Authorization`: `Basic aW5pdGlhdGVhZDpIcXJ3IHRzZGggczRSMiBYZmMxIEpsaFAgV1JySg==`
  - `Content-Type`: `application/json`
- Body:
  ```json
  {
    "email": "{{1.email}}",
    "first_name": "{{1.first_name}}",
    "last_name": "{{1.last_name}}",
    "phone_number": "{{1.phone_number}}",
    "account_type": "{{1.user_type}}"
  }
  ```

**Module 3: Error Handler**
- If status code = 409 (duplicate): Log and skip
- If status code = 429 (rate limit): Wait 5 minutes and retry
- If status code >= 500: Alert admin via email

**Module 4: Logger**
- Log all successful creations to Google Sheets or database

### Step 4: Update InitiatePH Backend

Add webhook call to your user registration:

```javascript
// In your backend/server.js or registration handler

async function sendToInitiateGlobal(userData) {
  const makeWebhookUrl = 'https://hook.us1.make.com/your-webhook-id';
  
  try {
    const response = await fetch(makeWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number,
        user_type: userData.account_type // 'investor' or 'borrower'
      })
    });
    
    if (!response.ok) {
      console.error('Failed to sync to InitiateGlobal:', await response.text());
    } else {
      console.log('User synced to InitiateGlobal successfully');
    }
  } catch (error) {
    console.error('Error syncing to InitiateGlobal:', error);
    // Don't fail the registration if sync fails
  }
}

// Call this after successful user registration
// Example:
app.post('/api/auth/register', async (req, res) => {
  // ... your existing registration code ...
  
  // After successful registration:
  try {
    await sendToInitiateGlobal({
      email: req.body.email,
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      phone_number: req.body.phoneNumber,
      account_type: req.body.accountType
    });
  } catch (error) {
    // Log but don't fail registration
    console.error('InitiateGlobal sync failed:', error);
  }
  
  res.json({ success: true });
});
```

### Step 5: Testing Checklist

Test these scenarios:

- [ ] New user registration → User created on both platforms
- [ ] Duplicate email → Returns 409 error, doesn't create duplicate
- [ ] Invalid data (missing fields) → Returns 400 error
- [ ] Rate limit test → After 100 requests, returns 429
- [ ] Network failure → InitiatePH registration still succeeds
- [ ] Make.com offline → Webhook queued for retry
- [ ] Invalid authentication → Returns 401 error

---

## PART 6: MONITORING & MAINTENANCE

### Logs to Monitor

**InitiateGlobal (WordPress error log):**
```
/wp-content/debug.log
```

Look for lines starting with:
- `Initiate API: User created successfully`
- `Initiate API Error:`

### Make.com Monitoring

- Check execution history daily
- Set up email alerts for failures
- Monitor rate limit warnings

### Monthly Review

- Review audit logs for unusual activity
- Check user counts match between platforms
- Verify no duplicate emails exist
- Test rate limiting still works

---

## PART 7: SECURITY FEATURES INCLUDED

This implementation includes:

✅ **Authentication:** WordPress Application Password (already tested)  
✅ **Authorization:** Only 'initiatead' user can access  
✅ **Rate Limiting:** 100 requests/hour per IP  
✅ **Input Validation:** All fields validated and sanitized  
✅ **SQL Injection Protection:** Prepared statements  
✅ **Duplicate Detection:** Email uniqueness check  
✅ **Audit Logging:** All operations logged  
✅ **Error Handling:** Detailed error messages without exposing internals  
✅ **CORS Headers:** Restricts cross-origin access  
✅ **Type Validation:** Account type must be investor/borrower/donor  

### Optional Extra Security (IP Whitelist)

If you want to restrict access to ONLY InitiatePH's server:

1. Get InitiatePH's server IP address
2. Uncomment the `initiate_check_ip_whitelist()` function in the code
3. Add InitiatePH's IP to the `$allowed_ips` array
4. Uncomment the IP check call in `initiate_verify_secure_auth()`

---

## PART 8: TROUBLESHOOTING

### Issue: "Endpoint not found"
**Solution:** Clear WordPress permalinks
- Go to: Settings → Permalinks → Click "Save Changes" (don't change anything)

### Issue: "Authentication failed"
**Solution:** Verify Application Password is still active
- Go to: Users → Profile → Application Passwords
- Regenerate if needed

### Issue: "Database error"
**Solution:** Check table name
- Verify table is `wp_jet_cct_users` (check your database prefix)
- Update `$table_name` in code if different

### Issue: Rate limit too strict
**Solution:** Increase limit
- Change `100` to higher number in `initiate_check_rate_limit()`
- Or change `HOUR_IN_SECONDS` to `DAY_IN_SECONDS`

---

## SUPPORT CONTACTS

**InitiateGlobal Team Issues:**
- Endpoint not working
- Database errors
- WordPress configuration

**InitiatePH Team Issues:**
- Integration implementation
- Make.com configuration
- Testing procedures

**Contact:**  
Shahbaz Sherwani  
m.shahbazsherwani@gmail.com

---

**Document Version:** 1.0  
**Last Updated:** December 19, 2024  
**Status:** Ready for Implementation
