import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function fixNotificationsTable() {
  try {
    console.log('=== Fixing Notifications Table ===\n');
    
    // Check if type column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name = 'type'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('⚠️  "type" column is missing. Adding it now...');
      
      await pool.query(`
        ALTER TABLE notifications 
        ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'general'
      `);
      
      console.log('✅ Added "type" column to notifications table');
    } else {
      console.log('✅ "type" column already exists');
    }
    
    // Check if link column exists
    const linkCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name = 'link'
    `);
    
    if (linkCheck.rows.length === 0) {
      console.log('⚠️  "link" column is missing. Adding it now...');
      
      await pool.query(`
        ALTER TABLE notifications 
        ADD COLUMN IF NOT EXISTS link TEXT
      `);
      
      console.log('✅ Added "link" column to notifications table');
    } else {
      console.log('✅ "link" column already exists');
    }
    
    console.log('\n✅ Notifications table is now fixed!');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

fixNotificationsTable();
