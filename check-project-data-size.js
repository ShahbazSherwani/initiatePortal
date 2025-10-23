// Check size of project_data JSONB column
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
  ssl: false,
  max: 1
});

async function checkSize() {
  try {
    console.log('🔍 Checking project_data column sizes...\n');

    const result = await pool.query(`
      SELECT 
        id,
        firebase_uid,
        pg_column_size(project_data) as data_size_bytes,
        pg_size_pretty(pg_column_size(project_data)::bigint) as data_size
      FROM projects
      ORDER BY pg_column_size(project_data) DESC
      LIMIT 5
    `);

    console.log('Top 5 largest project_data entries:\n');
    result.rows.forEach((row, i) => {
      console.log(`${i + 1}. Project ID: ${row.id}`);
      console.log(`   Firebase UID: ${row.firebase_uid}`);
      console.log(`   Size: ${row.data_size} (${row.data_size_bytes} bytes)`);
      console.log();
    });

    // Check average size
    const avgResult = await pool.query(`
      SELECT 
        AVG(pg_column_size(project_data)) as avg_size,
        MIN(pg_column_size(project_data)) as min_size,
        MAX(pg_column_size(project_data)) as max_size,
        pg_size_pretty(SUM(pg_column_size(project_data))::bigint) as total_size
      FROM projects
    `);

    console.log('Overall statistics:');
    console.log(`   Average size: ${Math.round(avgResult.rows[0].avg_size)} bytes`);
    console.log(`   Min size: ${avgResult.rows[0].min_size} bytes`);
    console.log(`   Max size: ${avgResult.rows[0].max_size} bytes`);
    console.log(`   Total size: ${avgResult.rows[0].total_size}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSize();
