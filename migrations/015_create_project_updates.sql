-- Migration: Create project_updates table
-- Stores borrower/issuer posted updates for published campaigns.
-- Updates require admin approval before being visible to investors.

CREATE TABLE IF NOT EXISTS project_updates (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  author_uid VARCHAR(255) NOT NULL,
  author_name VARCHAR(255),
  author_role VARCHAR(100),

  -- Content
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,

  -- Approval workflow
  status VARCHAR(20) DEFAULT 'pending',      -- 'pending' | 'approved' | 'rejected'
  admin_notes TEXT,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_pu_project_id ON project_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_pu_author_uid ON project_updates(author_uid);
CREATE INDEX IF NOT EXISTS idx_pu_status ON project_updates(status);
CREATE INDEX IF NOT EXISTS idx_pu_created_at ON project_updates(created_at DESC);
