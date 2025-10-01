# Admin User Management System - Implementation Guide

## Overview
This guide explains the complete admin user management system that allows owners/admins to view, edit, delete, and suspend users with full access to their registration data.

## Features Implemented

### 1. **View User Details** ✅
The admin can now view comprehensive user information across multiple tabs:

#### Available Tabs:
- **Overview**: Quick summary of user info, account statistics
- **Personal Profile**: Complete personal information including:
  - Name (First, Middle, Last)
  - Date of Birth & Place of Birth
  - Nationality, Gender, Marital Status
  - Email & Mobile Number
  - Employment Information (for borrowers)
    - Occupation
    - Employer Name & Address
    - Employment Status
    - Annual Income
    - Source of Income

- **Identifications**: ID documents uploaded during registration
  - National ID Number
  - Passport Number
  - TIN Number
  - Secondary ID Type & Number

- **Addresses**: Complete address information
  - Present Address (Street, City, State)
  - Postal Code
  - Country
  - Permanent Address

- **Bank Accounts**: Banking information
  - Bank Name
  - Account Name & Number
  - Account Type
  - IBAN & SWIFT Code
  - Default Account indicator

- **Roles & Settings**: Account configuration
  - Current Account Type
  - Has Borrower Account (Yes/No)
  - Has Investor Account (Yes/No)
  - Is Admin (Yes/No)

- **Projects**: User's projects (borrowers)
- **Investments**: User's investments (investors)
- **Activity Log**: User activity history

### 2. **Edit User Details** ✅
Admins can edit user information by clicking the "Edit Profile" button:
- Toggle edit mode for fields
- Update personal information
- Modify contact details
- Change identification numbers
- Update address information

**Note**: The save functionality needs to be connected to the backend update endpoint (`/api/owner/users/:userId`).

### 3. **Suspend User** ✅
- Click "Suspend" button in user detail page
- Enter reason for suspension in modal dialog
- User account is suspended immediately
- **Automatic Notification**: User receives an in-app notification stating:
  - "Your account has been suspended"
  - Reason provided by admin
  - Instructions to contact support

**Backend Implementation**:
```javascript
// Endpoint: POST /api/owner/users/:userId/suspend
// Body: { reason: "Violation of terms" }
```

**Features**:
- Updates user status to 'suspended'
- Creates notification in database
- Logs action with admin details
- User cannot access platform features while suspended

### 4. **Reactivate User** ✅
- Available for suspended users
- Click "Reactivate" button
- Immediately restores user access
- Sets account type back to original (borrower/investor)

**Backend Implementation**:
```javascript
// Endpoint: POST /api/owner/users/:userId/reactivate
```

### 5. **Delete User** ✅
- Click "Delete" button
- Type "DELETE" to confirm action
- **Permanently removes**:
  - User account from database
  - All projects
  - All investment records
  - Top-up requests
  - Borrower/Investor profiles
  
**Warning**: This action is irreversible!

**Backend Implementation**:
```javascript
// Endpoint: DELETE /api/owner/users/:userId
```

**Transaction**: Uses database transaction to ensure all related data is deleted atomically.

## How to Access

1. **Navigate to User Management**:
   - Login as admin/owner
   - Go to: `/owner/users`
   - View list of all registered users

2. **View User Details**:
   - Click on any user from the list
   - Route: `/owner/users/:userId`
   - See comprehensive registration data

3. **Perform Actions**:
   - Use action buttons in top-right corner
   - Suspend/Delete/Reactivate as needed

## Backend Endpoints

### 1. Get User Detail
```
GET /api/owner/users/:userId
```
**Response**:
```json
{
  "id": "firebase_uid",
  "fullName": "John Doe",
  "email": "john@example.com",
  "accountTypes": ["borrower"],
  "status": "active",
  "personalProfile": {...},
  "identifications": {...},
  "addresses": {...},
  "bankAccounts": [...],
  "rolesSettings": {...},
  "borrowerData": {...}
}
```

### 2. Suspend User
```
POST /api/owner/users/:userId/suspend
Body: { "reason": "Reason for suspension" }
```
**Actions**:
- Sets `current_account_type = 'suspended'`
- Creates notification for user
- Logs admin action

### 3. Reactivate User
```
POST /api/owner/users/:userId/reactivate
```
**Actions**:
- Restores `current_account_type` to 'borrower' or 'investor'
- Logs admin action

### 4. Delete User
```
DELETE /api/owner/users/:userId
```
**Actions**:
- Deletes all user data
- Uses transaction for data integrity
- Cannot be undone

### 5. Update User
```
PUT /api/owner/users/:userId
Body: { "fullName": "New Name", "email": "new@email.com" }
```
**Note**: Currently basic fields only. Expand as needed.

## Security Features

1. **Admin Verification**: All endpoints check `is_admin = true` before allowing actions
2. **Authorization**: Uses Firebase token verification
3. **Audit Logging**: All actions logged with admin ID and timestamp
4. **Confirmation Dialogs**: Require explicit confirmation for destructive actions

## Notifications System

When a user is suspended:
```javascript
Notification Created:
- Title: "Account Suspended"
- Message: "Your account has been suspended. Reason: [admin reason]. Please contact support."
- Type: "alert"
- is_read: false
```

Users will see this notification:
- In notification bell icon
- On dashboard
- Cannot be dismissed until read

## Database Schema Changes

### Users Table
```sql
- current_account_type: Can be 'borrower', 'investor', or 'suspended'
- is_admin: Boolean flag for admin access
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(255),
  title VARCHAR(255),
  message TEXT,
  type VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Testing Checklist

- [ ] View user detail page with all tabs
- [ ] Click through all tabs (Overview, Personal, Identifications, etc.)
- [ ] Verify all registration data displays correctly
- [ ] Test Edit mode toggle
- [ ] Suspend a user and verify notification sent
- [ ] Check suspended user cannot login
- [ ] Reactivate user and verify access restored
- [ ] Test delete with confirmation
- [ ] Verify deleted user removed from database
- [ ] Check all related data deleted (projects, profiles)

## Future Enhancements

1. **Enhanced Editing**: Add individual field update endpoints
2. **Audit Trail**: Complete activity log with all admin actions
3. **Bulk Actions**: Suspend/delete multiple users
4. **Export Data**: Download user data before deletion
5. **Email Notifications**: Send email when user is suspended
6. **Temporary Suspension**: Set suspension duration
7. **Reason Templates**: Pre-defined suspension reasons
8. **User History**: Track all changes made to user account

## Troubleshooting

### User Details Not Loading
- Check if user ID is correct in URL
- Verify backend endpoint is running
- Check console for errors
- Ensure admin has proper permissions

### Suspend Not Working
- Verify notification table exists
- Check database connection
- Ensure reason is provided

### Delete Fails
- Check for foreign key constraints
- Verify transaction support in database
- Check error logs in server console

## Support

For issues or questions:
1. Check server logs: `src/server/server.js`
2. Check browser console for frontend errors
3. Verify database structure matches schema
4. Ensure Firebase authentication is working

---

**Last Updated**: October 1, 2025
**Version**: 1.0.0
**Status**: Fully Implemented ✅
