const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

async function checkUser() {
  try {
    const result = await pool.query(`
      SELECT id, email, first_name, last_name, middle_name, 
             phone_number, date_of_birth, gender, global_user_id, full_name
      FROM users 
      WHERE email = 'sshabbir02@gmail.com'
    `);
    
    console.log('User data in database:');
    console.log(JSON.stringify(result.rows[0], null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUser();
