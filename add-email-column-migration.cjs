const pg = require('pg');
require('dotenv').config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addEmailColumn() {
  console.log('🔧 Adding email column to public.users...\n');
  
  try {
    // Add email column
    await pool.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email VARCHAR(255)`);
    console.log('✅ Added email column');

    // Add index
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email)`);
    console.log('✅ Added email index');

    // Add other fields for Make.com sync
    await pool.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS date_of_birth DATE`);
    console.log('✅ Added date_of_birth column');
    
    await pool.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender VARCHAR(20)`);
    console.log('✅ Added gender column');
    
    await pool.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS global_user_id VARCHAR(255)`);
    console.log('✅ Added global_user_id column');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_global_user_id ON public.users(global_user_id)`);
    console.log('✅ Added global_user_id index');

    // Verify columns exist now
    const result = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users' 
      AND column_name IN ('email', 'date_of_birth', 'gender', 'global_user_id')
    `);
    console.log('\n📋 Verified columns exist:', result.rows.map(r => r.column_name).join(', '));

    console.log('\n✅ Migration complete!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

addEmailColumn();
