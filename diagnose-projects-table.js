// Quick diagnosis of projects table performance issue
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // No SSL for local testing
  connectionTimeoutMillis: 5000,
  query_timeout: 10000, // Shorter timeout for testing
  max: 1 // Use only 1 connection for testing
});

async function diagnose() {
  console.log('🔍 Starting database diagnosis...\n');
  
  try {
    // Test 1: Simple count
    console.log('Test 1: Counting projects...');
    const startCount = Date.now();
    const countResult = await pool.query('SELECT COUNT(*) FROM projects');
    const countTime = Date.now() - startCount;
    console.log(`✅ Total projects: ${countResult.rows[0].count} (${countTime}ms)\n`);

    // Test 2: Simple select without joins
    console.log('Test 2: Fetching 10 projects (no joins)...');
    const startSimple = Date.now();
    const simpleResult = await pool.query('SELECT id, firebase_uid, created_at FROM projects LIMIT 10');
    const simpleTime = Date.now() - startSimple;
    console.log(`✅ Fetched ${simpleResult.rows.length} projects (${simpleTime}ms)\n`);

    // Test 3: Select with ORDER BY
    console.log('Test 3: Fetching 10 projects with ORDER BY...');
    const startOrder = Date.now();
    const orderResult = await pool.query('SELECT id, firebase_uid, created_at FROM projects ORDER BY created_at DESC LIMIT 10');
    const orderTime = Date.now() - startOrder;
    console.log(`✅ Fetched ${orderResult.rows.length} projects (${orderTime}ms)\n`);

    // Test 4: Full query with joins (like in API)
    console.log('Test 4: Full query with joins (LIMIT 10)...');
    const startFull = Date.now();
    const fullResult = await pool.query(`
      SELECT p.id, p.firebase_uid, p.project_data, p.created_at, u.full_name
      FROM projects p
      LEFT JOIN users u ON p.firebase_uid = u.firebase_uid
      ORDER BY p.created_at DESC
      LIMIT 10
    `);
    const fullTime = Date.now() - startFull;
    console.log(`✅ Fetched ${fullResult.rows.length} projects (${fullTime}ms)\n`);

    // Test 5: Check indexes
    console.log('Test 5: Checking indexes on projects table...');
    const indexResult = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'projects'
    `);
    console.log(`✅ Found ${indexResult.rows.length} indexes:`);
    indexResult.rows.forEach(idx => {
      console.log(`   - ${idx.indexname}`);
    });
    console.log();

    // Test 6: Table statistics
    console.log('Test 6: Table statistics...');
    const statsResult = await pool.query(`
      SELECT 
        pg_size_pretty(pg_total_relation_size('projects')) as total_size,
        pg_size_pretty(pg_relation_size('projects')) as table_size,
        pg_size_pretty(pg_indexes_size('projects')) as indexes_size
    `);
    console.log(`✅ Table sizes:`);
    console.log(`   - Total: ${statsResult.rows[0].total_size}`);
    console.log(`   - Table: ${statsResult.rows[0].table_size}`);
    console.log(`   - Indexes: ${statsResult.rows[0].indexes_size}`);
    console.log();

    // Test 7: Check for locks
    console.log('Test 7: Checking for table locks...');
    const locksResult = await pool.query(`
      SELECT pid, mode, granted 
      FROM pg_locks 
      WHERE relation = 'projects'::regclass
    `);
    if (locksResult.rows.length > 0) {
      console.log(`⚠️ Found ${locksResult.rows.length} locks:`);
      locksResult.rows.forEach(lock => {
        console.log(`   - PID: ${lock.pid}, Mode: ${lock.mode}, Granted: ${lock.granted}`);
      });
    } else {
      console.log(`✅ No locks found`);
    }
    console.log();

    // Test 8: EXPLAIN the slow query
    console.log('Test 8: EXPLAIN ANALYZE the full query...');
    const explainResult = await pool.query(`
      EXPLAIN ANALYZE
      SELECT p.id, p.firebase_uid, p.project_data, p.created_at, u.full_name
      FROM projects p
      LEFT JOIN users u ON p.firebase_uid = u.firebase_uid
      ORDER BY p.created_at DESC
      LIMIT 100
    `);
    console.log('Query plan:');
    explainResult.rows.forEach(row => {
      console.log(`   ${row['QUERY PLAN']}`);
    });

  } catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
    console.error(error);
  } finally {
    await pool.end();
    console.log('\n✅ Diagnosis complete');
  }
}

diagnose();
