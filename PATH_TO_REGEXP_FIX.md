# Path-to-Regexp Error Fix - October 23, 2025

## Problem
Render deployment failed with:
```
❌ Uncaught Exception: TypeError: Missing parameter name at 6
    at path-to-regexp/dist/index.js:73:19
```

## Root Cause
**Wildcard patterns (`*`) in Express routes are incompatible with path-to-regexp parser.**

Express uses the `path-to-regexp` library to parse route patterns. When you use wildcards like:
- `app.get('*', handler)`
- `app.all('/api/*', handler)`

The parser tries to interpret `*` as a named parameter and fails because there's no parameter name.

## Failed Solutions

### ❌ Attempt 1
```javascript
app.get('*', (req, res) => { ... });
```
**Error:** `TypeError: Missing parameter name at 6`

### ❌ Attempt 2
```javascript
app.all('/api/*', (req, res) => { ... });
app.get('*', (req, res) => { ... });
```
**Error:** `TypeError: Missing parameter name at 6`

## ✅ Working Solution

**Remove ALL wildcards and use plain middleware:**

```javascript
if (process.env.NODE_ENV === 'production') {
  // Single catch-all middleware with NO wildcards
  app.use((req, res, next) => {
    // Check path inside middleware
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ 
        error: 'API endpoint not found',
        path: req.path 
      });
    }
    
    // Serve index.html for all other routes
    res.sendFile(path.join(__dirname, '../../dist/index.html'), (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(500).send('Error loading application');
      }
    });
  });
}
```

## Why This Works

1. **No wildcards** - path-to-regexp never sees a `*` to parse ✅
2. **Middleware runs last** - Express processes it only after all defined routes
3. **Internal path checking** - We check `req.path.startsWith('/api/')` in JavaScript, not in the route pattern
4. **Existing routes work** - API endpoints defined earlier (like `/api/resend-verification-email`) handle requests normally
5. **Non-existent APIs get JSON 404** - The middleware catches unhandled `/api/*` requests
6. **SPA routes get HTML** - Everything else gets `index.html`

## Key Takeaway

**In Express with modern path-to-regexp:**
- ❌ Don't use: `app.METHOD('*', handler)`
- ❌ Don't use: `app.METHOD('/path/*', handler)`
- ✅ Do use: `app.use((req, res) => { /* check req.path here */ })`

## Testing

### Local Test (Development)
```bash
# Start server in production mode
$env:NODE_ENV="production"; node src/server/server.js

# Test API endpoint
curl http://localhost:3001/health
# Expected: {"status":"ok",...}

# Test non-existent API
curl http://localhost:3001/api/nonexistent
# Expected: {"error":"API endpoint not found","path":"/api/nonexistent"}

# Test homepage
curl http://localhost:3001/
# Expected: <!DOCTYPE html>...
```

### Production Test (After Render Deployment)
1. Check Render logs for "Server running on port..."
2. Open: `https://initiate-portal-api.onrender.com/health`
3. Should return JSON (not HTML)
4. No "Missing parameter name" errors

## Deployment

**Commit:** `815bff2`
**Branch:** `main`
**Status:** 🟡 Deploying to Render
**ETA:** ~10 minutes

## Files Changed
- `src/server/server.js` (Lines 9445-9465)

## References
- [path-to-regexp GitHub](https://github.com/pillarjs/path-to-regexp)
- [Express Routing Guide](https://expressjs.com/en/guide/routing.html)
- Error URL: https://git.new/pathToRegexpError

---

**Result:** Should deploy successfully without path-to-regexp errors ✅
