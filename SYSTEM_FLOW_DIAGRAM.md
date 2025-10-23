# Team Management System - Visual Flow Diagram

## Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ADMIN UPDATES USER PERMISSIONS                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Backend: PUT /api/owner/team/:memberId/permissions                     │
│  ├─ Delete old permissions                                              │
│  ├─ Insert new permissions                                              │
│  ├─ Create notification (type: team_update)                             │
│  └─ Return 200 OK                                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     NOTIFICATION IN DATABASE                            │
│  Table: notifications                                                   │
│  ├─ firebase_uid: [user's UID]                                          │
│  ├─ type: "team_update"                                                 │
│  ├─ title: "Your Permissions Have Been Updated"                         │
│  ├─ message: "[Admin] has updated your permissions..."                  │
│  ├─ link: "/owner"                                                      │
│  ├─ is_read: false                                                      │
│  └─ created_at: NOW()                                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                        [Wait up to 60 seconds]
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Frontend: NotificationContext polling (every 60s)                      │
│  GET /api/notifications?limit=20                                        │
│  ├─ Receives notifications array                                        │
│  ├─ Detects unread team_update notification                             │
│  └─ console.log("🔔 Team update notification detected...")              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Event Dispatched: window.dispatchEvent('refreshPermissions')           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  OwnerSidebar: Event Listener catches refreshPermissions                │
│  ├─ console.log("🔔 Permission refresh triggered by notification")      │
│  └─ Calls fetchPermissions()                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  API Call: GET /api/team/my-permissions                                 │
│  ├─ Fetches fresh permissions from database                             │
│  └─ Returns: { isAdmin: false, permissions: [...] }                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  OwnerSidebar: State Update                                             │
│  ├─ setTeamPermissions(newPermissions)                                  │
│  ├─ setLastFetchTime(Date.now())                                        │
│  └─ console.log("✅ Permissions refreshed:", newPermissions)            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  React Re-render: Sidebar menu updates                                  │
│  ├─ Filter allNavItems based on new permissions                         │
│  ├─ Show/hide menu items                                                │
│  └─ User sees updated sidebar (NO MANUAL REFRESH!)                      │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════

## Auto-Refresh Strategies

┌─────────────────────────────────────────────────────────────────────────┐
│  Strategy 1: INITIAL LOAD                                               │
│  ┌──────────┐         ┌──────────────┐         ┌──────────────┐        │
│  │  Login   │────────▶│ Profile Loads│────────▶│Fetch Perms   │        │
│  └──────────┘         └──────────────┘         └──────────────┘        │
│  Trigger: useEffect([profile])                                          │
│  Timing: Immediate on login                                             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  Strategy 2: AUTO-REFRESH TIMER                                         │
│  ┌──────────┐    ┌─────────┐    ┌────────────┐    ┌──────────────┐    │
│  │On Owner  │───▶│Every 30s│───▶│Cooldown OK?│───▶│Fetch Perms   │    │
│  │  Page    │    └─────────┘    └────────────┘    └──────────────┘    │
│  └──────────┘                      (>25s since last)                    │
│  Trigger: setInterval(30000)                                            │
│  Timing: Every 30 seconds (if on /owner/*)                              │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  Strategy 3: NAVIGATION TRIGGER                                         │
│  ┌──────────┐    ┌─────────┐    ┌────────────┐    ┌──────────────┐    │
│  │Navigate  │───▶│To /owner│───▶│Cooldown OK?│───▶│Fetch Perms   │    │
│  │  Page    │    │  route  │    └────────────┘    └──────────────┘    │
│  └──────────┘    └─────────┘      (>10s since last)                    │
│  Trigger: useEffect([location.pathname])                                │
│  Timing: On navigation (if >10s since last)                             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  Strategy 4: NOTIFICATION TRIGGER                                       │
│  ┌──────────┐    ┌─────────┐    ┌────────────┐    ┌──────────────┐    │
│  │Notif     │───▶│Team     │───▶│Dispatch    │───▶│Fetch Perms   │    │
│  │Arrives   │    │Update   │    │Event       │    │              │    │
│  └──────────┘    └─────────┘    └────────────┘    └──────────────┘    │
│  Trigger: NotificationContext detects team_update                       │
│  Timing: Instant (within notification poll cycle)                       │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════

## Database Cleanup Flow

┌─────────────────────────────────────────────────────────────────────────┐
│  ADMIN REMOVES TEAM MEMBER                                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  DELETE /api/owner/team/:memberId                                       │
│                                                                          │
│  Step 1: Get member email                                               │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │ SELECT email, member_uid FROM team_members WHERE id = $1   │         │
│  └────────────────────────────────────────────────────────────┘         │
│                                                                          │
│  Step 2: Delete ALL invitations                                         │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │ DELETE FROM team_invitations                                │         │
│  │ WHERE owner_uid = $1 AND email = $2                         │         │
│  └────────────────────────────────────────────────────────────┘         │
│                                                                          │
│  Step 3: Delete team member (cascade deletes permissions)               │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │ DELETE FROM team_members WHERE id = $1                      │         │
│  └────────────────────────────────────────────────────────────┘         │
│                                                                          │
│  Step 4: Send notification to removed user                              │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │ INSERT INTO notifications (...)                             │         │
│  │ VALUES ('Removed from Team', ...)                           │         │
│  └────────────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  ADMIN RE-INVITES SAME USER                                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  POST /api/owner/team/invite                                            │
│                                                                          │
│  Step 1: Check if already exists                                        │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │ SELECT id FROM team_members                                 │         │
│  │ WHERE owner_uid = $1 AND email = $2                         │         │
│  └────────────────────────────────────────────────────────────┘         │
│                                                                          │
│  Step 2: Clean up old invitations FIRST                                 │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │ DELETE FROM team_invitations                                │         │
│  │ WHERE owner_uid = $1 AND email = $2                         │         │
│  │ console.log("🧹 Cleaned up old invitations")                │         │
│  └────────────────────────────────────────────────────────────┘         │
│                                                                          │
│  Step 3: Create fresh team member                                       │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │ INSERT INTO team_members (...) VALUES (...)                 │         │
│  └────────────────────────────────────────────────────────────┘         │
│                                                                          │
│  Step 4: Create fresh permissions                                       │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │ INSERT INTO team_member_permissions (...) VALUES (...)      │         │
│  └────────────────────────────────────────────────────────────┘         │
│                                                                          │
│  Step 5: Create fresh invitation                                        │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │ INSERT INTO team_invitations (...) VALUES (...)             │         │
│  └────────────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                         FRESH START - NO OLD DATA! ✅


═══════════════════════════════════════════════════════════════════════════

## Timeline: From Permission Change to User Sees Update

┌────────────────────────────────────────────────────────────────────────┐
│ Time: 0s                                                               │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │ Admin clicks "Save" on permission update                         │   │
│ └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ Time: 0.1s                                                             │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │ Backend updates database + creates notification                  │   │
│ └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ Time: 0-60s (Wait for notification poll)                               │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │ NotificationContext polls /api/notifications                     │   │
│ └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ Time: 60s (Notification arrives)                                       │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │ Notification detected → Event dispatched                         │   │
│ └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ Time: 60.1s (Permission refresh)                                       │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │ OwnerSidebar fetches /api/team/my-permissions                    │   │
│ └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ Time: 60.2s (UI Updates)                                               │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │ Sidebar re-renders with new permissions                          │   │
│ │ User sees new menu items appear                                  │   │
│ │ ✅ NO MANUAL REFRESH NEEDED!                                      │   │
│ └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘

Alternative Fast Paths:
├─ If user navigates within 10s → Instant refresh
├─ If on owner page and 30s timer fires → Auto refresh
└─ Manual browser refresh (F5) → Still works


═══════════════════════════════════════════════════════════════════════════

## Component Architecture

┌─────────────────────────────────────────────────────────────────────────┐
│                            APP COMPONENT                                │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  AuthContext (provides user, profile, token)                   │    │
│  │  ├─ useAuth hook                                               │    │
│  │  └─ profile.isAdmin                                            │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                  │                                      │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  NotificationContext                                            │    │
│  │  ├─ Polls /api/notifications every 60s                          │    │
│  │  ├─ Detects team_update notifications                           │    │
│  │  └─ Dispatches refreshPermissions event                         │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                  │                                      │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  OwnerSidebar Component                                         │    │
│  │  ├─ Fetches /api/team/my-permissions                            │    │
│  │  ├─ Listens to refreshPermissions event                         │    │
│  │  ├─ Auto-refresh timer (30s)                                    │    │
│  │  ├─ Navigation-based refresh (10s cooldown)                     │    │
│  │  └─ Filters menu items by permissions                           │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════

## Key Takeaways

✅ Notifications sent automatically on all team changes
✅ Complete database cleanup on remove/re-invite
✅ 4-strategy auto-refresh system (no manual refresh needed)
✅ Smart cooldowns prevent excessive API calls
✅ Update time: 10-60 seconds (depending on trigger)
✅ Comprehensive logging for debugging
✅ Backward compatible (F5 still works)
✅ Production ready!

═══════════════════════════════════════════════════════════════════════════
