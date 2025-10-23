// Unsuspend specific user
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function unsuspendUser() {
  try {
    const targetUid = 'NkxgcXqkEGXHSpTmuvwZpSlLFun2';
    
    console.log('🔍 Checking user status...\n');
    
    // Check current status
    const before = await pool.query(
      'SELECT firebase_uid, full_name, suspension_scope, created_at FROM users WHERE firebase_uid = $1',
      [targetUid]
    );
    
    if (before.rows.length === 0) {
      console.log('❌ User not found!');
      await pool.end();
      return;
    }
    
    const user = before.rows[0];
    console.log('Current Status:');
    console.log(`   UID: ${user.firebase_uid}`);
    console.log(`   Name: ${user.full_name}`);
    console.log(`   Suspension: ${user.suspension_scope}`);
    console.log(`   Created: ${user.created_at}\n`);
    
    if (user.suspension_scope === 'none') {
      console.log('✅ User is already active (not suspended)');
      await pool.end();
      return;
    }
    
    // Unsuspend the user
    console.log('🔧 Unsuspending user...');
    await pool.query(
      "UPDATE users SET suspension_scope = 'none' WHERE firebase_uid = $1",
      [targetUid]
    );
    
    // Verify the change
    const after = await pool.query(
      'SELECT suspension_scope FROM users WHERE firebase_uid = $1',
      [targetUid]
    );
    
    console.log(`✅ User unsuspended successfully!`);
    console.log(`   New status: ${after.rows[0].suspension_scope}\n`);
    
    // Check all suspended users
    const stillSuspended = await pool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE suspension_scope != 'none' AND suspension_scope IS NOT NULL
    `);
    
    console.log(`📊 Remaining suspended accounts: ${stillSuspended.rows[0].count}`);
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

unsuspendUser();
