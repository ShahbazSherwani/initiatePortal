const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function seedNotificationsForAll() {
  try {
    console.log('🔍 Finding all users...\n');
    
    // Get all users
    const usersResult = await pool.query(`
      SELECT firebase_uid, full_name, current_account_type 
      FROM users 
      WHERE firebase_uid IS NOT NULL AND current_account_type != 'deleted'
      ORDER BY full_name
    `);
    
    console.log(`Found ${usersResult.rows.length} active users:`);
    console.table(usersResult.rows);
    
    if (usersResult.rows.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    // Create notifications for each user
    const testNotifications = [
      {
        type: 'project_approved',
        title: 'Project Approved',
        message: 'Your project has been approved and is now live on the platform!',
      },
      {
        type: 'investment_submitted',
        title: 'New Investment Received',
        message: 'You received a new investment on your project.',
      },
      {
        type: 'topup_approved',
        title: 'Wallet Top-up Approved',
        message: 'Your wallet top-up request has been approved.',
      },
      {
        type: 'general',
        title: 'Welcome to Investie',
        message: 'Thank you for joining our platform. Start exploring investment opportunities today!',
      }
    ];

    for (const user of usersResult.rows) {
      console.log(`\n📝 Creating notifications for ${user.full_name}...`);
      
      // Check existing
      const existing = await pool.query(`
        SELECT COUNT(*) as count FROM notifications WHERE firebase_uid = $1
      `, [user.firebase_uid]);
      
      const existingCount = parseInt(existing.rows[0].count);
      
      if (existingCount >= 3) {
        console.log(`   ✓ Already has ${existingCount} notifications, skipping`);
        continue;
      }
      
      let created = 0;
      for (const notif of testNotifications) {
        await pool.query(`
          INSERT INTO notifications (
            firebase_uid, 
            notification_type, 
            title, 
            message, 
            is_read,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${Math.floor(Math.random() * 7)} days')
        `, [
          user.firebase_uid,
          notif.type,
          notif.title,
          notif.message,
          Math.random() > 0.7 // 30% chance of being read
        ]);
        created++;
      }
      
      console.log(`   ✓ Created ${created} notifications`);
    }

    console.log('\n\n📊 Summary of all notifications:\n');
    
    for (const user of usersResult.rows) {
      const userNotifs = await pool.query(`
        SELECT COUNT(*) as total,
               COUNT(*) FILTER (WHERE is_read = FALSE) as unread
        FROM notifications 
        WHERE firebase_uid = $1
      `, [user.firebase_uid]);
      
      const stats = userNotifs.rows[0];
      console.log(`${user.full_name}: ${stats.total} total, ${stats.unread} unread`);
    }

    console.log('\n✅ Done! Refresh your dashboard to see the notifications.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

seedNotificationsForAll();
