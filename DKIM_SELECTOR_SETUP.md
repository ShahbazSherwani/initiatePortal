# 🔐 DKIM SETUP - SELECTOR1 & SELECTOR2

## ✅ YES - Add Both DKIM Selectors!

You have **two DKIM selectors** (selector1 and selector2). This is standard for Microsoft 365/Office 365 email hosting, which GoDaddy uses.

### Why Two Selectors?
- **Redundancy:** If one key needs to be rotated, the other stays active
- **Key Rotation:** Microsoft rotates keys periodically for security
- **Best Practice:** Always add both when provided

---

## 📋 HOW TO ADD BOTH DKIM CNAME RECORDS

### Step 1: Get Your DKIM Records from GoDaddy

GoDaddy/Microsoft should have provided you with records that look like:

```
Selector 1:
-----------
Type: CNAME
Name: selector1._domainkey
Value: selector1-initiateph-com._domainkey.initiateph.onmicrosoft.com

Selector 2:
-----------
Type: CNAME
Name: selector2._domainkey
Value: selector2-initiateph-com._domainkey.initiateph.onmicrosoft.com
```

**Note:** The exact values depend on your specific setup. Use what GoDaddy provided.

---

### Step 2: Add to GoDaddy DNS Management

#### For Selector 1:

1. **Log into GoDaddy**
2. Go to **DNS Management** for `initiateph.com`
3. Click **Add** → Select **CNAME**
4. Fill in:

```
Type: CNAME
Name: selector1._domainkey
Value: selector1-initiateph-com._domainkey.initiateph.onmicrosoft.com
TTL: 1 Hour (or 3600 seconds)
```

5. Click **Save**

#### For Selector 2:

1. Click **Add** again → Select **CNAME**
2. Fill in:

```
Type: CNAME
Name: selector2._domainkey
Value: selector2-initiateph-com._domainkey.initiateph.onmicrosoft.com
TTL: 1 Hour (or 3600 seconds)
```

3. Click **Save**

---

## 🎯 IMPORTANT NOTES

### About the "Name" Field:

Some DNS providers handle the domain name differently:

**Option A:** Enter exactly as shown
```
Name: selector1._domainkey
```

**Option B:** Enter without domain (GoDaddy auto-adds it)
```
Name: selector1._domainkey.initiateph.com
```

**Option C:** Enter just the selector part
```
Name: selector1._domainkey
(GoDaddy will automatically append .initiateph.com)
```

**Try Option A first.** If GoDaddy's interface shows it will become `selector1._domainkey.initiateph.com.initiateph.com`, then use just `selector1._domainkey`.

---

### About the "Value" Field:

**IMPORTANT:** The value should end with `.onmicrosoft.com` (NOT your domain)

✅ **Correct:**
```
selector1-initiateph-com._domainkey.initiateph.onmicrosoft.com
```

❌ **Incorrect:**
```
selector1-initiateph-com._domainkey.initiateph.com
```

---

## 📋 VISUAL EXAMPLE: Your DNS Records

After adding both, your DNS should look like this:

```
┌─────────────────────────────────────────────────────────────────────┐
│ DNS Records for initiateph.com                                       │
├────────┬──────────────────────┬─────────────────────────────────────┤
│ Type   │ Name                 │ Value                               │
├────────┼──────────────────────┼─────────────────────────────────────┤
│ TXT    │ @                    │ v=spf1 include:secureserver.net ~all│ ✅
├────────┼──────────────────────┼─────────────────────────────────────┤
│ CNAME  │ selector1._domainkey │ selector1-initiateph-com._domainkey.│ ← Add
│        │                      │   initiateph.onmicrosoft.com        │
├────────┼──────────────────────┼─────────────────────────────────────┤
│ CNAME  │ selector2._domainkey │ selector2-initiateph-com._domainkey.│ ← Add
│        │                      │   initiateph.onmicrosoft.com        │
├────────┼──────────────────────┼─────────────────────────────────────┤
│ TXT    │ _dmarc               │ v=DMARC1; p=quarantine; rua=mailto: │ ← Add
│        │                      │   admin@initiateph.com              │
└────────┴──────────────────────┴─────────────────────────────────────┘
```

---

## ✅ VERIFICATION STEPS

### Step 1: Wait for DNS Propagation
- **Minimum:** 15-30 minutes
- **Typical:** 1-2 hours
- **Maximum:** 24-48 hours

### Step 2: Check DKIM Records (After 1 hour)

**Method A: PowerShell**
```powershell
nslookup -type=cname selector1._domainkey.initiateph.com 8.8.8.8
nslookup -type=cname selector2._domainkey.initiateph.com 8.8.8.8
```

**Expected Result:**
```
selector1._domainkey.initiateph.com canonical name = selector1-initiateph-com._domainkey.initiateph.onmicrosoft.com
```

**Method B: MXToolbox**
1. Go to: https://mxtoolbox.com/SuperTool.aspx
2. Enter: `selector1._domainkey.initiateph.com`
3. Select: DKIM Lookup
4. Should show: CNAME pointing to Microsoft

### Step 3: Test DKIM Signature

**Method A: Mail-Tester**
1. Go to: https://www.mail-tester.com/
2. Register with test email address
3. Check DKIM score (should be PASS ✅)

**Method B: Send Email to Gmail**
1. Register on your platform with Gmail
2. Receive email → Click ⋮ → **Show original**
3. Look for:
```
DKIM: 'PASS' with domain initiateph.com ✅
```

---

## 🔧 TROUBLESHOOTING

### Issue: CNAME Record Not Found After 24 Hours

**Possible Causes:**
1. Wrong selector name (should be `selector1._domainkey` not `selector1-domainkey`)
2. Missing the dot in the value (should end with `.onmicrosoft.com`)
3. DNS provider appended domain twice (became `selector1._domainkey.initiateph.com.initiateph.com`)

**Solution:**
1. Check your DNS records in GoDaddy
2. Verify exact spelling of "Name" field
3. If duplicated, edit to remove extra domain

### Issue: DKIM Still Shows "FAIL" After Setup

**Possible Causes:**
1. DNS not propagated yet (wait longer)
2. DKIM not enabled in Microsoft 365/GoDaddy Email Settings
3. Wrong CNAME values

**Solution:**
1. Wait 24-48 hours for full propagation
2. Log into GoDaddy Email Settings → Enable DKIM
3. Verify CNAME values match what GoDaddy provided exactly

### Issue: GoDaddy Says "CNAME Already Exists"

**Possible Causes:**
1. You already added one of the selectors
2. Old DKIM records exist

**Solution:**
1. Check existing records in DNS Management
2. Edit existing record instead of adding new
3. Or delete old record and add new

---

## 📧 COMPLETE DKIM SETUP CHECKLIST

### Before You Start:
- [ ] Have both CNAME records from GoDaddy (selector1 and selector2)
- [ ] Know the exact values for each selector
- [ ] Have access to GoDaddy DNS Management

### Adding Records:
- [ ] Add CNAME for `selector1._domainkey`
- [ ] Add CNAME for `selector2._domainkey`
- [ ] Double-check spelling and values
- [ ] Save both records
- [ ] Note the time (for propagation tracking)

### Verification (After 1-2 hours):
- [ ] Check CNAME with `nslookup` command
- [ ] Verify both selectors resolve correctly
- [ ] Test with Mail-Tester (score should improve)
- [ ] Send test email to Gmail
- [ ] Check email headers for "DKIM: PASS"

### Final Configuration:
- [ ] Add DMARC TXT record (if not done yet)
- [ ] Enable DKIM in GoDaddy Email Settings (if option exists)
- [ ] Monitor email delivery for 1-2 weeks
- [ ] Check DMARC reports at admin@initiateph.com

---

## 🎓 UNDERSTANDING DKIM SELECTORS

### What is a Selector?

A selector is like a "version number" for your DKIM keys. It allows you to have multiple DKIM keys active at once.

### Why Multiple Selectors?

```
Scenario 1: Key Rotation
------------------------
Week 1-4: selector1 is active (emails signed with key1)
Week 3: selector2 is added (prepare for rotation)
Week 5: selector2 becomes active (emails signed with key2)
Week 6: selector1 can be removed (old emails still verify with key1)
```

### How Email Servers Use Them:

When an email is sent:
1. Your email server signs the email with a DKIM key
2. It adds a header: `DKIM-Signature: s=selector1; d=initiateph.com`
3. Receiving server looks up: `selector1._domainkey.initiateph.com`
4. Finds the public key (via CNAME → TXT record)
5. Verifies the signature matches

---

## 📊 EXPECTED TIMELINE

### Immediate (0-15 minutes):
- Records added to GoDaddy DNS
- Changes saved in system

### Short Term (15 minutes - 2 hours):
- DNS propagates to nearby servers
- Can verify with `nslookup`
- Some emails show DKIM PASS

### Medium Term (2-24 hours):
- DNS fully propagated worldwide
- All emails show DKIM PASS
- Inbox delivery improves

### Long Term (1-4 weeks):
- Domain reputation builds
- Consistent DKIM signing
- 90%+ inbox delivery rate achieved

---

## 🎯 WHAT TO EXPECT AFTER SETUP

### Before DKIM:
```
Email Headers:
--------------
SPF: PASS ✅
DKIM: NEUTRAL or FAIL ❌
DMARC: FAIL ❌

Inbox Rate: ~30-40%
Spam Rate: ~60-70%
```

### After DKIM (Both Selectors):
```
Email Headers:
--------------
SPF: PASS ✅
DKIM: PASS ✅ (with domain initiateph.com)
DMARC: PASS ✅ (after adding DMARC record)

Inbox Rate: ~70-80% (immediately)
Inbox Rate: ~90-95% (after 2-4 weeks)
Spam Rate: ~5-10%
```

---

## 💡 PRO TIPS

### Tip 1: Add Both Now
Even if only one is currently active, add both. Microsoft/GoDaddy will rotate between them automatically.

### Tip 2: Don't Remove Old Selectors
Keep both selectors active. Removing one might break verification for emails sent with that key.

### Tip 3: Check Email Headers Regularly
After setup, send yourself test emails and check headers to ensure DKIM is signing correctly.

### Tip 4: Add DMARC After DKIM
Once DKIM is working, add the DMARC record. This tells email providers to enforce SPF/DKIM checks.

### Tip 5: Monitor DMARC Reports
You'll start receiving DMARC reports at admin@initiateph.com. These show authentication status of your emails.

---

## 📝 QUICK COPY-PASTE

### DKIM CNAME Records (Update values from GoDaddy):

**Selector 1:**
```
Type: CNAME
Name: selector1._domainkey
Value: [GET FROM GODADDY - something like selector1-initiateph-com._domainkey.initiateph.onmicrosoft.com]
TTL: 1 Hour
```

**Selector 2:**
```
Type: CNAME
Name: selector2._domainkey
Value: [GET FROM GODADDY - something like selector2-initiateph-com._domainkey.initiateph.onmicrosoft.com]
TTL: 1 Hour
```

### DMARC Record (Add after DKIM):
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:admin@initiateph.com; pct=100; sp=quarantine
TTL: 1 Hour
```

### Verification Commands:
```powershell
# Check Selector 1
nslookup -type=cname selector1._domainkey.initiateph.com 8.8.8.8

# Check Selector 2
nslookup -type=cname selector2._domainkey.initiateph.com 8.8.8.8

# Check DMARC
nslookup -type=txt _dmarc.initiateph.com 8.8.8.8

# Check SPF
nslookup -type=txt initiateph.com 8.8.8.8
```

---

## 📞 NEED HELP?

### If CNAME Values Are Different:
Use exactly what GoDaddy provided. The format might be:
- `selector1-[domain]._domainkey.[domain].onmicrosoft.com`
- `[guid]._domainkey.[region].ppe.messagingservice.net`
- Or another format specific to your email service

### If Unsure About Values:
Contact GoDaddy and say:
> "I need the exact DKIM CNAME records for admin@initiateph.com including selector1 and selector2"

---

## ✅ SUMMARY

### To Answer Your Question:
**YES! Add both DKIM selectors (selector1 AND selector2) as CNAME records.**

### Quick Steps:
1. ✅ Add CNAME: `selector1._domainkey` → (value from GoDaddy)
2. ✅ Add CNAME: `selector2._domainkey` → (value from GoDaddy)
3. ✅ Wait 1-2 hours for DNS propagation
4. ✅ Verify with `nslookup` commands
5. ✅ Test with Mail-Tester
6. ✅ Add DMARC TXT record
7. ✅ Monitor delivery improvements

### Expected Result:
- DKIM: PASS ✅
- Emails signed with digital signature
- 50-60% improvement in inbox delivery
- After 2-4 weeks: 90%+ inbox delivery rate

---

**Last Updated:** October 18, 2025  
**Status:** Ready to add both CNAME records  
**Next Step:** Add both selectors to GoDaddy DNS  
**Priority:** 🔴 HIGH - This will significantly improve deliverability!
