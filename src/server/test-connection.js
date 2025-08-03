// Test Supabase connection
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const client = await db.connect();
    console.log('✅ Connected to Supabase successfully!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query test successful:', result.rows[0]);
    
    // Test tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('✅ Tables found:', tables.rows.map(r => r.table_name));
    
    client.release();
    console.log('🎉 All tests passed! Your Supabase setup is working.');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  } finally {
    await db.end();
  }
}

testConnection();
