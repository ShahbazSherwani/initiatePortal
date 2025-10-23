// Check user email verification status
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkUsers() {
  try {
    console.log('🔍 Checking user email verification status...\n');
    
    const result = await pool.query(`
      SELECT 
        firebase_uid,
        full_name,
        email,
        email_verified,
        email_verified_at,
        created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`📊 Found ${result.rows.length} recent users:\n`);
    
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name || 'No name'}`);
      console.log(`   UID: ${user.firebase_uid}`);
      console.log(`   Email: ${user.email || '❌ NO EMAIL'}`);
      console.log(`   Verified: ${user.email_verified ? '✅ Yes' : '❌ No'}`);
      console.log(`   Verified At: ${user.email_verified_at || 'Never'}`);
      console.log(`   Created: ${user.created_at}\n`);
    });
    
    // Count verified vs unverified
    const stats = await pool.query(`
      SELECT 
        email_verified,
        COUNT(*) as count
      FROM users
      GROUP BY email_verified
    `);
    
    console.log('📈 Statistics:');
    stats.rows.forEach(stat => {
      console.log(`   ${stat.email_verified ? '✅ Verified' : '❌ Unverified'}: ${stat.count} users`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsers();
