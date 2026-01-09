# CENTRALIZED SSO IMPLEMENTATION GUIDE
## Single Sign-On Across InitiatePH & InitiateGlobal

**Date:** January 3, 2026  
**Architecture:** Supabase Auth as Identity Provider + Platform-Specific Data

---

## 🎯 GOAL

- **One user account** = One identity across both platforms
- **Single login** works on both InitiatePH.com and InitiateGlobal.org
- **Platform-specific data** stays on each platform independently
- **Seamless experience** for users moving between platforms

---

## 🏗️ ARCHITECTURE

### Identity Layer (Centralized)
**Supabase Auth** - Single source of truth
- Email/password authentication
- User UUID (unique identifier)
- JWT tokens for session management
- Profile metadata: name, phone, account_type

### Platform Layer (Decentralized)
**InitiatePH (Supabase)**
- Projects, wallets, investments, KYC documents
- References user by UUID

**InitiateGlobal (WordPress)**
- Organization data, content, CCT records
- References user by UUID

---

## 📋 IMPLEMENTATION STEPS

### PHASE 1: Supabase Configuration (Identity Provider)

#### 1.1 Update Site URLs
In Supabase Dashboard → Authentication → URL Configuration:
```
Site URL: https://initiateph.com
Additional Redirect URLs:
  - https://initiateglobal.org/auth/callback
  - https://initiateph.com/auth/callback
```

#### 1.2 Enable JWT Tokens
Already enabled by default. Note these values:
```
SUPABASE_URL: https://your-project.supabase.co
SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET: your-jwt-secret (from Settings → API)
```

#### 1.3 Configure User Metadata Schema
Ensure these fields are stored in `auth.users.raw_user_meta_data`:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+639123456789",
  "account_type": "investor"
}
```

---

### PHASE 2: InitiatePH Implementation (React/Supabase)

#### 2.1 Update Registration Flow

**File:** `src/screens/RegisterScreen.tsx` (or wherever registration happens)

```typescript
import { supabase } from '@/lib/supabase';

async function handleRegister(formData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  accountType: 'investor' | 'borrower';
}) {
  // 1. Create user in Supabase Auth (centralized identity)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phoneNumber,
        account_type: formData.accountType
      }
    }
  });

  if (authError) {
    console.error('Registration failed:', authError);
    return;
  }

  const userId = authData.user?.id; // This is the UUID used everywhere

  // 2. Create platform-specific data (optional - only if needed locally)
  // This is for InitiatePH-specific features like projects, wallets, etc.
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: userId, // Reference the Supabase Auth user ID
      // Add any InitiatePH-specific fields here
      // Don't duplicate name/email - get from auth.users
    });

  // 3. Notify InitiateGlobal (via webhook)
  await fetch('https://hook.us1.make.com/your-webhook-id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      email: formData.email,
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone_number: formData.phoneNumber,
      account_type: formData.accountType
    })
  });

  console.log('✅ User registered with ID:', userId);
}
```

#### 2.2 Login Flow (Already Working)

Your existing Supabase auth should already work:
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Get JWT token
const token = data.session?.access_token;
```

---

### PHASE 3: InitiateGlobal Implementation (WordPress)

#### 3.1 Install WordPress JWT Plugin

**Option A: Use Existing Plugin**
1. Install: **JWT Authentication for WP-API**
2. Plugin URL: https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/

**Option B: Custom Implementation** (recommended for Supabase)

Add to Code Snippets plugin:

```php
/**
 * Supabase JWT Authentication for WordPress
 * Validates Supabase JWT tokens for SSO
 */

// Add custom authentication filter
add_filter('determine_current_user', 'supabase_jwt_authenticate', 20);

function supabase_jwt_authenticate($user_id) {
    // If already authenticated via WordPress, return that
    if ($user_id) {
        return $user_id;
    }

    // Check for Authorization header
    $auth_header = isset($_SERVER['HTTP_AUTHORIZATION']) 
        ? $_SERVER['HTTP_AUTHORIZATION'] 
        : (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION']) 
            ? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] 
            : '');

    if (!$auth_header) {
        return $user_id;
    }

    // Extract token
    list($token) = sscanf($auth_header, 'Bearer %s');
    
    if (!$token) {
        return $user_id;
    }

    // Verify token with Supabase
    $supabase_user = verify_supabase_token($token);
    
    if (!$supabase_user) {
        return $user_id;
    }

    // Get or create WordPress user mapped to Supabase ID
    $wp_user = get_user_by_supabase_id($supabase_user['sub']);
    
    if (!$wp_user) {
        // Create local WordPress user on first login
        $wp_user = create_wordpress_user_from_supabase($supabase_user);
    }

    return $wp_user->ID;
}

function verify_supabase_token($token) {
    $supabase_url = 'https://your-project.supabase.co';
    $supabase_jwt_secret = 'your-jwt-secret';

    // Verify JWT signature
    try {
        // You'll need a JWT library - use firebase/php-jwt
        require_once __DIR__ . '/vendor/autoload.php';
        
        use Firebase\JWT\JWT;
        use Firebase\JWT\Key;

        $decoded = JWT::decode($token, new Key($supabase_jwt_secret, 'HS256'));
        
        return [
            'sub' => $decoded->sub, // Supabase user UUID
            'email' => $decoded->email,
            'user_metadata' => $decoded->user_metadata
        ];
    } catch (Exception $e) {
        error_log('JWT verification failed: ' . $e->getMessage());
        return false;
    }
}

function get_user_by_supabase_id($supabase_id) {
    global $wpdb;
    
    $user_id = $wpdb->get_var($wpdb->prepare(
        "SELECT user_id FROM {$wpdb->usermeta} 
         WHERE meta_key = 'supabase_user_id' 
         AND meta_value = %s",
        $supabase_id
    ));
    
    if ($user_id) {
        return get_user_by('id', $user_id);
    }
    
    return false;
}

function create_wordpress_user_from_supabase($supabase_user) {
    $email = $supabase_user['email'];
    $supabase_id = $supabase_user['sub'];
    $metadata = $supabase_user['user_metadata'];
    
    // Check if user with email exists
    $existing_user = get_user_by('email', $email);
    
    if ($existing_user) {
        // Link existing user to Supabase ID
        update_user_meta($existing_user->ID, 'supabase_user_id', $supabase_id);
        return $existing_user;
    }
    
    // Create new WordPress user
    $user_id = wp_create_user(
        $email, // username
        wp_generate_password(24), // random password (won't be used)
        $email
    );
    
    if (is_wp_error($user_id)) {
        error_log('Failed to create WordPress user: ' . $user_id->get_error_message());
        return false;
    }
    
    // Store Supabase ID mapping
    update_user_meta($user_id, 'supabase_user_id', $supabase_id);
    
    // Store additional profile data
    wp_update_user([
        'ID' => $user_id,
        'first_name' => $metadata->first_name ?? '',
        'last_name' => $metadata->last_name ?? '',
        'display_name' => ($metadata->first_name ?? '') . ' ' . ($metadata->last_name ?? '')
    ]);
    
    update_user_meta($user_id, 'phone_number', $metadata->phone_number ?? '');
    update_user_meta($user_id, 'account_type', $metadata->account_type ?? '');
    
    // Also create CCT record for compatibility
    global $wpdb;
    $wpdb->insert(
        $wpdb->prefix . 'jet_cct_users',
        [
            'email' => $email,
            'first_name' => $metadata->first_name ?? '',
            'last_name' => $metadata->last_name ?? '',
            'phone_number' => $metadata->phone_number ?? '',
            'account_type' => $metadata->account_type ?? ''
        ]
    );
    
    error_log("✅ Created WordPress user for Supabase ID: $supabase_id");
    
    return get_user_by('id', $user_id);
}
```

#### 3.2 Install JWT Library

Via Composer (on InitiateGlobal server):
```bash
cd /path/to/wordpress/wp-content/plugins/
mkdir supabase-auth && cd supabase-auth
composer require firebase/php-jwt
```

Or manually download and include the library.

---

### PHASE 4: Frontend Integration (InitiateGlobal)

#### 4.1 Login Page on InitiateGlobal.org

Create a custom login page that uses Supabase:

```html
<!-- File: wp-content/themes/your-theme/page-login.php -->
<!DOCTYPE html>
<html>
<head>
    <title>Login - Initiate Global</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
    <div id="login-form">
        <h1>Login to Initiate Global</h1>
        <form id="auth-form">
            <input type="email" id="email" placeholder="Email" required />
            <input type="password" id="password" placeholder="Password" required />
            <button type="submit">Login</button>
        </form>
        <p id="message"></p>
    </div>

    <script>
        const SUPABASE_URL = 'https://your-project.supabase.co';
        const SUPABASE_KEY = 'your-anon-key';
        
        const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        document.getElementById('auth-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Authenticate with Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) {
                document.getElementById('message').textContent = 'Login failed: ' + error.message;
                return;
            }
            
            // Get JWT token
            const token = data.session.access_token;
            
            // Store token in cookie/localStorage
            localStorage.setItem('supabase_token', token);
            
            // Authenticate with WordPress via API
            const wpAuth = await fetch('/wp-json/supabase/v1/auth', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (wpAuth.ok) {
                // Redirect to dashboard
                window.location.href = '/dashboard';
            } else {
                document.getElementById('message').textContent = 'WordPress authentication failed';
            }
        });
    </script>
</body>
</html>
```

#### 4.2 Create WordPress Session Endpoint

```php
// Add to Code Snippets
add_action('rest_api_init', function() {
    register_rest_route('supabase/v1', '/auth', [
        'methods' => 'POST',
        'callback' => 'supabase_create_wordpress_session',
        'permission_callback' => '__return_true'
    ]);
});

function supabase_create_wordpress_session($request) {
    $auth_header = $request->get_header('authorization');
    
    if (!$auth_header) {
        return new WP_Error('no_auth', 'Authorization header required', ['status' => 401]);
    }
    
    list($token) = sscanf($auth_header, 'Bearer %s');
    $supabase_user = verify_supabase_token($token);
    
    if (!$supabase_user) {
        return new WP_Error('invalid_token', 'Invalid token', ['status' => 401]);
    }
    
    // Get or create WordPress user
    $wp_user = get_user_by_supabase_id($supabase_user['sub']);
    
    if (!$wp_user) {
        $wp_user = create_wordpress_user_from_supabase($supabase_user);
    }
    
    // Create WordPress session
    wp_set_auth_cookie($wp_user->ID, true);
    
    return [
        'success' => true,
        'user_id' => $wp_user->ID,
        'display_name' => $wp_user->display_name
    ];
}
```

---

### PHASE 5: Make.com Integration (Optional - For Sync)

#### 5.1 Webhook Scenario

**Trigger:** InitiatePH registration  
**Action 1:** Store user UUID in InitiateGlobal CCT  
**Action 2:** Send notification email

**Make.com Modules:**
1. Webhook (receives from InitiatePH)
2. HTTP Request to InitiateGlobal API
3. Email notification

---

## 🔐 SECURITY CONSIDERATIONS

### Token Storage
- **InitiatePH:** Store tokens in secure httpOnly cookies
- **InitiateGlobal:** Validate JWT on every request
- **Never** store passwords locally - always verify with Supabase

### Password Sync
- ❌ **Don't sync passwords** between platforms
- ✅ Always authenticate against Supabase
- ✅ WordPress users get random passwords (never used)

### Session Management
- Tokens expire after 1 hour (Supabase default)
- Implement refresh token flow
- Clear tokens on logout from both platforms

---

## 🧪 TESTING FLOW

### Test Case 1: New User Registration on InitiatePH
1. User registers on InitiatePH.com
2. Account created in Supabase Auth (identity store)
3. Webhook sends data to InitiateGlobal
4. User can immediately log into InitiateGlobal.org with same credentials

### Test Case 2: Existing User Logs into InitiateGlobal
1. User logs into InitiateGlobal.org
2. Frontend sends credentials to Supabase
3. Supabase validates and returns JWT
4. WordPress verifies JWT and creates local user (first time only)
5. Subsequent logins just validate JWT

### Test Case 3: Single Logout
1. User logs out on InitiatePH
2. Clear Supabase session
3. User is also logged out of InitiateGlobal (shared token invalidated)

---

## 📊 DATA FLOW DIAGRAM

```
Registration:
InitiatePH Form → Supabase Auth → User UUID → Both Platforms

Login (InitiatePH):
Login Form → Supabase Auth → JWT Token → Access Granted

Login (InitiateGlobal):
Login Form → Supabase Auth → JWT Token → WordPress Auth → Access Granted

Cross-Platform:
InitiatePH Session → JWT Token → InitiateGlobal API → Authenticated
```

---

## ✅ CHECKLIST

### Supabase Configuration
- [ ] Add both site URLs to allowed URLs
- [ ] Note JWT secret
- [ ] Configure user metadata fields
- [ ] Test registration with metadata

### InitiatePH
- [ ] Update registration to include metadata
- [ ] Add webhook call after registration
- [ ] Test token generation
- [ ] Implement logout that clears session

### InitiateGlobal
- [ ] Install JWT authentication code
- [ ] Install firebase/php-jwt library
- [ ] Create custom login page
- [ ] Test JWT verification
- [ ] Test user creation on first login
- [ ] Test CCT record creation

### Testing
- [ ] Register new user on InitiatePH
- [ ] Verify Supabase auth.users record created
- [ ] Log into InitiateGlobal with same credentials
- [ ] Verify WordPress user created
- [ ] Verify CCT record created
- [ ] Test logout from both platforms
- [ ] Test password reset flow

---

## 🚀 DEPLOYMENT

### InitiatePH (No Changes Needed)
Already deployed with Supabase auth

### InitiateGlobal
1. Add JWT authentication code to Code Snippets
2. Upload firebase/php-jwt library
3. Deploy custom login page
4. Test in staging first
5. Monitor error logs

---

## 📞 SUPPORT

**Issues?**
- Check WordPress error log: `/wp-content/debug.log`
- Check Supabase logs: Dashboard → Logs
- Verify JWT secret matches in both configs
- Test tokens at https://jwt.io

**Questions?**
Contact: m.shahbazsherwani@gmail.com

---

**Document Version:** 1.0  
**Last Updated:** January 3, 2026  
**Status:** Implementation Ready
