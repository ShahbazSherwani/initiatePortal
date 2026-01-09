# Make.com Integration - Quick Start Checklist

## ✅ Files Created (Ready to Use)

1. **MAKE_QUICK_SETUP.md** - Complete step-by-step guide
2. **MAKE_INTEGRATION_GUIDE.md** - Detailed architecture documentation
3. **backend/make-server-integration.js** - All backend code (copy to server.js)
4. **wordpress-sync-to-make.php** - WordPress snippet (add via Code Snippets)

---

## 🚀 Quick Implementation (2 hours)

### Phase 1: Make.com Setup (30 min)

- [ ] Create Make.com account (free)
- [ ] Create Scenario 1: "InitiatePH to InitiateGlobal"
  - Webhook trigger → Router → HTTP requests
  - Copy webhook URL (save for later)
- [ ] Create Scenario 2: "InitiateGlobal to InitiatePH"
  - Webhook trigger → Router → HTTP requests
  - Copy webhook URL (save for later)
- [ ] Turn both scenarios ON

**Follow:** MAKE_QUICK_SETUP.md Steps 2-3

---

### Phase 2: Backend Update (30 min)

- [ ] Open `backend/server.js`
- [ ] Copy sections from `backend/make-server-integration.js`:
  - Import crypto at top
  - Add Make config after Firebase init
  - Add notifyMakeOfNewUser() function
  - Add /api/check-user endpoint
  - Add /api/sync-user endpoint
  - Update profileRouter.post() to call webhook

- [ ] Create `.env` file entries:
```bash
MAKE_API_KEY=<generate-random-32-char-string>
MAKE_WEBHOOK_URL=<URL-from-Scenario-1>
```

- [ ] Test locally:
```bash
cd backend
npm install
node server.js
```

- [ ] Deploy to Render:
```bash
git add .
git commit -m "Add Make.com integration"
git push origin main
```

- [ ] Add environment variables in Render dashboard:
  - MAKE_API_KEY
  - MAKE_WEBHOOK_URL

**Follow:** MAKE_QUICK_SETUP.md Step 4

---

### Phase 3: WordPress Setup (15 min)

- [ ] Login to InitiateGlobal WordPress admin
- [ ] Go to Snippets → Add New
- [ ] Title: "Sync Users to Make.com"
- [ ] Copy code from `wordpress-sync-to-make.php`
- [ ] Update webhook URL on line 35:
```php
$make_webhook_url = '<URL-from-Scenario-2>';
```
- [ ] Activate snippet
- [ ] Check error log for confirmation

**Follow:** MAKE_QUICK_SETUP.md Step 5

---

### Phase 4: WordPress API Access (15 min)

- [ ] Go to Users → Your Profile
- [ ] Scroll to "Application Passwords"
- [ ] Name: "Make.com Integration"
- [ ] Generate password (format: `xxxx xxxx xxxx xxxx`)
- [ ] Encode for Make.com:
```bash
echo -n "username:xxxx xxxx xxxx xxxx" | base64
```
- [ ] Add to Make Scenario 1 HTTP request headers:
```
Authorization: Basic <base64-encoded-string>
```

**Follow:** MAKE_QUICK_SETUP.md Step 7

---

### Phase 5: Testing (30 min)

#### Test 1: PH → Global
- [ ] Register NEW user on InitiatePH.com
  - Email: test1@yourdomain.com
  - Password: Test123!
- [ ] Check Make.com execution history
- [ ] Check WordPress Users list
- [ ] Verify user has meta: `synced_from=PH`

#### Test 2: Global → PH  
- [ ] Create NEW user in WordPress
  - Email: test2@yourdomain.com
- [ ] Check Make.com execution history
- [ ] Check Supabase users table
- [ ] Verify user has `global_user_id`

#### Test 3: Loop Protection
- [ ] Check WordPress error logs
- [ ] Should see: "Loop protection: User came from PH"
- [ ] Verify no duplicate attempts

#### Test 4: Update Existing
- [ ] Update test1@yourdomain.com phone in PH
- [ ] Verify updated in Global

**Follow:** MAKE_QUICK_SETUP.md Step 6

---

## 🎯 What You'll Achieve

✅ User registers on InitiatePH → Auto-created on InitiateGlobal
✅ User registers on InitiateGlobal → Auto-created on InitiatePH
✅ Loop protection (won't sync infinitely)
✅ Works for both new users and updates
✅ Secure (API keys, no password syncing)
✅ Monitored via Make.com dashboard

---

## 📝 Important Notes

1. **No passwords are synced** - Users created from Global get temp password + reset email
2. **Loop protection is critical** - Don't skip the `source_system` checks
3. **Make.com free tier** - 1,000 operations/month (each sync = 3-5 ops)
4. **Testing first** - Use test emails before production
5. **Monitoring** - Check Make.com history daily first week

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Webhook not triggering | Check scenario is ON, verify URL in code |
| 401 Unauthorized | Verify API keys match, check WP app password |
| User not syncing | Test webhook with Postman, check execution history |
| Loop detected | Good! Verify logs show "Loop protection" |
| Make operations running out | Upgrade to paid plan ($9/mo for 10k ops) |

---

## 📊 Timeline

| Phase | Time | Status |
|-------|------|--------|
| Make.com setup | 30 min | ⏳ |
| Backend code | 30 min | ⏳ |
| WordPress snippet | 15 min | ⏳ |
| WP API setup | 15 min | ⏳ |
| Testing | 30 min | ⏳ |
| **Total** | **2 hours** | ⏳ |

---

## 🔄 Next Steps After Implementation

1. Monitor for 1 week - check Make.com execution history daily
2. Set up email alerts for Make errors
3. Document any custom field mappings needed
4. Consider extending to profile updates (not just registration)
5. Add webhooks for password changes, email updates, etc.

---

## 📞 Need Help?

1. Check MAKE_QUICK_SETUP.md for detailed steps
2. Check Make.com execution history for errors
3. Check WordPress error.log for webhook issues
4. Check InitiatePH console logs for API errors
5. Test webhooks manually with Postman

---

**Generated:** January 7, 2026
**Estimated Completion:** 2 hours from start
