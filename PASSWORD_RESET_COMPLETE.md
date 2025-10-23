# Password Reset System - Complete Implementation

## Overview
Complete email-based password reset system using Microsoft 365 SMTP with custom tokens and secure password validation.

---

## 🎯 Features

### Security Features:
- ✅ **Custom reset tokens** (32-byte hex, stored in database)
- ✅ **1-hour expiration** on reset links
- ✅ **Single-use tokens** (marked as used after reset)
- ✅ **Email enumeration prevention** (same response for existing/non-existing emails)
- ✅ **Strong password validation** (12+ chars, uppercase, lowercase, numbers, special chars)

### User Experience:
- ✅ **Professional email templates** with company branding
- ✅ **Real-time password strength indicator**
- ✅ **Clear error messages**
- ✅ **Automatic redirect after success**
- ✅ **Expired/invalid token handling**

---

## 📧 Email System

### SMTP Configuration (Microsoft 365):
```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=admin@initiateph.com
EMAIL_PASSWORD=$Empire08
FRONTEND_URL=http://localhost:5173  # Change to https://initiate.ph for production
```

### Email Template Features:
- Company branding and colors
- Clear call-to-action button
- Security warnings
- Expiration time notice
- Plain text link fallback
- Professional footer

---

## 🔄 Complete Flow

### 1. User Requests Password Reset
**Page:** `/forgot-password`

User enters their email address and clicks "Send Reset Link"

**Frontend (`ForgotPassword.tsx`):**
```tsx
POST /api/settings/forgot-password
Body: { email: "user@example.com" }
```

**Backend (`server.js`):**
1. Validates email exists in Firebase
2. Generates 32-byte hex token
3. Stores token in database with 1-hour expiration
4. Sends email with reset link
5. Returns success (even if email doesn't exist, for security)

**Email Sent:**
```
Subject: Reset Your Password - Initiate PH
Link: http://localhost:5173/reset-password/:token
Expires: 1 hour
```

---

### 2. User Clicks Reset Link
**Email link opens:** `http://localhost:5173/reset-password/:token`

**Frontend (`ResetPassword.tsx`):**
1. Extracts token from URL
2. Validates token with API
3. Shows reset form if valid
4. Shows error if invalid/expired

**Backend Validation:**
```javascript
GET /api/validate-reset-token/:token

Checks:
- Token exists in database
- Token not used yet
- Token not expired (< 1 hour old)

Returns:
{
  success: true,
  email: "user@example.com"
}
```

---

### 3. User Enters New Password
**Frontend Password Validation:**
- ✅ Minimum 12 characters
- ✅ At least one uppercase letter
- ✅ At least one lowercase letter
- ✅ At least one number
- ✅ At least one special character
- ✅ Real-time strength indicator
- ✅ Passwords must match

**Password Strength Indicator:**
```
Weak (0-2/5):  ████░░░░░░ Red
Fair (3/5):    ██████░░░░ Yellow
Good (4/5):    ████████░░ Blue
Strong (5/5):  ██████████ Green
```

---

### 4. Password Reset Submitted
**Frontend:**
```tsx
POST /api/reset-password
Body: {
  token: "abc123...",
  newPassword: "NewSecurePass123!"
}
```

**Backend:**
1. Validates token (exists, not used, not expired)
2. Validates password strength
3. Updates password in Firebase
4. Marks token as used
5. Returns success

**Success:**
- Shows success message
- Auto-redirects to login after 3 seconds
- User can click "Continue to Login" immediately

---

## 🗄️ Database Schema

### `password_reset_tokens` Table
```sql
CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
);
```

### Indexes:
- `idx_password_reset_tokens_token` - Fast token lookup
- `idx_password_reset_tokens_firebase_uid` - Fast user lookup
- `idx_password_reset_tokens_expires_at` - Fast expiration check

### Example Data:
```
id: 1
firebase_uid: "xd7BTiOlToW9mwFkDCLtZO5dDoY2"
email: "user@example.com"
token: "a1b2c3d4e5f6..."
expires_at: "2025-10-19 13:15:00"
used: false
created_at: "2025-10-19 12:15:00"
```

---

## 📁 Files Created/Modified

### New Files:
1. **`src/screens/ResetPassword.tsx`** (460 lines)
   - Password reset form component
   - Token validation
   - Password strength indicator
   - Success/error handling

2. **`migrations/008_add_password_reset_tokens.sql`** (30 lines)
   - Database migration
   - Table creation
   - Indexes

3. **`run-password-reset-migration.js`** (75 lines)
   - Migration runner script
   - Table verification

### Modified Files:
1. **`src/routes/AppRoutes.tsx`**
   - Added: `<Route path="/reset-password/:token" element={<ResetPassword />} />`
   - Added: `import { ResetPassword } from "../screens/ResetPassword";`

2. **`src/server/server.js`**
   - Added: `sendPasswordResetEmail()` function (65 lines)
   - Modified: `/api/settings/forgot-password` endpoint (sends custom email)
   - Added: `GET /api/validate-reset-token/:token` endpoint
   - Added: `POST /api/reset-password` endpoint

3. **`src/screens/ForgotPassword.tsx`**
   - Fixed: `/login` → `/` navigation

---

## 🧪 Testing Guide

### Test Complete Flow:

1. **Request Password Reset:**
   ```
   - Go to: http://localhost:5173/forgot-password
   - Enter email: your-email@example.com
   - Click "Send Reset Link"
   - Should see: "Check Your Email" success message
   ```

2. **Check Email:**
   ```
   - Open inbox (your-email@example.com)
   - Should receive email from: admin@initiateph.com
   - Subject: "Reset Your Password - Initiate PH"
   - Email should have:
     ✓ Professional branding
     ✓ "Reset Password" button
     ✓ Expiration warning (1 hour)
     ✓ Security notice
   ```

3. **Click Reset Link:**
   ```
   - Click "Reset Password" button in email
   - Should open: http://localhost:5173/reset-password/:token
   - Should see: "Reset Your Password" page
   - Should show: Your email address
   ```

4. **Enter New Password:**
   ```
   - Enter password: Test123!@#Strong
   - Should see: Real-time strength indicator
   - Should see: Green "Strong" indicator
   - Should see: All checkmarks green
   - Confirm password: Test123!@#Strong
   - Click "Reset Password"
   ```

5. **Verify Success:**
   ```
   - Should see: "Password Reset Successful!" message
   - Should see: "Redirecting to login page..."
   - Should auto-redirect after 3 seconds
   - Or click: "Continue to Login"
   ```

6. **Login with New Password:**
   ```
   - Enter email and new password
   - Should login successfully
   ```

### Test Edge Cases:

1. **Invalid Token:**
   ```
   - Go to: http://localhost:5173/reset-password/invalid-token-here
   - Should see: "Invalid Reset Link" error
   - Should see: "Request New Reset Link" button
   ```

2. **Expired Token:**
   ```
   - Wait 1 hour after requesting reset
   - Click reset link from old email
   - Should see: "Reset link has expired" error
   ```

3. **Used Token:**
   ```
   - Complete password reset successfully
   - Try to use same reset link again
   - Should see: "This reset link has already been used" error
   ```

4. **Weak Password:**
   ```
   - Enter password: "test123"
   - Should see: Red "Weak" indicator
   - Submit button should be disabled
   - Should show: Missing requirements
   ```

5. **Non-Matching Passwords:**
   ```
   - Enter password: "Test123!@#Strong"
   - Confirm password: "Different123"
   - Click "Reset Password"
   - Should see: "Passwords do not match" error
   ```

6. **Non-Existent Email:**
   ```
   - Request reset for: nonexistent@example.com
   - Should see same success message (security)
   - No email should be sent
   ```

---

## 🔐 Security Considerations

### Implemented:
✅ **Email Enumeration Prevention**
   - Same response for existing/non-existing emails
   - Prevents attackers from discovering valid emails

✅ **Token Expiration**
   - 1-hour expiration on all tokens
   - Reduces window for token theft/misuse

✅ **Single-Use Tokens**
   - Token marked as used after successful reset
   - Prevents replay attacks

✅ **Strong Password Requirements**
   - Enforced on both frontend and backend
   - Cannot submit weak passwords

✅ **Secure Token Generation**
   - Crypto.randomBytes(32) - cryptographically secure
   - 32 bytes = 256 bits of entropy

✅ **Database Constraints**
   - Unique token constraint
   - Foreign key constraint (cascade delete)
   - Indexes for performance

### Additional Recommendations:
⚠️ **Rate Limiting**
   - Limit password reset requests per IP/email
   - Prevents spam and DoS attacks
   - Suggested: 3 requests per hour per email

⚠️ **IP Logging**
   - Log IP addresses for password reset requests
   - Helps detect suspicious activity

⚠️ **Email Notification**
   - Send notification to user when password is changed
   - "Your password was recently changed" email

⚠️ **HTTPS Only**
   - Ensure production uses HTTPS
   - Prevents token interception

---

## 🚀 Production Deployment

### Before Deploying:

1. **Update `.env` on Render:**
   ```env
   FRONTEND_URL=https://initiate.ph
   EMAIL_HOST=smtp.office365.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=admin@initiateph.com
   EMAIL_PASSWORD=$Empire08
   ```

2. **Run Migration on Production Database:**
   ```bash
   # SSH into Render or run locally with production DB URL
   DATABASE_URL=<production-db-url> node run-password-reset-migration.js
   ```

3. **Test Production Flow:**
   - Request reset from https://initiate.ph/forgot-password
   - Verify email received
   - Test reset link works
   - Verify login with new password

4. **Monitor for Issues:**
   - Check Render logs for SMTP errors
   - Monitor database for expired tokens
   - Check email deliverability

### Optional: Cleanup Old Tokens
Create a cron job to delete expired/used tokens:

```sql
-- Delete tokens older than 24 hours
DELETE FROM password_reset_tokens 
WHERE created_at < NOW() - INTERVAL '24 hours';
```

---

## 📊 API Endpoints

### 1. Request Password Reset
```
POST /api/settings/forgot-password

Request Body:
{
  "email": "user@example.com"
}

Success Response (200):
{
  "success": true,
  "message": "If an account exists, a password reset link has been sent to your email"
}

Error Response (400):
{
  "success": false,
  "error": "Email is required"
}

Error Response (500):
{
  "success": false,
  "error": "Failed to process password reset request"
}
```

### 2. Validate Reset Token
```
GET /api/validate-reset-token/:token

Success Response (200):
{
  "success": true,
  "email": "user@example.com"
}

Error Response (400):
{
  "error": "Invalid reset link"
}
{
  "error": "This reset link has already been used"
}
{
  "error": "Reset link has expired. Please request a new one."
}

Error Response (500):
{
  "error": "Failed to validate reset token"
}
```

### 3. Reset Password
```
POST /api/reset-password

Request Body:
{
  "token": "abc123...",
  "newPassword": "NewSecurePass123!"
}

Success Response (200):
{
  "success": true,
  "message": "Password has been reset successfully"
}

Error Response (400):
{
  "error": "Token and new password are required"
}
{
  "error": "Password must be at least 12 characters long"
}
{
  "error": "Invalid reset link"
}
{
  "error": "This reset link has already been used"
}
{
  "error": "Reset link has expired. Please request a new one."
}

Error Response (500):
{
  "error": "Failed to reset password"
}
```

---

## 🎨 UI Components

### Password Strength Indicator
```tsx
<div className="space-y-2">
  {/* Strength Bar */}
  <div className="w-full h-2 bg-gray-200 rounded-full">
    <div 
      className={`h-full transition-all ${getStrengthColor()}`}
      style={{ width: `${(strength / 5) * 100}%` }}
    />
  </div>

  {/* Requirements Checklist */}
  <div className="text-xs space-y-1">
    <div className={length ? 'text-green-600' : 'text-gray-500'}>
      {length ? '✓' : '○'} At least 12 characters
    </div>
    <div className={uppercase ? 'text-green-600' : 'text-gray-500'}>
      {uppercase ? '✓' : '○'} One uppercase letter
    </div>
    {/* ... more checks ... */}
  </div>
</div>
```

### Token Validation States
```tsx
{status === 'validating' && (
  <RefreshCw className="w-16 h-16 animate-spin" />
)}
{status === 'valid' && (
  <form onSubmit={handleSubmit}>...</form>
)}
{status === 'invalid' && (
  <div>Token expired or invalid</div>
)}
{status === 'success' && (
  <div>Password reset successful!</div>
)}
```

---

## 🐛 Troubleshooting

### Email Not Received:
1. Check spam/junk folder
2. Verify EMAIL_HOST is `smtp.office365.com`
3. Check server logs for SMTP errors
4. Verify EMAIL_PASSWORD is correct
5. Test with: `node test-email-auth.js`

### Reset Link Not Working:
1. Check FRONTEND_URL in `.env`
2. Verify frontend is running (`npm run dev`)
3. Check token hasn't expired (< 1 hour old)
4. Verify token exists in database:
   ```sql
   SELECT * FROM password_reset_tokens WHERE token = 'your-token';
   ```

### Password Reset Fails:
1. Check password meets requirements (12+ chars)
2. Verify token not used already (used = false)
3. Check Firebase authentication working
4. Look for errors in browser console
5. Check backend logs

### Database Issues:
1. Verify migration ran:
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'password_reset_tokens';
   ```
2. Check indexes exist:
   ```sql
   SELECT * FROM pg_indexes 
   WHERE tablename = 'password_reset_tokens';
   ```
3. Verify foreign key constraint:
   ```sql
   SELECT * FROM information_schema.table_constraints 
   WHERE table_name = 'password_reset_tokens';
   ```

---

## 📝 Summary

### ✅ What's Working:
1. **Email sending** via Microsoft 365 SMTP
2. **Custom reset tokens** stored in database
3. **1-hour token expiration**
4. **Single-use tokens** (marked as used)
5. **Professional email templates**
6. **Password strength validation**
7. **Complete UI flow** (request → email → reset → login)
8. **Error handling** for all edge cases
9. **Security** against enumeration and replay attacks
10. **Database migration** completed

### 🎉 System Status: FULLY OPERATIONAL

**Last Updated:** October 19, 2025, 12:20 PM
**Tested By:** Development Team
**Status:** Production Ready ✅
