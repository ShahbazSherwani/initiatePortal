# Production Deployment Fix - API Routing Issue

## Issues Resolved

### 1. **API Routes Returning HTML Instead of JSON**
**Error:**
```
❌ Non-JSON response: <!DOCTYPE html>
Expected JSON response but got: text/html; charset=utf-8
```

**Root Cause:**
The static file middleware was placed BEFORE API routes, causing ALL requests (including `/api/*`) to be handled by the static file server, which returned `index.html` for everything.

**Fix:**
Added a catch-all route AFTER all API routes but BEFORE `app.listen()` to properly serve the SPA:

```javascript
// File: src/server/server.js (Line ~9444)

// IMPORTANT: This must be AFTER all API routes
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  });
}
```

### 2. **API URL Configuration Issue**
**Error:**
```
POST http://localhost:3001/api/send-verification-email net::ERR_CONNECTION_REFUSED
⚠️ Failed to send verification email: TypeError: Failed to fetch
```

**Root Cause:**
The `environment.ts` file had `forceLocalDev = true`, which forced the frontend to always use `localhost:3001` even in production builds.

**Fix:**
Updated API URL logic to use relative URLs in production:

```typescript
// File: src/config/environment.ts

const environment = (import.meta.env.MODE as string) || 'development';

// Use appropriate API based on environment
const finalApiUrl = environment === 'production'
  ? '/api'  // Relative URL - same origin as frontend
  : 'http://localhost:3001/api';

export const API_BASE_URL = finalApiUrl;
```

**Why Relative URLs?**
- In production, frontend and backend are served from the same origin
- Using `/api` instead of full URL avoids CORS issues
- Prevents hardcoding Render URLs

### 3. **Cache Write Failure (ERR_CACHE_WRITE_FAILURE)**
**Error:**
```
GET https://initiate-portal-api.onrender.com/api/projects net::ERR_CACHE_WRITE_FAILURE 304
```

**Root Cause:**
Browser cache corruption when switching between different API URLs.

**Fix:**
- Clear browser cache: `Ctrl+Shift+Delete` → Clear all data
- The relative URL fix (`/api`) will prevent this in the future

## Deployment Checklist

### Before Deploying:

1. **Build the Frontend:**
   ```bash
   npm run build
   ```

2. **Test Production Build Locally:**
   ```bash
   # Serve the dist folder with the backend
   cd src/server
   NODE_ENV=production node server.js
   
   # Open http://localhost:3001 in browser
   # Verify API calls work
   ```

3. **Verify Environment Variables:**
   - ✅ `NODE_ENV=production` on Render
   - ✅ `DATABASE_URL` set correctly
   - ✅ `FIREBASE_*` credentials configured
   - ✅ `EMAIL_*` credentials configured
   - ❌ **DO NOT** set `VITE_API_URL` on Render (use relative URLs)

### After Deploying:

1. **Clear Browser Cache:**
   - Open DevTools (F12)
   - Right-click Refresh button → "Empty Cache and Hard Reload"
   - Or: `Ctrl+Shift+Delete` → Clear all browsing data

2. **Test Registration Flow:**
   - Register a new user
   - Check verification email is sent
   - Verify email link works
   - Check user can login

3. **Test API Endpoints:**
   - Open DevTools → Network tab
   - Verify API calls go to `/api/*` (relative)
   - Check responses are JSON (not HTML)

## Files Changed

### 1. `src/server/server.js`
**Added:** Catch-all route for SPA (lines ~9444-9454)

### 2. `src/config/environment.ts`
**Changed:** API URL logic to use relative paths in production

## How It Works Now

### Development Mode:
```
Frontend (localhost:5173)
  ↓ API calls to: http://localhost:3001/api
Backend (localhost:3001)
```

### Production Mode:
```
User Browser
  ↓ Request: https://your-app.onrender.com/
Render Server
  ↓ Serves: dist/index.html (React app)
  
User Browser
  ↓ API call: /api/profile (relative URL)
Same Render Server
  ↓ Handles: API route, returns JSON
```

## Common Issues & Solutions

### Issue: "Cannot GET /api/endpoint"
**Cause:** API route not defined or typo in path
**Solution:** Check endpoint exists in `server.js`

### Issue: Still getting HTML responses
**Cause:** Browser cache not cleared
**Solution:** Hard reload or clear cache

### Issue: CORS errors
**Cause:** Using absolute URL instead of relative
**Solution:** Verify `API_BASE_URL` is `/api` in production

### Issue: 404 on page refresh
**Cause:** Catch-all route missing
**Solution:** Already fixed - catch-all serves index.html

## Testing Commands

### Test Production Build Locally:
```powershell
# 1. Build frontend
npm run build

# 2. Start server in production mode
cd src/server
$env:NODE_ENV="production"; node server.js

# 3. Open browser
start http://localhost:3001

# 4. Test registration
# - Register new user
# - Check DevTools Network tab
# - Verify API calls are successful
```

### Test API Endpoints:
```powershell
# Test health endpoint
curl http://localhost:3001/health

# Test profile endpoint (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/profile
```

## Deployment to Render

### 1. Push Changes:
```bash
git add .
git commit -m "Fix: API routing and production URL configuration"
git push origin main
```

### 2. Render Auto-Deploys:
- Render detects push to main branch
- Runs build command: `npm install && npm run build`
- Starts server: `node src/server/server.js`

### 3. Verify Deployment:
- Check Render logs for "Server running on port 3001"
- Open your app URL
- Test registration/login flow
- Check browser console for errors

## Rollback Plan

If issues persist after deployment:

1. **Revert Changes:**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Or Use Previous Commit:**
   ```bash
   git log  # Find working commit hash
   git checkout <commit-hash>
   git push -f origin main  # Force push (careful!)
   ```

3. **Manual Override (Temporary):**
   In `environment.ts`, temporarily hardcode:
   ```typescript
   export const API_BASE_URL = 'https://initiate-portal-api.onrender.com/api';
   ```

## Success Criteria

✅ Registration flow works end-to-end
✅ Verification emails are sent
✅ API calls return JSON (not HTML)
✅ No CORS errors in console
✅ No ERR_CONNECTION_REFUSED errors
✅ Page refresh works on all routes
✅ Projects load quickly (< 5 seconds)
✅ No cache write failures

## Next Steps

1. **Deploy these changes** - Push to main branch
2. **Monitor Render logs** - Check for startup errors
3. **Test thoroughly** - Register new user, verify email, login
4. **Clear browser cache** - Essential after deployment
5. **Report results** - Let me know if any issues persist
