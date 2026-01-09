# Make.com Bidirectional User Sync - Implementation Guide

## Overview
Sync users between InitiatePH.com and InitiateGlobal.org using Make.com automation platform.

## Architecture

```
InitiatePH Registration → Make Webhook → InitiateGlobal WP User API
InitiateGlobal Registration → Make Webhook → InitiatePH Backend API
```

## Prerequisites
1. Make.com account (free tier works)
2. API endpoints on both platforms
3. Shared secret keys for authentication

---

## Part 1: Make.com Scenarios Setup

### Scenario 1: PH → Global (When user registers on InitiatePH)

**Trigger:** Webhook (Custom)
- URL will be: `https://hook.us1.make.com/YOUR_WEBHOOK_ID`
- Method: POST
- Expected payload:
```json
{
  "source_system": "PH",
  "source_event_id": "uuid-here",
  "source_timestamp": "2026-01-07T10:00:00Z",
  "user": {
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+1234567890",
    "role": "borrower",
    "firebase_uid": "abc123",
    "ph_user_id": 123
  }
}
```

**Steps in Make:**

1. **Webhook Trigger** - Receives data from InitiatePH
2. **Router** - Check if source_system = "PH"
   - If source_system = "GLOBAL", STOP (loop protection)
3. **HTTP Request** - Check if user exists in InitiateGlobal
   - URL: `https://initiateglobal.org/wp-json/wp/v2/users`
   - Method: GET
   - Query: `?search={email}`
   - Auth: WordPress Application Password
4. **Router** - Based on user exists or not
   - Route A: User exists → Update
   - Route B: User doesn't exist → Create
5. **HTTP Request (Create)** - Create WordPress user
   - URL: `https://initiateglobal.org/wp-json/wp/v2/users`
   - Method: POST
   - Body:
   ```json
   {
     "username": "{email}",
     "email": "{email}",
     "first_name": "{first_name}",
     "last_name": "{last_name}",
     "roles": ["subscriber"],
     "meta": {
       "phone_number": "{phone_number}",
       "firebase_uid": "{firebase_uid}",
       "ph_user_id": "{ph_user_id}",
       "synced_from": "PH",
       "sync_event_id": "{source_event_id}"
     }
   }
   ```
6. **HTTP Request (Update)** - If user exists, update meta
   - URL: `https://initiateglobal.org/wp-json/wp/v2/users/{user_id}`
   - Method: POST
   - Body: Same as create
7. **Log to Data Store** (optional) - Store event_id to prevent duplicates

---

### Scenario 2: Global → PH (When user registers on InitiateGlobal)

**Trigger:** Webhook (Custom)
- URL will be: `https://hook.us1.make.com/YOUR_WEBHOOK_ID_2`
- Expected payload:
```json
{
  "source_system": "GLOBAL",
  "source_event_id": "uuid-here",
  "source_timestamp": "2026-01-07T10:00:00Z",
  "user": {
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+1234567890",
    "global_user_id": 50
  }
}
```

**Steps in Make:**

1. **Webhook Trigger** - Receives data from InitiateGlobal
2. **Router** - Check if source_system = "GLOBAL"
   - If source_system = "PH", STOP (loop protection)
3. **HTTP Request** - Check if user exists in InitiatePH
   - URL: `https://initiateph.com/api/check-user`
   - Method: POST
   - Body: `{"email": "{email}"}`
   - Headers: `X-API-Key: YOUR_SECRET_KEY`
4. **Router** - Based on user exists
   - Route A: User exists → Update
   - Route B: User doesn't exist → Create
5. **HTTP Request (Create/Update)** - Upsert user in InitiatePH
   - URL: `https://initiateph.com/api/sync-user`
   - Method: POST
   - Headers: `X-API-Key: YOUR_SECRET_KEY`
   - Body:
   ```json
   {
     "email": "{email}",
     "first_name": "{first_name}",
     "last_name": "{last_name}",
     "phone_number": "{phone_number}",
     "global_user_id": "{global_user_id}",
     "source_system": "GLOBAL",
     "source_event_id": "{source_event_id}"
   }
   ```
6. **Log to Data Store** (optional) - Store event_id

---

## Part 2: InitiatePH Backend Implementation

### Add these endpoints to server.js:

**1. POST /api/check-user** - Check if user exists
```javascript
// Returns: {exists: true/false, user_id: 123}
```

**2. POST /api/sync-user** - Create or update user
```javascript
// Receives data from Make
// Creates Firebase user + Supabase record
// Returns: {success: true, user_id: 123}
```

**3. Add Make webhook call to registration flow**
```javascript
// After successful registration in profileRouter.post()
// Call Make webhook with user data
```

---

## Part 3: InitiateGlobal WordPress Implementation

### Add WordPress snippet to fire webhook on user registration:

```php
// Fire webhook to Make when user is created
add_action('user_register', 'sync_user_to_make', 10, 1);
function sync_user_to_make($user_id) {
    $user = get_userdata($user_id);
    
    // Check if already synced (prevent loop)
    $synced_from = get_user_meta($user_id, 'synced_from', true);
    if ($synced_from === 'PH') {
        return; // Don't sync back
    }
    
    // Prepare payload
    $payload = array(
        'source_system' => 'GLOBAL',
        'source_event_id' => wp_generate_uuid4(),
        'source_timestamp' => current_time('c'),
        'user' => array(
            'email' => $user->user_email,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'phone_number' => get_user_meta($user_id, 'phone_number', true),
            'global_user_id' => $user_id
        )
    );
    
    // Call Make webhook
    wp_remote_post('https://hook.us1.make.com/YOUR_WEBHOOK_ID_2', array(
        'body' => json_encode($payload),
        'headers' => array('Content-Type' => 'application/json')
    ));
}
```

---

## Part 4: Setup Checklist

### Make.com Setup
- [ ] Create Scenario 1: PH → Global
- [ ] Create Scenario 2: Global → PH
- [ ] Test both webhooks with sample data
- [ ] Add loop protection (source_system check)
- [ ] Add error handling (retry logic)

### InitiatePH Setup
- [ ] Add `/api/check-user` endpoint
- [ ] Add `/api/sync-user` endpoint
- [ ] Add Make webhook call to registration
- [ ] Store Make webhook URL in .env
- [ ] Test with Postman

### InitiateGlobal Setup
- [ ] Add user_register webhook snippet
- [ ] Store Make webhook URL in snippet
- [ ] Test user creation triggers webhook
- [ ] Verify loop protection works

### Testing
- [ ] Register user on PH → Verify created on Global
- [ ] Register user on Global → Verify created on PH
- [ ] Register same email twice → Verify update, not duplicate
- [ ] Check loop protection (user created by sync doesn't sync back)

---

## Security Considerations

1. **API Keys**: Store Make webhook URLs as environment variables
2. **Authentication**: Use X-API-Key header for InitiatePH endpoints
3. **WordPress Auth**: Use Application Passwords for WP API
4. **Validation**: Verify source_event_id to prevent replay attacks
5. **Rate Limiting**: Add throttling to prevent abuse

---

## Monitoring

### Make.com Dashboard
- Check scenario execution history
- Monitor error rates
- Set up email alerts for failures

### Logs to Check
- InitiatePH: Check console logs for webhook calls
- InitiateGlobal: Check WordPress error logs
- Make.com: Check operation history

---

## Estimated Timeline
- Make scenarios setup: 30 minutes
- Backend endpoints: 1 hour
- WordPress webhook: 30 minutes
- Testing: 1 hour
- **Total: 3 hours**

---

## Next Steps
1. Create Make.com account and get webhook URLs
2. Implement InitiatePH endpoints (I'll write the code)
3. Add WordPress snippet
4. Test end-to-end
