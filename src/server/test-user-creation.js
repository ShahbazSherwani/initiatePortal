// Test user creation and retrieval
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testUserOperations() {
  const testFirebaseUID = 'KTRAtY1dHidvZ3pGcQrLD1IMWy23';
  
  try {
    console.log('=== Testing User Operations ===');
    
    // Check if user exists
    console.log('\n1. Checking if user exists...');
    const { rows: existingUser } = await db.query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [testFirebaseUID]
    );
    
    if (existingUser.length > 0) {
      console.log('✅ User found:', existingUser[0]);
    } else {
      console.log('❌ User not found, creating...');
      
      // Create user
      await db.query(
        `INSERT INTO users (firebase_uid, full_name, role, has_completed_registration, is_admin)
         VALUES ($1, $2, $3, $4, $5)`,
        [testFirebaseUID, 'Test Admin User', 'admin', true, true]
      );
      
      console.log('✅ User created successfully');
      
      // Verify creation
      const { rows: newUser } = await db.query(
        'SELECT * FROM users WHERE firebase_uid = $1',
        [testFirebaseUID]
      );
      
      console.log('✅ Verified user:', newUser[0]);
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
  }
}

testUserOperations();
