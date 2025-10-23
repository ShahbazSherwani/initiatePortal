# Team Role Assignment Email Notification

## Overview
Added email notification functionality that automatically sends an email to team members when their role is assigned or updated in the Owner Dashboard.

## Implementation Summary

### Files Modified
1. **`src/server/server.js`**
   - Added new function: `sendRoleAssignmentEmail()`
   - Integrated email sending into role update endpoint
   - Email sent when role/permissions are updated via `/api/owner/team/:memberId/role`

## Features

### Email Sent When:
- ✅ Team member's role is updated by admin/owner
- ✅ Team member's permissions are changed
- ✅ User has already accepted their team invitation (has `member_uid`)

### Email Content Includes:
- Owner's name (who made the change)
- New role assignment with badge styling
- Updated permissions list
- Direct link to dashboard
- Professional HTML template with Initiate PH branding

### Email Template Design
- **Header**: Green gradient (#0C4B20 to #8FB200) with role update icon
- **Role Badge**: Prominent display of new role in uppercase
- **Permissions List**: Formatted list of all assigned permissions
- **Call-to-Action**: "Go to Dashboard" button
- **Footer**: Company information and address

## Technical Details

### Function: `sendRoleAssignmentEmail(email, ownerName, role, permissions)`

**Parameters:**
- `email` (string): Team member's email address
- `ownerName` (string): Name of the admin/owner who made the change
- `role` (string): New role assigned (admin, editor, viewer, member)
- `permissions` (array): List of permission keys

**Returns:**
- `true` if email sent successfully or SendGrid not configured
- `false` if email sending fails

**Behavior:**
- Gracefully handles missing SendGrid configuration
- Logs detailed information about email status
- Returns success even if SendGrid not configured (doesn't block role update)
- Formats permissions in human-readable format

### Integration Point

**Endpoint:** `PUT /api/owner/team/:memberId/role`

```javascript
// After updating role and permissions in database
if (memberDetails.rows.length > 0 && memberDetails.rows[0].member_uid) {
  const memberUid = memberDetails.rows[0].member_uid;
  const memberEmail = memberDetails.rows[0].email;

  // Create in-app notification
  await db.query(`INSERT INTO notifications ...`);

  // Send email notification
  await sendRoleAssignmentEmail(memberEmail, ownerName, role, permissions);
}
```

### Dual Notification System

When a role is updated, the user receives **TWO notifications**:

1. **In-App Notification** (Database: `notifications` table)
   - Visible in notification dropdown
   - Shows in dashboard notification card
   - Type: `team_update`
   - Title: "Your Role Has Been Updated"

2. **Email Notification** (via SendGrid)
   - Sent to team member's email
   - Detailed information about role and permissions
   - Direct link to platform

## SendGrid Configuration

### Required Environment Variables

Add to `.env` file:

```properties
# SendGrid Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@initiate.ph
FRONTEND_URL=https://your-production-url.com
```

### How to Get SendGrid API Key

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Navigate to Settings → API Keys
3. Click "Create API Key"
4. Select "Full Access" or "Restricted Access" with Mail Send permission
5. Copy the API key and add to `.env`

### Email Sender Setup

1. Verify your sender email domain in SendGrid
2. Complete domain authentication
3. Set `SENDGRID_FROM_EMAIL` to your verified sender email
4. Recommended: `noreply@initiate.ph` or `notifications@initiate.ph`

## Testing

### Without SendGrid (Local Development)

If `SENDGRID_API_KEY` is not configured:
- Email function returns success without sending
- Console logs show what email would have been sent
- Role update still completes successfully
- User still gets in-app notification

**Console Output:**
```
⚠️ SendGrid not configured. Role assignment email not sent to: user@example.com
📧 Email would notify: user@example.com about role: admin
```

### With SendGrid (Production)

When properly configured:
- Email sends automatically on role update
- Console logs confirmation
- User receives both email and in-app notification

**Console Output:**
```
✅ Role assignment email sent to user@example.com
📬 Notification sent to user abc123 about role update to admin
📧 Email sent to user@example.com about role update
```

## Sample Email Preview

```html
Subject: Your team role has been updated - Initiate PH

Hello!

John Doe has updated your role on the Initiate PH platform.

Your New Role:
[ADMIN]

Updated Permissions:
• Projects - View
• Projects - Edit
• Projects - Approve
• Users - View
• Users - Edit

These changes are effective immediately.

[Go to Dashboard]

If you have any questions, please contact your team administrator.
```

## Error Handling

### Email Send Failures
- Errors are caught and logged
- Role update continues even if email fails
- In-app notification still created
- User can access platform with new role

### Common Issues

1. **SendGrid API Key Invalid**
   ```
   ❌ Failed to send role assignment email: Unauthorized
   ```
   **Solution:** Verify API key in `.env` file

2. **Sender Not Verified**
   ```
   ❌ Failed to send role assignment email: Sender not verified
   ```
   **Solution:** Verify sender domain in SendGrid dashboard

3. **Rate Limit Exceeded**
   ```
   ❌ Failed to send role assignment email: Rate limit exceeded
   ```
   **Solution:** Upgrade SendGrid plan or wait for rate limit reset

## Security Considerations

- Email only sent to verified team members (those with `member_uid`)
- No sensitive data included in email content
- Uses secure HTTPS links
- SendGrid API key stored in environment variables (not in code)
- Email addresses validated before sending

## Benefits

### For Team Members
- ✅ Immediate notification of role changes
- ✅ Clear understanding of new permissions
- ✅ Direct access link to platform
- ✅ Professional communication from platform

### For Admins/Owners
- ✅ Automated notification process
- ✅ No manual email sending required
- ✅ Audit trail of role changes
- ✅ Consistent branding in communications

### For Platform
- ✅ Improved user engagement
- ✅ Better transparency
- ✅ Reduced support inquiries
- ✅ Professional image

## Future Enhancements (Optional)

1. **Email Templates Library**
   - Store templates in separate files
   - Support multiple languages
   - Easy template updates without code changes

2. **Email Preferences**
   - Allow users to opt-out of certain emails
   - Email frequency settings
   - Digest vs immediate notifications

3. **Rich Notifications**
   - Include team logo in email
   - Add team member photos
   - Show permission comparison (old vs new)

4. **Analytics**
   - Track email open rates
   - Monitor click-through rates
   - Measure engagement with role updates

## Current Status

✅ **Implemented:**
- Email sending function created
- Integrated into role update endpoint
- HTML email template with branding
- Graceful fallback for missing SendGrid
- Console logging for debugging

⚠️ **Pending:**
- SendGrid API key configuration in `.env`
- Sender domain verification
- Production testing with real emails

## Next Steps

1. **Configure SendGrid** (if not already done)
   ```bash
   # Add to .env file
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   SENDGRID_FROM_EMAIL=noreply@initiate.ph
   FRONTEND_URL=https://initiate.ph
   ```

2. **Test Email Sending**
   - Update a team member's role in Owner Dashboard
   - Check console for email sending confirmation
   - Verify email received in inbox

3. **Monitor Email Delivery**
   - Check SendGrid dashboard for delivery stats
   - Monitor bounce/spam rates
   - Adjust templates if needed

## Support

For issues related to:
- **Email not sending**: Check SendGrid API key and sender verification
- **Email going to spam**: Verify SPF/DKIM records in SendGrid
- **Template issues**: Modify `sendRoleAssignmentEmail()` function in `server.js`

---

**Last Updated:** ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
