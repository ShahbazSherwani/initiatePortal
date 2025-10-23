# Quick Test Guide - Auto Permission Refresh

## What Changed
✅ Permissions now refresh automatically - no manual browser refresh needed!

## How to Test

### Test 1: Update Jim's Permissions (Fastest Test)
1. **As Admin**: Go to `/owner/team`
2. Click "Edit" on Jim's row
3. Add or remove a permission (e.g., add "investments.view")
4. Click "Save"
5. **As Jim**: 
   - **OLD WAY**: Had to press Ctrl+Shift+R to see changes ❌
   - **NEW WAY**: Wait 10-60 seconds, menu automatically updates ✅
   - Check notification bell - should see "Your Permissions Have Been Updated"
   - Within 60 seconds, "Investment Requests" appears in sidebar

### Test 2: Accept New Invitation
1. **As Admin**: Remove Jim, then re-invite with different permissions
2. **As Jim**: Accept invitation via email link
3. **OLD WAY**: Had to manually refresh ❌
4. **NEW WAY**: Notification appears, permissions auto-refresh ✅
5. Sidebar updates with new permissions within 60 seconds

### Test 3: Navigation Trigger
1. **As Jim**: Go to `/owner/users`
2. **As Admin**: Update Jim's permissions
3. **As Jim**: Navigate to `/owner/projects` (after 10 seconds)
4. Permissions automatically refresh on navigation ✅

### Test 4: Idle Auto-Refresh
1. **As Jim**: Stay on `/owner/dashboard`
2. **As Admin**: Update Jim's permissions
3. **As Jim**: Don't do anything, just wait
4. Within 30 seconds, permissions auto-refresh ✅
5. When notification arrives (within 60s), immediate refresh triggered

## What to Expect

### Console Messages (Open DevTools)
You should see:
```
✅ Permissions refreshed: {isAdmin: false, permissions: Array(15)}
🔄 Auto-refreshing permissions...
🔄 Refreshing permissions on navigation...
🔔 Team update notification detected, triggering permission refresh...
🔔 Permission refresh triggered by notification
```

### Timing
- **Notification arrives**: Within 60 seconds (notification polling)
- **Permission refresh**: Immediate after notification
- **Auto-refresh**: Every 30 seconds if on owner pages
- **Navigation refresh**: When moving between owner pages (10s cooldown)

### User Experience
1. Admin updates permissions
2. Jim receives notification (within 60s)
3. Permissions auto-refresh (instant when notification arrives)
4. Sidebar menu updates
5. **No F5 or manual refresh needed!** ✅

## Troubleshooting

### "I don't see the new permissions"
1. Check notifications - did you receive a team update notification?
2. Open DevTools console - do you see refresh messages?
3. Wait 60 seconds - notification polling might not have run yet
4. Navigate to another owner page - triggers refresh
5. As last resort: Hard refresh (Ctrl+Shift+R) still works

### "Permissions refreshing too often"
This is normal! The system uses multiple strategies:
- Every 30 seconds (auto)
- On navigation (if >10s since last)
- On notification (instant)

### "Console is spammy"
The logging is for debugging. Can be removed in production.

## Rollback Plan

If you need to revert to old behavior:

1. Remove auto-refresh timer in `OwnerSidebar.tsx` (lines ~72-84)
2. Remove navigation refresh (lines ~87-98)
3. Remove event listener (lines ~100-109)
4. Remove notification trigger in `NotificationContext.tsx` (lines ~131-142)

## Success Criteria

✅ Jim accepts invitation → No manual refresh needed  
✅ Admin updates Jim's role → Jim sees changes within 60s  
✅ Admin updates Jim's permissions → Jim sees changes within 60s  
✅ Jim navigates between owner pages → Fresh permissions loaded  
✅ Jim idle on page → Permissions stay fresh (30s refresh)  
✅ Multiple refresh strategies work independently  
✅ No excessive API calls (cooldowns prevent spam)  

## Next Steps

1. Test with Jim's account (or create test account)
2. Monitor console for refresh messages
3. Verify timing is acceptable (adjust if needed)
4. Consider adding visual refresh indicator (optional)
5. Consider WebSocket for instant updates (future enhancement)

## Questions?

- **"Can I adjust timing?"** → Yes, see timing constants in code
- **"Can I disable auto-refresh?"** → Yes, see Rollback Plan above
- **"Will this increase server load?"** → No, smart cooldowns prevent spam
- **"What if notifications are disabled?"** → Auto-refresh and navigation refresh still work
