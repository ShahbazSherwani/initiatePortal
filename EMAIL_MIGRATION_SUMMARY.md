# Email System Migration - SendGrid to GoDaddy SMTP

## ✅ Implementation Complete

**Date:** October 17, 2025  
**Migration:** SendGrid API → GoDaddy SMTP (Nodemailer)  
**New Feature:** Email Verification for User Registration

---

## Changes Made

### 1. Package Installation ✅
- **Installed:** `nodemailer@^6.9.7` in `src/server/package.json`
- **Purpose:** Send emails via GoDaddy SMTP instead of SendGrid API

### 2. Database Migration ✅
- **File:** `migrations/007_add_email_verification.sql`
- **Changes:**
  - Created `email_verifications` table
  - Added indexes for performance (token, firebase_uid, email)
  - Added `email_verified` and `email_verified_at` columns to `users` table
- **Status:** ✅ Successfully applied

### 3. Server Updates ✅
**File:** `src/server/server.js`

#### Email Transporter Setup
- Added nodemailer import
- Created `createEmailTransporter()` function
- Configures GoDaddy SMTP with:
  - Host: `process.env.EMAIL_HOST`
  - Port: `process.env.EMAIL_PORT`
  - Secure: SSL/TLS support
  - Auth: Email credentials
  - TLS: Reject unauthorized = false (for GoDaddy certificates)

#### Email Sending Functions
1. **`sendEmail({ to, subject, html })`**
   - Generic email sender using Nodemailer
   - Fallback to console logging if email not configured
   
2. **`sendVerificationEmail(email, token, userName)`**
   - Sends HTML email with verification link
   - 24-hour expiration
   - Professional template with INITIATE PH branding

#### New API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/send-verification-email` | POST | ✓ | Send verification email to user |
| `/api/verify-email/:token` | GET | ✗ | Verify email with token (public) |
| `/api/check-email-verification` | GET | ✓ | Check if user's email is verified |
| `/api/resend-verification-email` | POST | ✓ | Resend verification email (5-min rate limit) |

---

## Environment Variables Required

Add these to your `.env` file:

```properties
# GoDaddy Email Configuration
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=noreply@initiate.ph
EMAIL_PASSWORD=your_godaddy_email_password
EMAIL_FROM=noreply@initiate.ph
EMAIL_FROM_NAME=Initiate PH
FRONTEND_URL=https://initiate.ph
```

### Remove These (No Longer Needed):
```properties
# SENDGRID_API_KEY=...
# SENDGRID_FROM_EMAIL=...
```

---

## Database Schema

### `email_verifications` Table
```sql
CREATE TABLE email_verifications (
  id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);
```

### `users` Table Updates
```sql
ALTER TABLE users 
  ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN email_verified_at TIMESTAMP;
```

---

## Email Verification Flow

```
1. User registers with email + password
   ↓
2. System creates Firebase user
   ↓
3. Frontend calls POST /api/send-verification-email
   ↓
4. Backend generates random token (32 bytes hex)
   ↓
5. Token stored in database with 24-hour expiration
   ↓
6. Email sent with verification link
   ↓
7. User clicks link → GET /api/verify-email/:token
   ↓
8. Backend validates token (exists, not expired)
   ↓
9. Marks email_verified = true in users table
   ↓
10. User can proceed to complete registration
```

---

## Security Features

### Token Security
- ✅ Cryptographically random tokens (32 bytes)
- ✅ Unique constraint on tokens
- ✅ 24-hour expiration
- ✅ Single-use (marked verified after use)
- ✅ Old tokens deleted when new ones created

### Rate Limiting
- ✅ 5-minute cooldown between resend requests
- ✅ Prevents email spam abuse

### Data Protection
- ✅ Email addresses not exposed in error messages
- ✅ Verification status only available to authenticated user
- ✅ Public endpoint validates token but doesn't expose user data

---

## Frontend Integration Needed

### Next Steps:

1. **Create Email Verification Pages**
   - `/verify-email/:token` - Verification landing page
   - `/verification-pending` - Waiting for verification page

2. **Update Registration Flow**
   - After successful registration, call `/api/send-verification-email`
   - Redirect to `/verification-pending`
   - Show email with resend option

3. **Add Email Verification Guard**
   - Check email verification before allowing KYC completion
   - Block borrower/investor registration until verified
   - Call `/api/check-email-verification` on protected routes

4. **Create Components** (see EMAIL_VERIFICATION_IMPLEMENTATION.md):
   - `EmailVerification.tsx` - Token verification page
   - `EmailVerificationPending.tsx` - Pending verification UI
   - Update `AppRoutes.tsx` with new routes
   - Update `RegisterStep.tsx` to send verification email

---

## Testing Checklist

- [ ] Configure GoDaddy email in `.env`
- [ ] Test email connection (see GODADDY_EMAIL_SETUP.md)
- [ ] Test registration flow
- [ ] Test verification email sending
- [ ] Test verification link clicking
- [ ] Test resend functionality (5-min rate limit)
- [ ] Test expired token handling
- [ ] Test already verified handling
- [ ] Test email verification guard on KYC pages

---

## Cost Savings

| Service | Monthly Cost | Emails/Month |
|---------|-------------|--------------|
| **SendGrid** | $19.95+ | 40,000+ |
| **GoDaddy SMTP** | $0 | Unlimited* |

*Included with existing GoDaddy hosting plan

**Annual Savings:** ~$240/year minimum

---

## Migration from SendGrid (TODO)

### Files Still Using SendGrid:
These functions still need to be converted from SendGrid to Nodemailer:

1. **`sendRoleAssignmentEmail()`** (line ~8265)
   - Currently uses: `@sendgrid/mail`
   - Needs: Convert to `sendEmail()` helper

2. **`sendTeamInvitationEmail()`** (line ~8363)
   - Currently uses: `@sendgrid/mail`  
   - Needs: Convert to `sendEmail()` helper

### How to Convert:
Replace this pattern:
```javascript
const sgMail = await import('@sendgrid/mail');
sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);
await sgMail.default.send(msg);
```

With:
```javascript
await sendEmail({
  to: email,
  subject: 'Your Subject',
  html: htmlContent
});
```

---

## Documentation Files Created

1. **GODADDY_EMAIL_SETUP.md** - GoDaddy SMTP configuration guide
2. **EMAIL_VERIFICATION_IMPLEMENTATION.md** - Complete implementation guide
3. **migrations/007_add_email_verification.sql** - Database migration
4. **migrations/run-email-verification-migration.js** - Migration runner
5. **EMAIL_MIGRATION_SUMMARY.md** (this file) - Migration summary

---

## Troubleshooting

### Email Not Sending
1. Check `.env` configuration
2. Verify GoDaddy email credentials
3. Check server logs for errors
4. Run connection test (see GODADDY_EMAIL_SETUP.md)

### Verification Link Not Working
1. Check token in database (email_verifications table)
2. Verify expiration time
3. Check frontend route configuration (`/verify-email/:token`)
4. Ensure `FRONTEND_URL` is correct in `.env`

### User Stuck on Verification
1. Check `email_verified` flag in users table
2. Manually verify: `UPDATE users SET email_verified = true WHERE firebase_uid = 'xxx'`
3. Resend verification email

---

## Next Actions

### Immediate:
1. ✅ Install nodemailer
2. ✅ Run database migration
3. ✅ Add email endpoints to server.js
4. ✅ Create email sending functions
5. [ ] Configure GoDaddy email in `.env`
6. [ ] Test email connection

### Frontend (Pending):
7. [ ] Create EmailVerification.tsx page
8. [ ] Create EmailVerificationPending.tsx page
9. [ ] Add routes to AppRoutes.tsx
10. [ ] Update RegisterStep.tsx to send verification email
11. [ ] Add email verification guard to KYC pages

### Optional (Later):
12. [ ] Convert SendGrid functions to Nodemailer
13. [ ] Remove @sendgrid/mail dependency
14. [ ] Add email templates for other notifications

---

## Support

- **Email Setup:** See GODADDY_EMAIL_SETUP.md
- **Implementation:** See EMAIL_VERIFICATION_IMPLEMENTATION.md
- **DPO Contact:** dpo@initiate.ph
- **Support:** support@initiate.ph

---

**Status:** Backend implementation complete ✅  
**Next:** Frontend integration and testing
