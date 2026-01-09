# ENTERPRISE SSO IMPLEMENTATION GUIDE
## Step-by-Step Instructions for Both Platforms

**Architecture:** Supabase Auth (Identity Provider) + JWT Token Verification  
**Security Level:** Enterprise-Grade  
**Estimated Time:** 4-6 hours  
**Date:** January 4, 2026

---

## 🎯 OVERVIEW

We'll implement in this order:
1. **InitiateGlobal (WordPress)** - Authentication receiver (30% of work)
2. **InitiatePH (React)** - Authentication provider (70% of work)
3. **Testing & Integration** - End-to-end validation

---

# PART A: INITIATE GLOBAL (WordPress)

Time: ~2 hours

---

## STEP 1: Install JWT Library via Composer

### 1.1 Access Server via SSH or Terminal

**If you have SSH access:**
```bash
ssh your-username@initiateglobal.org
```

**If using cPanel:**
1. Go to cPanel → Terminal (or use File Manager's terminal)

### 1.2 Navigate to WordPress Directory
```bash
cd /home/username/public_html
# OR wherever WordPress is installed
cd /var/www/html
```

### 1.3 Check if Composer is Installed
```bash
composer --version
```

**If Composer NOT installed:**
```bash
# Install Composer
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
```

**If you don't have SSH/terminal access:**
- Contact hosting provider to install Composer, OR
- I'll provide manual installation method (Step 1.4)

### 1.4 Install JWT Library
```bash
composer require firebase/php-jwt
```

This creates:
- `/vendor/` folder with JWT library
- `/vendor/autoload.php` file

**Verify installation:**
```bash
ls -la vendor/firebase/php-jwt
# Should show library files
```

### 1.5 Alternative: Manual Installation (No Composer)

**If Composer unavailable:**

1. Download from GitHub:
   - Go to: https://github.com/firebase/php-jwt/archive/refs/heads/main.zip
   - Save as `php-jwt.zip`

2. Upload to cPanel File Manager:
   - Path: `/wp-content/plugins/jwt-library/`
   - Extract the ZIP

3. The library will be at: `/wp-content/plugins/jwt-library/php-jwt-main/`

---

## STEP 2: Get Supabase Credentials

### 2.1 Log into Supabase Dashboard
Go to: https://supabase.com/dashboard

### 2.2 Select InitiatePH Project

### 2.3 Get API Credentials
1. Go to: **Settings → API**
2. Copy these values:

**SUPABASE_URL:**
```
https://xxxxxxxxxxxxx.supabase.co
```

**SUPABASE_ANON_KEY (Public Key):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
```

**JWT_SECRET:**
1. Go to: **Settings → API → JWT Settings**
2. Copy: **JWT Secret**
```
your-super-secret-jwt-secret-key-here
```

⚠️ **CRITICAL:** Keep JWT_SECRET private! Never expose in frontend code.

### 2.4 Save These Credentials
Create a temporary note with:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
JWT_SECRET=your-secret-here
```

---

## STEP 3: Create Code Snippet in WordPress

### 3.1 Log into WordPress Admin
Go to: https://initiateglobal.org/wp-admin

### 3.2 Navigate to Code Snippets
**Snippets → Add New**

### 3.3 Snippet Title
```
Supabase SSO Authentication
```

### 3.4 Paste This Code

**IMPORTANT:** Replace the placeholders with YOUR credentials from Step 2.

```php
<?php
/**
 * Supabase SSO Authentication for WordPress
 * Enterprise-Grade JWT Token Verification
 * Version: 1.0.0
 */

// ============================================
// CONFIGURATION - REPLACE WITH YOUR VALUES
// ============================================
define('SUPABASE_URL', 'https://YOUR-PROJECT.supabase.co');
define('SUPABASE_JWT_SECRET', 'YOUR-JWT-SECRET-HERE');

// ============================================
// LOAD JWT LIBRARY
// ============================================
// If using Composer:
require_once ABSPATH . 'vendor/autoload.php';

// If manual installation:
// require_once WP_CONTENT_DIR . '/plugins/jwt-library/php-jwt-main/src/JWT.php';
// require_once WP_CONTENT_DIR . '/plugins/jwt-library/php-jwt-main/src/Key.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// ============================================
// CUSTOM AUTHENTICATION FILTER
// ============================================
add_filter('determine_current_user', 'supabase_jwt_authenticate', 20);

function supabase_jwt_authenticate($user_id) {
    // If already authenticated via WordPress, return
    if ($user_id) {
        return $user_id;
    }

    // Check for Authorization header
    $auth_header = get_authorization_header();
    
    if (!$auth_header) {
        return $user_id;
    }

    // Extract Bearer token
    list($token) = sscanf($auth_header, 'Bearer %s');
    
    if (!$token) {
        return $user_id;
    }

    // Verify and decode JWT
    $supabase_user = verify_supabase_jwt($token);
    
    if (!$supabase_user) {
        return $user_id;
    }

    // Get or create WordPress user
    $wp_user = get_or_create_wp_user_from_supabase($supabase_user);
    
    if (!$wp_user) {
        error_log('SSO: Failed to get/create WordPress user');
        return $user_id;
    }

    error_log('SSO: User authenticated - ' . $wp_user->user_email);
    return $wp_user->ID;
}

// ============================================
// HELPER: GET AUTHORIZATION HEADER
// ============================================
function get_authorization_header() {
    $headers = [
        'HTTP_AUTHORIZATION',
        'REDIRECT_HTTP_AUTHORIZATION',
        'Authorization'
    ];
    
    foreach ($headers as $header) {
        if (isset($_SERVER[$header])) {
            return $_SERVER[$header];
        }
    }
    
    // Try apache_request_headers
    if (function_exists('apache_request_headers')) {
        $request_headers = apache_request_headers();
        if (isset($request_headers['Authorization'])) {
            return $request_headers['Authorization'];
        }
    }
    
    return null;
}

// ============================================
// VERIFY SUPABASE JWT TOKEN
// ============================================
function verify_supabase_jwt($token) {
    try {
        $decoded = JWT::decode(
            $token, 
            new Key(SUPABASE_JWT_SECRET, 'HS256')
        );
        
        // Validate issuer
        if ($decoded->iss !== SUPABASE_URL . '/auth/v1') {
            error_log('SSO: Invalid token issuer');
            return false;
        }
        
        // Check expiration
        if ($decoded->exp < time()) {
            error_log('SSO: Token expired');
            return false;
        }
        
        return [
            'id' => $decoded->sub,
            'email' => $decoded->email ?? null,
            'user_metadata' => $decoded->user_metadata ?? new stdClass()
        ];
        
    } catch (Exception $e) {
        error_log('SSO: JWT verification failed - ' . $e->getMessage());
        return false;
    }
}

// ============================================
// GET OR CREATE WORDPRESS USER
// ============================================
function get_or_create_wp_user_from_supabase($supabase_user) {
    $supabase_id = $supabase_user['id'];
    $email = $supabase_user['email'];
    $metadata = (array) $supabase_user['user_metadata'];
    
    // Check if user already exists by Supabase ID
    $wp_user_id = get_user_id_by_supabase_id($supabase_id);
    
    if ($wp_user_id) {
        return get_user_by('id', $wp_user_id);
    }
    
    // Check if user exists by email
    $wp_user = get_user_by('email', $email);
    
    if ($wp_user) {
        // Link existing WordPress user to Supabase ID
        update_user_meta($wp_user->ID, 'supabase_user_id', $supabase_id);
        sync_user_metadata($wp_user->ID, $metadata);
        error_log('SSO: Linked existing WordPress user to Supabase ID');
        return $wp_user;
    }
    
    // Create new WordPress user
    return create_new_wp_user($supabase_id, $email, $metadata);
}

// ============================================
// GET USER ID BY SUPABASE ID
// ============================================
function get_user_id_by_supabase_id($supabase_id) {
    global $wpdb;
    
    $user_id = $wpdb->get_var($wpdb->prepare(
        "SELECT user_id FROM {$wpdb->usermeta} 
         WHERE meta_key = 'supabase_user_id' 
         AND meta_value = %s 
         LIMIT 1",
        $supabase_id
    ));
    
    return $user_id ? (int) $user_id : null;
}

// ============================================
// CREATE NEW WORDPRESS USER
// ============================================
function create_new_wp_user($supabase_id, $email, $metadata) {
    $first_name = $metadata['first_name'] ?? '';
    $last_name = $metadata['last_name'] ?? '';
    $display_name = trim($first_name . ' ' . $last_name) ?: $email;
    
    // Generate random password (never used - auth via Supabase only)
    $password = wp_generate_password(32, true, true);
    
    // Create WordPress user
    $user_id = wp_create_user($email, $password, $email);
    
    if (is_wp_error($user_id)) {
        error_log('SSO: Failed to create WordPress user - ' . $user_id->get_error_message());
        return false;
    }
    
    // Update user profile
    wp_update_user([
        'ID' => $user_id,
        'first_name' => $first_name,
        'last_name' => $last_name,
        'display_name' => $display_name,
        'role' => 'subscriber' // Change as needed
    ]);
    
    // Store Supabase ID mapping
    update_user_meta($user_id, 'supabase_user_id', $supabase_id);
    
    // Sync additional metadata
    sync_user_metadata($user_id, $metadata);
    
    // Create CCT record for compatibility with existing system
    create_cct_user_record($user_id, $email, $metadata);
    
    error_log('SSO: Created new WordPress user - ' . $email);
    
    return get_user_by('id', $user_id);
}

// ============================================
// SYNC USER METADATA
// ============================================
function sync_user_metadata($user_id, $metadata) {
    $meta_fields = [
        'phone_number',
        'account_type',
        'organization',
        'date_of_birth',
        'gender'
    ];
    
    foreach ($meta_fields as $field) {
        if (isset($metadata[$field])) {
            update_user_meta($user_id, $field, sanitize_text_field($metadata[$field]));
        }
    }
}

// ============================================
// CREATE CCT RECORD (COMPATIBILITY)
// ============================================
function create_cct_user_record($user_id, $email, $metadata) {
    global $wpdb;
    
    $table_name = $wpdb->prefix . 'jet_cct_users';
    
    // Check if record already exists
    $exists = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM {$table_name} WHERE email = %s",
        $email
    ));
    
    if ($exists) {
        return; // Already exists
    }
    
    // Insert CCT record
    $wpdb->insert(
        $table_name,
        [
            'email' => $email,
            'first_name' => $metadata['first_name'] ?? '',
            'last_name' => $metadata['last_name'] ?? '',
            'phone_number' => $metadata['phone_number'] ?? '',
            'account_type' => $metadata['account_type'] ?? ''
        ],
        ['%s', '%s', '%s', '%s', '%s']
    );
    
    if ($wpdb->last_error) {
        error_log('SSO: Failed to create CCT record - ' . $wpdb->last_error);
    }
}

// ============================================
// REST API: CREATE WORDPRESS SESSION
// ============================================
add_action('rest_api_init', function() {
    register_rest_route('supabase/v1', '/auth', [
        'methods' => 'POST',
        'callback' => 'supabase_create_session',
        'permission_callback' => '__return_true'
    ]);
});

function supabase_create_session($request) {
    $auth_header = $request->get_header('authorization');
    
    if (!$auth_header) {
        return new WP_Error('no_token', 'Authorization token required', ['status' => 401]);
    }
    
    list($token) = sscanf($auth_header, 'Bearer %s');
    
    if (!$token) {
        return new WP_Error('invalid_format', 'Invalid authorization format', ['status' => 401]);
    }
    
    // Verify token
    $supabase_user = verify_supabase_jwt($token);
    
    if (!$supabase_user) {
        return new WP_Error('invalid_token', 'Invalid or expired token', ['status' => 401]);
    }
    
    // Get or create WordPress user
    $wp_user = get_or_create_wp_user_from_supabase($supabase_user);
    
    if (!$wp_user) {
        return new WP_Error('user_creation_failed', 'Failed to create user', ['status' => 500]);
    }
    
    // Create WordPress authentication cookie
    wp_set_auth_cookie($wp_user->ID, true, is_ssl());
    
    return [
        'success' => true,
        'user' => [
            'id' => $wp_user->ID,
            'email' => $wp_user->user_email,
            'display_name' => $wp_user->display_name,
            'first_name' => get_user_meta($wp_user->ID, 'first_name', true),
            'last_name' => get_user_meta($wp_user->ID, 'last_name', true)
        ]
    ];
}

// ============================================
// REST API: CHECK IF USER EXISTS
// ============================================
add_action('rest_api_init', function() {
    register_rest_route('supabase/v1', '/check-user', [
        'methods' => 'POST',
        'callback' => 'supabase_check_user',
        'permission_callback' => '__return_true'
    ]);
});

function supabase_check_user($request) {
    $email = $request->get_param('email');
    
    if (!$email || !is_email($email)) {
        return new WP_Error('invalid_email', 'Invalid email address', ['status' => 400]);
    }
    
    // Check WordPress user
    $wp_user = get_user_by('email', $email);
    
    if ($wp_user) {
        return [
            'exists' => true,
            'source' => 'wordpress',
            'first_name' => get_user_meta($wp_user->ID, 'first_name', true),
            'last_name' => get_user_meta($wp_user->ID, 'last_name', true),
            'phone_number' => get_user_meta($wp_user->ID, 'phone_number', true),
            'account_type' => get_user_meta($wp_user->ID, 'account_type', true)
        ];
    }
    
    // Check CCT table
    global $wpdb;
    $cct_user = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}jet_cct_users WHERE email = %s LIMIT 1",
        $email
    ));
    
    if ($cct_user) {
        return [
            'exists' => true,
            'source' => 'cct',
            'first_name' => $cct_user->first_name ?? '',
            'last_name' => $cct_user->last_name ?? '',
            'phone_number' => $cct_user->phone_number ?? '',
            'account_type' => $cct_user->account_type ?? ''
        ];
    }
    
    return [
        'exists' => false
    ];
}

// ============================================
// ENABLE DEBUG LOGGING
// ============================================
if (!defined('WP_DEBUG_LOG')) {
    define('WP_DEBUG_LOG', true);
}
```

### 3.5 Configure the Snippet

1. **Code Type:** PHP
2. **Location:** Run snippet everywhere
3. **Priority:** Default

### 3.6 Click "Save Changes and Activate"

---

## STEP 4: Test InitiateGlobal Backend

### 4.1 Test User Check Endpoint

Open PowerShell and run:

```powershell
Invoke-RestMethod -Uri "https://initiateglobal.org/wp-json/supabase/v1/check-user" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"test@example.com"}'
```

**Expected Response:**
```json
{
  "exists": false
}
```

Or if user exists:
```json
{
  "exists": true,
  "source": "wordpress",
  "first_name": "John",
  "last_name": "Doe"
}
```

### 4.2 Check WordPress Error Log

Go to: `/wp-content/debug.log`

Look for lines starting with `SSO:`

**If you see errors**, send them to me and I'll help debug.

---

## STEP 5: Create Login Page on InitiateGlobal

### 5.1 Go to WordPress Admin
**Pages → Add New**

### 5.2 Page Title
```
SSO Login
```

### 5.3 Set Template
**Page Attributes → Template:** Full Width (or Custom)

### 5.4 Paste This HTML in Custom HTML Block

```html
<!-- Supabase CDN -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<style>
  .sso-container {
    max-width: 450px;
    margin: 50px auto;
    padding: 30px;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  .form-group {
    margin-bottom: 20px;
  }
  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }
  .form-group input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
  }
  .btn-primary {
    width: 100%;
    padding: 12px;
    background: #0073aa;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
  }
  .btn-primary:hover {
    background: #005a87;
  }
  .alert {
    padding: 12px;
    margin-bottom: 20px;
    border-radius: 4px;
  }
  .alert-info {
    background: #d1ecf1;
    border: 1px solid #bee5eb;
    color: #0c5460;
  }
  .alert-error {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
  }
  .alert-success {
    background: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
  }
</style>

<div class="sso-container">
  <h2>Login to Initiate Global</h2>
  
  <div id="message"></div>
  
  <form id="login-form">
    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" required placeholder="your@email.com" />
    </div>
    
    <div class="form-group">
      <label for="password">Password</label>
      <input type="password" id="password" required placeholder="Your password" />
    </div>
    
    <button type="submit" class="btn-primary">Login</button>
  </form>
  
  <p style="text-align: center; margin-top: 20px;">
    Don't have an account? 
    <a href="https://initiateph.com/register">Register on InitiatePH</a>
  </p>
</div>

<script>
  // REPLACE WITH YOUR ACTUAL VALUES
  const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
  const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY-HERE';
  
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const messageDiv = document.getElementById('message');
  
  // Check if already logged in
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      messageDiv.innerHTML = '<div class="alert alert-info">You are already logged in! Redirecting...</div>';
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    }
  });
  
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    messageDiv.innerHTML = '<div class="alert alert-info">Authenticating...</div>';
    
    try {
      // Step 1: Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        messageDiv.innerHTML = `<div class="alert alert-error">Login failed: ${error.message}</div>`;
        return;
      }
      
      const token = data.session.access_token;
      
      messageDiv.innerHTML = '<div class="alert alert-info">Creating WordPress session...</div>';
      
      // Step 2: Create WordPress session
      const wpResponse = await fetch('/wp-json/supabase/v1/auth', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const wpResult = await wpResponse.json();
      
      if (!wpResponse.ok) {
        messageDiv.innerHTML = `<div class="alert alert-error">WordPress authentication failed: ${wpResult.message || 'Unknown error'}</div>`;
        return;
      }
      
      // Success!
      messageDiv.innerHTML = '<div class="alert alert-success">Login successful! Redirecting...</div>';
      
      // Redirect to dashboard or home
      setTimeout(() => {
        window.location.href = '/dashboard'; // Change as needed
      }, 1500);
      
    } catch (error) {
      messageDiv.innerHTML = `<div class="alert alert-error">Error: ${error.message}</div>`;
    }
  });
</script>
```

### 5.5 IMPORTANT: Update Credentials in the HTML

Replace these lines with your actual values from Step 2:
```javascript
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY-HERE';
```

### 5.6 Publish the Page

Click **Publish**

### 5.7 Note the URL
Should be: `https://initiateglobal.org/sso-login/`

---

## STEP 6: Test InitiateGlobal Login

### 6.1 Open the Login Page
Go to: https://initiateglobal.org/sso-login/

### 6.2 Try Logging In

**If you have an existing InitiatePH account:**
- Enter your InitiatePH email/password
- Click Login

**Expected Result:**
- "Authenticating..." message
- "Creating WordPress session..." message
- "Login successful! Redirecting..."
- You're logged into WordPress!

### 6.3 Verify Login

1. Check if you can access: `https://initiateglobal.org/wp-admin/`
2. You should be logged in without entering WordPress credentials!

### 6.4 Check Logs

Go to `/wp-content/debug.log`

Look for:
```
SSO: User authenticated - user@example.com
SSO: Created new WordPress user - user@example.com
```

---

## ✅ CHECKPOINT: InitiateGlobal Complete

**Completed:**
- ✅ JWT library installed
- ✅ Supabase authentication code active
- ✅ API endpoints working
- ✅ Login page created
- ✅ Can log in with Supabase credentials

**Test Result:** You should be able to log into InitiateGlobal using your InitiatePH account!

---

# PART B: INITIATE PH (React/Supabase)

Time: ~3-4 hours

This is where we implement the registration flow and cross-platform integration.

## Ready to Continue to Part B?

Before we move forward:

1. **Did Part A work?** (Can you log into InitiateGlobal?)
2. **Any errors in the WordPress debug log?**
3. **Ready to implement the InitiatePH side?**

Let me know and I'll provide Part B step-by-step instructions!

---

**Current Progress:** 50% Complete (InitiateGlobal authentication receiver working)  
**Next:** InitiatePH registration/login integration  
**Estimated Time Remaining:** 3-4 hours
