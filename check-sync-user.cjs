const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.hruwzvreotstwnaarucf:ofLsAuJ9aqFYbVwX@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'
});

async function checkAndFix() {
  try {
    // Check existing constraints on users table
    const constraints = await pool.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' AND table_schema = 'public'
    `);
    console.log('Existing constraints on users table:');
    console.log(constraints.rows);

    // Check indexes
    const indexes = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'users' AND schemaname = 'public'
    `);
    console.log('\nExisting indexes:');
    indexes.rows.forEach(r => console.log(`  ${r.indexname}`));

    // Add unique constraint on email if it doesn't exist
    console.log('\nAdding unique constraint on email...');
    await pool.query(`
      ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email)
    `);
    console.log('✅ Added unique constraint on email');
    
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('Constraint already exists, skipping');
    } else {
      console.error('Error:', err.message);
    }
  } finally {
    await pool.end();
  }
}

checkAndFix();
