# ✅ Email Setup Checklist - admin@initiateph.com

## Step-by-Step Setup

### ☐ Step 1: Get GoDaddy Email Password (5 minutes)
1. Go to https://godaddy.com and log in
2. Navigate to **"Email & Office"** dashboard
3. Find your email: **admin@initiateph.com**
4. Click **"Manage"** or **"Settings"**
5. Look for **"Email Password"** or **"Reset Password"**
6. Copy the password (write it down securely)

**Note:** This is the EMAIL password, NOT your GoDaddy account password!

---

### ☐ Step 2: Update .env File (2 minutes)

Open `.env` file in project root and add these lines:

```properties
# GoDaddy Email Configuration
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=admin@initiateph.com
EMAIL_PASSWORD=paste_your_password_here
EMAIL_FROM=admin@initiateph.com
EMAIL_FROM_NAME=Initiate PH
FRONTEND_URL=https://initiate.ph
```

**Important:** Replace `paste_your_password_here` with actual password from Step 1!

---

### ☐ Step 3: Test Email Connection (1 minute)

Run the test script:

```bash
node test-email.js
```

**Expected output:**
```
✅ Step 1: Connection successful!
✅ Step 2: Test email sent successfully!
🎉 SUCCESS! Your email system is ready!
```

**Check your inbox** at admin@initiateph.com for the test email.

---

### ☐ Step 4: Restart Server (1 minute)

```bash
cd src/server
npm start
```

**Look for this line in the logs:**
```
✅ Email transporter ready (GoDaddy SMTP)
```

If you see it, you're good to go! ✅

---

### ☐ Step 5: Test Full Flow (5 minutes)

1. Start frontend: `npm run dev`
2. Go to registration page
3. Register with a test email
4. Should redirect to `/verification-pending`
5. Check inbox for verification email
6. Click verification link
7. Should verify and redirect to login

---

## Troubleshooting Quick Reference

### If test-email.js fails:

**Authentication Error:**
- Check password is correct
- This is EMAIL password, not GoDaddy account password
- Reset password in GoDaddy if needed

**Connection Timeout:**
Try alternative port:
```properties
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Still not working?**
- Check `GODADDY_EMAIL_SETUP.md` (detailed troubleshooting)
- Contact GoDaddy support
- Try generating an "App Password" if available

---

## Quick Test Commands

```bash
# Test email connection
node test-email.js

# Restart server
cd src/server
npm start

# Start frontend
npm run dev

# Check if email config loaded
# Look for: ✅ Email transporter ready (GoDaddy SMTP)
```

---

## Current Status

- ✅ Email system implemented
- ✅ Database migrated
- ✅ Frontend pages created
- ✅ API endpoints ready
- ✅ Test script created
- ⏳ **Next:** Configure email password and test

---

## Your Configuration

**Email:** admin@initiateph.com  
**SMTP Server:** smtpout.secureserver.net  
**Port:** 465 (SSL)  
**Status:** Ready for password ⏳

---

## Estimated Time

- Step 1 (Get Password): 5 minutes
- Step 2 (Update .env): 2 minutes
- Step 3 (Test Connection): 1 minute
- Step 4 (Restart Server): 1 minute
- Step 5 (Test Full Flow): 5 minutes

**Total: ~15 minutes** ⏱️

---

## Success Criteria

After completing all steps, you should have:
- ✅ Email connection working
- ✅ Test email received in inbox
- ✅ Server shows "Email transporter ready"
- ✅ User registration sends verification emails
- ✅ Verification links work correctly

---

**Ready to start? Begin with Step 1!** 🚀
