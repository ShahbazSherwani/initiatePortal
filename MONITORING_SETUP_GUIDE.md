# Monitoring Setup Guide

This guide will help you set up comprehensive monitoring for the Initiate Platform.

## 1. Google Analytics 4 (GA4) Setup

### Step 1: Create GA4 Property

1. Go to https://analytics.google.com/
2. Click "Admin" (gear icon in bottom left)
3. Click "Create Property"
4. Property details:
   - **Property name**: "Initiate Platform"
   - **Reporting time zone**: Philippines (GMT+8)
   - **Currency**: Philippine Peso (PHP)
5. Click "Next"
6. Business details:
   - **Industry**: Financial Services / Crowdfunding
   - **Business size**: Small (1-10 employees)
7. Click "Create" and accept Terms of Service

### Step 2: Set up Data Stream

1. Select "Web" platform
2. Website URL: `https://initiate-portal.vercel.app` (or your custom domain)
3. Stream name: "Initiate Platform Production"
4. Click "Create stream"
5. You'll see your **Measurement ID**: `G-XXXXXXXXXX`

### Step 3: Install GA4 in Your App

#### Option A: Using React (Recommended)

Install package:
```bash
npm install react-ga4
```

Create `src/lib/analytics.ts`:
```typescript
import ReactGA from 'react-ga4';

export const initGA = () => {
  ReactGA.initialize('G-XXXXXXXXXX'); // Replace with your Measurement ID
};

export const logPageView = () => {
  ReactGA.send({ hitType: 'pageview', page: window.location.pathname });
};

export const logEvent = (category: string, action: string, label?: string) => {
  ReactGA.event({
    category,
    action,
    label,
  });
};
```

In `src/index.tsx` or `src/App.tsx`:
```typescript
import { initGA, logPageView } from './lib/analytics';

// Initialize on app load
useEffect(() => {
  initGA();
  logPageView();
}, []);

// Track route changes
const location = useLocation();
useEffect(() => {
  logPageView();
}, [location]);
```

#### Option B: Using Google Tag Manager (Alternative)

1. In GA4, go to "Admin" → "Data Streams" → Your stream
2. Click "Tagging Instructions" → "Install manually"
3. Copy the gtag.js code snippet
4. Add to `index.html` in `<head>` section:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Step 4: Track Custom Events

Track important user actions:

```typescript
import { logEvent } from './lib/analytics';

// Track investment
logEvent('Investment', 'Submit', `Project ${projectId}`);

// Track top-up
logEvent('Top-up', 'Request', `Amount ${amount}`);

// Track signup
logEvent('Auth', 'Signup', accountType);

// Track login
logEvent('Auth', 'Login', accountType);
```

### Step 5: Set up Real-Time Dashboard

1. In GA4, go to "Reports" → "Realtime"
2. You'll see:
   - Users by country (Philippines map)
   - Users by page
   - Users by device
   - Event count by event name
3. Bookmark this page for quick access

### Step 6: Create Custom Dashboard

1. Go to "Explore" → "Blank"
2. Add segments:
   - All Users
   - Investors
   - Borrowers
3. Add dimensions:
   - Page path
   - Event name
   - Device category
4. Add metrics:
   - Active users
   - Event count
   - Conversions
5. Save as "Initiate Platform Dashboard"

---

## 2. UptimeRobot Setup

### Step 1: Create Account

1. Go to https://uptimerobot.com/
2. Click "Sign Up Free"
3. Enter email: `admin@initiateph.com`
4. Verify email

### Step 2: Add Monitors

#### Monitor 1: Frontend (Vercel)
1. Click "Add New Monitor"
2. Monitor Type: **HTTP(s)**
3. Friendly Name: `Initiate Platform - Frontend`
4. URL: `https://initiate-portal.vercel.app`
5. Monitoring Interval: **5 minutes** (free tier)
6. Monitor Timeout: **30 seconds**
7. Click "Create Monitor"

#### Monitor 2: Backend Health Check
1. Click "Add New Monitor"
2. Monitor Type: **HTTP(s)**
3. Friendly Name: `Initiate Platform - Backend Health`
4. URL: `https://initiate-portal-api.onrender.com/api/health`
5. Monitoring Interval: **5 minutes**
6. Monitor Timeout: **30 seconds**
7. Click "Create Monitor"

#### Monitor 3: Backend API
1. Click "Add New Monitor"
2. Monitor Type: **HTTP(s)**
3. Friendly Name: `Initiate Platform - Backend API`
4. URL: `https://initiate-portal-api.onrender.com/api/accounts`
5. Monitoring Interval: **5 minutes**
6. Monitor Timeout: **30 seconds**
7. Click "Create Monitor"

### Step 3: Set up Alert Contacts

1. Go to "My Settings" → "Alert Contacts"
2. Add email:
   - Email: `admin@initiateph.com`
   - Name: `Admin Team`
   - Click "Add"
3. Add Slack (optional):
   - Create Slack incoming webhook
   - Paste webhook URL
   - Test connection
4. Add SMS (upgrade to Pro for this feature):
   - Phone: +63-XXX-XXX-XXXX
   - Name: `Admin Phone`

### Step 4: Configure Alerts

For each monitor:
1. Click monitor name → "Edit"
2. Scroll to "Alert Contacts To Notify"
3. Select:
   - ✅ Admin Team (email)
   - ✅ Slack (if configured)
4. Alert settings:
   - Send alerts when: **Down**
   - Send alerts when: **Up** (after being down)
5. Save

### Step 5: Create Public Status Page (Optional)

1. Go to "Add Status Page"
2. Name: `Initiate Platform Status`
3. Select monitors:
   - ✅ Frontend
   - ✅ Backend Health
   - ✅ Backend API
4. Customize:
   - Logo: Upload Initiate logo
   - Custom domain: `status.initiateph.com` (requires DNS setup)
5. Save and get public URL: `https://stats.uptimerobot.com/XXXXX`
6. Share with users for transparency

---

## 3. Sentry Setup (Error Tracking) - Optional but Recommended

### Step 1: Create Account
1. Go to https://sentry.io/
2. Sign up with email: `admin@initiateph.com`
3. Choose plan: **Developer (Free)**

### Step 2: Create Projects

#### Frontend Project
1. Click "Create Project"
2. Platform: **React**
3. Project name: `initiate-platform-frontend`
4. Alert frequency: **On every new issue**
5. Copy DSN: `https://XXXXX@oXXXXXX.ingest.sentry.io/XXXXXX`

#### Backend Project
1. Click "Create Project"
2. Platform: **Node.js**
3. Project name: `initiate-platform-backend`
4. Copy DSN

### Step 3: Install Sentry SDK

**Frontend:**
```bash
npm install @sentry/react
```

In `src/index.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_FRONTEND_DSN",
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

**Backend:**
```bash
npm install @sentry/node
```

In `src/server/server.js`:
```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "YOUR_BACKEND_DSN",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Add after Express app creation
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Add before error handlers
app.use(Sentry.Handlers.errorHandler());
```

---

## 4. Slack Notifications Setup (Optional)

### Step 1: Create Slack Workspace
1. Go to https://slack.com/create
2. Workspace name: `Initiate Platform`
3. Channel name: `#alerts`

### Step 2: Create Incoming Webhook
1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. App name: `Monitoring Alerts`
4. Workspace: `Initiate Platform`
5. Go to "Incoming Webhooks"
6. Toggle "Activate Incoming Webhooks" → ON
7. Click "Add New Webhook to Workspace"
8. Select channel: `#alerts`
9. Copy webhook URL: `https://hooks.slack.com/services/XXXXX/XXXXX/XXXXX`

### Step 3: Send Test Alert
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🚨 Test alert from Initiate Platform"}' \
  YOUR_WEBHOOK_URL
```

### Step 4: Add to UptimeRobot
1. In UptimeRobot, go to "My Settings" → "Alert Contacts"
2. Click "Add Alert Contact"
3. Contact Type: **Web-Hook**
4. URL to Notify: `YOUR_WEBHOOK_URL`
5. POST value: 
```json
{
  "text": "🚨 *[*monitorFriendlyName*]* is *[*alertType*]* \n URL: *[*monitorURL*]*"
}
```
6. Save and test

---

## 5. Cost Summary

| Service | Plan | Monthly Cost | Annual Cost |
|---------|------|--------------|-------------|
| **Google Analytics 4** | Free | $0 | $0 |
| **UptimeRobot** | Free (50 monitors) | $0 | $0 |
| **Sentry** | Developer (Free) | $0 | $0 |
| **Slack** | Free | $0 | $0 |
| **Total** | | **$0/month** | **$0/year** |

### Upgrade Options (Optional)

- **UptimeRobot Pro**: $7/month (1-min checks, SMS alerts)
- **Sentry Team**: $26/month (50k errors, better features)
- **Total with upgrades**: $33/month ($396/year)

---

## 6. Testing Your Setup

### Test GA4:
1. Visit your website
2. Go to GA4 → Reports → Realtime
3. You should see yourself as "1 user by country: Philippines"

### Test UptimeRobot:
1. Wait 5 minutes for first check
2. Go to UptimeRobot dashboard
3. All monitors should show **Up** status with green checkmark

### Test Sentry:
```javascript
// In browser console or test page
throw new Error("Test error for Sentry");
```
Check Sentry dashboard for the error.

### Test Health Endpoint:
```bash
curl https://initiate-portal-api.onrender.com/api/health
```
Should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-27T...",
  "uptime": 12345,
  "database": "connected",
  "version": "1.0.0"
}
```

---

## 7. Daily Monitoring Checklist

**Morning Check (5 minutes):**
- [ ] Check UptimeRobot dashboard (all green?)
- [ ] Review GA4 Realtime (users online?)
- [ ] Check Sentry for new errors
- [ ] Review admin monitoring dashboard (platform metrics)

**Weekly Review (15 minutes):**
- [ ] GA4: Traffic trends (up or down?)
- [ ] GA4: Top pages visited
- [ ] UptimeRobot: Uptime percentage (>99.9%?)
- [ ] Sentry: Error rate trends
- [ ] Admin dashboard: User growth, investment trends

---

## 8. Setting up Environment Variables

Add to `.env`:
```bash
# Google Analytics
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# Sentry
VITE_SENTRY_DSN=https://xxxxx@oxxxxx.ingest.sentry.io/xxxxx
SENTRY_DSN=https://xxxxx@oxxxxx.ingest.sentry.io/xxxxx

# Slack Webhook (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXXXX/XXXXX/XXXXX
```

Add to Render environment variables (backend):
```
SENTRY_DSN=https://xxxxx@oxxxxx.ingest.sentry.io/xxxxx
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXXXX/XXXXX/XXXXX
```

Add to Vercel environment variables (frontend):
```
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxxxx@oxxxxx.ingest.sentry.io/xxxxx
```

---

## 9. Troubleshooting

**GA4 not tracking:**
- Check browser console for errors
- Verify Measurement ID is correct
- Check ad blockers are disabled
- Wait 24 hours for data to appear (real-time is instant)

**UptimeRobot showing "Down":**
- Check if backend is actually running: visit health endpoint manually
- Verify URL is correct (no typos)
- Check if backend is warming up (Render free tier goes to sleep)

**Sentry not receiving errors:**
- Check DSN is correct
- Verify Sentry.init() is called before any errors
- Try throwing a test error
- Check browser console for Sentry connection errors

---

## 10. Support Contacts

- **Google Analytics**: https://support.google.com/analytics/
- **UptimeRobot**: support@uptimerobot.com
- **Sentry**: support@sentry.io
- **Slack**: https://slack.com/help

---

✅ **Setup Complete!** Your platform now has comprehensive monitoring. Check dashboards daily and respond to alerts promptly.
