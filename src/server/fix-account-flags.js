// Database migration script to fix account flags
// Run this script to fix users who have account profiles but flags are not set correctly

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixAccountFlags() {
  const client = await db.connect();
  
  try {
    console.log('🔧 Starting account flags migration...');
    
    // Check current state for the specific user
    const userCheck = await client.query(`
      SELECT 
        firebase_uid,
        full_name,
        has_borrower_account,
        has_investor_account,
        current_account_type
      FROM users 
      WHERE firebase_uid = 'hfAt4L2H4Pgzchk2Xcw15IKcMYJ2'
    `);
    
    console.log('📊 Current user state:', userCheck.rows[0]);
    
    // Count profiles
    const borrowerProfiles = await client.query(`
      SELECT COUNT(*) as count FROM borrower_profiles WHERE firebase_uid = 'hfAt4L2H4Pgzchk2Xcw15IKcMYJ2'
    `);
    
    const investorProfiles = await client.query(`
      SELECT COUNT(*) as count FROM investor_profiles WHERE firebase_uid = 'hfAt4L2H4Pgzchk2Xcw15IKcMYJ2'
    `);
    
    const userProjects = await client.query(`
      SELECT COUNT(*) as count FROM projects WHERE created_by = 'hfAt4L2H4Pgzchk2Xcw15IKcMYJ2'
    `);
    
    console.log('📈 Profile counts:');
    console.log(`  - Borrower profiles: ${borrowerProfiles.rows[0].count}`);
    console.log(`  - Investor profiles: ${investorProfiles.rows[0].count}`);
    console.log(`  - User projects: ${userProjects.rows[0].count}`);
    
    // Fix borrower account flags based on profiles
    const borrowerFix = await client.query(`
      UPDATE users 
      SET has_borrower_account = TRUE 
      WHERE firebase_uid IN (
          SELECT DISTINCT firebase_uid 
          FROM borrower_profiles 
          WHERE firebase_uid IS NOT NULL
      ) 
      AND has_borrower_account = FALSE
    `);
    
    console.log(`✅ Fixed ${borrowerFix.rowCount} borrower account flags based on profiles`);
    
    // Fix investor account flags based on profiles
    const investorFix = await client.query(`
      UPDATE users 
      SET has_investor_account = TRUE 
      WHERE firebase_uid IN (
          SELECT DISTINCT firebase_uid 
          FROM investor_profiles 
          WHERE firebase_uid IS NOT NULL
      ) 
      AND has_investor_account = FALSE
    `);
    
    console.log(`✅ Fixed ${investorFix.rowCount} investor account flags based on profiles`);
    
    // Alternative fix: Set borrower flag for users with projects (if no borrower profile exists)
    const projectsFix = await client.query(`
      UPDATE users 
      SET has_borrower_account = TRUE 
      WHERE firebase_uid IN (
          SELECT DISTINCT created_by 
          FROM projects 
          WHERE created_by IS NOT NULL
      ) 
      AND has_borrower_account = FALSE
      AND firebase_uid NOT IN (SELECT firebase_uid FROM borrower_profiles WHERE firebase_uid IS NOT NULL)
    `);
    
    console.log(`✅ Fixed ${projectsFix.rowCount} borrower account flags based on projects`);
    
    // Show final state
    const finalCheck = await client.query(`
      SELECT 
        firebase_uid,
        full_name,
        has_borrower_account,
        has_investor_account,
        current_account_type
      FROM users 
      WHERE firebase_uid = 'hfAt4L2H4Pgzchk2Xcw15IKcMYJ2'
    `);
    
    console.log('📊 Final user state:', finalCheck.rows[0]);
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    client.release();
    await db.end();
  }
}

if (require.main === module) {
  fixAccountFlags();
}

module.exports = { fixAccountFlags };
