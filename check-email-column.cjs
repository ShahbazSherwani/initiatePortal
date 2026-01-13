const pg = require('pg');
require('dotenv').config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    // Check all columns in public.users
    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users' 
      ORDER BY ordinal_position
    `);
    console.log('All columns in public.users:');
    cols.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));

    // Get sample user to see what data we have
    const user = await pool.query(`SELECT * FROM public.users LIMIT 1`);
    if (user.rows.length > 0) {
      console.log('\nSample user keys:', Object.keys(user.rows[0]).join(', '));
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

check();
