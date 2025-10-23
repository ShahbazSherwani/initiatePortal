const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function optimizeDatabase() {
  try {
    console.log('🔧 Starting database optimization...\n');
    
    // Check current projects count
    const countResult = await pool.query('SELECT COUNT(*) as count FROM projects');
    console.log(`📊 Total projects in database: ${countResult.rows[0].count}`);
    
    // Check current indexes
    console.log('\n📋 Current indexes on projects table:');
    const indexResult = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'projects'
      ORDER BY indexname
    `);
    console.table(indexResult.rows);
    
    // Read and execute the SQL file
    console.log('\n🔨 Creating indexes...');
    const sql = fs.readFileSync('./add-projects-indexes.sql', 'utf8');
    await pool.query(sql);
    
    console.log('\n✅ Database optimization complete!');
    
    // Show new indexes
    console.log('\n📋 Updated indexes on projects table:');
    const newIndexResult = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'projects'
      ORDER BY indexname
    `);
    console.table(newIndexResult.rows);
    
    console.log('\n🚀 Projects query should now be much faster!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

optimizeDatabase();
