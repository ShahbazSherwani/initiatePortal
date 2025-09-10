import { Pool } from 'pg';
import { config } from 'dotenv';

config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function verifyMigration() {
  let client;
  
  try {
    console.log('🔍 Verifying KYC migration results...');
    client = await pool.connect();
    
    // Check borrower_profiles columns
    console.log('\n📋 Borrower Profiles KYC Fields:');
    const borrowerCols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'borrower_profiles' 
      AND column_name IN (
        'place_of_birth', 'gender', 'civil_status', 'nationality', 'contact_email',
        'secondary_id_type', 'secondary_id_number', 'emergency_contact_name',
        'emergency_contact_relationship', 'emergency_contact_phone', 'emergency_contact_email',
        'is_individual_account', 'business_registration_type', 'business_registration_number',
        'business_registration_date', 'corporate_tin', 'nature_of_business',
        'principal_office_street', 'principal_office_barangay', 'principal_office_municipality',
        'principal_office_province', 'principal_office_country', 'principal_office_postal_code',
        'gis_total_assets', 'gis_total_liabilities', 'gis_paid_up_capital',
        'gis_number_of_stockholders', 'gis_number_of_employees', 'is_politically_exposed_person',
        'pep_details', 'authorized_signatory_name', 'authorized_signatory_position',
        'authorized_signatory_id_type', 'authorized_signatory_id_number'
      )
      ORDER BY column_name;
    `);
    
    borrowerCols.rows.forEach(col => {
      console.log(`  ✅ ${col.column_name} (${col.data_type})`);
    });
    
    // Check investor_profiles columns
    console.log('\n📋 Investor Profiles KYC Fields:');
    const investorCols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'investor_profiles' 
      AND column_name IN (
        'place_of_birth', 'gender', 'civil_status', 'nationality', 'contact_email',
        'secondary_id_type', 'secondary_id_number', 'emergency_contact_name',
        'emergency_contact_relationship', 'emergency_contact_phone', 'emergency_contact_email',
        'is_individual_account', 'business_registration_type', 'business_registration_number',
        'business_registration_date', 'corporate_tin', 'nature_of_business',
        'principal_office_street', 'principal_office_barangay', 'principal_office_municipality',
        'principal_office_province', 'principal_office_country', 'principal_office_postal_code',
        'gis_total_assets', 'gis_total_liabilities', 'gis_paid_up_capital',
        'gis_number_of_stockholders', 'gis_number_of_employees', 'is_politically_exposed_person',
        'pep_details', 'authorized_signatory_name', 'authorized_signatory_position',
        'authorized_signatory_id_type', 'authorized_signatory_id_number'
      )
      ORDER BY column_name;
    `);
    
    investorCols.rows.forEach(col => {
      console.log(`  ✅ ${col.column_name} (${col.data_type})`);
    });
    
    // Check indexes
    console.log('\n📊 Created Indexes:');
    const indexes = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes 
      WHERE tablename IN ('borrower_profiles', 'investor_profiles')
      AND indexname LIKE '%account_type%' OR indexname LIKE '%business_reg%' OR indexname LIKE '%pep%'
      ORDER BY tablename, indexname;
    `);
    
    indexes.rows.forEach(idx => {
      console.log(`  ✅ ${idx.indexname} on ${idx.tablename}`);
    });
    
    // Check migration log
    console.log('\n📝 Migration History:');
    const migrations = await client.query(`
      SELECT migration_name, executed_at
      FROM schema_migrations 
      ORDER BY executed_at;
    `);
    
    migrations.rows.forEach(mig => {
      console.log(`  ✅ ${mig.migration_name} (${mig.executed_at})`);
    });
    
    console.log('\n🎉 Migration verification completed successfully!');
    console.log(`📊 Total KYC fields added: ${borrowerCols.rows.length} per profile table`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

verifyMigration();
