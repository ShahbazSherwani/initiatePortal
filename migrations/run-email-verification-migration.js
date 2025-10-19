// Run email verification migration
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Running email verification migration...');
    
    // Read the migration file
    const migrationSQL = readFileSync(
      path.join(__dirname, '007_add_email_verification.sql'),
      'utf8'
    );
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Email verification migration completed successfully');
    
    // Verify tables were created
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'email_verifications'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ email_verifications table created');
    }
    
    // Check if columns were added to users table
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('email_verified', 'email_verified_at')
    `);
    
    console.log(`✅ Added ${columnCheck.rows.length} columns to users table:`, 
      columnCheck.rows.map(r => r.column_name).join(', '));
    
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
