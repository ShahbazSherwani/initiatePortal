import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function checkTeamMemberAccess() {
  try {
    console.log('=== Checking Team Member Access ===\n');
    
    // Get the team member UID from menji@gmail.com
    const memberUid = 'F8s1udSigkTLvkpQMnktV4iloZ62'; // From previous debug output
    
    // Check if user is admin
    const adminCheck = await pool.query(`
      SELECT firebase_uid, full_name, is_admin, role
      FROM users 
      WHERE firebase_uid = $1
    `, [memberUid]);
    
    console.log('User Info:');
    console.log(adminCheck.rows[0]);
    console.log('');
    
    // Check team member status
    const memberCheck = await pool.query(`
      SELECT 
        tm.id as team_member_id,
        tm.owner_uid,
        tm.email,
        tm.role,
        tm.status,
        u.full_name as owner_name
      FROM team_members tm
      LEFT JOIN users u ON tm.owner_uid = u.firebase_uid
      WHERE tm.member_uid = $1
    `, [memberUid]);
    
    if (memberCheck.rows.length > 0) {
      console.log('Team Member Status:');
      memberCheck.rows.forEach(member => {
        console.log(`  Owner: ${member.owner_name}`);
        console.log(`  Role: ${member.role}`);
        console.log(`  Status: ${member.status}`);
        console.log(`  Email: ${member.email}`);
        console.log('');
      });
      
      // Get permissions for this team member
      const permissionsCheck = await pool.query(`
        SELECT 
          tmp.permission_key,
          tmp.can_access
        FROM team_member_permissions tmp
        WHERE tmp.team_member_id = $1
      `, [memberCheck.rows[0].team_member_id]);
      
      console.log('Team Member Permissions:');
      if (permissionsCheck.rows.length > 0) {
        permissionsCheck.rows.forEach(perm => {
          console.log(`  ${perm.permission_key}: ${perm.can_access ? '✅' : '❌'}`);
        });
      } else {
        console.log('  ⚠️ No permissions assigned yet!');
      }
    } else {
      console.log('❌ Not a team member');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkTeamMemberAccess();
