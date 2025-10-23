# Team Member Backend Permission Fix

## Issue
Team members with `users.view` and `projects.view` permissions were able to access routes on the frontend (thanks to `TeamOrAdminRoute`), but the backend API endpoints were blocking them with 403 errors because they only checked for admin status.

### Symptoms:
- Users page stuck on "Loading users..."
- Projects page potentially stuck on loading
- Backend returns 403 Unauthorized despite frontend route access
- Frontend component conditional logic (e.g., `if (profile?.isAdmin)`) preventing data fetch

## Root Cause

### Backend Endpoints Checked Admin Only:
```javascript
// ❌ OLD CODE - Blocked team members
const adminCheck = await db.query(
  'SELECT is_admin FROM users WHERE firebase_uid = $1',
  [firebase_uid]
);

if (!adminCheck.rows[0]?.is_admin) {
  return res.status(403).json({ error: 'Access denied' });
}
```

### Frontend Components Checked Admin Only:
```typescript
// ❌ OLD CODE - Prevented team members from fetching
useEffect(() => {
  if (user && profile?.isAdmin) {  // Team members blocked here!
    fetchUsers();
  }
}, [user, profile]);
```

## Solution Implemented

### 1. Backend Permission Checks (server.js)

Updated **3 endpoints** to check for both admin AND team member permissions:

#### `/api/owner/users` (Line 3760)
```javascript
const isAdmin = adminCheck.rows.length > 0 && adminCheck.rows[0].is_admin;

// ✅ NEW: Also check for team member permissions
if (!isAdmin) {
  const teamPermCheck = await db.query(`
    SELECT tmp.permission_key
    FROM team_members tm
    JOIN team_member_permissions tmp ON tm.id = tmp.team_member_id
    WHERE tm.member_uid = $1 
      AND tm.status = 'active'
      AND tmp.can_access = true
      AND (tmp.permission_key = 'users.view' OR tmp.permission_key = 'users.edit')
  `, [firebase_uid]);
  
  if (teamPermCheck.rows.length === 0) {
    return res.status(403).json({ error: 'Access denied' });
  }
}
```

#### `/api/owner/projects` (Line 6395)
```javascript
const isAdmin = adminCheck.rows[0]?.is_admin;

// ✅ NEW: Also check for team member permissions
if (!isAdmin) {
  const teamPermCheck = await db.query(`
    SELECT tmp.permission_key
    FROM team_members tm
    JOIN team_member_permissions tmp ON tm.id = tmp.team_member_id
    WHERE tm.member_uid = $1 
      AND tm.status = 'active'
      AND tmp.can_access = true
      AND (tmp.permission_key = 'projects.view' OR tmp.permission_key = 'projects.edit')
  `, [req.uid]);
  
  if (teamPermCheck.rows.length === 0) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
}
```

#### `/api/owner/users` Duplicate (Line 6733)
Same fix applied to the duplicate endpoint (should be removed in future refactoring).

### 2. Frontend Component Updates (OwnerUsers.tsx)

**File: `src/screens/owner/OwnerUsers.tsx`**

```typescript
// ❌ OLD CODE
useEffect(() => {
  if (user && profile?.isAdmin) {  // Blocked team members!
    fetchUsers();
  }
}, [user, profile]);

// ✅ NEW CODE
useEffect(() => {
  // Fetch users if authenticated (route guard handles permission check)
  if (user && profile) {
    fetchUsers();
  }
}, [user, profile]);
```

**Why this works:**
- The `TeamOrAdminRoute` component already checked permissions before allowing access
- No need to duplicate permission logic in the component
- Component trusts that if it's rendered, the user has permission

## Permission Logic

### How It Works Now:

1. **Frontend Route Guard** (`TeamOrAdminRoute`):
   - Checks `/api/team/my-permissions` endpoint
   - Grants access if user is admin OR has required permission
   - Redirects if no access

2. **Frontend Component**:
   - Simply checks if user is authenticated
   - Fetches data (route guard already verified permission)

3. **Backend Endpoint**:
   - Double-checks admin status OR team member permission
   - Returns data if authorized
   - Returns 403 if not authorized (defense in depth)

## Endpoints Updated

| Endpoint | Line | Permission Check Added |
|----------|------|------------------------|
| GET `/api/owner/users` | 3760 | `users.view` OR `users.edit` |
| GET `/api/owner/projects` | 6395 | `projects.view` OR `projects.edit` |
| GET `/api/owner/users` (dup) | 6733 | `users.view` OR `users.edit` |

## Files Modified

1. **`src/server/server.js`**:
   - Line 3760-3790: Updated `/api/owner/users` permission check
   - Line 6395-6415: Updated `/api/owner/projects` permission check
   - Line 6733-6753: Updated duplicate `/api/owner/users` permission check

2. **`src/screens/owner/OwnerUsers.tsx`**:
   - Line 69: Removed `profile?.isAdmin` check from useEffect

## Testing Instructions

1. **Restart the server** (changes won't apply until restart):
   ```powershell
   # Stop current server (Ctrl+C)
   cd src/server
   node server.js
   ```

2. **Test as Team Member (jim@gmail.com)**:
   - Navigate to `/owner/users`
   - Should load user list successfully (no more "Loading users..." stuck state)
   - Navigate to `/owner/projects`
   - Should load projects from database

3. **Check server logs**:
   ```
   ✅ Team member access verified for user: O2wPRdzv6OfOWdLrR1lGnbdyXSn2
   📊 Found 53 users in database
   ```

4. **Check browser console**:
   - Should see successful API responses (200 status)
   - No 403 Unauthorized errors

## Expected Behavior

### Before (Broken):
```
Frontend: TeamOrAdminRoute ✅ Allow access
Component: if (profile?.isAdmin) ❌ Block fetch
Backend: Check admin only ❌ Return 403
Result: Stuck on "Loading..."
```

### After (Fixed):
```
Frontend: TeamOrAdminRoute ✅ Allow access
Component: if (profile) ✅ Fetch data
Backend: Check admin OR permission ✅ Return data
Result: Data loads successfully! ✅
```

## Future Improvements

1. **Remove duplicate endpoint**: Line 6733 `/api/owner/users` is a duplicate of line 3760
2. **Create permission middleware**: Extract permission checking into reusable middleware
3. **Centralize permission logic**: Create a `checkPermission(uid, requiredPermission)` helper function

## Note on Edit Permissions

The backend now accepts BOTH `.view` and `.edit` permissions:
- `users.view` → Can view users
- `users.edit` → Can view AND edit users (implicitly grants view access)
- Same logic for `projects.view` and `projects.edit`

This matches the frontend logic where edit permissions grant access to view-only routes.
