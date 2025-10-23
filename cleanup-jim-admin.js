// Clean up Jim's team member permissions and verify admin status
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function cleanupJimAdmin() {
  const client = await pool.connect();
  
  try {
    const jimUid = 'O2wPRdzv6OfOWdLrR1lGnbdyXSn2';
    
    console.log('=== Cleaning Up Jim\'s Admin Setup ===\n');
    
    // 1. Check current status
    console.log('1. Checking Jim\'s current status...');
    const userCheck = await client.query(
      'SELECT firebase_uid, full_name, is_admin FROM users WHERE firebase_uid = $1',
      [jimUid]
    );
    
    if (userCheck.rows.length === 0) {
      console.log('❌ Jim not found in database');
      return;
    }
    
    console.log('Current status:', userCheck.rows[0]);
    console.log(`Is Admin: ${userCheck.rows[0].is_admin ? 'YES ✅' : 'NO ❌'}\n`);
    
    // 2. Check team member status
    console.log('2. Checking team member records...');
    const teamCheck = await client.query(`
      SELECT tm.id, tm.status, tm.role, 
             (SELECT COUNT(*) FROM team_member_permissions WHERE team_member_id = tm.id) as permission_count
      FROM team_members tm
      WHERE tm.member_uid = $1
    `, [jimUid]);
    
    if (teamCheck.rows.length > 0) {
      console.log(`Found ${teamCheck.rows.length} team member record(s):`);
      teamCheck.rows.forEach((row, i) => {
        console.log(`  ${i + 1}. ID: ${row.id}, Status: ${row.status}, Role: ${row.role}, Permissions: ${row.permission_count}`);
      });
      console.log('');
    } else {
      console.log('No team member records found ✅\n');
    }
    
    // 3. If Jim is admin, remove team member status
    if (userCheck.rows[0].is_admin) {
      console.log('3. Jim is admin - removing team member records...');
      
      if (teamCheck.rows.length > 0) {
        // Delete team member permissions first
        for (const tm of teamCheck.rows) {
          await client.query(
            'DELETE FROM team_member_permissions WHERE team_member_id = $1',
            [tm.id]
          );
          console.log(`  ✅ Deleted permissions for team_member_id: ${tm.id}`);
        }
        
        // Delete team member records
        await client.query(
          'DELETE FROM team_members WHERE member_uid = $1',
          [jimUid]
        );
        console.log(`  ✅ Deleted team member records for Jim`);
        console.log('');
      } else {
        console.log('  No team member records to clean up ✅\n');
      }
      
      // 4. Verify final state
      console.log('4. Verifying final state...');
      const finalCheck = await client.query(`
        SELECT 
          u.full_name,
          u.is_admin,
          (SELECT COUNT(*) FROM team_members WHERE member_uid = u.firebase_uid) as team_member_count,
          (SELECT COUNT(*) FROM team_member_permissions tmp 
           JOIN team_members tm ON tmp.team_member_id = tm.id 
           WHERE tm.member_uid = u.firebase_uid) as permission_count
        FROM users u
        WHERE u.firebase_uid = $1
      `, [jimUid]);
      
      const result = finalCheck.rows[0];
      console.log(`Name: ${result.full_name}`);
      console.log(`Is Admin: ${result.is_admin ? 'YES ✅' : 'NO ❌'}`);
      console.log(`Team Member Records: ${result.team_member_count}`);
      console.log(`Team Permissions: ${result.permission_count}`);
      console.log('');
      
      if (result.is_admin && result.team_member_count === 0 && result.permission_count === 0) {
        console.log('✅ SUCCESS: Jim is now a clean admin with no team member conflicts!');
      } else {
        console.log('⚠️ WARNING: Some inconsistencies remain');
      }
    } else {
      console.log('3. Jim is NOT admin - no cleanup needed');
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupJimAdmin();
