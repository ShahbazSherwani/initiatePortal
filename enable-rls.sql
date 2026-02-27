-- ========================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- Run this in Supabase SQL Editor
-- ========================================

-- IMPORTANT: Since your app uses a service_role key from the backend,
-- RLS policies won't affect your backend API calls (service_role bypasses RLS).
-- However, RLS protects against direct database access with leaked credentials.

-- ========================================
-- 1. ENABLE RLS ON ALL TABLES
-- ========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrower_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE topup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_suspension_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vulnerability_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE vulnerability_scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_tracker ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. CREATE POLICIES FOR SERVICE ROLE
-- (Allows your backend to still work)
-- ========================================

-- Users table
CREATE POLICY "Service role has full access to users" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = firebase_uid);

-- Borrower profiles
CREATE POLICY "Service role has full access to borrower_profiles" ON borrower_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Investor profiles
CREATE POLICY "Service role has full access to investor_profiles" ON investor_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Projects (public read, service write)
CREATE POLICY "Service role has full access to projects" ON projects
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can view approved projects" ON projects
  FOR SELECT USING (status = 'approved');

-- Notifications
CREATE POLICY "Service role has full access to notifications" ON notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Email verifications (sensitive - service only)
CREATE POLICY "Service role has full access to email_verifications" ON email_verifications
  FOR ALL USING (auth.role() = 'service_role');

-- Password reset tokens (very sensitive - service only)
CREATE POLICY "Service role has full access to password_reset_tokens" ON password_reset_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- Wallets (sensitive - service only)
CREATE POLICY "Service role has full access to wallets" ON wallets
  FOR ALL USING (auth.role() = 'service_role');

-- Topup requests
CREATE POLICY "Service role has full access to topup_requests" ON topup_requests
  FOR ALL USING (auth.role() = 'service_role');

-- Borrow requests
CREATE POLICY "Service role has full access to borrow_requests" ON borrow_requests
  FOR ALL USING (auth.role() = 'service_role');

-- Team members
CREATE POLICY "Service role has full access to team_members" ON team_members
  FOR ALL USING (auth.role() = 'service_role');

-- Team invitations
CREATE POLICY "Service role has full access to team_invitations" ON team_invitations
  FOR ALL USING (auth.role() = 'service_role');

-- Team member permissions
CREATE POLICY "Service role has full access to team_member_permissions" ON team_member_permissions
  FOR ALL USING (auth.role() = 'service_role');

-- Team activity log
CREATE POLICY "Service role has full access to team_activity_log" ON team_activity_log
  FOR ALL USING (auth.role() = 'service_role');

-- User settings
CREATE POLICY "Service role has full access to user_settings" ON user_settings
  FOR ALL USING (auth.role() = 'service_role');

-- User suspensions
CREATE POLICY "Service role has full access to user_suspensions" ON user_suspensions
  FOR ALL USING (auth.role() = 'service_role');

-- User suspension history
CREATE POLICY "Service role has full access to user_suspension_history" ON user_suspension_history
  FOR ALL USING (auth.role() = 'service_role');

-- Audit logs
CREATE POLICY "Service role has full access to audit_logs" ON audit_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Security events
CREATE POLICY "Service role has full access to security_events" ON security_events
  FOR ALL USING (auth.role() = 'service_role');

-- Vulnerability scans
CREATE POLICY "Service role has full access to vulnerability_scans" ON vulnerability_scans
  FOR ALL USING (auth.role() = 'service_role');

-- Vulnerability scan history
CREATE POLICY "Service role has full access to vulnerability_scan_history" ON vulnerability_scan_history
  FOR ALL USING (auth.role() = 'service_role');

-- Schema migrations (admin only)
CREATE POLICY "Service role has full access to schema_migrations" ON schema_migrations
  FOR ALL USING (auth.role() = 'service_role');

-- Migration tracker (admin only)
CREATE POLICY "Service role has full access to migration_tracker" ON migration_tracker
  FOR ALL USING (auth.role() = 'service_role');

-- Payment transactions (sensitive - service has full access; investors can view their own)
CREATE POLICY "Service role has full access to payment_transactions" ON payment_transactions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own payment transactions" ON payment_transactions
  FOR SELECT USING (auth.uid()::text = firebase_uid);

-- ========================================
-- VERIFICATION
-- ========================================
-- After running, check RLS status:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
