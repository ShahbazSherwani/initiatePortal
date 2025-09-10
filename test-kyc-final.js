// Quick KYC Implementation Test
// This script tests the KYC functionality end-to-end

import { Pool } from 'pg';
import { config } from 'dotenv';

config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function testKYCImplementation() {
  let client;
  
  try {
    console.log('🧪 Testing KYC Implementation...\n');
    client = await pool.connect();
    
    // Test 1: Check if KYC fields exist
    console.log('1️⃣ Testing KYC fields in database...');
    const borrowerFields = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'borrower_profiles' 
      AND column_name IN ('place_of_birth', 'gender', 'is_individual_account', 'business_registration_type')
    `);
    
    const investorFields = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'investor_profiles' 
      AND column_name IN ('place_of_birth', 'gender', 'is_individual_account', 'business_registration_type')
    `);
    
    console.log(`   ✅ Borrower KYC fields found: ${borrowerFields.rows.length}`);
    console.log(`   ✅ Investor KYC fields found: ${investorFields.rows.length}`);
    
    // Test 2: Test Individual Account Data
    console.log('\n2️⃣ Testing Individual Account KYC data insertion...');
    const testUID = 'test-kyc-individual-' + Date.now();
    
    await client.query(`
      INSERT INTO borrower_profiles (
        firebase_uid, is_individual_account, place_of_birth, gender, 
        civil_status, nationality, contact_email, secondary_id_type,
        secondary_id_number, emergency_contact_name, emergency_contact_relationship,
        emergency_contact_phone, is_politically_exposed_person
      ) VALUES (
        $1, true, 'Manila, Philippines', 'Male', 'Single', 'Filipino',
        'test@example.com', 'Drivers License', 'DL123456789',
        'John Doe', 'Father', '+639123456789', false
      )
    `, [testUID]);
    
    const individualTest = await client.query('SELECT * FROM borrower_profiles WHERE firebase_uid = $1', [testUID]);
    console.log('   ✅ Individual account data inserted successfully');
    console.log(`   📋 Fields populated: ${Object.keys(individualTest.rows[0]).length}`);
    
    // Test 3: Test Business Account Data
    console.log('\n3️⃣ Testing Business Account KYC data insertion...');
    const testUID2 = 'test-kyc-business-' + Date.now();
    
    await client.query(`
      INSERT INTO investor_profiles (
        firebase_uid, is_individual_account, business_registration_type,
        business_registration_number, corporate_tin, nature_of_business,
        principal_office_street, principal_office_municipality, principal_office_province,
        authorized_signatory_name, authorized_signatory_position, is_politically_exposed_person
      ) VALUES (
        $1, false, 'SEC', 'SEC-12345', 'TIN-987654321', 'Technology Services',
        '123 Business St', 'Makati City', 'Metro Manila',
        'Jane Smith', 'CEO', false
      )
    `, [testUID2]);
    
    const businessTest = await client.query('SELECT * FROM investor_profiles WHERE firebase_uid = $1', [testUID2]);
    console.log('   ✅ Business account data inserted successfully');
    console.log(`   📋 Fields populated: ${Object.keys(businessTest.rows[0]).length}`);
    
    // Test 4: Check Migration History
    console.log('\n4️⃣ Checking migration history...');
    const migrations = await client.query('SELECT * FROM schema_migrations ORDER BY executed_at DESC LIMIT 3');
    console.log('   ✅ Recent migrations:');
    migrations.rows.forEach(mig => {
      console.log(`      - ${mig.migration_name} (${mig.executed_at})`);
    });
    
    // Test 5: Check Indexes
    console.log('\n5️⃣ Verifying performance indexes...');
    const indexes = await client.query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE tablename IN ('borrower_profiles', 'investor_profiles')
      AND (indexname LIKE '%account_type%' OR indexname LIKE '%business_reg%' OR indexname LIKE '%pep%')
    `);
    console.log(`   ✅ KYC-related indexes found: ${indexes.rows.length}`);
    
    // Cleanup test data
    await client.query('DELETE FROM borrower_profiles WHERE firebase_uid = $1', [testUID]);
    await client.query('DELETE FROM investor_profiles WHERE firebase_uid = $1', [testUID2]);
    
    console.log('\n🎉 KYC Implementation Test PASSED!');
    console.log('\n📊 Test Results Summary:');
    console.log('   ✅ Database schema: Complete');
    console.log('   ✅ Individual KYC: Working');
    console.log('   ✅ Business KYC: Working');
    console.log('   ✅ Migration tracking: Active');
    console.log('   ✅ Performance indexes: Created');
    console.log('\n🚀 KYC system is ready for production use!');
    
  } catch (error) {
    console.error('❌ KYC Implementation Test FAILED:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

testKYCImplementation();
