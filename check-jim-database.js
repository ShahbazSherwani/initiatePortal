// Check Jim's current permissions in the database
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

async function checkJimPermissions() {
  const client = await pool.connect();
  
  try {
    const jimUid = 'O2wPRdzv6OfOWdLrR1lGnbdyXSn2';
    
    console.log('=== Jim\'s Current State in Database ===\n');
    
    // 1. Check users table
    console.log('1. Users Table:');
    const user = await client.query(`
      SELECT firebase_uid, full_name, is_admin, role
      FROM users WHERE firebase_uid = $1
    `, [jimUid]);
    
    if (user.rows.length > 0) {
      console.log(JSON.stringify(user.rows[0], null, 2));
    } else {
      console.log('❌ User not found');
    }
    
    // 2. Check team_members table
    console.log('\n2. Team Members Table:');
    const teamMembers = await client.query(`
      SELECT id, owner_uid, email, member_uid, role, status, invited_at, joined_at
      FROM team_members WHERE member_uid = $1
    `, [jimUid]);
    
    if (teamMembers.rows.length > 0) {
      console.log(`Found ${teamMembers.rows.length} team member record(s):`);
      teamMembers.rows.forEach((row, idx) => {
        console.log(`\n  Record ${idx + 1}:`);
        console.log(`  ID: ${row.id}`);
        console.log(`  Owner UID: ${row.owner_uid}`);
        console.log(`  Email: ${row.email}`);
        console.log(`  Role: ${row.role}`);
        console.log(`  Status: ${row.status}`);
        console.log(`  Invited: ${row.invited_at}`);
        console.log(`  Joined: ${row.joined_at}`);
      });
    } else {
      console.log('No team member records found ✅');
    }
    
    // 3. Check team_member_permissions table
    console.log('\n3. Team Member Permissions:');
    const permissions = await client.query(`
      SELECT tmp.id, tmp.team_member_id, tmp.permission_key, tmp.can_access, tm.role, tm.email
      FROM team_member_permissions tmp
      JOIN team_members tm ON tmp.team_member_id = tm.id
      WHERE tm.member_uid = $1
      ORDER BY tmp.permission_key
    `, [jimUid]);
    
    if (permissions.rows.length > 0) {
      console.log(`Found ${permissions.rows.length} permission(s):`);
      permissions.rows.forEach((row, idx) => {
        console.log(`  ${idx + 1}. ${row.permission_key} (${row.can_access ? '✅' : '❌'}) [Team Member ID: ${row.team_member_id}, Role: ${row.role}]`);
      });
    } else {
      console.log('No permissions found ✅');
    }
    
    // 4. Check team_invitations table
    console.log('\n4. Team Invitations:');
    // Get Jim's email from team_members table
    const jimEmail = teamMembers.rows.length > 0 ? teamMembers.rows[0].email : null;
    let invitations = { rows: [] };
    
    if (jimEmail) {
      invitations = await client.query(`
        SELECT id, email, role, status, permissions, created_at, expires_at, accepted_at
        FROM team_invitations
        WHERE LOWER(email) = LOWER($1)
        ORDER BY created_at DESC
        LIMIT 5
      `, [jimEmail]);
    }
    
    if (invitations.rows.length > 0) {
      console.log(`Found ${invitations.rows.length} invitation(s):`);
      invitations.rows.forEach((row, idx) => {
        console.log(`\n  Invitation ${idx + 1}:`);
        console.log(`  Email: ${row.email}`);
        console.log(`  Role: ${row.role}`);
        console.log(`  Status: ${row.status}`);
        console.log(`  Permissions: ${row.permissions}`);
        console.log(`  Created: ${row.created_at}`);
        console.log(`  Expires: ${row.expires_at}`);
        console.log(`  Accepted: ${row.accepted_at || 'N/A'}`);
      });
    } else {
      console.log('No invitations found');
    }
    
    // 5. Summary
    console.log('\n=== SUMMARY ===');
    const isSystemAdmin = user.rows[0]?.is_admin || false;
    const hasTeamRecords = teamMembers.rows.length > 0;
    const hasPermissions = permissions.rows.length > 0;
    
    console.log(`System Admin: ${isSystemAdmin ? 'YES ✅' : 'NO ❌'}`);
    console.log(`Team Member: ${hasTeamRecords ? 'YES ⚠️' : 'NO ✅'}`);
    console.log(`Has Permissions: ${hasPermissions ? 'YES ⚠️' : 'NO ✅'}`);
    
    if (isSystemAdmin && (hasTeamRecords || hasPermissions)) {
      console.log('\n⚠️ CONFLICT DETECTED!');
      console.log('Jim is marked as system admin but still has team member data.');
      console.log('This will cause confusion - team permissions override admin status.');
    } else if (isSystemAdmin) {
      console.log('\n✅ CLEAN STATE: Jim is system admin with no team data');
    } else if (hasTeamRecords) {
      console.log(`\n✅ TEAM MEMBER: Jim has ${permissions.rows.length} permission(s)`);
    } else {
      console.log('\n⚠️ NO ACCESS: Jim has neither admin nor team member access');
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkJimPermissions();
