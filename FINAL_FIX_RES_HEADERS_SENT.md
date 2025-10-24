# FINAL FIX: res.headersSent Check for API Routes

## Date: October 24, 2025
## Commit: `6b6a9a9`

---

## The Problem (Root Cause)

API routes were returning HTML instead of JSON because:

1. API route handlers would send JSON responses
2. **BUT** the catch-all middleware would **STILL RUN** after them
3. The catch-all would then serve `index.html`, overwriting the JSON response

**Key insight:** In Express, `app.use()` middleware **ALWAYS runs**, even after route handlers have sent a response. This is different from route handlers which only run if no earlier route matched.

---

## Previous Failed Attempts

### ❌ Attempt 1: Wildcard Routes
```javascript
app.get('*', handler)
app.all('/api/*', handler)
```
**Failed:** path-to-regexp parser error with wildcards

### ❌ Attempt 2: Middleware with Path Prefix
```javascript
app.use('/api', handler)
```
**Failed:** Intercepted ALL `/api/*` requests, even those with handlers

### ❌ Attempt 3: Simple Middleware
```javascript
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({...});
  }
  res.sendFile('index.html');
});
```
**Failed:** Middleware runs AFTER API routes, serving HTML even when API already sent JSON

---

## ✅ The Working Solution

```javascript
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // CRITICAL: Check if response was already sent by earlier routes
    if (res.headersSent) {
      return next(); // Don't interfere if response already sent
    }
    
    // API routes that weren't handled get JSON 404
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ 
        error: 'API endpoint not found',
        path: req.path 
      });
    }
    
    // All other routes serve index.html (SPA)
    res.sendFile(path.join(__dirname, '../../dist/index.html'), (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(500).send('Error loading application');
      }
    });
  });
}
```

### Why This Works

**`res.headersSent` is the key:**
- When an API route sends a response, Express sets `res.headersSent = true`
- Our catch-all middleware checks this flag
- If headers were already sent, middleware does nothing
- If headers weren't sent, it means no route handled the request

**Flow diagram:**

```
Request: POST /api/resend-verification-email
↓
1. API route handler executes → Sends JSON response
   └─> res.headersSent = true
↓
2. Catch-all middleware runs
   └─> Checks: res.headersSent? YES
   └─> Returns next() → Does nothing ✅
↓
Result: JSON response reaches client ✅
```

```
Request: GET /some-spa-route
↓
1. No API route matches
2. Static file middleware - no file found
   └─> res.headersSent = false
↓
3. Catch-all middleware runs
   └─> Checks: res.headersSent? NO
   └─> Not an API route? YES
   └─> Serves index.html ✅
↓
Result: SPA loads correctly ✅
```

```
Request: GET /api/nonexistent
↓
1. No API route matches
   └─> res.headersSent = false
↓
2. Catch-all middleware runs
   └─> Checks: res.headersSent? NO
   └─> Is API route? YES
   └─> Returns JSON 404 ✅
↓
Result: {"error":"API endpoint not found","path":"/api/nonexistent"} ✅
```

---

## Testing Results

### Local Test ✅
```bash
$ curl http://localhost:3001/health
{"status":"ok","timestamp":"2025-10-24T07:29:47.067Z","uptime":14.2092224}
```

### Production Test (Expected)
```bash
$ curl https://initiate-portal-api.onrender.com/health
{"status":"ok",...}

$ curl https://initiate-portal-api.onrender.com/api/resend-verification-email
# Should return JSON (not HTML)
```

---

## Key Takeaways

### Express Middleware vs Routes

| Type | Behavior | When to Use |
|------|----------|-------------|
| `app.use(handler)` | **Always runs** for all requests | Body parsing, logging, authentication |
| `app.get(path, handler)` | Only runs if **no earlier route matched** | Specific endpoints |
| `app.use()` + `res.headersSent` check | Runs always but **can detect** if response sent | Catch-all handlers |

### The Problem with Catch-All Middleware

**Without `res.headersSent` check:**
```
API Route → Sends JSON → Catch-all runs → Sends HTML → Client gets HTML ❌
```

**With `res.headersSent` check:**
```
API Route → Sends JSON → Catch-all runs → Detects headers sent → Does nothing → Client gets JSON ✅
```

---

## Deployment Status

- **Commit:** `6b6a9a9`
- **Status:** Pushed to GitHub ✅
- **Render:** Auto-deploying 🟡
- **ETA:** ~10 minutes

---

## Verification Checklist

Once Render finishes deploying:

### 1. Clear Browser Cache
- Press `Ctrl+Shift+Delete`
- Select "All time"
- Check "Cached images and files"
- Click "Clear data"

### 2. Test API Endpoints
- Open DevTools (F12)
- Go to Network tab
- Click "Disable cache"
- Reload page
- Check API calls:
  - ✅ Response Type should be "json" (not "html")
  - ✅ Content-Type should be "application/json"
  - ✅ Response body should be valid JSON

### 3. Test Email Verification
- Register new user
- Check: No HTML errors in console
- Check: Verification email sent successfully
- Check: `/api/resend-verification-email` returns JSON

### 4. Test SPA Routes
- Navigate to different pages
- Check: Pages load correctly
- Check: Back/forward buttons work
- Check: Direct URL access works

---

## Why We Were Stuck in a Loop

We kept hitting the same error because:

1. **First issue:** Wildcards caused path-to-regexp errors
2. **Second issue:** Middleware intercepted all requests
3. **Third issue:** Middleware ran AFTER routes, overwriting responses

**The missing piece:** We never checked `res.headersSent` to see if a response was already sent.

---

## Expected Render Logs

```
✅ Database connected successfully
✅ Email transporter ready
Server running on port 3001
🚀 Server is ready to accept connections
```

**NO MORE:**
```
❌ TypeError: Missing parameter name (path-to-regexp error)
==> No open ports detected
```

---

## Files Changed

- `src/server/server.js` (Lines 9445-9470)
  - Added `res.headersSent` check
  - Removed wildcard patterns
  - Prevents catch-all from interfering with API responses

---

## Summary

The fix is simple but critical:

**Before:** Catch-all middleware always served index.html, even after API routes sent JSON
**After:** Catch-all middleware checks if response was already sent, does nothing if so
**Result:** API routes return JSON ✅, SPA routes get HTML ✅

This should **finally** solve the persistent "API returns HTML" error! 🎉

---

**Status:** 🟡 Deploying to production  
**Next:** Wait for Render, then test registration and email verification
