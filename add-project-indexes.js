import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function addProjectIndexes() {
  try {
    console.log('=== Adding Indexes to Projects Table ===\n');
    
    // 1. Index on JSONB status field
    console.log('Adding index on project_data->>\'status\'...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_status 
      ON projects ((project_data->>'status'))
    `);
    console.log('✅ Status index created\n');
    
    // 2. Index on JSONB approvalStatus field
    console.log('Adding index on project_data->>\'approvalStatus\'...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_approval_status 
      ON projects ((project_data->>'approvalStatus'))
    `);
    console.log('✅ Approval status index created\n');
    
    // 3. Index on firebase_uid for faster joins
    console.log('Adding index on firebase_uid...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_firebase_uid 
      ON projects (firebase_uid)
    `);
    console.log('✅ Firebase UID index created\n');
    
    // 4. Index on created_at for sorting
    console.log('Adding index on created_at...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_created_at 
      ON projects (created_at DESC)
    `);
    console.log('✅ Created at index created\n');
    
    // 5. Composite index for common query pattern
    console.log('Adding composite index...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_status_approval 
      ON projects ((project_data->>'status'), (project_data->>'approvalStatus'))
    `);
    console.log('✅ Composite index created\n');
    
    // Show current indexes
    console.log('=== Current Indexes on Projects Table ===\n');
    const indexes = await pool.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'projects'
      ORDER BY indexname
    `);
    
    indexes.rows.forEach((idx, i) => {
      console.log(`${i + 1}. ${idx.indexname}`);
      console.log(`   ${idx.indexdef}\n`);
    });
    
    // Analyze table to update statistics
    console.log('Analyzing projects table to update query planner statistics...');
    await pool.query('ANALYZE projects');
    console.log('✅ Table analyzed\n');
    
    // Show table stats
    const stats = await pool.query(`
      SELECT 
        n_tup_ins as total_inserts,
        n_tup_upd as total_updates,
        n_tup_del as total_deletes,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows,
        last_analyze,
        last_autovacuum
      FROM pg_stat_user_tables
      WHERE relname = 'projects'
    `);
    
    if (stats.rows.length > 0) {
      console.log('=== Projects Table Statistics ===');
      console.log(`Live rows: ${stats.rows[0].live_rows}`);
      console.log(`Dead rows: ${stats.rows[0].dead_rows}`);
      console.log(`Last analyzed: ${stats.rows[0].last_analyze || 'Never'}`);
      console.log(`Last autovacuum: ${stats.rows[0].last_autovacuum || 'Never'}\n`);
    }
    
    console.log('✅ All indexes created successfully!');
    console.log('\n📊 Query performance should be significantly improved.');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

addProjectIndexes();
