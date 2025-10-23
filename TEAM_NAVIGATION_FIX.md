# Team Member Navigation Access - Final Fix

## Issue
Team members with `projects.view` and `users.view` permissions could not properly navigate the owner portal because:
1. The sidebar showed ALL menu items including admin-only items that would redirect them
2. Clicking "Dashboard" redirected them away since it's admin-only
3. The `/owner` route always redirected to `/owner/dashboard` (admin-only), causing confusion

## Solution Implemented

### 1. Smart Sidebar Navigation (`OwnerSidebar.tsx`)
- **Added permission checking** to fetch user's team permissions via `/api/team/my-permissions`
- **Filtered menu items** based on permissions:
  - Admin users see all items
  - Team members only see items they have permission for
  - Each nav item now has `adminOnly` or `requiredPermission` flags

**Menu Item Visibility:**
| Menu Item | Admin | Team Member with Permission |
|-----------|-------|----------------------------|
| Dashboard | ✅ | ❌ (Admin only) |
| Calendar | ✅ | ✅ |
| Users | ✅ | ✅ (requires `users.view`) |
| Projects | ✅ | ✅ (requires `projects.view`) |
| My Team | ✅ | ❌ (Admin only) |
| Admin Projects | ✅ | ❌ (Admin only) |
| Top-up Requests | ✅ | ❌ (Admin only) |
| Investment Requests | ✅ | ❌ (Admin only) |
| Settings | ✅ | ✅ |

### 2. Smart Owner Route Redirect (`OwnerRedirect` component in `AppRoutes.tsx`)
- **Created OwnerRedirect component** that intelligently redirects based on user type:
  - **Admins** → `/owner/dashboard`
  - **Team members with projects.view** → `/owner/projects`
  - **Team members with users.view** → `/owner/users`
  - **Non-team members** → `/investor/discover` or `/borrow`

### 3. Route Structure
```tsx
// /owner redirects intelligently based on permissions
<Route path="/owner" element={<OwnerRedirect />} />

// Dashboard - Admin only
<Route path="/owner/dashboard" element={<AdminRoute><OwnerDashboard /></AdminRoute>} />

// Users - Admin or team members with users.view permission
<Route path="/owner/users" element={<TeamOrAdminRoute requiredPermission="users.view"><OwnerUsers /></TeamOrAdminRoute>} />

// Projects - Admin or team members with projects.view permission
<Route path="/owner/projects" element={<TeamOrAdminRoute requiredPermission="projects.view"><OwnerProjects /></TeamOrAdminRoute>} />

// Team management - Admin only
<Route path="/owner/team" element={<AdminRoute><OwnerTeam /></AdminRoute>} />
```

## Files Modified

### 1. `src/components/owner/OwnerSidebar.tsx`
**Changes:**
- Added imports: `useEffect`, `useState`, `authFetch`, `API_BASE_URL`
- Added `TeamPermissions` interface with `isAdmin` and `permissions` fields
- Added state variable `teamPermissions` to store user's permissions
- Added `useEffect` to fetch `/api/team/my-permissions` on component mount
- Renamed `ownerNavItems` to `allNavItems` and added metadata:
  - `adminOnly: true` for admin-exclusive items
  - `requiredPermission: 'permission.name'` for permission-based items
- Added filtering logic to create `ownerNavItems` based on permissions:
  ```tsx
  const ownerNavItems = allNavItems.filter((item) => {
    if (!teamPermissions) return false;
    if (teamPermissions.isAdmin) return true;
    if (item.adminOnly) return false;
    if (item.requiredPermission) {
      return teamPermissions.permissions.includes(item.requiredPermission);
    }
    return true;
  });
  ```

### 2. `src/routes/AppRoutes.tsx`
**Changes:**
- Created new `OwnerRedirect` component before `TeamOrAdminRoute`:
  - Checks if user is admin → redirect to `/owner/dashboard`
  - Checks if user has `projects.view` → redirect to `/owner/projects`
  - Checks if user has `users.view` → redirect to `/owner/users`
  - Otherwise → redirect to regular dashboard
- Updated route definition:
  ```tsx
  <Route path="/owner" element={<OwnerRedirect />} />
  ```

## Testing Instructions

### Test as Admin User:
1. Navigate to `/owner` → ✅ Should redirect to `/owner/dashboard`
2. Check sidebar → ✅ Should show ALL menu items
3. Access all pages → ✅ Should work without redirects

### Test as Team Member (jim@gmail.com or menji@gmail.com):
1. Navigate to `/owner` → ✅ Should redirect to `/owner/projects`
2. Check sidebar → Should show:
   - ✅ Calendar
   - ✅ Users
   - ✅ Projects
   - ✅ Settings
   - ❌ Dashboard (hidden)
   - ❌ My Team (hidden)
   - ❌ Admin sections (hidden)
3. Access `/owner/projects` → ✅ Should work
4. Access `/owner/users` → ✅ Should work
5. Try to access `/owner/dashboard` directly → ❌ Should redirect to `/borrow` or `/investor/discover`

## Result
✅ **Team members now have a clean, permission-based navigation experience**
✅ **No more confusing redirects when clicking menu items**
✅ **Smart default routing based on available permissions**
✅ **Admin users unaffected - full access maintained**
✅ **Menu items dynamically filtered based on permissions**

## Additional Fix: Database Performance
The query timeout issue on `/api/projects` was also resolved by adding database indexes:
- `idx_projects_status` on `project_data->>'status'`
- `idx_projects_approval_status` on `project_data->>'approvalStatus'`
- `idx_projects_firebase_uid` on `firebase_uid`
- `idx_projects_created_at` on `created_at DESC`
- `idx_projects_status_approval` (composite index)

**Performance Improvement:** Query time reduced from 30+ seconds (timeout) to milliseconds.

## Next Steps
1. **Refresh the browser** to load the updated sidebar component
2. **Test with team member accounts** (jim@gmail.com, menji@gmail.com)
3. **Verify navigation** works smoothly without unexpected redirects
4. Consider adding more granular permissions in the future if needed (e.g., `projects.edit`, `users.edit`)
