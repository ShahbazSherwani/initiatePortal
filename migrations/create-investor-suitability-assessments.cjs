/**
 * Migration: Create investor_suitability_assessments table
 * Run: node migrations/create-investor-suitability-assessments.cjs
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create the suitability assessments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS investor_suitability_assessments (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(firebase_uid) ON DELETE CASCADE,

        -- A. Personal Info (may already exist in investor_profiles, stored here for audit)
        full_name TEXT,
        date_of_birth DATE,
        nationality TEXT,
        government_id_or_tin TEXT,
        address TEXT,
        contact_number TEXT,
        email TEXT,

        -- B. Employment & Financial Profile
        employment_status TEXT NOT NULL CHECK (employment_status IN ('employed','self_employed','unemployed','retired','student')),
        occupation_or_business_type TEXT,
        gross_annual_income_band TEXT NOT NULL CHECK (gross_annual_income_band IN ('below_250k','250k_to_500k','500k_to_1m','1m_to_5m','above_5m')),
        net_worth_band TEXT NOT NULL CHECK (net_worth_band IN ('below_500k','500k_to_1m','1m_to_5m','above_5m')),
        liquidity_band TEXT NOT NULL CHECK (liquidity_band IN ('below_100k','100k_to_500k','above_500k')),

        -- C. Investment Objectives & Experience
        main_investment_goal TEXT NOT NULL CHECK (main_investment_goal IN ('capital_preservation','regular_income','moderate_growth','high_growth_speculative')),
        investment_horizon TEXT NOT NULL CHECK (investment_horizon IN ('less_than_1_year','one_to_three_years','three_to_five_years','more_than_five_years')),
        investment_knowledge_level TEXT NOT NULL CHECK (investment_knowledge_level IN ('none','basic','intermediate','advanced')),
        investment_experience TEXT[] NOT NULL DEFAULT '{}',

        -- D. Risk Tolerance
        reaction_to_loss TEXT NOT NULL CHECK (reaction_to_loss IN ('sell_all','wait_and_monitor','invest_more')),
        high_risk_allocation TEXT NOT NULL CHECK (high_risk_allocation IN ('less_than_10_percent','ten_to_thirty_percent','over_30_percent')),
        risk_comfort_statement TEXT NOT NULL CHECK (risk_comfort_statement IN ('guaranteed_low_returns','moderate_fluctuations_for_growth','comfortable_with_losses_for_high_returns')),

        -- E. Declaration
        declaration_accepted BOOLEAN NOT NULL DEFAULT false,
        declaration_accepted_at TIMESTAMPTZ,
        risk_disclosure_accepted BOOLEAN NOT NULL DEFAULT false,
        risk_disclosure_accepted_at TIMESTAMPTZ,

        -- Computed Scores
        income_score SMALLINT NOT NULL DEFAULT 0,
        net_worth_score SMALLINT NOT NULL DEFAULT 0,
        liquidity_score SMALLINT NOT NULL DEFAULT 0,
        knowledge_score SMALLINT NOT NULL DEFAULT 0,
        experience_score SMALLINT NOT NULL DEFAULT 0,
        primary_goal_score SMALLINT NOT NULL DEFAULT 0,
        horizon_score SMALLINT NOT NULL DEFAULT 0,
        reaction_score SMALLINT NOT NULL DEFAULT 0,
        allocation_score SMALLINT NOT NULL DEFAULT 0,
        risk_attitude_score SMALLINT NOT NULL DEFAULT 0,
        total_score SMALLINT NOT NULL DEFAULT 0,

        -- Classification
        investor_risk_profile TEXT NOT NULL CHECK (investor_risk_profile IN ('conservative','moderate','aggressive')),

        -- Meta
        assessment_version TEXT NOT NULL DEFAULT '1.0',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_suitability_user_id ON investor_suitability_assessments(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_suitability_active ON investor_suitability_assessments(user_id, is_active) WHERE is_active = true;`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_suitability_profile ON investor_suitability_assessments(investor_risk_profile);`);

    // 3. Add cached columns to users table for fast eligibility checks
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS suitability_completed BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS suitability_score SMALLINT,
        ADD COLUMN IF NOT EXISTS suitability_profile TEXT;
    `);

    // 4. Create suitability_rejection_log table for compliance
    await client.query(`
      CREATE TABLE IF NOT EXISTS suitability_rejection_log (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        project_id TEXT,
        investor_risk_profile TEXT NOT NULL,
        project_type TEXT,
        project_risk_level TEXT,
        rejection_reason TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_rejection_log_user ON suitability_rejection_log(user_id);`);

    await client.query('COMMIT');
    console.log('✅ Migration complete: investor_suitability_assessments table created');
    console.log('✅ Users table updated with suitability columns');
    console.log('✅ Suitability rejection log table created');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
