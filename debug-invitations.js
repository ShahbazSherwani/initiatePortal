import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function debugInvitations() {
  try {
    console.log('=== Checking Team Invitations ===\n');
    
    // Get all team invitations
    const invitations = await pool.query(`
      SELECT 
        id, 
        owner_uid, 
        email, 
        token, 
        role, 
        status, 
        created_at, 
        expires_at, 
        accepted_at
      FROM team_invitations 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`Found ${invitations.rows.length} recent invitations:\n`);
    invitations.rows.forEach((inv, i) => {
      console.log(`${i + 1}. Email: ${inv.email}`);
      console.log(`   Status: ${inv.status}`);
      console.log(`   Role: ${inv.role}`);
      console.log(`   Token: ${inv.token.substring(0, 20)}...`);
      console.log(`   Created: ${inv.created_at}`);
      console.log(`   Expires: ${inv.expires_at}`);
      console.log(`   Accepted: ${inv.accepted_at || 'Not accepted'}`);
      console.log('');
    });

    console.log('\n=== Checking Team Members ===\n');
    
    // Get all team members
    const members = await pool.query(`
      SELECT 
        id, 
        owner_uid, 
        email, 
        member_uid, 
        role, 
        status, 
        invited_at, 
        joined_at
      FROM team_members 
      ORDER BY invited_at DESC 
      LIMIT 10
    `);
    
    console.log(`Found ${members.rows.length} recent team members:\n`);
    members.rows.forEach((member, i) => {
      console.log(`${i + 1}. Email: ${member.email}`);
      console.log(`   Status: ${member.status}`);
      console.log(`   Role: ${member.role}`);
      console.log(`   Member UID: ${member.member_uid || 'Not assigned'}`);
      console.log(`   Owner UID: ${member.owner_uid}`);
      console.log(`   Invited: ${member.invited_at}`);
      console.log(`   Joined: ${member.joined_at || 'Not joined'}`);
      console.log('');
    });

    console.log('\n=== Checking Notifications ===\n');
    
    // Get all notifications
    const notifications = await pool.query(`
      SELECT 
        id, 
        firebase_uid, 
        type, 
        title, 
        message, 
        is_read, 
        created_at
      FROM notifications 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`Found ${notifications.rows.length} recent notifications:\n`);
    notifications.rows.forEach((notif, i) => {
      console.log(`${i + 1}. User UID: ${notif.firebase_uid}`);
      console.log(`   Type: ${notif.type}`);
      console.log(`   Title: ${notif.title}`);
      console.log(`   Message: ${notif.message}`);
      console.log(`   Read: ${notif.is_read}`);
      console.log(`   Created: ${notif.created_at}`);
      console.log('');
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

debugInvitations();
