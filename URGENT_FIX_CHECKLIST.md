# URGENT FIX CHECKLIST - API Returns HTML Error

## The Problem

You're seeing these errors because:
1. **Frontend is calling localhost** (development mode) instead of production API
2. **Production API on Render is returning HTML** instead of JSON
3. **Frontend on Vercel has old cached code**

## IMMEDIATE FIXES NEEDED

### Fix 1: Rebuild Frontend (CRITICAL)

The frontend on Vercel is cached with old code. You MUST rebuild:

```bash
# From project root
npm run build

# Then commit and push
git add dist/
git commit -m "Build: Updated frontend with production API configuration"
git push origin main
```

**OR** force rebuild on Vercel:
1. Go to Vercel Dashboard
2. Click your project
3. Click "Deployments"
4. Click "..." on latest deployment
5. Click "Redeploy"
6. Check "Use existing Build Cache" = OFF
7. Click "Redeploy"

### Fix 2: Check Render Deployment Status

1. Go to Render Dashboard: https://dashboard.render.com
2. Click "initiate-portal-api" (or your service name)
3. Check logs for:
   ```
   ✅ Server running on port 3001
   ✅ Database connected successfully
   🚀 Server is ready to accept connections
   ```

4. If you see errors, check the "Events" tab

### Fix 3: Clear Browser Cache (CRITICAL)

Old cached responses are showing HTML errors:

**Method 1: Hard Refresh**
1. Open DevTools (F12)
2. Right-click Refresh button
3. Select "Empty Cache and Hard Reload"

**Method 2: Clear All Data**
1. Press Ctrl+Shift+Delete
2. Select "All time"
3. Check "Cached images and files"
4. Check "Cookies and other site data"
5. Click "Clear data"

**Method 3: Incognito Mode**
- Open new Incognito/Private window
- Test the app fresh

---

## Verification Steps

### Step 1: Check Production API Directly

Open this URL in browser:
```
https://initiate-portal-api.onrender.com/health
```

**Expected:** `{"status":"ok","timestamp":"...","uptime":...}`
**If you get HTML:** Render deployment failed or is still deploying

### Step 2: Check Frontend Environment

Open browser console on your app and type:
```javascript
console.log(window.location.origin);
```

**If it shows `http://localhost:5173`:** You're in development mode
**If it shows `https://initiate-portal.vercel.app`:** You're in production mode

### Step 3: Check API Calls in Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Look for API calls
5. Click on any API call
6. Check the "Request URL"

**Should be:** `https://initiate-portal-api.onrender.com/api/...`
**If it says:** `http://localhost:3001/api/...` → Frontend is in development mode

### Step 4: Check Response Content-Type

In Network tab, click an API request:
- Look at Response Headers
- Find "Content-Type"

**Should be:** `application/json; charset=utf-8`
**If it's:** `text/html; charset=utf-8` → API is returning HTML (catch-all issue)

---

## Quick Debug Commands

### Test Production API
```bash
# Should return JSON
curl https://initiate-portal-api.onrender.com/health

# Should return JSON 404
curl https://initiate-portal-api.onrender.com/api/nonexistent
```

### Check Render Logs
```bash
# In Render dashboard
1. Click service
2. Click "Logs" tab
3. Look for latest logs after deployment
```

---

## Common Issues & Solutions

### Issue 1: "ERR_CONNECTION_REFUSED to localhost:3001"

**Cause:** Frontend is running in development mode or has old code cached

**Fix:**
- Clear browser cache
- Rebuild frontend: `npm run build`
- Redeploy to Vercel

### Issue 2: "Expected JSON but got HTML"

**Cause:** Catch-all middleware serving index.html for API routes

**Fix:** Already deployed in commit `6b6a9a9`, but need to:
- Wait for Render to finish deploying
- Clear browser cache to see changes

### Issue 3: "404 Not Found" on API endpoints

**Cause:** API route not defined or Render deployment incomplete

**Fix:**
- Check Render logs
- Verify route exists in server.js
- Check spelling of endpoint

---

## Expected Timeline

From now:

1. **Immediately:** Clear browser cache
2. **+0 min:** Check Render dashboard - is deployment complete?
3. **+2 min:** Test health endpoint directly
4. **+5 min:** Rebuild frontend if needed
5. **+10 min:** Vercel redeploys frontend
6. **+15 min:** Test full registration flow

---

## If Still Not Working

### Check These:

1. **Render Environment Variables**
   - Go to Render Dashboard → Service → Environment
   - Verify `NODE_ENV=production`
   - Verify `DATABASE_URL` is set
   - Verify `FIREBASE_*` variables are set

2. **Frontend Build**
   - Check `dist/` folder exists locally
   - Check `dist/index.html` exists
   - Check `dist/assets/` has JS/CSS files

3. **Vercel Deployment**
   - Go to Vercel Dashboard
   - Check latest deployment status
   - Check build logs for errors
   - Verify "Output Directory" = `dist`

4. **Check res.headersSent Fix is Deployed**
   ```bash
   # SSH into Render (if possible) or check deployment logs
   # Look for commit: 6b6a9a9
   # Verify server.js has res.headersSent check
   ```

---

## Emergency Rollback

If nothing works, rollback to known working state:

```bash
# Find last working commit
git log --oneline -10

# Rollback (example)
git reset --hard <commit-hash>
git push -f origin main
```

---

## Contact Support

If issue persists after all fixes:

**Render Support:**
- https://render.com/docs/troubleshooting

**Vercel Support:**
- https://vercel.com/docs/concepts/deployments/troubleshoot

**Share This Info:**
1. Render service URL
2. Vercel deployment URL
3. Screenshot of Network tab showing API call
4. Screenshot of Response Headers
5. Render logs (last 50 lines)
6. Browser console errors

---

## Success Indicators

You'll know it's fixed when:

✅ Health endpoint returns JSON (not HTML)
✅ Registration works without errors
✅ Verification email sends
✅ No "ERR_CONNECTION_REFUSED" errors
✅ No "Expected JSON but got HTML" errors
✅ Network tab shows `application/json` responses
✅ All API calls go to `initiate-portal-api.onrender.com`

---

**MOST LIKELY ISSUE:** Old cached frontend on Vercel. Force rebuild!
