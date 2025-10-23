/**
 * Run Password Reset Tokens Migration
 * Creates the password_reset_tokens table
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const { Pool } = pg;

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('📋 Running password reset tokens migration...\n');

    // Read migration file
    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', '008_add_password_reset_tokens.sql'),
      'utf8'
    );

    // Execute migration
    await pool.query(migrationSQL);

    console.log('✅ Password reset tokens table created successfully!');
    console.log('✅ Indexes created');
    console.log('✅ Migration complete!\n');

    // Verify table was created
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'password_reset_tokens'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Verified: password_reset_tokens table exists');
      
      // Show table structure
      const structureQuery = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'password_reset_tokens'
        ORDER BY ordinal_position;
      `);

      console.log('\n📊 Table structure:');
      console.table(structureQuery.rows);
    } else {
      console.error('❌ Table creation failed');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n🎉 Password reset system is ready!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
