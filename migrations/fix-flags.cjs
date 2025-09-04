const { Pool } = require('pg');
require('dotenv').config();

async function fixAccountFlags() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  let client;

  try {
    console.log('🚀 Connecting to database...');
    client = await pool.connect();
    console.log('✅ Connected to database');

    // Check current state
    console.log('\n📊 Checking current account flags...');
    const currentState = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN has_borrower_account THEN 1 END) as current_borrower_flags,
        COUNT(CASE WHEN has_investor_account THEN 1 END) as current_investor_flags,
        (SELECT COUNT(DISTINCT firebase_uid) FROM borrower_profiles WHERE firebase_uid IS NOT NULL) as borrower_profiles_count,
        (SELECT COUNT(DISTINCT firebase_uid) FROM investor_profiles WHERE firebase_uid IS NOT NULL) as investor_profiles_count,
        (SELECT COUNT(DISTINCT firebase_uid) FROM projects WHERE firebase_uid IS NOT NULL) as users_with_projects
      FROM users 
      WHERE has_completed_registration = true
    `);

    const current = currentState.rows[0];
    console.log(`👥 Total registered users: ${current.total_users}`);
    console.log(`🏦 Current borrower flags: ${current.current_borrower_flags}`);
    console.log(`📈 Current investor flags: ${current.current_investor_flags}`);
    console.log(`📋 Users with borrower profiles: ${current.borrower_profiles_count}`);
    console.log(`💼 Users with investor profiles: ${current.investor_profiles_count}`);
    console.log(`📝 Users with projects: ${current.users_with_projects}`);

    console.log('\n🔧 Starting migration...');

    // Update borrower flags for users who have borrower profiles
    const borrowerProfileUpdate = await client.query(`
      UPDATE users 
      SET has_borrower_account = true, updated_at = CURRENT_TIMESTAMP
      WHERE firebase_uid IN (
        SELECT DISTINCT firebase_uid 
        FROM borrower_profiles
        WHERE firebase_uid IS NOT NULL
      ) AND has_borrower_account = false
    `);

    console.log(`✅ Updated borrower flags for ${borrowerProfileUpdate.rowCount} users with borrower profiles`);

    // Update investor flags for users who have investor profiles
    const investorProfileUpdate = await client.query(`
      UPDATE users 
      SET has_investor_account = true, updated_at = CURRENT_TIMESTAMP
      WHERE firebase_uid IN (
        SELECT DISTINCT firebase_uid 
        FROM investor_profiles
        WHERE firebase_uid IS NOT NULL
      ) AND has_investor_account = false
    `);

    console.log(`✅ Updated investor flags for ${investorProfileUpdate.rowCount} users with investor profiles`);

    // Update borrower flags for users who have projects
    const projectsUpdate = await client.query(`
      UPDATE users 
      SET has_borrower_account = true, updated_at = CURRENT_TIMESTAMP
      WHERE firebase_uid IN (
        SELECT DISTINCT firebase_uid 
        FROM projects
        WHERE firebase_uid IS NOT NULL
      ) AND has_borrower_account = false
    `);

    console.log(`✅ Updated borrower flags for ${projectsUpdate.rowCount} users with projects`);

    // Verify final state
    console.log('\n📊 Final verification...');
    const finalState = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN has_borrower_account THEN 1 END) as final_borrower_flags,
        COUNT(CASE WHEN has_investor_account THEN 1 END) as final_investor_flags
      FROM users 
      WHERE has_completed_registration = true
    `);

    const final = finalState.rows[0];
    console.log(`👥 Total registered users: ${final.total_users}`);
    console.log(`🏦 Final borrower flags: ${final.final_borrower_flags}`);
    console.log(`📈 Final investor flags: ${final.final_investor_flags}`);

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run the migration
fixAccountFlags();
