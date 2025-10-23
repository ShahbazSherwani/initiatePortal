# GoDaddy Email Setup Guide for Initiate PH

## Why GoDaddy Email?

Since you already have GoDaddy hosting, you can use their SMTP service at **no extra cost** instead of paying for SendGrid. This is perfect for transactional emails like:
- Email verification
- Team invitations
- Role assignment notifications
- Password resets

---

## Step 1: Set Up Email Account in GoDaddy

### Option A: Use Existing Email
If you already have an email like `noreply@initiate.ph` or `notifications@initiate.ph`, you can use that.

### Option B: Create New Email Account
1. Log into your GoDaddy account
2. Go to **Email & Office** → **Email** (or **cPanel** if you have hosting)
3. Click **Create Email Address**
4. Create: `noreply@initiate.ph` or `notifications@initiate.ph`
5. Set a strong password
6. Save the credentials

---

## Step 2: Get GoDaddy SMTP Settings

GoDaddy provides different SMTP servers depending on your hosting type:

### For GoDaddy Workspace Email (Email & Office)
```
SMTP Server: smtpout.secureserver.net
Port: 465 (SSL) or 587 (TLS)
Username: noreply@initiate.ph (your full email address)
Password: your_email_password
Encryption: SSL/TLS
```

### For cPanel Email (Web Hosting with cPanel)
```
SMTP Server: initiate.ph (your domain name)
Port: 465 (SSL) or 587 (TLS)
Username: noreply@initiate.ph (your full email address)
Password: your_email_password
Encryption: SSL/TLS
```

### For Legacy GoDaddy Email
```
SMTP Server: relay-hosting.secureserver.net
Port: 25 or 587
Username: noreply@initiate.ph
Password: your_email_password
```

**Most Common (Use This First):**
```
Host: smtpout.secureserver.net
Port: 465
Secure: true (SSL)
```

---

## Step 3: Install Nodemailer

Nodemailer is a free, open-source Node.js module for sending emails.

```bash
# Navigate to backend directory
cd backend

# Install nodemailer
npm install nodemailer
```

Or add to your `backend/package.json`:

```json
{
  "dependencies": {
    "nodemailer": "^6.9.7"
  }
}
```

Then run:
```bash
npm install
```

---

## Step 4: Configure Environment Variables

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

# Frontend URL for email links
FRONTEND_URL=https://initiate.ph
```

**Security Note:** Never commit your `.env` file to Git!

---

## Step 5: Test SMTP Connection

### Quick Test Script

Create a file `test-email.js` in your backend folder:

```javascript
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  try {
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    // Send test email
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: 'your-test-email@gmail.com', // Replace with your email
      subject: 'Test Email from Initiate PH',
      html: '<h1>Success!</h1><p>GoDaddy email is working correctly.</p>'
    });

    console.log('✅ Test email sent:', info.messageId);
  } catch (error) {
    console.error('❌ Email error:', error);
  }
}

testEmail();
```

Run the test:
```bash
node test-email.js
```

---

## Troubleshooting Common Issues

### Issue 1: "Invalid login" or "Authentication failed"

**Solutions:**
1. Verify email and password are correct
2. Try logging into webmail to confirm credentials: https://email.secureserver.net/
3. Make sure you're using the **full email address** as username
4. Check if 2FA is enabled (may need app-specific password)

### Issue 2: "Connection timeout" or "ETIMEDOUT"

**Solutions:**
1. Try different port:
   - Port 465 with SSL
   - Port 587 with TLS
   - Port 25 (some servers block this)
2. Check firewall/antivirus settings
3. Try different SMTP server (see options above)

### Issue 3: "Self-signed certificate"

**Solution:**
Add to transporter config:
```javascript
{
  host: 'smtpout.secureserver.net',
  port: 465,
  secure: true,
  auth: { user: '...', pass: '...' },
  tls: { rejectUnauthorized: false } // Add this line
}
```

### Issue 4: Emails going to spam

**Solutions:**
1. Set up SPF record in GoDaddy DNS:
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:secureserver.net ~all
   ```

2. Set up DKIM (in GoDaddy Email settings)

3. Add proper email headers:
   ```javascript
   headers: {
     'X-Priority': '3',
     'X-Mailer': 'Initiate PH Mailer'
   }
   ```

### Issue 5: Rate limiting

GoDaddy limits:
- **Workspace Email**: ~250 emails/day per account
- **cPanel Email**: ~500 emails/day per account

**Solution for high volume:**
- Create multiple email accounts (e.g., `noreply1@`, `noreply2@`)
- Implement email queue system
- Or upgrade to dedicated SMTP service for high volume

---

## Testing Different SMTP Configurations

If one configuration doesn't work, try these in order:

### Config 1: GoDaddy Workspace (Most Common)
```javascript
{
  host: 'smtpout.secureserver.net',
  port: 465,
  secure: true,
  auth: {
    user: 'noreply@initiate.ph',
    pass: 'your_password'
  }
}
```

### Config 2: With TLS on Port 587
```javascript
{
  host: 'smtpout.secureserver.net',
  port: 587,
  secure: false,
  auth: {
    user: 'noreply@initiate.ph',
    pass: 'your_password'
  },
  tls: { ciphers: 'SSLv3' }
}
```

### Config 3: Direct Domain SMTP
```javascript
{
  host: 'initiate.ph',
  port: 465,
  secure: true,
  auth: {
    user: 'noreply@initiate.ph',
    pass: 'your_password'
  }
}
```

### Config 4: Legacy Relay
```javascript
{
  host: 'relay-hosting.secureserver.net',
  port: 25,
  secure: false,
  auth: {
    user: 'noreply@initiate.ph',
    pass: 'your_password'
  }
}
```

---

## Cost Comparison

| Service | Cost | Emails/Month | Notes |
|---------|------|--------------|-------|
| **GoDaddy Email** | $0* | ~7,500 | *Already included with hosting |
| SendGrid Free | $0 | 3,000 | Limited features |
| SendGrid Essentials | $19.95/mo | 50,000 | More features |
| Mailgun Pay-as-you-go | $0.80/1000 | Variable | Good for scaling |

**Winner for your use case: GoDaddy Email** ✅

---

## Security Best Practices

1. **Use App-Specific Password** (if 2FA enabled)
2. **Don't hardcode credentials** - use environment variables
3. **Limit email account permissions** - read/send only
4. **Monitor email logs** - check for abuse
5. **Set up DMARC** - prevent email spoofing
6. **Use rate limiting** - prevent spam

---

## Next Steps After Setup

1. ✅ Create email account in GoDaddy
2. ✅ Get SMTP credentials
3. ✅ Add to `.env` file
4. ✅ Install nodemailer: `npm install nodemailer`
5. ✅ Test connection with test script
6. ✅ Integrate into server.js (see EMAIL_VERIFICATION_IMPLEMENTATION.md)
7. ✅ Test email verification flow
8. ✅ Test role assignment emails
9. ✅ Set up SPF/DKIM records

---

## GoDaddy Support Resources

- **SMTP Settings**: https://www.godaddy.com/help/server-and-port-settings-for-workspace-email-6949
- **Email Support**: https://www.godaddy.com/help/email
- **Webmail Access**: https://email.secureserver.net/
- **DNS Management**: Your GoDaddy Domain Dashboard

---

## Quick Reference

**Email Test Command:**
```bash
node test-email.js
```

**Environment Variables:**
```
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=noreply@initiate.ph
EMAIL_PASSWORD=your_password
EMAIL_FROM=noreply@initiate.ph
```

**Default Config:**
```javascript
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

---

Need help? Check GoDaddy's SMTP settings documentation or contact their support.
