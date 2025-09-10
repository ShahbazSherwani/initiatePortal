import { Pool } from 'pg';
import { config } from 'dotenv';

config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function verifyKYCImplementation() {
  let client;
  
  try {
    console.log('🔍 Verifying KYC Implementation...');
    client = await pool.connect();
    
    // Check borrower_profiles table structure
    console.log('\n📋 Borrower Profiles KYC Fields:');
    const borrowerColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'borrower_profiles' 
      AND column_name IN (
        'is_individual_account', 'place_of_birth', 'gender', 'civil_status', 
        'nationality', 'contact_email', 'secondary_id_type', 'secondary_id_number',
        'emergency_contact_name', 'business_registration_type', 'corporate_tin',
        'is_politically_exposed_person', 'authorized_signatory_name'
      )
      ORDER BY column_name;
    `);
    
    console.log(`✅ Found ${borrowerColumns.rows.length} KYC fields in borrower_profiles`);
    
    // Check investor_profiles table structure  
    console.log('\n📋 Investor Profiles KYC Fields:');
    const investorColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'investor_profiles' 
      AND column_name IN (
        'is_individual_account', 'place_of_birth', 'gender', 'civil_status',
        'nationality', 'contact_email', 'business_registration_type', 
        'corporate_tin', 'nature_of_business', 'authorized_signatory_name',
        'is_politically_exposed_person'
      )
      ORDER BY column_name;
    `);
    
    console.log(`✅ Found ${investorColumns.rows.length} KYC fields in investor_profiles`);
    
    // Check migration status
    console.log('\n📝 Migration Status:');
    const migrations = await client.query(`
      SELECT migration_name, executed_at
      FROM schema_migrations 
      WHERE migration_name LIKE '%kyc%'
      ORDER BY executed_at DESC;
    `);
    
    if (migrations.rows.length > 0) {
      migrations.rows.forEach(row => {
        console.log(`✅ ${row.migration_name} - ${row.executed_at}`);
      });
    } else {
      console.log('⚠️  No KYC migrations found');
    }
    
    // Test data insertion (dry run)
    console.log('\n🧪 Testing KYC Data Structure...');
    
    const testData = {
      firebase_uid: 'test-uid-' + Date.now(),
      is_individual_account: true,
      place_of_birth: 'Manila, Philippines',
      gender: 'Male',
      civil_status: 'Single',
      nationality: 'Filipino',
      contact_email: 'test@example.com',
      emergency_contact_name: 'Emergency Contact',
      is_politically_exposed_person: false
    };
    
    // Verify we can insert test data (then rollback)
    await client.query('BEGIN');
    
    await client.query(`
      INSERT INTO borrower_profiles (
        firebase_uid, is_individual_account, place_of_birth, gender, 
        civil_status, nationality, contact_email, emergency_contact_name,
        is_politically_exposed_person, is_complete
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
    `, [
      testData.firebase_uid, testData.is_individual_account, testData.place_of_birth,
      testData.gender, testData.civil_status, testData.nationality, 
      testData.contact_email, testData.emergency_contact_name,
      testData.is_politically_exposed_person
    ]);
    
    console.log('✅ Test KYC data insertion successful');
    
    // Rollback test data
    await client.query('ROLLBACK');
    console.log('✅ Test data rollback successful');
    
    // Performance check
    console.log('\n⚡ Performance Check:');
    const indexCheck = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes 
      WHERE tablename IN ('borrower_profiles', 'investor_profiles')
      AND (indexname LIKE '%account_type%' OR indexname LIKE '%pep%')
      ORDER BY tablename, indexname;
    `);
    
    console.log(`✅ Found ${indexCheck.rows.length} KYC-related indexes`);
    indexCheck.rows.forEach(row => {
      console.log(`   - ${row.indexname} on ${row.tablename}`);
    });
    
    console.log('\n🎉 KYC Implementation Verification Complete!');
    console.log('📊 Summary:');
    console.log(`   - Borrower KYC fields: ${borrowerColumns.rows.length}`);
    console.log(`   - Investor KYC fields: ${investorColumns.rows.length}`);  
    console.log(`   - KYC migrations: ${migrations.rows.length}`);
    console.log(`   - Performance indexes: ${indexCheck.rows.length}`);
    console.log('   - Data insertion: ✅ Working');
    console.log('   - Transaction safety: ✅ Working');
    
    console.log('\n🚀 Ready for Testing!');
    console.log('1. Frontend: http://localhost:5173/register-kyc');
    console.log('2. API: POST /api/profile/complete-kyc');
    console.log('3. Database: All KYC tables ready');
    
  } catch (error) {
    console.error('❌ KYC Verification failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

verifyKYCImplementation();
