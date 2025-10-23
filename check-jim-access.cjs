const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkJimAccess() {
  try {
    console.log('🔍 Checking jim\'s account status...\n');
    
    const result = await pool.query(`
      SELECT 
        firebase_uid,
        full_name,
        current_account_type,
        is_admin,
        is_super_admin
      FROM users 
      WHERE full_name = 'jim'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ User "jim" not found');
      return;
    }
    
    const jim = result.rows[0];
    console.log('User Details:');
    console.table(jim);
    
    if (!jim.is_admin && !jim.is_super_admin) {
      console.log('\n⚠️  Jim is NOT an admin/owner!');
      console.log('   Current role: ' + jim.current_account_type);
      console.log('   is_admin: ' + jim.is_admin);
      console.log('   is_super_admin: ' + jim.is_super_admin);
      console.log('\n❓ Do you want to make jim an admin? (Y/N)');
      console.log('\n   If YES, run: node make-jim-admin.cjs');
    } else {
      console.log('\n✅ Jim is an admin/owner and should be able to access the owner dashboard');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkJimAccess();
