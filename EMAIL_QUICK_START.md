# 🚀 Email System & Verification - Quick Start Guide

## ✅ What's Been Implemented

### Backend (Complete)
- ✅ Nodemailer installed for GoDaddy SMTP
- ✅ Email transporter configured
- ✅ Email verification database tables created
- ✅ 4 new API endpoints added
- ✅ Email sending functions created

### Frontend (Complete)
- ✅ EmailVerification page created
- ✅ EmailVerificationPending page created
- ✅ Routes added to AppRoutes

---

## 🔧 Setup Instructions

### Step 1: Configure GoDaddy Email

Add these to your `.env` file:

```properties
# GoDaddy SMTP Configuration
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=noreply@initiate.ph
EMAIL_PASSWORD=your_godaddy_password_here
EMAIL_FROM=noreply@initiate.ph
EMAIL_FROM_NAME=Initiate PH
FRONTEND_URL=https://initiate.ph
```

### Step 2: Test Email Connection

Create `test-email.js` in project root:

```javascript
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function test() {
  try {
    await transporter.verify();
    console.log('✅ Email connection successful!');
    
    // Send test email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: 'your-test-email@example.com',
      subject: 'Test Email',
      text: 'Connection works!'
    });
    console.log('✅ Test email sent!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

test();
```

Run: `node test-email.js`

### Step 3: Restart Server

```bash
cd src/server
npm start
```

---

## 📋 API Endpoints Reference

### 1. Send Verification Email
**POST** `/api/send-verification-email`
- **Auth:** Required (Firebase token)
- **Purpose:** Send verification email to logged-in user
- **Response:** `{ success: true, email: "user@example.com" }`

### 2. Verify Email
**GET** `/api/verify-email/:token`
- **Auth:** Not required (public)
- **Purpose:** Verify email using token from email link
- **Response:** `{ success: true, message: "...", email: "..." }`

### 3. Check Verification Status
**GET** `/api/check-email-verification`
- **Auth:** Required
- **Purpose:** Check if current user's email is verified
- **Response:** `{ emailVerified: true/false, email: "..." }`

### 4. Resend Verification Email
**POST** `/api/resend-verification-email`
- **Auth:** Required
- **Purpose:** Resend verification email (5-min rate limit)
- **Response:** `{ success: true, message: "..." }`

---

## 🔄 User Flow

### Registration with Email Verification

1. **User registers** → `RegisterStep.tsx`
   ```typescript
   // After creating Firebase user
   await authFetch(`${API_BASE_URL}/api/send-verification-email`, {
     method: 'POST'
   });
   navigate('/verification-pending');
   ```

2. **User sees pending page** → `/verification-pending`
   - Shows email address
   - Resend button (with countdown)
   - Instructions

3. **User clicks link in email** → `/verify-email/:token`
   - Backend validates token
   - Marks email as verified
   - Redirects to login

4. **User logs in and continues** → Protected routes check verification
   ```typescript
   const response = await authFetch('/api/check-email-verification');
   if (!data.emailVerified) {
     navigate('/verification-pending');
   }
   ```

---

## 🎨 Frontend Pages

### EmailVerification (`/verify-email/:token`)
**Purpose:** Landing page when user clicks verification link

**Features:**
- Loading spinner while verifying
- Success ✅ or Error ❌ icon
- Auto-redirect to login after 3 seconds
- Manual "Continue to Login" button

### EmailVerificationPending (`/verification-pending`)
**Purpose:** Waiting room after registration

**Features:**
- Shows user's email address
- Resend button with 5-minute countdown
- Success/error messages
- Instructions for next steps
- Link to support

---

## 🔒 Security Features

| Feature | Implementation |
|---------|----------------|
| **Random Tokens** | 32-byte cryptographically secure |
| **Expiration** | 24 hours from creation |
| **Single-Use** | Token marked verified after use |
| **Rate Limiting** | 5-minute cooldown between resends |
| **Old Token Cleanup** | Previous tokens deleted on new request |

---

## 🧪 Testing Checklist

### Backend Testing
- [ ] Server starts without errors
- [ ] Email transporter connects successfully
- [ ] `/api/send-verification-email` works
- [ ] `/api/verify-email/:token` works
- [ ] `/api/check-email-verification` works
- [ ] `/api/resend-verification-email` works (with rate limit)

### Frontend Testing
- [ ] Registration redirects to `/verification-pending`
- [ ] Verification pending page loads
- [ ] Email shows correctly
- [ ] Resend button works
- [ ] Resend countdown works (5 minutes)
- [ ] Verification link in email works
- [ ] Verification page shows success
- [ ] Auto-redirect to login works
- [ ] Protected routes check verification

### Email Testing
- [ ] Verification email arrives in inbox
- [ ] Email template displays correctly
- [ ] Verification link is correct
- [ ] Link expires after 24 hours
- [ ] Resend email works

---

## 🐛 Troubleshooting

### Email Not Sending

**Problem:** Emails aren't being sent

**Check:**
1. `.env` file has correct GoDaddy credentials
2. Run `node test-email.js` to test connection
3. Check server logs for email errors
4. Verify GoDaddy email account is active

**Solution:**
```bash
# Test connection
cd src/server
node -e "import('./server.js')"
# Look for: ✅ Email transporter ready
```

### Verification Link Not Working

**Problem:** Clicking link shows error

**Check:**
1. Token exists in database: 
   ```sql
   SELECT * FROM email_verifications WHERE verified = false;
   ```
2. Token hasn't expired (check `expires_at`)
3. Frontend route `/verify-email/:token` is configured
4. `FRONTEND_URL` in `.env` is correct

**Solution:**
Manually verify user:
```sql
UPDATE users 
SET email_verified = true, email_verified_at = NOW() 
WHERE firebase_uid = 'USER_UID_HERE';
```

### User Stuck on Pending Page

**Problem:** User can't proceed even though email is verified

**Check:**
1. `email_verified` flag in database:
   ```sql
   SELECT email_verified FROM users WHERE firebase_uid = 'USER_UID';
   ```
2. Frontend is checking verification status
3. User has refreshed the page

**Solution:**
```sql
-- Manually verify
UPDATE users SET email_verified = true WHERE firebase_uid = 'USER_UID';
```

### Rate Limit Issues

**Problem:** Can't resend email even after 5 minutes

**Check:**
1. Server time is correct
2. `created_at` in `email_verifications` table

**Solution:**
```sql
-- Reset rate limit for user
DELETE FROM email_verifications 
WHERE firebase_uid = 'USER_UID' AND verified = false;
```

---

## 📊 Database Queries

### Check Verification Status
```sql
SELECT 
  u.email,
  u.email_verified,
  u.email_verified_at,
  ev.token,
  ev.expires_at,
  ev.created_at
FROM users u
LEFT JOIN email_verifications ev ON u.firebase_uid = ev.firebase_uid
WHERE u.firebase_uid = 'USER_UID';
```

### Manually Verify User
```sql
UPDATE users 
SET email_verified = true, email_verified_at = NOW() 
WHERE firebase_uid = 'USER_UID';
```

### Clear Old Verifications
```sql
DELETE FROM email_verifications 
WHERE expires_at < NOW();
```

### Check Pending Verifications
```sql
SELECT 
  ev.*,
  u.email,
  u.full_name
FROM email_verifications ev
JOIN users u ON ev.firebase_uid = u.firebase_uid
WHERE ev.verified = false
AND ev.expires_at > NOW()
ORDER BY ev.created_at DESC;
```

---

## 💰 Cost Comparison

| Service | Setup | Monthly Cost | Emails/Month |
|---------|-------|--------------|--------------|
| **SendGrid** | API Key | $19.95+ | 40,000 |
| **GoDaddy SMTP** | Email credentials | $0 | Unlimited* |

*Included with GoDaddy hosting plan

**Annual Savings:** ~$240/year

---

## 📝 Next Steps

### Required (Before Launch):
1. [ ] Configure GoDaddy email in production `.env`
2. [ ] Test email sending in production
3. [ ] Update RegisterStep.tsx to send verification email
4. [ ] Add verification guard to KYC pages
5. [ ] Test full registration flow

### Optional (Future Improvements):
- [ ] Convert SendGrid functions to Nodemailer
- [ ] Add email templates for other notifications
- [ ] Add email preview/testing tool
- [ ] Add admin panel for managing verifications

---

## 📚 Documentation Files

1. **GODADDY_EMAIL_SETUP.md** - Complete GoDaddy SMTP setup
2. **EMAIL_VERIFICATION_IMPLEMENTATION.md** - Implementation details
3. **EMAIL_MIGRATION_SUMMARY.md** - Migration from SendGrid
4. **EMAIL_QUICK_START.md** (this file) - Quick reference

---

## 🆘 Support

**Questions?** Check documentation files or contact:
- DPO: dpo@initiate.ph
- Support: support@initiate.ph

**Repository:** github.com/ShahbazSherwani/initiatePortal

---

Last Updated: October 17, 2025
