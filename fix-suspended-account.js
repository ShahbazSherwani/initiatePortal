// Fix Suspended Account - Quick Script
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixSuspension() {
  try {
    console.log('🔍 Checking for suspended accounts...\n');

    // Get all suspended accounts
    const suspended = await pool.query(`
      SELECT 
        firebase_uid,
        email,
        full_name,
        suspension_scope,
        created_at
      FROM users
      WHERE suspension_scope IS NOT NULL AND suspension_scope != 'none'
      ORDER BY created_at DESC
    `);

    if (suspended.rows.length === 0) {
      console.log('✅ No suspended accounts found!');
      
      // Check recent accounts
      console.log('\n📋 Recent user accounts:');
      const recent = await pool.query(`
        SELECT 
          email,
          full_name,
          suspension_scope,
          created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 5
      `);
      
      recent.rows.forEach((user, i) => {
        console.log(`${i + 1}. ${user.email} - ${user.suspension_scope || 'none'} - ${user.created_at}`);
      });
      
    } else {
      console.log(`⚠️ Found ${suspended.rows.length} suspended account(s):\n`);
      
      suspended.rows.forEach((user, i) => {
        console.log(`${i + 1}. Email: ${user.email}`);
        console.log(`   Name: ${user.full_name}`);
        console.log(`   Suspension: ${user.suspension_scope}`);
        console.log(`   Created: ${user.created_at}\n`);
      });

      // Unsuspend all accounts
      console.log('🔧 Unsuspending all accounts...');
      const result = await pool.query(`
        UPDATE users 
        SET suspension_scope = 'none'
        WHERE suspension_scope IS NOT NULL AND suspension_scope != 'none'
        RETURNING email, full_name
      `);

      console.log(`✅ Unsuspended ${result.rows.length} account(s):`);
      result.rows.forEach((user) => {
        console.log(`   - ${user.email} (${user.full_name})`);
      });
    }

    await pool.end();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

fixSuspension();
