// Fix user profile script
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function fixUserProfile() {
  const firebaseUID = 'xd7BTiOlToW9mwFkDCLtZO5dDoY2'; // Your Firebase UID
  
  try {
    console.log('Fixing user profile...');
    
    const result = await db.query(`
      UPDATE users 
      SET 
        has_completed_registration = TRUE,
        role = 'investor',
        full_name = 'Admin User',
        is_admin = TRUE,
        updated_at = CURRENT_TIMESTAMP
      WHERE firebase_uid = $1
      RETURNING *
    `, [firebaseUID]);
    
    console.log('✅ User profile updated successfully:');
    console.log(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Failed to update user profile:', error.message);
  } finally {
    await db.end();
  }
}

fixUserProfile();
