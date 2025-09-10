// Check database schema to see what columns actually exist
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const db = new Pool({
  connectionString: process.env.SUPABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 60000,
  max: 5
});

async function checkSchema() {
  try {
    console.log('🔍 Checking users table schema...');
    
    const result = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Users table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Also check if there are any users to see the actual data structure
    const userSample = await db.query('SELECT * FROM users LIMIT 1');
    console.log('\n📊 Sample user record structure:');
    if (userSample.rows.length > 0) {
      console.log('Columns in actual data:', Object.keys(userSample.rows[0]));
    } else {
      console.log('No users found in table');
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
  } finally {
    await db.end();
  }
}

checkSchema();
