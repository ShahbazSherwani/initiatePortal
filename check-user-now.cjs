const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.hruwzvreotstwnaarucf:VT1CHeNNwvKxnCGt@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  const client = await pool.connect();
  try {
    console.log('=== Checking for sshabbir02@gmail.com ===\n');
    
    // Check for the synced user by email
    const r1 = await client.query(
      "SELECT id, firebase_uid, email, global_user_id, created_at FROM users WHERE email = $1",
      ['sshabbir02@gmail.com']
    );
    console.log('Users with email sshabbir02@gmail.com:', r1.rows.length);
    r1.rows.forEach(r => console.log(JSON.stringify(r, null, 2)));
    
    // Check by Firebase UID from Make.com response
    const r2 = await client.query(
      "SELECT id, firebase_uid, email FROM users WHERE firebase_uid = $1",
      ['8w6bKX0ozPeKky1M2Uy1pnYIy193']
    );
    console.log('\nUsers with Firebase UID 8w6bKX0ozPeKky1M2Uy1pnYIy193:', r2.rows.length);
    r2.rows.forEach(r => console.log(JSON.stringify(r, null, 2)));
    
    // Check if user ID 275 exists
    const r3 = await client.query(
      "SELECT id, firebase_uid, email, global_user_id FROM users WHERE id = 275"
    );
    console.log('\nUser with ID 275:', r3.rows.length);
    r3.rows.forEach(r => console.log(JSON.stringify(r, null, 2)));
    
    // Total users
    const count = await client.query('SELECT COUNT(*) as total FROM users');
    console.log('\nTotal users in database:', count.rows[0].total);
    
    // Check recent users
    const recent = await client.query(
      "SELECT id, firebase_uid, email, created_at FROM users ORDER BY created_at DESC LIMIT 5"
    );
    console.log('\nMost recent 5 users:');
    recent.rows.forEach(r => console.log(`  ${r.id}: ${r.email} (${r.created_at})`));
    
  } finally {
    client.release();
    await pool.end();
  }
})();
