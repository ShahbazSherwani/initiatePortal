// Script to update existing users - split full_name into first_name and last_name
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function updateExistingUsers() {
  try {
    console.log('🔄 Starting user update process...\n');
    
    // Get all users where first_name and last_name are NULL but full_name exists
    const usersResult = await db.query(`
      SELECT id, firebase_uid, full_name, first_name, last_name
      FROM users
      WHERE full_name IS NOT NULL 
        AND full_name != '' 
        AND (first_name IS NULL OR first_name = '')
        AND (last_name IS NULL OR last_name = '')
      ORDER BY id
    `);
    
    console.log(`📊 Found ${usersResult.rows.length} users to update\n`);
    
    if (usersResult.rows.length === 0) {
      console.log('✅ No users need updating. All users already have first_name and last_name!');
      return;
    }
    
    let updated = 0;
    let skipped = 0;
    
    for (const user of usersResult.rows) {
      const fullName = user.full_name.trim();
      
      if (!fullName) {
        console.log(`⏭️  Skipping user ID ${user.id} (empty full_name)`);
        skipped++;
        continue;
      }
      
      // Split full name
      const nameParts = fullName.split(' ').filter(part => part.length > 0);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      // Update the user
      await db.query(`
        UPDATE users
        SET first_name = $1,
            last_name = $2,
            updated_at = NOW()
        WHERE firebase_uid = $3
      `, [firstName, lastName, user.firebase_uid]);
      
      console.log(`✅ Updated user ID ${user.id}:`);
      console.log(`   Full Name: "${fullName}"`);
      console.log(`   → First Name: "${firstName}"`);
      console.log(`   → Last Name: "${lastName}"\n`);
      
      updated++;
    }
    
    console.log('\n═══════════════════════════════════════');
    console.log('📈 Update Summary:');
    console.log(`   ✅ Updated: ${updated} users`);
    console.log(`   ⏭️  Skipped: ${skipped} users`);
    console.log('═══════════════════════════════════════\n');
    
    // Verify the updates
    const verifyResult = await db.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE full_name IS NOT NULL 
        AND full_name != ''
        AND first_name IS NOT NULL
        AND first_name != ''
    `);
    
    console.log(`✅ Verification: ${verifyResult.rows[0].count} users now have first_name populated\n`);
    
  } catch (error) {
    console.error('❌ Error updating users:', error);
    throw error;
  } finally {
    await db.end();
  }
}

// Run the update
updateExistingUsers()
  .then(() => {
    console.log('🎉 User update completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Update failed:', error);
    process.exit(1);
  });
