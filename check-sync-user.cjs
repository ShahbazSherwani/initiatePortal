const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.hruwzvreotstwnaarucf:ofLsAuJ9aqFYbVwX@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'
});

async function check() {
  try {
    // Check the new user from the logs
    const result = await pool.query(
      `SELECT id, email, firebase_uid, full_name, email_verified, created_at 
       FROM users 
       WHERE firebase_uid = 'hkraBlYQUggnhgTrAhairPsbgTC2'`
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User NOT found in database - profile creation failed!');
    } else {
      console.log('User found:', result.rows[0]);
    }

    // Check all recent users
    const recent = await pool.query(
      `SELECT id, email, firebase_uid, full_name, created_at 
       FROM users 
       ORDER BY created_at DESC
       LIMIT 5`
    );
    console.log('\nMost recent users:');
    recent.rows.forEach(r => {
      console.log(`  ${r.id}: ${r.email || 'NO EMAIL'} | ${r.firebase_uid?.substring(0,10)}... | ${r.full_name}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

check();
