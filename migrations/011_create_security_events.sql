-- Migration 011: Create security events table for intrusion detection
-- Description: Tracks security threats, suspicious activities, and potential attacks

CREATE TABLE IF NOT EXISTS security_events (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  user_id VARCHAR(255),
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  user_agent TEXT,
  request_method VARCHAR(10),
  request_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(firebase_uid) ON DELETE SET NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip_created ON security_events(ip_address, created_at DESC);

-- Comments
COMMENT ON TABLE security_events IS 'Logs security threats and suspicious activities detected by IDS';
COMMENT ON COLUMN security_events.severity IS 'Threat severity: low, medium, high, critical';
COMMENT ON COLUMN security_events.event_type IS 'Type of security event (e.g., sql_injection, xss_attempt, brute_force)';
COMMENT ON COLUMN security_events.metadata IS 'Additional context about the threat (JSON)';

-- Rollback instructions
-- DROP TABLE IF EXISTS security_events;
