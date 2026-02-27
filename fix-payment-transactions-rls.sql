-- ========================================
-- FIX: Enable RLS on payment_transactions
-- Run this in Supabase SQL Editor
-- ========================================

-- 1. Enable RLS on the table
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- 2. Service role (backend) has unrestricted access
--    Your Node.js server uses the service_role key, so this policy
--    ensures all existing backend queries continue to work unchanged.
CREATE POLICY "Service role has full access to payment_transactions"
  ON payment_transactions
  FOR ALL
  USING (auth.role() = 'service_role');

-- 3. Authenticated users can only read their own payment records
--    (firebase_uid column matches the logged-in user's UID)
CREATE POLICY "Users can view own payment transactions"
  ON payment_transactions
  FOR SELECT
  USING (auth.uid()::text = firebase_uid);

-- ========================================
-- VERIFY
-- ========================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'payment_transactions';
-- rowsecurity should be: true
