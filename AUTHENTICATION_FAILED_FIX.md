# 🔧 Authentication Failed - Troubleshooting Guide

## Current Status
❌ **Error:** Authentication Failed (535)  
**Email:** admin@initiateph.com  
**Tried:** Port 465 (SSL) and Port 587 (TLS)

---

## Why This Happens

The "535 Authentication Failed" error means:
- The email password is incorrect, OR
- The email account settings need to be configured in GoDaddy, OR
- The email account requires additional authentication

---

## Solution Steps

### Step 1: Verify/Reset Email Password in GoDaddy

1. **Log into GoDaddy:**
   - Go to https://godaddy.com
   - Sign in with your account

2. **Navigate to Email:**
   - Click **"Email & Office"** in your account dashboard
   - Or go directly to: https://account.godaddy.com/products

3. **Find Your Email Account:**
   - Look for **admin@initiateph.com**
   - Click **"Manage"** or **"Manage All"**

4. **Check Email Account Settings:**
   - Click on **"Webmail"** or **"Settings"**
   - Look for the email account **admin@initiateph.com**

5. **Reset the Password:**
   - Click **"Reset Password"** or **"Change Password"**
   - Create a NEW password (write it down!)
   - **Use a simple password for testing** (no special characters like $ initially)
   - Example: `Empire2024Test` (letters and numbers only)

6. **Update .env File:**
   ```properties
   EMAIL_PASSWORD=your_new_password_here
   ```

---

### Step 2: Verify Email Account is Active

Check that:
- ✅ The email account `admin@initiateph.com` exists
- ✅ It's not suspended or locked
- ✅ You can log into webmail with the password
- ✅ The email plan is active (not expired)

**Test Webmail Login:**
- Go to: https://email.godaddy.com or https://outlook.office365.com/mail
- Try logging in with: `admin@initiateph.com` and your password
- If you can't log in to webmail, the password is definitely wrong

---

### Step 3: Check GoDaddy Email Type

GoDaddy has different email products:

#### Option A: Workspace Email (Most Common)
- **SMTP Server:** `smtpout.secureserver.net`
- **Port:** 465 (SSL) or 587 (TLS)
- **This is what we're using** ✅

#### Option B: Microsoft 365 Email
If your email is through Microsoft 365/Outlook:
- **SMTP Server:** `smtp.office365.com`
- **Port:** 587
- **Authentication:** Modern Auth might be required

**Check which type you have:**
1. In GoDaddy dashboard, look at your email product name
2. If it says "Microsoft 365" or "Office 365", update your .env:
   ```properties
   EMAIL_HOST=smtp.office365.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   ```

---

### Step 4: Try Alternative SMTP Settings

If still failing, try these configurations:

#### Configuration 1: Direct SMTP (Workspace Email)
```properties
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=admin@initiateph.com
EMAIL_PASSWORD=your_password
```

#### Configuration 2: STARTTLS (Workspace Email)
```properties
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=admin@initiateph.com
EMAIL_PASSWORD=your_password
```

#### Configuration 3: Alternative Relay
```properties
EMAIL_HOST=relay-hosting.secureserver.net
EMAIL_PORT=25
EMAIL_SECURE=false
EMAIL_USER=admin@initiateph.com
EMAIL_PASSWORD=your_password
```

#### Configuration 4: Microsoft 365 (if applicable)
```properties
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=admin@initiateph.com
EMAIL_PASSWORD=your_password
```

---

### Step 5: Password Special Characters

Your current password has `$` which might cause issues in some environments.

**Try:**
1. Escape the $ character: `\$Empire08`
2. Or quote the password: `"$Empire08"`
3. Or use a simpler password without special characters for testing

Update `.env`:
```properties
# Try one of these:
EMAIL_PASSWORD=\$Empire08
# or
EMAIL_PASSWORD="$Empire08"
# or create a new simple password:
EMAIL_PASSWORD=Empire2024Test
```

---

### Step 6: Check Email Account in Control Panel

1. **Log into GoDaddy cPanel/Plesk:**
   - If you have hosting with cPanel, log in there
   - Go to **Email Accounts**
   - Find `admin@initiateph.com`

2. **Verify:**
   - Email account exists
   - No quota exceeded
   - Not suspended
   - Password is set

3. **Test in Email Client:**
   - Set up the email in Outlook/Thunderbird with same settings
   - If it works there, the password is correct

---

## Quick Diagnostic Steps

### Test 1: Can You Access Webmail?
```
Go to: https://email.godaddy.com
Login: admin@initiateph.com
Password: $Empire08
```
**If this fails** → Password is wrong, reset it

### Test 2: Check Email Product Type
```
GoDaddy Dashboard → Email & Office → Check product name
- If "Workspace Email" → Use smtpout.secureserver.net
- If "Microsoft 365" → Use smtp.office365.com
```

### Test 3: Try Simple Password
```
Create new password: Empire2024
(No special characters)
Update .env and test again
```

---

## After You Fix the Password

1. **Update `.env` with new password**
2. **Run test:** `node test-email.js`
3. **Should see:**
   ```
   ✅ Step 1: Connection successful!
   ✅ Step 2: Test email sent successfully!
   ```
4. **Check inbox** at admin@initiateph.com for test email

---

## Still Not Working?

### Contact GoDaddy Support

**Phone:** 
- US: (480) 505-8877
- 24/7 Support

**Live Chat:**
- Log into GoDaddy account
- Click "Help" or "Contact Us"
- Use live chat

**Ask them:**
1. "I need to verify my email password for admin@initiateph.com"
2. "What SMTP settings should I use for this email?"
3. "Is this a Workspace Email or Microsoft 365 email?"
4. "Can you help me reset the email password?"

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Invalid login" | Reset password in GoDaddy |
| "Authentication failed" | Verify password in webmail first |
| Special character in password | Use simple password or escape $ |
| Wrong SMTP server | Check if using Microsoft 365 |
| Account suspended | Check account status in GoDaddy |
| Quota exceeded | Check email storage in control panel |

---

## Next Steps

1. ✅ **Verify password in GoDaddy webmail**
2. ✅ **Reset password if needed (use simple one for testing)**
3. ✅ **Update `.env` with correct password**
4. ✅ **Run `node test-email.js` again**
5. ✅ **If successful, proceed with server restart**

---

## Need More Help?

See these documents:
- **GODADDY_EMAIL_SETUP.md** - Complete setup guide
- **EMAIL_QUICK_START.md** - Quick reference
- **NEXT_STEPS_EMAIL_SETUP.md** - Next steps after setup

---

**Your Current Settings:**
- Email: admin@initiateph.com
- Host: smtpout.secureserver.net
- Port: 587 (currently configured)
- Password: Needs verification ⚠️

**Action Required:** Verify/reset email password in GoDaddy and test webmail login first!
