# Multiple Issues Summary

## Issues Identified:

### 1. **Query Timeout Issue** (CRITICAL - Blocking everything)
**Problem:** `/api/projects` queries are timing out despite indexes being created
**Cause:** The indexes might not be created properly, or there's a table lock
**Evidence:** 
```
Error fetching projects: Error: Query read timeout
Projects query: SELECT p.id, p.firebase_uid, p.project_data...
```

**Solution:** Need to verify indexes were created and analyze query performance

### 2. **Jim's Role Confusion**
**Problem:** Jim is assigned as "admin" role in team_members, but `is_admin=false` in users table
**Cause:** Two different admin systems:
- `users.is_admin` = System/Owner admin (full access)
- `team_members.role = 'admin'` = Team admin (still needs permissions)

**Current State:**
- Jim has `is_admin=false` in users table
- Jim has `role='admin'` in team_members table
- Jim has 15 permissions granted as team member

**Result:** Jim is treated as team member, not system admin

### 3. **Sidebar Shows Old Permissions**
**Problem:** When you change user roles, sidebar still shows old permission-based menu items
**Cause:** Frontend caches `/api/team/my-permissions` response
**Solution:** Need to refresh page or clear cache after role changes

### 4. **Hardcoded Projects Showing**
**Problem:** Projects showing hardcoded data instead of database data
**Cause:** Query timeout causes frontend to fall back to mock data in catch block
**Evidence:**
```typescript
} catch (error) {
  console.error('Error fetching projects:', error);
  toast.error('Failed to load projects');
  
  // Mock data for development  ← This is showing instead
  setProjects([...hardcoded data...]);
}
```

### 5. **No Notifications for Role Assignment**
**Problem:** When you assign someone a role, they don't get notified
**Cause:** Team invitation/assignment doesn't create notification records
**Solution:** Need to add notification creation to team member update endpoint

## Priority Actions:

### IMMEDIATE (Fix query timeout first):

1. **Check if indexes exist:**
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'projects' 
AND schemaname = 'public';
```

2. **If indexes don't exist, recreate them:**
```powershell
node add-project-indexes.js
```

3. **Restart server** to apply all changes

### THEN (Fix Jim's admin status):

**Option A: Make Jim a TRUE system admin**
```sql
UPDATE users 
SET is_admin = true 
WHERE firebase_uid = 'O2wPRdzv6OfOWdLrR1lGnbdyXSn2';

-- Then delete his team member records:
DELETE FROM team_member_permissions 
WHERE team_member_id IN (
  SELECT id FROM team_members 
  WHERE member_uid = 'O2wPRdzv6OfOWdLrR1lGnbdyXSn2'
);

DELETE FROM team_members 
WHERE member_uid = 'O2wPRdzv6OfOWdLrR1lGnbdyXSn2';
```

**Option B: Keep Jim as team member with full permissions**
- Current setup with 15 permissions
- Will work once query timeout is fixed
- Not recommended if you want him to manage team

## Root Cause Chain:

```
Query Timeout 
  ↓
Frontend catches error
  ↓
Falls back to hardcoded data
  ↓
User sees wrong data + thinks permissions are wrong
  ↓
Actually, permissions are working but data isn't loading
```

## Files to Check:

1. **Query performance:** Run `node add-project-indexes.js` again
2. **Jim's status:** Run script I'll create next
3. **Notifications:** Need to add notification creation code
4. **Frontend cache:** Hard refresh browser (Ctrl+Shift+R)

## Next Steps:

1. ✅ I'll create a script to make Jim a true admin
2. ✅ I'll create a script to verify/recreate indexes
3. ✅ I'll show you where to add notifications for role changes
4. ⏳ You decide: Jim as system admin OR team member?
