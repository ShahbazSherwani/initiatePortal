const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function seedNotifications() {
  try {
    console.log('🔍 Finding users...\n');
    
    // Get all users
    const usersResult = await pool.query(`
      SELECT firebase_uid, full_name, current_account_type 
      FROM users 
      WHERE firebase_uid IS NOT NULL 
      LIMIT 5
    `);
    
    console.log(`Found ${usersResult.rows.length} users:`);
    console.table(usersResult.rows);
    
    if (usersResult.rows.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    // Use the first user
    const user = usersResult.rows[0];
    console.log(`\n✅ Using user: ${user.full_name} (${user.firebase_uid})\n`);
    
    // Check existing notifications
    const existing = await pool.query(`
      SELECT COUNT(*) as count FROM notifications WHERE firebase_uid = $1
    `, [user.firebase_uid]);
    
    console.log(`📬 Existing notifications: ${existing.rows[0].count}\n`);
    
    if (parseInt(existing.rows[0].count) > 0) {
      console.log('✅ User already has notifications. Displaying them:\n');
      const notifs = await pool.query(`
        SELECT id, notification_type, title, is_read, created_at 
        FROM notifications 
        WHERE firebase_uid = $1 
        ORDER BY created_at DESC 
        LIMIT 10
      `, [user.firebase_uid]);
      console.table(notifs.rows);
      return;
    }
    
    console.log('📝 Creating test notifications...\n');
    
    // Create test notifications
    const testNotifications = [
      {
        type: 'project_approved',
        title: 'Project Approved',
        message: 'Your project "Rice Field Expansion" has been approved and is now live on the platform!',
      },
      {
        type: 'investment_submitted',
        title: 'New Investment Received',
        message: 'You received a new investment of ₱50,000 on your project.',
      },
      {
        type: 'topup_approved',
        title: 'Wallet Top-up Approved',
        message: 'Your wallet top-up request of ₱100,000 has been approved.',
      },
      {
        type: 'project_rejected',
        title: 'Project Update Required',
        message: 'Your project submission needs additional information. Please review and resubmit.',
      },
      {
        type: 'general',
        title: 'Welcome to Investie',
        message: 'Thank you for joining our platform. Start exploring investment opportunities today!',
      }
    ];

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
        Math.random() > 0.6 // 40% chance of being read
      ]);
      created++;
    }

    console.log(`✅ Created ${created} test notifications!\n`);

    // Display created notifications
    const newNotifs = await pool.query(`
      SELECT id, notification_type, title, is_read, created_at 
      FROM notifications 
      WHERE firebase_uid = $1 
      ORDER BY created_at DESC
    `, [user.firebase_uid]);

    console.log('📬 All notifications for this user:\n');
    console.table(newNotifs.rows);

    // Unread count
    const unreadCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE firebase_uid = $1 AND is_read = FALSE
    `, [user.firebase_uid]);

    console.log(`\n🔔 Unread notifications: ${unreadCount.rows[0].count}`);
    console.log('\n✅ Done! Refresh your dashboard to see the notifications.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

seedNotifications();
