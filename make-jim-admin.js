// Make Jim a TRUE system admin and clean up team member records
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function makeJimAdmin() {
  const client = await pool.connect();
  
  try {
    const jimUid = 'O2wPRdzv6OfOWdLrR1lGnbdyXSn2';
    
    console.log('=== Making Jim a TRUE System Admin ===\n');
    
    await client.query('BEGIN');
    
    // 1. Set is_admin = true in users table
    console.log('1. Setting is_admin = true in users table...');
    await client.query(
      'UPDATE users SET is_admin = true WHERE firebase_uid = $1',
      [jimUid]
    );
    console.log('✅ Jim is now a system admin\n');
    
    // 2. Delete team member permissions
    console.log('2. Removing team member permissions...');
    const deletePerms = await client.query(`
      DELETE FROM team_member_permissions 
      WHERE team_member_id IN (
        SELECT id FROM team_members WHERE member_uid = $1
      )
    `, [jimUid]);
    console.log(`✅ Deleted ${deletePerms.rowCount} permission records\n`);
    
    // 3. Delete team member records
    console.log('3. Removing team member records...');
    const deleteTeam = await client.query(
      'DELETE FROM team_members WHERE member_uid = $1',
      [jimUid]
    );
    console.log(`✅ Deleted ${deleteTeam.rowCount} team member records\n`);
    
    await client.query('COMMIT');
    
    // 4. Verify
    console.log('4. Verifying final state...');
    const verify = await client.query(`
      SELECT 
        u.full_name,
        u.is_admin,
        (SELECT COUNT(*) FROM team_members WHERE member_uid = u.firebase_uid) as team_count
      FROM users u
      WHERE u.firebase_uid = $1
    `, [jimUid]);
    
    const result = verify.rows[0];
    console.log(`Name: ${result.full_name}`);
    console.log(`Is Admin: ${result.is_admin ? 'YES ✅' : 'NO ❌'}`);
    console.log(`Team Member Records: ${result.team_count}\n`);
    
    if (result.is_admin && result.team_count === 0) {
      console.log('✅ SUCCESS! Jim is now a system admin with full access!');
      console.log('\nNext steps:');
      console.log('1. Have Jim log out and log back in');
      console.log('2. Hard refresh browser (Ctrl+Shift+R)');
      console.log('3. All menu items should now appear');
    }
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

makeJimAdmin();
