// Create admin user script
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function createAdmin() {
  const firebaseUID = process.argv[2]; // Get UID from command line argument
  
  if (!firebaseUID) {
    console.log('❌ Please provide your Firebase UID as an argument');
    console.log('Usage: node create-admin.js YOUR_FIREBASE_UID');
    console.log('\nTo get your Firebase UID:');
    console.log('1. Open your app in browser and log in');
    console.log('2. Open browser console (F12)');
    console.log('3. Type: firebase.auth().currentUser.uid');
    console.log('4. Copy the UID and run this script');
    process.exit(1);
  }
  
  try {
    console.log('Creating admin user with UID:', firebaseUID);
    
    const result = await db.query(`
      INSERT INTO users (firebase_uid, full_name, role, is_admin) 
      VALUES ($1, 'Admin User', 'borrower', TRUE)
      ON CONFLICT (firebase_uid) DO UPDATE SET 
        is_admin = TRUE,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [firebaseUID]);
    
    console.log('✅ Admin user created/updated successfully:');
    console.log(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
  } finally {
    await db.end();
  }
}

createAdmin();
