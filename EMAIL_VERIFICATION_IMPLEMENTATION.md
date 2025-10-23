# Email Verification Implementation Guide

## Overview

This document covers the implementation of email verification for user registration. Users must verify their email address before they can complete their borrower or investor registration.

---

## Flow Diagram

```
1. User enters email + password on registration
   ↓
2. System creates Firebase user
   ↓
3. Email verification sent to user's inbox
   ↓
4. User clicks verification link in email
   ↓
5. System verifies token and marks email as verified
   ↓
6. User can now complete registration (Borrower/Investor)
```

---

## Database Schema Changes

### Add Email Verification Table

```sql
CREATE TABLE IF NOT EXISTS email_verifications (
  id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid) ON DELETE CASCADE
);

CREATE INDEX idx_email_verifications_token ON email_verifications(token);
CREATE INDEX idx_email_verifications_uid ON email_verifications(firebase_uid);
```

### Update Users Table

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;
```

---

## Implementation Steps

### Step 1: Install Required Packages

```bash
cd backend
npm install nodemailer
```

Add to `backend/package.json`:
```json
{
  "dependencies": {
    "nodemailer": "^6.9.7"
  }
}
```

### Step 2: Update Environment Variables

Add to `.env`:
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

### Step 3: Create Email Transporter (server.js)

Add at the top of server.js after imports:

```javascript
import nodemailer from 'nodemailer';

// Create email transporter for GoDaddy
let emailTransporter = null;

async function createEmailTransporter() {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    try {
      emailTransporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 465,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        tls: {
          rejectUnauthorized: false // For GoDaddy SSL certificates
        }
      });

      // Verify connection
      await emailTransporter.verify();
      console.log('✅ Email transporter ready (GoDaddy SMTP)');
      return true;
    } catch (error) {
      console.error('⚠️ Email configuration error:', error.message);
      console.log('📧 Emails will be logged to console instead');
      emailTransporter = null;
      return false;
    }
  } else {
    console.log('⚠️ Email not configured. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD in .env');
    return false;
  }
}

// Initialize email on server start
createEmailTransporter();
```

### Step 4: Email Sending Functions

Add these functions to server.js:

```javascript
// Generic email sending function
async function sendEmail({ to, subject, html }) {
  if (!emailTransporter) {
    console.log('📧 Email not configured. Would send to:', to);
    console.log('Subject:', subject);
    console.log('Content:', html.substring(0, 200) + '...');
    return { success: false, messageId: null };
  }

  try {
    const info = await emailTransporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Initiate PH'}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html
    });

    console.log(`✅ Email sent to ${to}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    return { success: false, error: error.message };
  }
}

// Send email verification
async function sendVerificationEmail(email, token, userName = 'User') {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0C4B20, #8FB200); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; padding: 14px 32px; background: #0C4B20; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .button:hover { background: #0A3D1A; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .info-box { background: #f9f9f9; padding: 15px; border-left: 4px solid #0C4B20; margin: 20px 0; }
        .warning-box { background: #fff3cd; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📧 Verify Your Email</h1>
        </div>
        <div class="content">
          <h2>Hello${userName !== 'User' ? ' ' + userName : ''}!</h2>
          <p>Thank you for registering with <strong>Initiate PH</strong>, the Philippines' first all-in-one crowdfunding platform.</p>
          
          <p>To complete your registration and access all features, please verify your email address by clicking the button below:</p>

          <p style="text-align: center;">
            <a href="${verifyUrl}" class="button">Verify Email Address</a>
          </p>

          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:<br>
            <code style="background: #f5f5f5; padding: 8px; display: block; margin-top: 8px; word-break: break-all;">${verifyUrl}</code>
          </p>

          <div class="warning-box">
            <strong>⚠️ Important:</strong> This verification link will expire in <strong>24 hours</strong>. Please verify your email soon.
          </div>

          <div class="info-box">
            <strong>What happens after verification?</strong><br>
            • You'll be able to complete your Borrower or Investor registration<br>
            • Access all platform features<br>
            • Create and invest in crowdfunding campaigns
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you didn't create an account with Initiate PH, please ignore this email or contact us at <a href="mailto:support@initiate.ph">support@initiate.ph</a>.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Initiate PH. All rights reserved.</p>
          <p>Unit 1915 Capital House 9th Avenue, corner 34th<br>Bonifacio Global City, Taguig City</p>
          <p><a href="mailto:dpo@initiate.ph">dpo@initiate.ph</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify Your Email - Initiate PH',
    html
  });
}

// Resend verification email
async function resendVerificationEmail(email, token, userName) {
  return sendVerificationEmail(email, token, userName);
}
```

### Step 5: Create Email Verification Endpoints

Add these endpoints to server.js:

```javascript
// Create email verification table on server start
async function createEmailVerificationTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id SERIAL PRIMARY KEY,
        firebase_uid VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        verified_at TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_email_verifications_token 
      ON email_verifications(token)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_email_verifications_uid 
      ON email_verifications(firebase_uid)
    `);

    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP
    `);

    console.log('✅ Email verification table ready');
  } catch (error) {
    console.error('❌ Error creating email verification table:', error);
  }
}

// Call this in your server startup sequence
// Add after other table creation calls

// Send verification email after user registration
app.post('/api/send-verification-email', verifyToken, async (req, res) => {
  try {
    const firebase_uid = req.uid;

    // Get user details
    const userResult = await db.query(
      'SELECT email, full_name, email_verified FROM users WHERE firebase_uid = $1',
      [firebase_uid]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { email, full_name, email_verified } = userResult.rows[0];

    if (email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate verification token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete any existing unverified tokens for this user
    await db.query(
      'DELETE FROM email_verifications WHERE firebase_uid = $1 AND verified = false',
      [firebase_uid]
    );

    // Store verification token
    await db.query(`
      INSERT INTO email_verifications (firebase_uid, email, token, expires_at)
      VALUES ($1, $2, $3, $4)
    `, [firebase_uid, email, token, expiresAt]);

    // Send email
    const result = await sendVerificationEmail(email, token, full_name);

    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Verification email sent successfully',
        email: email
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to send verification email',
        details: result.error 
      });
    }

  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// Verify email endpoint (public - no auth required)
app.get('/api/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find verification record
    const verificationResult = await db.query(
      `SELECT * FROM email_verifications 
       WHERE token = $1 AND verified = false`,
      [token]
    );

    if (verificationResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid or expired verification link',
        code: 'INVALID_TOKEN'
      });
    }

    const verification = verificationResult.rows[0];

    // Check if token expired
    if (new Date() > new Date(verification.expires_at)) {
      return res.status(400).json({ 
        error: 'Verification link has expired. Please request a new one.',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Mark as verified
    await db.query(
      `UPDATE email_verifications 
       SET verified = true, verified_at = NOW() 
       WHERE token = $1`,
      [token]
    );

    // Update user table
    await db.query(
      `UPDATE users 
       SET email_verified = true, email_verified_at = NOW() 
       WHERE firebase_uid = $1`,
      [verification.firebase_uid]
    );

    console.log(`✅ Email verified for user ${verification.firebase_uid}`);

    res.json({ 
      success: true, 
      message: 'Email verified successfully!',
      email: verification.email
    });

  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Check email verification status
app.get('/api/check-email-verification', verifyToken, async (req, res) => {
  try {
    const firebase_uid = req.uid;

    const result = await db.query(
      'SELECT email_verified, email FROM users WHERE firebase_uid = $1',
      [firebase_uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      emailVerified: result.rows[0].email_verified || false,
      email: result.rows[0].email
    });

  } catch (error) {
    console.error('Error checking email verification:', error);
    res.status(500).json({ error: 'Failed to check verification status' });
  }
});

// Resend verification email
app.post('/api/resend-verification-email', verifyToken, async (req, res) => {
  try {
    const firebase_uid = req.uid;

    // Get user details
    const userResult = await db.query(
      'SELECT email, full_name, email_verified FROM users WHERE firebase_uid = $1',
      [firebase_uid]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { email, full_name, email_verified } = userResult.rows[0];

    if (email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Check if there's a recent verification email (within last 5 minutes)
    const recentCheck = await db.query(
      `SELECT created_at FROM email_verifications 
       WHERE firebase_uid = $1 
       ORDER BY created_at DESC LIMIT 1`,
      [firebase_uid]
    );

    if (recentCheck.rows.length > 0) {
      const timeSinceLastEmail = Date.now() - new Date(recentCheck.rows[0].created_at).getTime();
      const minutesSinceLastEmail = timeSinceLastEmail / 1000 / 60;
      
      if (minutesSinceLastEmail < 5) {
        return res.status(429).json({ 
          error: `Please wait ${Math.ceil(5 - minutesSinceLastEmail)} minutes before requesting another verification email`
        });
      }
    }

    // Generate new token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Delete old tokens
    await db.query(
      'DELETE FROM email_verifications WHERE firebase_uid = $1 AND verified = false',
      [firebase_uid]
    );

    // Create new verification
    await db.query(`
      INSERT INTO email_verifications (firebase_uid, email, token, expires_at)
      VALUES ($1, $2, $3, $4)
    `, [firebase_uid, email, token, expiresAt]);

    // Send email
    const result = await resendVerificationEmail(email, token, full_name);

    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Verification email resent successfully'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to resend verification email',
        details: result.error 
      });
    }

  } catch (error) {
    console.error('Error resending verification email:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});
```

---

## Frontend Implementation

### Step 1: Create Email Verification Page

Create `src/screens/EmailVerification.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle, XCircle, Mail, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config/environment';

export const EmailVerification: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-email/${token}`);
      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        setEmail(data.email);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { message: 'Email verified! Please log in to continue.' }
          });
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Verification failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred during verification');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'verifying' && (
              <RefreshCw className="w-16 h-16 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-16 h-16 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="w-16 h-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'verifying' && 'Verifying Your Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">{message}</p>
          
          {status === 'success' && (
            <>
              <p className="text-sm text-gray-500 mb-4">
                Email: <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Redirecting to login page...
              </p>
              <Button onClick={() => navigate('/login')} className="w-full">
                Continue to Login
              </Button>
            </>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Button 
                onClick={() => navigate('/login')} 
                variant="outline" 
                className="w-full"
              >
                Go to Login
              </Button>
              <p className="text-xs text-gray-500">
                Need help? Contact <a href="mailto:support@initiate.ph" className="text-blue-600">support@initiate.ph</a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
```

### Step 2: Create Email Verification Pending Page

Create `src/screens/EmailVerificationPending.tsx`:

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';
import { toast } from 'react-hot-toast';

export const EmailVerificationPending: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [resending, setResending] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);

  const handleResendEmail = async () => {
    try {
      setResending(true);
      await authFetch(`${API_BASE_URL}/api/resend-verification-email`, {
        method: 'POST'
      });

      toast.success('Verification email sent! Check your inbox.');
      
      // Start 5-minute countdown
      setCanResend(false);
      setCountdown(300); // 5 minutes in seconds
      
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error: any) {
      toast.error(error.message || 'Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="w-16 h-16 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-gray-600">
            We've sent a verification email to:
          </p>
          <p className="font-semibold text-lg">{profile?.email}</p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm text-gray-700">
              <strong>Next Steps:</strong>
            </p>
            <ol className="text-sm text-gray-600 mt-2 space-y-1 list-decimal list-inside">
              <li>Check your inbox (and spam folder)</li>
              <li>Click the verification link in the email</li>
              <li>Complete your registration</li>
            </ol>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleResendEmail}
              disabled={!canResend || resending}
              variant="outline"
              className="w-full"
            >
              {resending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : !canResend ? (
                <>Resend in {formatTime(countdown)}</>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <Button
              onClick={() => navigate('/login')}
              variant="ghost"
              className="w-full"
            >
              Back to Login
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            Didn't receive the email? Check your spam folder or contact{' '}
            <a href="mailto:support@initiate.ph" className="text-blue-600">
              support@initiate.ph
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
```

### Step 3: Add Routes

Update `src/routes/AppRoutes.tsx`:

```typescript
import { EmailVerification } from '../screens/EmailVerification';
import { EmailVerificationPending } from '../screens/EmailVerificationPending';

// Add these routes
<Route path="/verify-email/:token" element={<EmailVerification />} />
<Route path="/verification-pending" element={<EmailVerificationPending />} />
```

### Step 4: Update Registration Flow

Update `src/screens/LogIn/RegisterStep.tsx` to send verification email after registration:

```typescript
// After successful user creation
try {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const idToken = await cred.user.getIdToken();
  localStorage.setItem("fb_token", idToken);

  await upsertProfile(idToken, fullName);
  const prof = await fetchProfile(idToken);

  setProfile({ 
    id: cred.user.uid,
    email: cred.user.email,
    name: prof.full_name, 
    role: prof.role || null,
    joined: prof.created_at,
    hasCompletedRegistration: prof.has_completed_registration || false,
    isAdmin: prof.is_admin || false,
    profileCode: generateProfileCode(cred.user.uid)
  });

  // Send verification email
  try {
    await authFetch(`${API_BASE_URL}/api/send-verification-email`, {
      method: 'POST'
    });
    
    // Redirect to verification pending page
    navigate("/verification-pending");
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
    // Still allow user to proceed
    navigate("/register-kyc", { state: { accountType: 'borrower' } });
  }
  
} catch (err) {
  // ... error handling
}
```

### Step 5: Add Email Verification Guard

Update KYC and account type selection to check email verification:

```typescript
// In RegisterKYC.tsx or account selection screen
useEffect(() => {
  checkEmailVerification();
}, []);

const checkEmailVerification = async () => {
  try {
    const response = await authFetch(`${API_BASE_URL}/api/check-email-verification`);
    const data = await response.json();
    
    if (!data.emailVerified) {
      navigate('/verification-pending');
    }
  } catch (error) {
    console.error('Error checking verification:', error);
  }
};
```

---

## Testing Checklist

- [ ] Install nodemailer: `npm install nodemailer`
- [ ] Configure GoDaddy email in `.env`
- [ ] Test email connection (test-email.js)
- [ ] Create database tables (email_verifications)
- [ ] Test registration flow
- [ ] Test verification email sending
- [ ] Test verification link clicking
- [ ] Test resend functionality
- [ ] Test expired token handling
- [ ] Test already verified handling
- [ ] Test email verification guard on KYC pages

---

## Security Considerations

1. **Token Security**
   - Tokens are cryptographically random (32 bytes)
   - Tokens expire after 24 hours
   - Tokens are single-use (marked verified after use)
   - Old tokens are deleted when new ones are created

2. **Rate Limiting**
   - 5-minute cooldown between resend requests
   - Prevents email spam abuse

3. **Verification Guard**
   - Blocks access to KYC/registration until verified
   - Checks verification status on protected routes

4. **Email Privacy**
   - Email addresses not exposed in error messages
   - Verification status only available to authenticated user

---

## Troubleshooting

### Email not sending
1. Check `.env` configuration
2. Run test-email.js
3. Verify GoDaddy credentials
4. Check console logs for errors

### Verification link not working
1. Check token in database
2. Verify expiration time
3. Check frontend route configuration

### User stuck on verification page
1. Check email_verified flag in database
2. Manually verify: `UPDATE users SET email_verified = true WHERE firebase_uid = 'xxx'`
3. Resend verification email

---

**Next:** See GODADDY_EMAIL_SETUP.md for email configuration details.
