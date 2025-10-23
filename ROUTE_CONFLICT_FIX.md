# 500 Error Fix - Duplicate Route Definitions

## Issue
- `/api/projects` endpoint returning 500 Internal Server Error
- Users page stuck on loading screen
- Projects showing only hardcoded data

## Root Cause
Express.js route conflict due to duplicate `/api/projects` definitions:

1. **Line 4166**: `app.use("/api/projects", projectsRouter)` - Router registered FIRST
2. **Line 5387** (old): `app.get('/api/projects', ...)` - Standalone route registered SECOND

### The Problem:
When a request comes to `/api/projects`:
1. Express matches `app.use("/api/projects", projectsRouter)` FIRST
2. The router doesn't have a GET "/" handler (it's commented out in the router)
3. The request falls through without a response
4. The standalone `app.get('/api/projects', ...)` never gets called because the router already handled the path
5. Result: No response sent → client sees 500 error or hangs

## Solution

### Moved Route Order:
Express routes are matched in the order they're defined. **More specific routes must come BEFORE generic routers.**

**Fixed order:**
```javascript
// Step 1: Define specific route FIRST
app.get('/api/projects', verifyToken, async (req, res) => {
  // ... handles GET requests to /api/projects
});

// Step 2: Register router AFTER (for other sub-routes like POST /api/projects)
app.use("/api/projects", projectsRouter);
```

**Why this works:**
- `app.get('/api/projects', ...)` matches GET requests to exactly `/api/projects`
- `app.use("/api/projects", projectsRouter)` matches all other /api/projects/* routes
- Express checks routes in order, so the specific GET handler runs first

### Changes Made:

**File: `src/server/server.js`**

1. **Line 4166** (moved GET route here):
   - Added complete `app.get('/api/projects', verifyToken, ...)` route
   - Placed BEFORE `app.use("/api/projects", projectsRouter)`
   - Added comment explaining route order importance

2. **Line ~5387** (removed duplicate):
   - Removed duplicate `app.get('/api/projects', ...)` definition
   - Added comment explaining it was moved earlier

## Testing Instructions

1. **Restart the server**:
   ```powershell
   # In the terminal running the server:
   Ctrl+C  # Stop current server
   cd src/server
   node server.js
   ```

2. **Test the fix**:
   - Refresh browser
   - Navigate to `/owner/users` as jim@gmail.com
   - Should load user list without 500 errors
   - Navigate to `/owner/projects`
   - Should show all projects from database (not just hardcoded data)

3. **Check server logs**:
   ```
   Projects query: SELECT p.id, p.firebase_uid, p.project_data...
   Returning 7 projects
   ```

4. **Verify browser console**:
   - No more "Failed to load resource: 500" errors
   - `ProjectsContext.tsx` should show successful project loading

## Expected Behavior After Fix

### Before (Broken):
```
Browser Request → app.use("/api/projects", projectsRouter)
                → projectsRouter has no GET "/" handler
                → Falls through without response
                → app.get('/api/projects') never reached
                → 500 Error
```

### After (Fixed):
```
Browser Request → app.get('/api/projects') ✅
                → Responds with project data
                → Done!
```

## Related Routes

The projectsRouter still handles:
- `POST /api/projects` - Create project
- `GET /api/projects/my-projects` - Get user's projects
- Other project-related routes defined in the router

Only the main `GET /api/projects` endpoint is defined outside the router for proper route matching.

## Files Modified
- `src/server/server.js`:
  - Line 4166: Moved `app.get('/api/projects', ...)` route to come BEFORE router
  - Line ~5387: Removed duplicate route definition
  - Added clarifying comments

## Note for Future
When using `app.use()` with a router:
- ✅ DO: Define specific routes BEFORE generic routers
- ❌ DON'T: Define the same path after a router that might match it
- Express matches routes in order - first match wins!
