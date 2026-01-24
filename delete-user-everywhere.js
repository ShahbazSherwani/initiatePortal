// Script to delete a user from Firebase AND Database
// Run with: node delete-user-everywhere.js <email>

import pg from 'pg';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

dotenv.config();

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
try {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized');
} catch (err) {
  console.log('⚠️  Could not initialize Firebase Admin:', err.message);
  console.log('   Will only delete from database');
}

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function deleteUserEverywhere(email) {
  const client = await pool.connect();
  
  try {
    console.log(`\n🔍 Looking for user with email: ${email}`);
    
    // Step 1: Find user in Firebase by email
    let firebaseUser = null;
    try {
      firebaseUser = await admin.auth().getUserByEmail(email);
      console.log(`📋 Found Firebase user: ${firebaseUser.uid}`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        console.log('❌ No user found in Firebase with that email');
      } else {
        console.log('⚠️  Firebase error:', err.message);
      }
    }
    
    // Step 2: Find user in database
    const userResult = await client.query(
      'SELECT firebase_uid, email, full_name FROM users WHERE email = $1',
      [email]
    );
    
    const dbUids = userResult.rows.map(r => r.firebase_uid);
    if (userResult.rows.length > 0) {
      console.log(`📋 Found ${userResult.rows.length} user(s) in database`);
    } else {
      console.log('❌ No user found in database with that email');
    }
    
    // Step 3: Find all UIDs in email_verifications
    const evResult = await client.query(
      'SELECT DISTINCT firebase_uid FROM email_verifications WHERE email = $1',
      [email]
    );
    const evUids = evResult.rows.map(r => r.firebase_uid);
    if (evResult.rows.length > 0) {
      console.log(`📋 Found ${evResult.rows.length} email_verifications`);
    }
    
    // Collect all UIDs
    const allUids = new Set([...dbUids, ...evUids]);
    if (firebaseUser) {
      allUids.add(firebaseUser.uid);
    }
    
    console.log(`\n📋 Total UIDs to clean up: ${allUids.size}`);
    
    // Step 4: Delete from Firebase
    if (firebaseUser) {
      try {
        await admin.auth().deleteUser(firebaseUser.uid);
        console.log(`✅ Deleted user from Firebase: ${firebaseUser.uid}`);
      } catch (err) {
        console.log(`⚠️  Could not delete from Firebase: ${err.message}`);
      }
    }
    
    // Also try to delete any other UIDs from Firebase
    for (const uid of allUids) {
      if (uid !== firebaseUser?.uid) {
        try {
          await admin.auth().deleteUser(uid);
          console.log(`✅ Deleted orphan Firebase user: ${uid}`);
        } catch (err) {
          // Ignore - user probably doesn't exist
        }
      }
    }
    
    // Step 5: Delete from database
    console.log('\n🗑️  Deleting from database...');
    
    for (const uid of allUids) {
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
            console.log(`   ✅ Deleted ${result.rowCount} from ${name} (UID: ${uid.slice(0,8)}...)`);
          }
        } catch (err) { }
      }
    }
    
    // Also delete by email
    await client.query('DELETE FROM email_verifications WHERE email = $1', [email]);
    await client.query('DELETE FROM users WHERE email = $1', [email]);
    
    console.log('\n✅ User completely deleted from Firebase and Database!');
    console.log('   User can now register fresh.');
    
  } finally {
    client.release();
    await pool.end();
  }
}

const email = process.argv[2];

if (!email) {
  console.log('Usage: node delete-user-everywhere.js <email>');
  process.exit(1);
}

deleteUserEverywhere(email).catch(console.error);
