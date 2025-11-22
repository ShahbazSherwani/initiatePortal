// run-audit-migration.js
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

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
  try {
    console.log('📋 Running audit logs migration...');
    
    const sql = readFileSync('migrations/009_create_audit_logs.sql', 'utf8');
    
    await db.query(sql);
    
    console.log('✅ Audit logs table created successfully!');
    
    // Verify table exists
    const result = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'audit_logs' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Audit logs table structure:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await db.end();
  }
}

runMigration();
