# 🚀 Next Steps - Email Setup with admin@initiateph.com

## Your Email Configuration

**Email Address:** `admin@initiateph.com`  
**SMTP Server:** `smtpout.secureserver.net`  
**Port:** `465` (SSL)

---

## Step-by-Step Setup

### Step 1: Get Your GoDaddy Email Password

1. Log into your GoDaddy account at https://godaddy.com
2. Go to **"Email & Office"** dashboard
3. Find your email account: `admin@initiateph.com`
4. Click **"Manage"** or **"Settings"**
5. Look for **"Email Password"** or **"Reset Password"**
6. Copy or note down the password

**Important:** This is NOT your GoDaddy account password, it's the email account password!

---

### Step 2: Update Your .env File

Open your `.env` file in the project root and add/update these lines:

```properties
# ==================== EMAIL CONFIGURATION ====================
# GoDaddy SMTP Settings
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=admin@initiateph.com
EMAIL_PASSWORD=your_actual_password_here
EMAIL_FROM=admin@initiateph.com
EMAIL_FROM_NAME=Initiate PH
FRONTEND_URL=https://initiate.ph
```

**Replace `your_actual_password_here` with the actual password from Step 1!**

---

### Step 3: Test Email Connection

Create a test file called `test-email.js` in your project root:

```javascript
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('📧 Testing email configuration...');
console.log('Email User:', process.env.EMAIL_USER);
console.log('Email Host:', process.env.EMAIL_HOST);
console.log('Email Port:', process.env.EMAIL_PORT);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('\n🔄 Verifying connection...');
    await transporter.verify();
    console.log('✅ Connection successful!');
    
    console.log('\n📨 Sending test email...');
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: 'admin@initiateph.com', // Send test to yourself
      subject: 'Test Email - Initiate PH Email System',
      html: `
        <h1>✅ Success!</h1>
        <p>Your GoDaddy SMTP email configuration is working correctly!</p>
        <p><strong>Email System Details:</strong></p>
        <ul>
          <li>From: ${process.env.EMAIL_FROM}</li>
          <li>Host: ${process.env.EMAIL_HOST}</li>
          <li>Port: ${process.env.EMAIL_PORT}</li>
        </ul>
        <p>You're ready to send verification emails!</p>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\n📬 Check your inbox at admin@initiateph.com');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Check your email password is correct');
    console.log('2. Verify the email account is active in GoDaddy');
    console.log('3. Try port 587 with TLS if 465 fails');
    console.log('4. Check if GoDaddy requires additional authentication');
  }
}

testConnection();
```

Then run:
```bash
node test-email.js
```

**Expected Output:**
```
📧 Testing email configuration...
Email User: admin@initiateph.com
Email Host: smtpout.secureserver.net
Email Port: 465

🔄 Verifying connection...
✅ Connection successful!

📨 Sending test email...
✅ Test email sent successfully!
Message ID: <some-message-id>

📬 Check your inbox at admin@initiateph.com
```

---

### Step 4: Restart Your Server

```bash
cd src/server
npm start
```

**Look for this message:**
```
✅ Email transporter ready (GoDaddy SMTP)
```

If you see this, email is configured correctly! ✅

---

### Step 5: Update RegisterStep.tsx (Registration Integration)

Open `src/screens/LogIn/RegisterStep.tsx` and find the registration success section.

Add this code after user profile creation:

```typescript
// Around line 150-200, after successful user creation
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

  // 🆕 ADD THIS: Send verification email
  try {
    const response = await fetch(`${API_BASE_URL}/api/send-verification-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      // Redirect to verification pending page
      navigate("/verification-pending");
    } else {
      // If email fails, show error but allow user to continue
      console.error('Failed to send verification email');
      toast.error('Failed to send verification email. Please contact support.');
      // Optionally still redirect to verification pending
      navigate("/verification-pending");
    }
  } catch (emailError) {
    console.error('Email sending error:', emailError);
    toast.error('Failed to send verification email');
    // Optionally redirect anyway
    navigate("/verification-pending");
  }
  
} catch (err) {
  // ... existing error handling
}
```

---

### Step 6: Test Complete Flow

1. **Start your server:**
   ```bash
   cd src/server
   npm start
   ```

2. **Start your frontend:**
   ```bash
   npm run dev
   ```

3. **Test registration:**
   - Go to `http://localhost:5173/register`
   - Register with a test email
   - Should redirect to `/verification-pending`
   - Check your email inbox for verification email

4. **Test verification:**
   - Click link in email
   - Should verify and redirect to login
   - Try logging in

---

## Troubleshooting

### If Connection Fails:

**Try Alternative Port (587 with TLS):**

Update your `.env`:
```properties
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Check GoDaddy Email Settings:**
1. Verify email account is active
2. Check if 2FA or additional security is enabled
3. Try generating an "App Password" in GoDaddy if available

### Common Issues:

| Issue | Solution |
|-------|----------|
| **Authentication failed** | Check password is correct for email account |
| **Connection timeout** | Try port 587 instead of 465 |
| **Certificate error** | Already handled with `rejectUnauthorized: false` |
| **Email not received** | Check spam/junk folder |

---

## Quick Commands Reference

```bash
# Test email connection
node test-email.js

# Start server
cd src/server
npm start

# Start frontend
npm run dev

# Check database migration
cd migrations
node run-email-verification-migration.js

# Check logs
# Look for: ✅ Email transporter ready (GoDaddy SMTP)
```

---

## What Happens Next?

1. ✅ Email configured with `admin@initiateph.com`
2. ✅ Test email connection
3. ✅ Server recognizes email configuration
4. ✅ Update registration flow
5. ✅ Test complete user registration → verification → login flow

---

## Need Help?

**Stuck on a step?** Check these docs:
- `GODADDY_EMAIL_SETUP.md` - Complete SMTP troubleshooting
- `EMAIL_QUICK_START.md` - Quick reference
- `EMAIL_VERIFICATION_IMPLEMENTATION.md` - Full implementation details

**Email Issues?** Contact GoDaddy support or check their documentation for SMTP settings specific to your hosting plan.

---

**Your Email:** admin@initiateph.com  
**Status:** Ready to configure ✅  
**Next:** Add password to .env and run test-email.js
