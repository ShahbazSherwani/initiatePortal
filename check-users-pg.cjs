const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.hruwzvreotstwnaarucf:ofLsAuJ9aqFYbVwX@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

const firebaseUids = [
  'U7tobF2zFNYxYFKHCIf5PLjBExw2',  // westharborinc@aol.com
  '53liPMYkzFMs7q83zprzW29ymWl2',  // carter.b.williams@gmail.com
  'uKQ3sVnbPQffilrnbLizh4tNRzl',   // barringerrosa@gmail.com
  'IzuGirfqO0QVW9Mv3HGiAYb7FXc2'   // ass@ass.com
];

async function checkUsers() {
  console.log('=== Checking How Users Were Created ===\n');
  
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT id, firebase_uid, email, first_name, last_name, global_user_id, email_verified, created_at
      FROM users
      WHERE firebase_uid = ANY($1)
    `, [firebaseUids]);
    
    console.log(`Found ${result.rows.length} of 4 users in database\n`);
    
    result.rows.forEach((u, i) => {
      console.log(`--- User ${i + 1} ---`);
      console.log(`Email: ${u.email}`);
      console.log(`Firebase UID: ${u.firebase_uid}`);
      console.log(`Name: ${u.first_name || ''} ${u.last_name || ''}`);
      console.log(`Global User ID: ${u.global_user_id || 'N/A'}`);
      console.log(`Email Verified: ${u.email_verified}`);
      console.log(`Created: ${u.created_at}`);
      
      // Determine how user was created based on global_user_id
      if (u.global_user_id) {
        console.log(`\n🌐 ORIGIN: Synced FROM WordPress (InitiateGlobal) - has global_user_id`);
      } else {
        console.log(`\n🔥 ORIGIN: Direct registration on InitiatePH (no global_user_id)`);
      }
      console.log('');
    });
    
    // Check which ones are missing
    const foundUids = result.rows.map(u => u.firebase_uid);
    const missingUids = firebaseUids.filter(uid => !foundUids.includes(uid));
    
    if (missingUids.length > 0) {
      console.log('--- Missing Users (not in database) ---');
      missingUids.forEach(uid => {
        console.log(`Firebase UID: ${uid} - NOT FOUND IN DATABASE`);
        console.log('  (User exists in Firebase only - profile was not created in DB)');
      });
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

checkUsers().catch(console.error);
