-- Migration: Create project_credit_reviews table
-- This is an ADDITIVE migration — it does NOT modify existing tables.

CREATE TABLE IF NOT EXISTS project_credit_reviews (
  id SERIAL PRIMARY KEY,

  -- Foreign keys
  project_id INTEGER NOT NULL,
  issuer_id VARCHAR(255),

  -- Issuer snapshot (read-only reference at time of review)
  issuer_score_snapshot NUMERIC,
  issuer_risk_bucket_snapshot VARCHAR(20),
  issuer_rating_snapshot VARCHAR(50),

  -- Campaign / facility details
  campaign_type VARCHAR(20) NOT NULL,          -- 'debt' | 'equity'
  facility_amount NUMERIC,
  tenor_value NUMERIC,
  tenor_unit VARCHAR(20),                     -- 'days' | 'months' | 'years'
  grace_period_value NUMERIC,
  grace_period_unit VARCHAR(20),

  -- Project/facility scoring (debt)
  tenor_score_option VARCHAR(30),             -- enum key from scoring table
  tenor_score NUMERIC,
  track_record_category VARCHAR(30),
  track_record_score NUMERIC,
  project_credit_score NUMERIC,
  project_risk_bucket VARCHAR(20),            -- 'low' | 'medium' | 'high'

  -- Final decision
  final_campaign_risk_bucket VARCHAR(20) NOT NULL,  -- 'low' | 'medium' | 'high'
  is_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  reviewer_notes TEXT,
  review_status VARCHAR(20) DEFAULT 'draft',  -- 'draft' | 'finalized'
  scoring_version VARCHAR(20) DEFAULT '1.0.0',

  -- Audit
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_pcr_project_id ON project_credit_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_pcr_issuer_id ON project_credit_reviews(issuer_id);
CREATE INDEX IF NOT EXISTS idx_pcr_review_status ON project_credit_reviews(review_status);
CREATE INDEX IF NOT EXISTS idx_pcr_final_bucket ON project_credit_reviews(final_campaign_risk_bucket);
