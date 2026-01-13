const pg = require('pg');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Firebase Admin
let serviceAccount;
try {
  serviceAccount = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'backend', 'firebase-service-account.json'))
  );
} catch (e) {
  console.error('Firebase service account file not found at backend/firebase-service-account.json');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function populateEmails() {
  console.log('🔧 Populating email column from Firebase Auth...\n');
  
  try {
    // Get all users from database
    const dbUsers = await pool.query(`
      SELECT id, firebase_uid, full_name 
      FROM public.users 
      WHERE email IS NULL
    `);
    
    console.log(`Found ${dbUsers.rows.length} users without email\n`);
    
    let updated = 0;
    let errors = 0;
    
    for (const user of dbUsers.rows) {
      try {
        // Get email from Firebase Auth
        const firebaseUser = await admin.auth().getUser(user.firebase_uid);
        const email = firebaseUser.email;
        
        if (email) {
          await pool.query(
            'UPDATE public.users SET email = $1 WHERE id = $2',
            [email, user.id]
          );
          console.log(`✅ Updated ${user.full_name || user.firebase_uid}: ${email}`);
          updated++;
        } else {
          console.log(`⚠️ No email in Firebase for ${user.full_name || user.firebase_uid}`);
        }
      } catch (err) {
        console.log(`❌ Error for ${user.firebase_uid}: ${err.message}`);
        errors++;
      }
    }
    
    console.log(`\n📊 Summary: ${updated} updated, ${errors} errors`);
    
    // Verify
    const check = await pool.query(`SELECT email, full_name FROM public.users WHERE email IS NOT NULL LIMIT 5`);
    console.log('\n📋 Sample users with emails:');
    check.rows.forEach(r => console.log(`  - ${r.full_name}: ${r.email}`));
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

populateEmails();
