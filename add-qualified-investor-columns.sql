-- Qualified investor governance columns
ALTER TABLE investor_profiles
  ADD COLUMN IF NOT EXISTS is_qualified_investor BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS qi_request_status VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS qi_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS qi_request_notes TEXT,
  ADD COLUMN IF NOT EXISTS qi_request_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS qi_granted_by TEXT,
  ADD COLUMN IF NOT EXISTS qi_granted_at TIMESTAMPTZ;
