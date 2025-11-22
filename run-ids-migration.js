// run-ids-migration.js
// Runs the security events table migration for intrusion detection
import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const { Pool } = pg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? {
    rejectUnauthorized: false
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

async function runMigration() {
  console.log('🛡️  Running security events table migration...\n');
  
  try {
    // Run SQL migration
    const sql = readFileSync('migrations/011_create_security_events.sql', 'utf8');
    await db.query(sql);
    console.log('✅ Security events table created successfully!\n');
    
    // Verify table structure
    const result = await db.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'security_events'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Security events table structure:');
    result.rows.forEach(row => {
      const length = row.character_maximum_length ? ` (${row.character_maximum_length})` : '';
      console.log(`   - ${row.column_name}: ${row.data_type}${length}`);
    });
    
    console.log('\n✅ Intrusion detection system ready to track security threats!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await db.end();
  }
}

runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
