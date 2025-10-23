# Quick Reference Card - Initiate PH Email Notifications

## 📧 Email Notification System

### When Emails Are Sent

| Event | Email Type | Recipient | Template |
|-------|-----------|-----------|----------|
| Team member invited | Team Invitation | New member | `sendTeamInvitationEmail()` |
| Role assigned/updated | Role Assignment | Existing member | `sendRoleAssignmentEmail()` |
| Invitation resent | Team Invitation | Pending member | `sendTeamInvitationEmail()` |

### Email Content

**Team Invitation Email:**
- Subject: "You've been invited to join {ownerName}'s team"
- Contains: Invitation link, Role badge, Expiry notice (7 days)
- Call-to-action: "Accept Invitation" button

**Role Assignment Email:**
- Subject: "Your team role has been updated - Initiate PH"
- Contains: New role, Updated permissions list
- Call-to-action: "Go to Dashboard" button

### Configuration

```bash
# .env file
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@initiate.ph
FRONTEND_URL=https://initiate.ph
```

### Testing Commands

```bash
# Start server
cd src/server
node server.js

# Check console for:
✅ Role assignment email sent to user@example.com
📬 Notification sent to user abc123
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| No email received | 1. Check spam folder<br>2. Verify SendGrid API key<br>3. Check console logs |
| "Unauthorized" error | Verify API key has Mail Send permission |
| "Sender not verified" | Complete sender verification in SendGrid |
| Emails going to spam | Complete domain authentication (SPF/DKIM) |

### Quick Test

1. Login as admin to Owner Dashboard
2. Go to Team Management
3. Update any team member's role
4. Check:
   - ✅ Console shows "Email sent to..."
   - ✅ User receives email
   - ✅ In-app notification created

### Important URLs

- **SendGrid Dashboard**: https://app.sendgrid.com/
- **Email Activity**: Settings → Activity Feed
- **API Keys**: Settings → API Keys
- **Domain Auth**: Settings → Sender Authentication

---

## 📋 Legal Document Popups

### Modal Sequence

1. **Risk Assessment** (existing)
2. **Terms & Conditions** (new)
3. **Privacy Policy** (new)

### Triggers

- First visit to `/login` screen
- First visit to `/register` screen
- Cleared browser sessionStorage

### Session Storage Keys

```javascript
// Login screen
hasSeenRiskStatement_login
hasSeenTerms_login
hasSeenPrivacy_login

// Register screen
hasSeenRiskStatement_register
hasSeenTerms_register
hasSeenPrivacy_register
```

### Clear for Testing

```javascript
// Browser console
sessionStorage.clear();
// Then refresh page
```

### User Requirements

For each modal:
1. ✅ Scroll to bottom (if content is long)
2. ✅ Check acknowledgment checkbox
3. ✅ Click "I Accept & Continue"

### Content Sources

- **Terms**: Official INITIATE PH T&C (17 sections)
- **Privacy**: Data Privacy Act 2012 compliant notice (9 sections)
- **Contact**: dpo@initiate.ph

---

## 🔑 Quick Commands

```bash
# Restart server
cd src/server
node server.js

# Check database connection
# Look for: "🚀 Server is ready to accept connections"

# Test SendGrid
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"personalizations":[{"to":[{"email":"test@example.com"}]}],"from":{"email":"noreply@initiate.ph"},"subject":"Test","content":[{"type":"text/plain","value":"Test"}]}'
```

---

## 📱 Contact Information

**Data Protection Officer**
- Name: Boncarlo R. Uneta
- Email: dpo@initiate.ph

**Company Address**
- Unit 1915 Capital House
- 9th Avenue, corner 34th
- Bonifacio Global City
- Taguig City

---

## ✅ Implementation Checklist

- [x] Terms & Conditions modal created
- [x] Privacy Policy modal created
- [x] Sequential popup flow implemented
- [x] Email notification function created
- [x] Role update endpoint integrated
- [ ] SendGrid API key configured
- [ ] Sender domain verified
- [ ] Production testing completed

---

**For detailed documentation, see:**
- `IMPLEMENTATION_SUMMARY.md`
- `TERMS_PRIVACY_IMPLEMENTATION.md`
- `TEAM_ROLE_EMAIL_IMPLEMENTATION.md`
- `SENDGRID_SETUP_GUIDE.md`
