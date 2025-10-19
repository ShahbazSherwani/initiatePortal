// Run suspension scope fix migration
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
    console.log('🚀 Running suspension scope fix migration...\n');
    
    // Read the migration file
    const migrationSQL = readFileSync(
      path.join(__dirname, '008_fix_suspension_scope_default.sql'),
      'utf8'
    );
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully\n');
    
    // Verify the fix
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE suspension_scope = 'none') as active_count,
        COUNT(*) FILTER (WHERE suspension_scope = 'full_account') as suspended_count,
        COUNT(*) FILTER (WHERE suspension_scope IS NULL) as null_count,
        COUNT(*) as total_count
      FROM users
    `);
    
    const stats = result.rows[0];
    console.log('📊 Account Status Summary:');
    console.log(`   ✅ Active: ${stats.active_count}`);
    console.log(`   ⛔ Suspended: ${stats.suspended_count}`);
    console.log(`   ❓ NULL: ${stats.null_count}`);
    console.log(`   📋 Total: ${stats.total_count}\n`);
    
    // Show recent accounts
    const recent = await pool.query(`
      SELECT 
        email_address,
        full_name,
        suspension_scope,
        created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('📋 Most Recent Accounts:');
    recent.rows.forEach((user, i) => {
      const status = user.suspension_scope === 'none' ? '✅' : '⛔';
      const email = user.email_address || 'No email';
      console.log(`   ${i + 1}. ${status} ${email} - ${user.suspension_scope} - ${user.created_at}`);
    });
    
    await pool.end();
    console.log('\n✅ All done! New registrations will no longer be suspended.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
