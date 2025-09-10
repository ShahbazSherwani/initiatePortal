import { Pool } from 'pg';
import { config } from 'dotenv';

config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  let client;
  
  try {
    console.log('🚀 Starting KYC migration...');
    client = await pool.connect();
    
    // First check if schema_migrations table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('📋 Creating schema_migrations table...');
      await client.query(`
        CREATE TABLE schema_migrations (
          id SERIAL PRIMARY KEY,
          migration_name VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          rollback_sql TEXT
        );
      `);
      console.log('✅ Schema migrations table created');
    }
    
    // Check if our migration has already been run
    const migrationCheck = await client.query(
      'SELECT 1 FROM schema_migrations WHERE migration_name = $1',
      ['002_add_kyc_compliance_fields']
    );
    
    if (migrationCheck.rows.length > 0) {
      console.log('⚠️  Migration 002_add_kyc_compliance_fields has already been executed. Skipping.');
      return;
    }
    
    console.log('⚡ Running KYC compliance fields migration...');
    
    // Run the migration in chunks to avoid timeouts
    await client.query('BEGIN');
    
    // First, log the migration
    await client.query(`
      INSERT INTO schema_migrations (migration_name, rollback_sql)
      VALUES ('002_add_kyc_compliance_fields', 'SELECT 1')
    `);
    
    console.log('📝 Adding KYC fields to borrower_profiles...');
    
    // Add fields to borrower_profiles
    await client.query(`
      ALTER TABLE borrower_profiles 
      ADD COLUMN IF NOT EXISTS place_of_birth VARCHAR(255),
      ADD COLUMN IF NOT EXISTS gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
      ADD COLUMN IF NOT EXISTS civil_status VARCHAR(50) CHECK (civil_status IN ('Single', 'Married', 'Divorced', 'Widowed', 'Separated')),
      ADD COLUMN IF NOT EXISTS nationality VARCHAR(100),
      ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS secondary_id_type VARCHAR(50) CHECK (secondary_id_type IN ('Drivers License', 'Postal ID', 'Voters ID', 'PhilHealth ID', 'SSS ID', 'GSIS ID', 'PRC ID', 'OFW ID', 'Senior Citizen ID', 'PWD ID')),
      ADD COLUMN IF NOT EXISTS secondary_id_number VARCHAR(100)
    `);
    
    await client.query(`
      ALTER TABLE borrower_profiles 
      ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100),
      ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS emergency_contact_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS is_individual_account BOOLEAN DEFAULT TRUE
    `);
    
    await client.query(`
      ALTER TABLE borrower_profiles 
      ADD COLUMN IF NOT EXISTS business_registration_type VARCHAR(50) CHECK (business_registration_type IN ('SEC', 'CDA', 'DTI')),
      ADD COLUMN IF NOT EXISTS business_registration_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS business_registration_date DATE,
      ADD COLUMN IF NOT EXISTS corporate_tin VARCHAR(50),
      ADD COLUMN IF NOT EXISTS nature_of_business VARCHAR(255)
    `);
    
    await client.query(`
      ALTER TABLE borrower_profiles 
      ADD COLUMN IF NOT EXISTS principal_office_street VARCHAR(255),
      ADD COLUMN IF NOT EXISTS principal_office_barangay VARCHAR(255),
      ADD COLUMN IF NOT EXISTS principal_office_municipality VARCHAR(255),
      ADD COLUMN IF NOT EXISTS principal_office_province VARCHAR(255),
      ADD COLUMN IF NOT EXISTS principal_office_country VARCHAR(100) DEFAULT 'Philippines',
      ADD COLUMN IF NOT EXISTS principal_office_postal_code VARCHAR(10)
    `);
    
    await client.query(`
      ALTER TABLE borrower_profiles 
      ADD COLUMN IF NOT EXISTS gis_total_assets DECIMAL(15,2),
      ADD COLUMN IF NOT EXISTS gis_total_liabilities DECIMAL(15,2),
      ADD COLUMN IF NOT EXISTS gis_paid_up_capital DECIMAL(15,2),
      ADD COLUMN IF NOT EXISTS gis_number_of_stockholders INTEGER,
      ADD COLUMN IF NOT EXISTS gis_number_of_employees INTEGER,
      ADD COLUMN IF NOT EXISTS is_politically_exposed_person BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS pep_details TEXT
    `);
    
    await client.query(`
      ALTER TABLE borrower_profiles 
      ADD COLUMN IF NOT EXISTS authorized_signatory_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS authorized_signatory_position VARCHAR(100),
      ADD COLUMN IF NOT EXISTS authorized_signatory_id_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS authorized_signatory_id_number VARCHAR(100)
    `);
    
    console.log('📝 Adding KYC fields to investor_profiles...');
    
    // Add same fields to investor_profiles
    await client.query(`
      ALTER TABLE investor_profiles 
      ADD COLUMN IF NOT EXISTS place_of_birth VARCHAR(255),
      ADD COLUMN IF NOT EXISTS gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
      ADD COLUMN IF NOT EXISTS civil_status VARCHAR(50) CHECK (civil_status IN ('Single', 'Married', 'Divorced', 'Widowed', 'Separated')),
      ADD COLUMN IF NOT EXISTS nationality VARCHAR(100),
      ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS secondary_id_type VARCHAR(50) CHECK (secondary_id_type IN ('Drivers License', 'Postal ID', 'Voters ID', 'PhilHealth ID', 'SSS ID', 'GSIS ID', 'PRC ID', 'OFW ID', 'Senior Citizen ID', 'PWD ID')),
      ADD COLUMN IF NOT EXISTS secondary_id_number VARCHAR(100)
    `);
    
    await client.query(`
      ALTER TABLE investor_profiles 
      ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100),
      ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS emergency_contact_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS is_individual_account BOOLEAN DEFAULT TRUE
    `);
    
    await client.query(`
      ALTER TABLE investor_profiles 
      ADD COLUMN IF NOT EXISTS business_registration_type VARCHAR(50) CHECK (business_registration_type IN ('SEC', 'CDA', 'DTI')),
      ADD COLUMN IF NOT EXISTS business_registration_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS business_registration_date DATE,
      ADD COLUMN IF NOT EXISTS corporate_tin VARCHAR(50),
      ADD COLUMN IF NOT EXISTS nature_of_business VARCHAR(255)
    `);
    
    await client.query(`
      ALTER TABLE investor_profiles 
      ADD COLUMN IF NOT EXISTS principal_office_street VARCHAR(255),
      ADD COLUMN IF NOT EXISTS principal_office_barangay VARCHAR(255),
      ADD COLUMN IF NOT EXISTS principal_office_municipality VARCHAR(255),
      ADD COLUMN IF NOT EXISTS principal_office_province VARCHAR(255),
      ADD COLUMN IF NOT EXISTS principal_office_country VARCHAR(100) DEFAULT 'Philippines',
      ADD COLUMN IF NOT EXISTS principal_office_postal_code VARCHAR(10)
    `);
    
    await client.query(`
      ALTER TABLE investor_profiles 
      ADD COLUMN IF NOT EXISTS gis_total_assets DECIMAL(15,2),
      ADD COLUMN IF NOT EXISTS gis_total_liabilities DECIMAL(15,2),
      ADD COLUMN IF NOT EXISTS gis_paid_up_capital DECIMAL(15,2),
      ADD COLUMN IF NOT EXISTS gis_number_of_stockholders INTEGER,
      ADD COLUMN IF NOT EXISTS gis_number_of_employees INTEGER,
      ADD COLUMN IF NOT EXISTS is_politically_exposed_person BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS pep_details TEXT
    `);
    
    await client.query(`
      ALTER TABLE investor_profiles 
      ADD COLUMN IF NOT EXISTS authorized_signatory_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS authorized_signatory_position VARCHAR(100),
      ADD COLUMN IF NOT EXISTS authorized_signatory_id_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS authorized_signatory_id_number VARCHAR(100)
    `);
    
    console.log('📊 Creating indexes...');
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_borrower_profiles_account_type ON borrower_profiles(is_individual_account)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_borrower_profiles_business_reg ON borrower_profiles(business_registration_type, business_registration_number)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_borrower_profiles_pep ON borrower_profiles(is_politically_exposed_person)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_investor_profiles_account_type ON investor_profiles(is_individual_account)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_investor_profiles_business_reg ON investor_profiles(business_registration_type, business_registration_number)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_investor_profiles_pep ON investor_profiles(is_politically_exposed_person)
    `);
    
    await client.query('COMMIT');
    
    console.log('🎉 KYC compliance fields migration completed successfully!');
    console.log('✅ Added comprehensive KYC fields for Individual and Non-Individual accounts');
    
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

runMigration();
