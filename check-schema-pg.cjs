const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.hruwzvreotstwnaarucf:ofLsAuJ9aqFYbVwX@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    console.log('Users table columns:');
    result.rows.forEach(r => console.log('  ' + r.column_name + ' (' + r.data_type + ')'));
  } finally {
    client.release();
    await pool.end();
  }
})();
