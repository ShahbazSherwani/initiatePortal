# PayMongo Integration Setup Guide

## Overview
This guide walks you through setting up PayMongo payment integration for the Initiate Portal investment system.

---

## Step 1: Create a PayMongo Account

1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com/)
2. Click **"Sign Up"** or **"Get Started"**
3. Fill in your business details:
   - Business name
   - Email address
   - Password
4. Verify your email address
5. Complete the business verification (for live mode later)

---

## Step 2: Access Test Mode (Sandbox)

1. Log in to your PayMongo dashboard
2. Look for the **"Test Mode"** toggle in the top-right corner
3. Make sure it's **enabled** (orange/yellow color) for testing
4. You'll see "Test Mode" indicator when active

---

## Step 3: Get Your API Keys

1. In the PayMongo dashboard, go to **"Developers"** → **"API Keys"**
2. You'll see two types of keys:
   - **Secret Key** (starts with `sk_test_` in test mode)
   - **Public Key** (starts with `pk_test_` in test mode)

3. Copy both keys - you'll need them for your environment variables

### Example Test Keys Format:
```
Secret Key: sk_test_xxxxxxxxxxxxxxxxxxxx
Public Key: pk_test_xxxxxxxxxxxxxxxxxxxx
```

---

## Step 4: Set Up Webhooks (Optional but Recommended)

Webhooks notify your app when payments are completed.

1. In PayMongo dashboard, go to **"Developers"** → **"Webhooks"**
2. Click **"Create Webhook"**
3. Enter your webhook URL:
   ```
   https://your-backend-url.com/api/payments/webhook
   ```
   For Render deployment:
   ```
   https://initiate-portal-api.onrender.com/api/payments/webhook
   ```
4. Select events to listen for:
   - `checkout_session.payment.paid`
   - `payment.paid`
5. Copy the **Webhook Secret** (starts with `whsec_`)

---

## Step 5: Add Environment Variables

Add these to your backend `.env` file:

```env
# PayMongo Configuration
PAYMONGO_SECRET_KEY=sk_test_your_secret_key_here
PAYMONGO_PUBLIC_KEY=pk_test_your_public_key_here
PAYMONGO_WEBHOOK_SECRET=whsec_your_webhook_secret_here
APP_BASE_URL=https://initiate-portal.vercel.app
```

### For Render Deployment:
1. Go to your Render dashboard
2. Select your backend service
3. Go to **"Environment"** tab
4. Add the environment variables:
   - `PAYMONGO_SECRET_KEY`
   - `PAYMONGO_PUBLIC_KEY`
   - `PAYMONGO_WEBHOOK_SECRET`
   - `APP_BASE_URL`

---

## Step 6: Run Database Migration

Run the SQL migration to create the payment_transactions table:

```sql
-- Run this in your Supabase SQL editor
CREATE TABLE IF NOT EXISTS payment_transactions (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    amount DECIMAL(15, 2) NOT NULL,
    paymongo_checkout_id VARCHAR(255),
    paymongo_reference VARCHAR(255),
    paymongo_payment_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_firebase_uid ON payment_transactions(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_project_id ON payment_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_checkout_id ON payment_transactions(paymongo_checkout_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
```

---

## Step 7: Test the Integration

### Test Payment Flow:
1. Log in as an investor
2. Go to a project page
3. Enter an investment amount (minimum ₱100)
4. Click "Continue" then "Proceed to Payment"
5. You'll be redirected to PayMongo checkout
6. Use test card details:
   ```
   Card Number: 4343 4343 4343 4345
   Expiry: Any future date (e.g., 12/25)
   CVV: Any 3 digits (e.g., 123)
   ```
7. Complete the payment
8. You'll be redirected to the success page

### Test E-Wallet (GCash/GrabPay):
- Select GCash or GrabPay in the checkout
- PayMongo test mode will simulate the payment

---

## PayMongo Test Cards

| Card Number | Description |
|-------------|-------------|
| 4343 4343 4343 4345 | Successful payment |
| 4571 7360 0000 0000 | Declined payment |
| 4009 9301 0000 0000 | 3D Secure authentication |

---

## Supported Payment Methods

The integration supports:
- **GCash** - Philippine e-wallet
- **GrabPay** - Grab e-wallet
- **PayMaya** - Maya e-wallet
- **Credit/Debit Cards** - Visa, Mastercard
- **DOB/DOB UBP** - Direct online banking

---

## Going Live (Production)

When ready for production:

1. Complete KYC verification in PayMongo dashboard
2. Toggle off "Test Mode" in the dashboard
3. Get your **live API keys** (start with `sk_live_` and `pk_live_`)
4. Update environment variables with live keys
5. Update webhook URL to production backend
6. Test with real payments (small amounts first)

---

## Troubleshooting

### "Payment service not configured"
- Check that `PAYMONGO_SECRET_KEY` is set in backend environment

### Payment fails immediately
- Verify you're using test keys in test mode
- Check browser console for error details

### Webhook not receiving events
- Verify webhook URL is correct and accessible
- Check webhook secret is correct
- Ensure backend is deployed and running

### "Minimum investment amount is ₱100"
- PayMongo requires minimum 100 PHP per transaction

---

## Files Modified/Created

1. `src/lib/paymongo.ts` - Frontend PayMongo service
2. `src/screens/InvestorProjectView.tsx` - Updated to use PayMongo
3. `src/screens/PaymentSuccess.tsx` - Payment success page
4. `src/routes/AppRoutes.tsx` - Added payment routes
5. `src/components/Sidebar/Sidebar.tsx` - Hidden iFunds menu
6. `backend/server.js` - Added PayMongo endpoints
7. `migrations/add-payment-transactions.sql` - Database migration

---

## Support

- PayMongo Documentation: https://developers.paymongo.com/
- PayMongo Support: support@paymongo.com
