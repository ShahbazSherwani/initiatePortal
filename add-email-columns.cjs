// Add email verification columns to users table
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addEmailVerificationColumns() {
  try {
    console.log('🔧 Adding email verification columns to users table...');
    
    // Check if columns already exist
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('email_verified', 'email_verified_at')
    `);
    
    console.log('📋 Existing email verification columns:', checkResult.rows.map(r => r.column_name));
    
    // Add email_verified column if it doesn't exist
    if (!checkResult.rows.find(r => r.column_name === 'email_verified')) {
      console.log('➕ Adding email_verified column...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ email_verified column added');
    } else {
      console.log('✅ email_verified column already exists');
    }
    
    // Add email_verified_at column if it doesn't exist
    if (!checkResult.rows.find(r => r.column_name === 'email_verified_at')) {
      console.log('➕ Adding email_verified_at column...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP
      `);
      console.log('✅ email_verified_at column added');
    } else {
      console.log('✅ email_verified_at column already exists');
    }
    
    // Verify columns were added
    const verifyResult = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('email_verified', 'email_verified_at')
      ORDER BY column_name
    `);
    
    console.log('\n📊 Final column status:');
    verifyResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.column_default ? `(default: ${col.column_default})` : ''}`);
    });
    
    // Check if email_verifications table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'email_verifications'
      )
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('\n✅ email_verifications table exists');
      
      // Show table structure
      const structureResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'email_verifications'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 email_verifications columns:');
      structureResult.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('\n❌ email_verifications table does NOT exist');
      console.log('⚠️  You need to run migration 007_add_email_verification.sql');
    }
    
    console.log('\n✅ Email verification setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

addEmailVerificationColumns();
