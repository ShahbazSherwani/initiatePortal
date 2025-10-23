# Editor Role Access Fix

## Issue
User "jim" has an "Editor" role with 6 permissions:
- `investments.view`
- `projects.edit`
- `projects.view`
- `users.edit`
- `users.view`
- `investments.edit`

However, the sidebar only showed Users, Projects, and Settings. The Investment Requests menu item was missing.

## Root Cause
1. **Sidebar filtering** only checked for exact permission matches (e.g., `projects.view`)
2. **Routes** only accepted single permission strings, not arrays
3. **Edit permissions** weren't considered equivalent to view permissions for route access
4. **Investment Requests** menu item was marked as `adminOnly: true` instead of checking for investment permissions

## Solution Implemented

### 1. Updated OwnerSidebar.tsx

**Changed permission structure from single to array:**
```typescript
// Before:
{ label: "Users", requiredPermission: 'users.view' }
{ label: "Projects", requiredPermission: 'projects.view' }

// After:
{ label: "Users", requiredPermissions: ['users.view', 'users.edit'] }
{ label: "Projects", requiredPermissions: ['projects.view', 'projects.edit'] }
{ label: "Investment Requests", requiredPermissions: ['investments.view', 'investments.edit'] }
```

**Updated filtering logic:**
```typescript
// Check if user has ANY of the required permissions
if (item.requiredPermissions) {
  const hasPermission = item.requiredPermissions.some(perm => 
    teamPermissions.permissions.includes(perm)
  );
  return hasPermission;
}
```

**Added detailed console logging:**
```typescript
console.log(`${hasPermission ? '✅' : '❌'} ${item.label}: Required [${item.requiredPermissions.join(', ')}], Has: [${teamPermissions.permissions.join(', ')}]`);
```

### 2. Updated TeamOrAdminRoute Component (AppRoutes.tsx)

**Added support for multiple permissions:**
```typescript
// Component now accepts both single permission and array
const TeamOrAdminRoute: React.FC<{ 
  children: JSX.Element; 
  requiredPermission?: string;
  requiredPermissions?: string[]; // NEW
}> = ({ children, requiredPermission, requiredPermissions }) => {
```

**Enhanced permission checking:**
```typescript
const permsToCheck = requiredPermissions || (requiredPermission ? [requiredPermission] : []);
const hasAnyPermission = permsToCheck.some(perm => 
  data.permissions.includes('*') || 
  data.permissions.includes(perm) ||
  // ✅ NEW: Check for edit permission if view is required
  (perm.endsWith('.view') && data.permissions.includes(perm.replace('.view', '.edit')))
);
```

**Key Logic:**
- If user has `projects.edit`, they can access routes requiring `projects.view`
- If user has `users.edit`, they can access routes requiring `users.view`
- Edit permissions are considered "higher level" than view permissions

### 3. Updated Menu Item Definitions

| Menu Item | Before | After | Jim's Access |
|-----------|--------|-------|--------------|
| Dashboard | Admin only | Admin only | ❌ No |
| Calendar | Public | Public | ✅ Yes |
| Users | `users.view` | `['users.view', 'users.edit']` | ✅ Yes (has users.edit) |
| Projects | `projects.view` | `['projects.view', 'projects.edit']` | ✅ Yes (has projects.edit) |
| My Team | Admin only | Admin only | ❌ No |
| Admin Projects | Admin only | Admin only | ❌ No |
| Top-up Requests | Admin only | Admin only | ❌ No |
| Investment Requests | Admin only ❌ | `['investments.view', 'investments.edit']` ✅ | ✅ Yes (has both) |
| Settings | Public | Public | ✅ Yes |

## Expected Result for Jim (Editor Role)

### Sidebar Should Show:
✅ Calendar
✅ Users
✅ Projects
✅ Investment Requests (NEW!)
✅ Settings

### Sidebar Should Hide:
❌ Dashboard (admin only)
❌ My Team (admin only)
❌ Admin Projects (admin only)
❌ Top-up Requests (admin only)

### Console Logs to Verify:
When jim loads the page, console should show:
```
❌ Hiding admin-only item: Dashboard
✅ Showing public item: Calendar
✅ Users: Required [users.view, users.edit], Has: [investments.view, projects.edit, projects.view, users.edit, users.view, investments.edit]
✅ Projects: Required [projects.view, projects.edit], Has: [investments.view, projects.edit, projects.view, users.edit, users.view, investments.edit]
❌ Hiding admin-only item: My Team
❌ Hiding admin-only item: Admin Projects
❌ Hiding admin-only item: Top-up Requests
✅ Investment Requests: Required [investments.view, investments.edit], Has: [investments.view, projects.edit, projects.view, users.edit, users.view, investments.edit]
✅ Showing public item: Settings
```

## Testing Instructions

1. **Refresh browser** while logged in as jim@gmail.com
2. **Check sidebar** - should now show "Investment Requests" menu item
3. **Open browser console** - verify permission checking logs
4. **Click Investment Requests** - should navigate successfully
5. **Verify other menu items** work correctly

## Files Modified
- `src/components/owner/OwnerSidebar.tsx`
  - Changed `requiredPermission` (string) to `requiredPermissions` (array)
  - Updated Investment Requests item from adminOnly to permission-based
  - Enhanced filtering logic to support arrays
  - Added detailed console logging
  
- `src/routes/AppRoutes.tsx`
  - Added `requiredPermissions` prop to TeamOrAdminRoute
  - Enhanced permission checking to support arrays
  - Added logic: edit permission grants view permission access
  - Added route access console logging

## Future Enhancements
Consider creating permission hierarchy:
- `*.admin` → Full access to that resource
- `*.edit` → Can edit and view
- `*.view` → Can only view
- `*.delete` → Can delete (requires edit)
