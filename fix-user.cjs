const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.hruwzvreotstwnaarucf:VT1CHeNNwvKxnCGt@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  const client = await pool.connect();
  try {
    // Fix the user's account type
    await client.query(
      "UPDATE users SET current_account_type = NULL, status = 'active' WHERE id = 275"
    );
    console.log('✅ Fixed! User account type reset to NULL and status set to active');
    
    // Verify
    const result = await client.query(
      "SELECT id, email, current_account_type, status FROM users WHERE id = 275"
    );
    console.log('Updated user:', JSON.stringify(result.rows[0], null, 2));
  } finally {
    client.release();
    await pool.end();
  }
})();
