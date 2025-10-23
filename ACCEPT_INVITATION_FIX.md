# Accept Invitation Error Fix

## Problem
The error "response.json is not a function" occurred when trying to accept a team invitation.

## Root Cause
The `AcceptInvitation.tsx` component was trying to call `response.json()` on the response object returned by `authFetch()`. However, `authFetch()` already handles response parsing and returns the parsed data directly - it doesn't return a Response object.

## Changes Made

### 1. Fixed `AcceptInvitation.tsx` (src/screens/team/AcceptInvitation.tsx)

**Before:**
```tsx
const response = await authFetch(...);
if (!response.ok) {
  const error = await response.json();  // ❌ response is already parsed data, not a Response object
  throw new Error(error.error);
}
```

**After:**
```tsx
const data = await authFetch(...);  // ✅ authFetch returns parsed data directly
// If we reach here, the request was successful
setStatus('success');
setMessage(data.message || 'Invitation accepted successfully!');
```

### 2. Improved Error Handling in `api.ts` (src/lib/api.ts)

Enhanced the `authFetch` error handling to:
- ✅ Always try to parse JSON error responses first
- ✅ Extract `error` or `message` fields from JSON responses
- ✅ Fall back to plain text for non-JSON errors
- ✅ Provide clear, user-friendly error messages

### 3. Better Error Messages in Frontend

Added specific handling for common invitation errors:
- ✅ "Already accepted" → User-friendly message explaining they're already a member
- ✅ "Expired" → Clear instructions to request a new invitation
- ✅ "Not found" → Explains the link may be invalid
- ✅ "User not found" → Reminds user to log in with the invited email

## Testing

To test the fix:

1. **Valid invitation** (should succeed):
   ```bash
   # Log in with the invited email
   # Click invitation link or navigate to:
   http://localhost:5173/accept-invitation/{valid-token}
   ```

2. **Already accepted invitation** (should show friendly error):
   ```bash
   # Use the same token from debug script output
   http://localhost:5173/accept-invitation/81453328ff5c73b3b35fde4987861799ec54176a1b6fd940799e497a8924bde8
   ```

3. **Invalid token** (should show "not found" error):
   ```bash
   http://localhost:5173/accept-invitation/invalid-token-here
   ```

## Current Invitation Status

From the debug script, here's the current state:

**Accepted Invitations:**
- menji@gmail.com (member) - Token: 81453328ff5c73b3b35f... - Accepted: Oct 10, 2025

**Pending Invitations:**
- menji@gmail.com (viewer) - Token: 9b0a5db592a59a9efd0f... - Expires: Oct 15, 2025

**Active Team Member:**
- Email: menji@gmail.com
- Role: member  
- Status: active
- Member UID: F8s1udSigkTLvkpQMnktV4iloZ62

## Next Steps

1. ✅ Error handling fixed
2. ⏳ Test with the valid pending invitation token
3. ⏳ Verify error messages are user-friendly
4. ⏳ Consider adding email verification check (ensure logged-in email matches invited email)

## How authFetch Works

The `authFetch` function:
1. Gets Firebase auth token
2. Makes the API request with Authorization header
3. **Checks `response.ok`** - if false, throws an error
4. **Parses JSON** from successful responses
5. **Returns the parsed data** (not the Response object)

This means components should:
- ✅ Use `try/catch` to handle errors
- ✅ Expect parsed data directly from `authFetch()`
- ❌ NOT call `.json()` on the result
- ❌ NOT check `response.ok` (already handled)

## Example Usage

```tsx
// ✅ CORRECT
try {
  const data = await authFetch('/api/endpoint', { method: 'POST' });
  console.log(data.message);  // data is already parsed
} catch (error) {
  console.error(error.message);  // error has user-friendly message
}

// ❌ WRONG
try {
  const response = await authFetch('/api/endpoint');
  if (!response.ok) {  // ❌ response is data, not Response object
    const error = await response.json();  // ❌ .json() not available
  }
}
```
