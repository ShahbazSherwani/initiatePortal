import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function cleanupOldInvitations() {
  try {
    console.log('=== Cleaning Up Old Team Invitations ===\n');
    
    // 1. Show current pending invitations
    const pending = await pool.query(`
      SELECT id, email, role, status, created_at, expires_at
      FROM team_invitations
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${pending.rows.length} pending invitations:\n`);
    pending.rows.forEach((inv, i) => {
      const isExpired = new Date(inv.expires_at) < new Date();
      console.log(`${i + 1}. ${inv.email} (${inv.role})`);
      console.log(`   Created: ${inv.created_at}`);
      console.log(`   Expires: ${inv.expires_at}`);
      console.log(`   Status: ${isExpired ? '❌ EXPIRED' : '✅ Still valid'}`);
      console.log('');
    });
    
    // 2. Delete expired pending invitations
    const deleteResult = await pool.query(`
      DELETE FROM team_invitations
      WHERE status = 'pending' 
      AND expires_at < NOW()
      RETURNING email, role, created_at
    `);
    
    if (deleteResult.rows.length > 0) {
      console.log(`\n🗑️  Deleted ${deleteResult.rows.length} expired invitations:`);
      deleteResult.rows.forEach((inv, i) => {
        console.log(`  ${i + 1}. ${inv.email} (${inv.role}) - created ${inv.created_at}`);
      });
    } else {
      console.log('\n✅ No expired invitations to delete');
    }
    
    // 3. Show duplicate invitations for same email/owner (keep newest, mark others for review)
    const duplicates = await pool.query(`
      SELECT 
        email, 
        owner_uid,
        COUNT(*) as count,
        array_agg(id ORDER BY created_at DESC) as invitation_ids,
        array_agg(created_at ORDER BY created_at DESC) as created_dates
      FROM team_invitations
      WHERE status = 'pending'
      GROUP BY email, owner_uid
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.rows.length > 0) {
      console.log(`\n\n⚠️  Found ${duplicates.rows.length} emails with duplicate pending invitations:\n`);
      
      for (const dup of duplicates.rows) {
        console.log(`Email: ${dup.email}`);
        console.log(`  Total pending: ${dup.count}`);
        console.log(`  Keeping newest (ID: ${dup.invitation_ids[0]}, created: ${dup.created_dates[0]})`);
        console.log(`  Deleting ${dup.count - 1} older invitation(s)...`);
        
        // Delete all but the newest
        const oldIds = dup.invitation_ids.slice(1);
        if (oldIds.length > 0) {
          await pool.query(`
            DELETE FROM team_invitations
            WHERE id = ANY($1)
          `, [oldIds]);
          console.log(`  ✅ Deleted ${oldIds.length} old duplicate(s)`);
        }
        console.log('');
      }
    } else {
      console.log('\n✅ No duplicate pending invitations found');
    }
    
    // 4. Final summary
    const finalCount = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
        COUNT(*) FILTER (WHERE status = 'expired') as expired
      FROM team_invitations
    `);
    
    console.log('\n=== Final Summary ===');
    console.log(`Pending invitations: ${finalCount.rows[0].pending}`);
    console.log(`Accepted invitations: ${finalCount.rows[0].accepted}`);
    console.log(`Expired invitations: ${finalCount.rows[0].expired || 0}`);
    console.log('\n✅ Cleanup complete!');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

cleanupOldInvitations();
