# Emergency Troubleshooting Guide

## If API Still Returns HTML After This Fix

### Step 1: Check Render Logs
Look for these specific messages:

**✅ Good Signs:**
```
Server running on port 3001
🚀 Server is ready to accept connections
✅ Database connected successfully
```

**❌ Bad Signs:**
```
❌ Uncaught Exception
TypeError: Missing parameter name
==> No open ports detected
```

### Step 2: Test Health Endpoint
```bash
curl https://initiate-portal-api.onrender.com/health
```

**Expected:** `{"status":"ok",...}`  
**If you get HTML:** Server didn't start correctly

### Step 3: Check Browser Cache
**CRITICAL:** Old cached responses might still show HTML errors

1. Open DevTools (F12)
2. Right-click the Refresh button
3. Select "Empty Cache and Hard Reload"
4. OR: Open Incognito/Private window

### Step 4: Verify Environment Variables on Render

Make sure these are set:
- `NODE_ENV=production`
- `DATABASE_URL=<your-supabase-url>`
- `FIREBASE_*` credentials
- `EMAIL_*` credentials

### Step 5: Check API Route Definition

If a specific route still returns HTML, verify:

```javascript
// Route MUST be defined BEFORE the catch-all
app.post('/api/resend-verification-email', verifyToken, async (req, res) => {
  // ... handler code
  res.json({ success: true }); // Must send response
});

// Catch-all comes AFTER all routes
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (res.headersSent) return next();
    // ...
  });
}
```

### Step 6: Check Response Headers

In DevTools Network tab, click on the API request:

**Should see:**
```
Status: 200 OK
Content-Type: application/json; charset=utf-8
```

**If you see:**
```
Status: 200 OK
Content-Type: text/html; charset=utf-8  ← WRONG!
```

This means the catch-all is still running. Check that:
1. API route is sending a response: `res.json({...})`
2. No middleware is calling `res.sendFile()` after the API

### Step 7: Nuclear Option - Force Rebuild

If nothing works:

1. Go to Render Dashboard
2. Click your service
3. Click "Manual Deploy"
4. Select "Clear build cache & deploy"
5. Wait for fresh deployment

### Step 8: Test Locally First

**Always test locally in production mode before deploying:**

```bash
# Start server in production mode
$env:NODE_ENV="production"
node src/server/server.js

# Test API endpoint
curl http://localhost:3001/health

# Should return JSON, not HTML
```

If it works locally but not on Render:
- Environment variable mismatch
- Build artifact corruption
- Render caching old version

---

## Quick Diagnosis Commands

### Check if server is actually running
```bash
curl -I https://initiate-portal-api.onrender.com/health
```

### Check what content-type is returned
```bash
curl -H "Content-Type: application/json" \
     https://initiate-portal-api.onrender.com/health
```

### Test API with auth token
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://initiate-portal-api.onrender.com/api/profile
```

---

## Common Mistakes

### ❌ Mistake 1: Route Order
```javascript
// WRONG - catch-all before API routes
app.use((req, res) => { ... });
app.post('/api/endpoint', handler);
```

### ❌ Mistake 2: Not Sending Response
```javascript
app.post('/api/endpoint', async (req, res) => {
  await doSomething();
  // FORGOT TO SEND RESPONSE!
});
```

### ❌ Mistake 3: Multiple Responses
```javascript
app.post('/api/endpoint', async (req, res) => {
  res.json({ success: true });
  res.json({ another: 'response' }); // ERROR: Can't send twice!
});
```

### ❌ Mistake 4: Not Using res.headersSent
```javascript
// WRONG - will always serve HTML
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({...});
  }
  res.sendFile('index.html'); // This runs even after API routes!
});
```

### ✅ Correct: Check res.headersSent
```javascript
app.use((req, res, next) => {
  if (res.headersSent) return next(); // CRITICAL!
  
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({...});
  }
  res.sendFile('index.html');
});
```

---

## Still Not Working?

If after all this, API still returns HTML:

1. **Check Render logs for errors**
2. **Verify build completed successfully**
3. **Test health endpoint first** - if that returns HTML, server isn't configured correctly
4. **Check that `dist/` folder was built correctly**
5. **Verify `NODE_ENV=production` is set on Render**
6. **Try rolling back to a known working commit**

---

## Contact Information

If stuck, share:
1. Render logs (last 100 lines)
2. Response from `curl https://your-app.onrender.com/health`
3. Network tab screenshot showing Content-Type header
4. Error message from browser console

---

## Expected Timeline

- **T+0min:** Code pushed to GitHub
- **T+0min:** Render auto-deploy triggered
- **T+5min:** Build phase (npm install, build frontend)
- **T+8min:** Server starts
- **T+10min:** Health checks pass
- **T+12min:** Ready for testing

Total: ~10-15 minutes from push to live
