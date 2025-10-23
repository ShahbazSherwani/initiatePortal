# SendGrid Email Setup Guide for Initiate PH

## Quick Setup (5 minutes)

### Step 1: Create SendGrid Account
1. Go to [https://sendgrid.com/](https://sendgrid.com/)
2. Click "Start for Free" or "Sign Up"
3. Complete registration
4. Verify your email address

### Step 2: Create API Key
1. Log into SendGrid dashboard
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Enter a name: "Initiate PH Production" or "Initiate PH Development"
5. Select permission level:
   - For production: **Full Access**
   - For development: **Restricted Access** → Enable only "Mail Send"
6. Click **Create & View**
7. **IMPORTANT:** Copy the API key immediately (it won't be shown again)

### Step 3: Verify Sender Domain (Recommended for Production)

#### Option A: Single Sender Verification (Quick - for testing)
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in your email: `noreply@initiate.ph`
4. Fill in sender details
5. Click **Create**
6. Check your email and verify

#### Option B: Domain Authentication (Recommended - for production)
1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Select your DNS host (e.g., Cloudflare, GoDaddy)
4. Enter domain: `initiate.ph`
5. Copy the DNS records provided
6. Add DNS records to your domain provider:
   - CNAME records for domain authentication
   - CNAME records for link branding
7. Click **Verify** in SendGrid
8. Wait for verification (can take up to 48 hours)

### Step 4: Update Environment Variables

Add these to your `.env` file:

```properties
# SendGrid Email Configuration
SENDGRID_API_KEY=SG.your_actual_api_key_here
SENDGRID_FROM_EMAIL=noreply@initiate.ph
FRONTEND_URL=https://initiate.ph
```

**For Local Development:**
```properties
SENDGRID_API_KEY=SG.your_actual_api_key_here
SENDGRID_FROM_EMAIL=noreply@initiate.ph
FRONTEND_URL=http://localhost:5173
```

### Step 5: Test Email Sending

1. Restart your server:
   ```bash
   cd src/server
   node server.js
   ```

2. In Owner Dashboard, update a team member's role

3. Check console output:
   ```
   ✅ Role assignment email sent to user@example.com
   ```

4. Check inbox for email

## SendGrid Dashboard Features

### Monitor Email Activity
- **Activity Feed**: Real-time view of all sent emails
- **Statistics**: Open rates, click rates, bounce rates
- **Suppressions**: Manage bounces, spam reports, unsubscribes

### View Email Status
1. Go to **Activity** → **Email Activity**
2. Search by recipient email
3. View delivery status, opens, clicks

### Check Reputation
- **Settings** → **Sender Authentication**
- **Account Details** → **Sender Score**
- Maintain good sender reputation by:
  - Sending to valid emails only
  - Avoiding spam triggers
  - Monitoring bounce rates

## Free Tier Limitations

**SendGrid Free Plan:**
- ✅ 100 emails/day
- ✅ Email API access
- ✅ SMTP relay
- ✅ Email validation API (limited)
- ❌ Dedicated IP
- ❌ Advanced statistics

**For Production:**
- Consider **Essentials Plan** ($19.95/mo): 50,000 emails/mo
- Or **Pro Plan** ($89.95/mo): 1,500,000 emails/mo

## Common Issues & Solutions

### Issue 1: API Key Not Working
**Error:** `Unauthorized` or `Forbidden`

**Solution:**
- Verify API key is copied correctly (no extra spaces)
- Ensure API key has "Mail Send" permission
- Create a new API key if needed

### Issue 2: Emails Going to Spam
**Solution:**
- Complete domain authentication
- Add SPF and DKIM records
- Use verified sender email
- Avoid spam trigger words
- Include unsubscribe link (for marketing emails)

### Issue 3: Sender Not Verified
**Error:** `Sender identity not verified`

**Solution:**
- Complete Single Sender Verification OR
- Complete Domain Authentication
- Use only verified sender emails

### Issue 4: Daily Limit Exceeded
**Error:** `Daily sending quota exceeded`

**Solution:**
- Wait 24 hours for reset OR
- Upgrade to paid plan
- Monitor daily usage in SendGrid dashboard

## Email Template Testing

### Test Email Locally
```javascript
// Quick test in server.js
const testEmail = async () => {
  await sendRoleAssignmentEmail(
    'your-test-email@gmail.com',
    'Admin User',
    'admin',
    ['projects.view', 'projects.edit', 'users.view']
  );
};

// Call after server starts
testEmail();
```

### Preview Email in Browser
1. Copy HTML from `sendRoleAssignmentEmail()` function
2. Save as `test-email.html`
3. Open in browser
4. Test responsive design

## Security Best Practices

### Protect Your API Key
- ❌ Never commit `.env` file to Git
- ❌ Never share API key publicly
- ❌ Never hardcode API key in source code
- ✅ Use environment variables only
- ✅ Rotate API keys periodically
- ✅ Use different keys for dev/staging/prod

### Add to `.gitignore`
```
.env
.env.local
.env.production
```

### Verify `.env` is ignored
```bash
git status
# .env should NOT appear in untracked files
```

## Production Checklist

Before deploying to production:

- [ ] SendGrid account created
- [ ] API key generated (Full Access)
- [ ] Domain authenticated (SPF/DKIM records added)
- [ ] Sender email verified
- [ ] Environment variables set in production
- [ ] Test emails sent successfully
- [ ] Email template reviewed (no typos, correct branding)
- [ ] Links point to production URL
- [ ] Monitoring/alerts configured in SendGrid
- [ ] Backup plan for email service downtime

## Monitoring & Maintenance

### Daily Checks
- Monitor email delivery rates in SendGrid dashboard
- Check for bounces or spam reports
- Review error logs in server console

### Weekly Checks
- Review email engagement (opens, clicks)
- Check sender reputation score
- Update suppression lists if needed

### Monthly Checks
- Review SendGrid usage vs plan limits
- Analyze email performance metrics
- Update email templates if needed
- Rotate API keys for security

## Alternative Email Services

If SendGrid doesn't meet your needs:

1. **Mailgun** - Similar pricing, good documentation
2. **Amazon SES** - Very cheap, requires AWS setup
3. **Postmark** - Focus on transactional emails
4. **Sendinblue** - Built-in marketing features
5. **Resend** - Modern developer experience

## Support Resources

- **SendGrid Documentation**: [https://docs.sendgrid.com/](https://docs.sendgrid.com/)
- **API Reference**: [https://docs.sendgrid.com/api-reference](https://docs.sendgrid.com/api-reference)
- **Support**: [https://support.sendgrid.com/](https://support.sendgrid.com/)
- **Status Page**: [https://status.sendgrid.com/](https://status.sendgrid.com/)

## Quick Reference

### Environment Variables
```properties
SENDGRID_API_KEY=SG.xxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@initiate.ph
FRONTEND_URL=https://initiate.ph
```

### Test API Key
```bash
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [{"to": [{"email": "test@example.com"}]}],
    "from": {"email": "noreply@initiate.ph"},
    "subject": "Test Email",
    "content": [{"type": "text/plain", "value": "Test"}]
  }'
```

### Verify DNS Records
```bash
# Check SPF record
nslookup -type=TXT initiate.ph

# Check DKIM record
nslookup -type=TXT s1._domainkey.initiate.ph
```

---

Need help? Contact the development team or check the Initiate PH documentation.
