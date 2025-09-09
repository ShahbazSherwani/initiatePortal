import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function addColumns() {
  try {
    console.log('🔧 Adding address columns to investor_profiles...');
    await pool.query(`
      ALTER TABLE investor_profiles 
      ADD COLUMN IF NOT EXISTS street VARCHAR(255),
      ADD COLUMN IF NOT EXISTS barangay VARCHAR(255),
      ADD COLUMN IF NOT EXISTS municipality VARCHAR(255),
      ADD COLUMN IF NOT EXISTS province VARCHAR(255),
      ADD COLUMN IF NOT EXISTS country VARCHAR(255),
      ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20)
    `);
    
    console.log('🔧 Adding identification columns to investor_profiles...');
    await pool.query(`
      ALTER TABLE investor_profiles 
      ADD COLUMN IF NOT EXISTS national_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS passport_no VARCHAR(255),
      ADD COLUMN IF NOT EXISTS tin VARCHAR(255)
    `);
    
    console.log('✅ Successfully added all missing columns to investor_profiles');
    
    // Verify the columns were added
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'investor_profiles'
      ORDER BY column_name
    `);
    
    console.log('📋 Updated investor_profiles columns:', result.rows.map(row => row.column_name));
    
  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
  } finally {
    await pool.end();
  }
}

addColumns();
