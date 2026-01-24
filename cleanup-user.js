// Script to completely clean up a user from the database
// Run with: node cleanup-user.js <email>

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function cleanupUser(email) {
  const client = await pool.connect();
  
  try {
    console.log(`\n🔍 Looking for user with email: ${email}`);
    
    // Find all records with this email
    const userResult = await client.query(
      'SELECT firebase_uid, email, full_name, has_investor_account, has_borrower_account, email_verified FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ No user found with that email in users table');
    } else {
      console.log('📋 Found user(s) in users table:');
      for (const row of userResult.rows) {
        console.log(`   - UID: ${row.firebase_uid}, Name: ${row.full_name}, Verified: ${row.email_verified}`);
      }
    }
    
    // Check for orphaned profiles by looking at email_verifications
    const verificationResult = await client.query(
      'SELECT firebase_uid, email, verified FROM email_verifications WHERE email = $1',
      [email]
    );
    
    if (verificationResult.rows.length > 0) {
      console.log(`📋 Found ${verificationResult.rows.length} email_verifications`);
    }
    
    // Collect all firebase_uids associated with this email
    const allUids = new Set();
    userResult.rows.forEach(r => allUids.add(r.firebase_uid));
    verificationResult.rows.forEach(r => allUids.add(r.firebase_uid));
    
    // Now delete everything
    console.log('\n🗑️  Starting cleanup...');
    
    for (const uid of allUids) {
      console.log(`\n   Cleaning up UID: ${uid}`);
      
      // Delete in correct order (children first, then parent)
      const tables = [
        { name: 'password_reset_tokens', column: 'firebase_uid' },
        { name: 'email_verifications', column: 'firebase_uid' },
        { name: 'notifications', column: 'firebase_uid' },
        { name: 'team_members', column: 'owner_uid' },
        { name: 'team_members', column: 'member_uid' },
        { name: 'projects', column: 'firebase_uid' },
        { name: 'investor_profiles', column: 'firebase_uid' },
        { name: 'borrower_profiles', column: 'firebase_uid' },
        { name: 'users', column: 'firebase_uid' },
      ];
      
      for (const { name, column } of tables) {
        try {
          const result = await client.query(`DELETE FROM ${name} WHERE ${column} = $1`, [uid]);
          if (result.rowCount > 0) {
            console.log(`   ✅ Deleted ${result.rowCount} row(s) from ${name}`);
          }
        } catch (err) {
          // Ignore errors for tables that might not exist
        }
      }
    }
    
    // Also delete by email directly
    console.log('\n   Cleaning up by email directly...');
    try {
      const evResult = await client.query('DELETE FROM email_verifications WHERE email = $1', [email]);
      if (evResult.rowCount > 0) console.log(`   ✅ Deleted ${evResult.rowCount} email_verifications by email`);
    } catch (err) { }
    
    try {
      const userDeleteResult = await client.query('DELETE FROM users WHERE email = $1', [email]);
      if (userDeleteResult.rowCount > 0) console.log(`   ✅ Deleted ${userDeleteResult.rowCount} users by email`);
    } catch (err) { }
    
    console.log('\n✅ Cleanup complete! User can now re-register with a fresh account.');
    console.log('⚠️  Note: You also need to delete the user from Firebase Console if they exist there.');
    
  } finally {
    client.release();
    await pool.end();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node cleanup-user.js <email>');
  console.log('Example: node cleanup-user.js sshabbir02@gmail.com');
  process.exit(1);
}

cleanupUser(email).catch(console.error);
