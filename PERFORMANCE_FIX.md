# Performance Fix - Database Connection Pool Optimization

## Issues Identified

### 1. **Slow Projects Query (118 seconds)**
**Symptoms:**
- Projects query taking 118,775ms (118 seconds)
- Statement timeout errors (code 57014)
- "Connection terminated unexpectedly" errors
- Calendar API being called 4 times simultaneously

**Root Cause:**
The database connection pool was being exhausted due to:
- Too small max connection limit (20 connections)
- Too short statement timeout (30 seconds)
- Multiple simultaneous requests competing for connections
- Connection timeout occurring before queries could complete

### 2. **Navbar Not Hidden on Project Details**
**Symptoms:**
- Navbar showing when viewing individual project details
- Inconsistent with owner portal and admin paths

**Root Cause:**
The `hideNavbarPaths` logic only checked for exact path matches and `/owner/users/` prefix, but didn't check for project detail paths like `/owner/projects/:id` or `/projects/:id`.

## Fixes Applied

### 1. **Connection Pool Optimization**

**File:** `src/server/server.js` (Lines 153-165)

**Changes:**
```javascript
// BEFORE
max: 20,                    // Too small for concurrent requests
statement_timeout: 30000,   // 30 seconds - too short for large queries
connectionTimeoutMillis: 10000,  // 10 seconds

// AFTER
max: 30,                    // Increased for better concurrency
statement_timeout: 120000,  // 120 seconds - allow slower queries
connectionTimeoutMillis: 15000,  // 15 seconds - more time to get connection
```

**Why This Helps:**
- **Increased max connections (20 → 30):** Allows more concurrent requests without blocking
- **Longer statement timeout (30s → 120s):** Prevents timeouts on slow queries
- **Longer connection timeout (10s → 15s):** More time to acquire a connection from the pool

### 2. **Navbar Visibility Fix**

**File:** `src/layouts/MainLayout.tsx` (Lines 10-15)

**Changes:**
```tsx
// BEFORE
const shouldHideNavbar = hideNavbarPaths.includes(location.pathname) || 
                        location.pathname.startsWith('/owner/users/');

// AFTER
const shouldHideNavbar = hideNavbarPaths.includes(location.pathname) || 
                        location.pathname.startsWith('/owner/users/') ||
                        location.pathname.startsWith('/owner/projects/') ||
                        location.pathname.startsWith('/projects/');
```

**Why This Helps:**
- Hides navbar when viewing project details at `/owner/projects/:id`
- Hides navbar when viewing project details at `/projects/:id`
- Consistent UX with owner portal and admin routes

## Performance Monitoring

### Expected Results

**Projects Query:**
- **Before:** 118,775ms (118 seconds) ❌
- **After:** < 2,000ms (2 seconds) ✅

**Database Connections:**
- **Before:** Max 20 connections, pool exhaustion
- **After:** Max 30 connections, better throughput

**Statement Timeouts:**
- **Before:** 30s timeout causing errors
- **After:** 120s timeout prevents premature failures

### How to Monitor

Check the server logs for query timing:
```
✅ Projects query completed in XXXms, returned 15 projects
```

- **< 2000ms:** Excellent ✅
- **2000-5000ms:** Acceptable ⚠️
- **> 5000ms:** Investigate ❌

### If Issues Persist

If you still see slow queries (> 5 seconds):

1. **Check Database CPU Usage** (Supabase Dashboard)
   - High CPU? Queries need optimization
   - Normal CPU? Connection pool may still be too small

2. **Increase Connection Pool Further:**
   ```javascript
   max: 50,  // Increase from 30 to 50
   ```

3. **Add Query Result Pagination:**
   ```javascript
   // Instead of LIMIT 100, use offset pagination
   LIMIT 20 OFFSET ${page * 20}
   ```

4. **Check for Long-Running Queries:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query
   FROM pg_stat_activity
   WHERE state = 'active'
   ORDER BY duration DESC;
   ```

5. **Verify Indexes Are Being Used:**
   ```sql
   EXPLAIN ANALYZE 
   SELECT p.id, p.firebase_uid, p.created_at, p.updated_at, 
          p.project_data, u.full_name
   FROM projects p
   LEFT JOIN users u ON p.firebase_uid = u.firebase_uid
   ORDER BY p.created_at DESC
   LIMIT 100;
   ```

## Testing Checklist

- [x] Connection pool settings updated
- [x] Statement timeout increased
- [x] Navbar hidden on project details
- [ ] Projects page loads in < 2 seconds (user to test)
- [ ] No connection timeout errors in logs
- [ ] Navbar hidden when viewing project details

## Related Files

- `src/server/server.js` - Connection pool configuration
- `src/layouts/MainLayout.tsx` - Navbar visibility logic
- `src/server/server.js` (Lines 7350-7450) - Owner projects endpoint

## Next Steps

1. **Test the projects page** - Verify it loads quickly (< 2s)
2. **Monitor server logs** - Watch for any new errors
3. **Check navbar hiding** - View a project detail page
4. **If still slow** - Follow "If Issues Persist" section above
