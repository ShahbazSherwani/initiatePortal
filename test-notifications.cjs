const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testNotifications() {
  try {
    console.log('🔍 Checking notifications in database...\n');

    // Get current user (jim - borrower)
    const userResult = await pool.query(`
      SELECT firebase_uid, email, full_name, current_account_type 
      FROM users 
      WHERE email LIKE '%jim%' OR full_name LIKE '%jim%' OR full_name LIKE '%Jim%'
      LIMIT 1
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ No user found matching "jim"');
      console.log('\n📋 Fetching all users:');
      const allUsers = await pool.query('SELECT firebase_uid, email, full_name, current_account_type FROM users LIMIT 10');
      console.table(allUsers.rows);
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ Found user:');
    console.log(`   Name: ${user.full_name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Account Type: ${user.current_account_type}`);
    console.log(`   Firebase UID: ${user.firebase_uid}`);
    console.log('');

    // Check existing notifications for this user
    const notificationsResult = await pool.query(`
      SELECT * FROM notifications 
      WHERE firebase_uid = $1 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [user.firebase_uid]);

    console.log(`📬 Found ${notificationsResult.rows.length} notifications for ${user.full_name}:\n`);
    
    if (notificationsResult.rows.length > 0) {
      console.table(notificationsResult.rows.map(n => ({
        id: n.id,
        type: n.notification_type,
        title: n.title,
        is_read: n.is_read,
        created_at: new Date(n.created_at).toLocaleString()
      })));
    } else {
      console.log('❌ No notifications found. Creating test notifications...\n');

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
          Math.random() > 0.5 // Random read/unread status
        ]);
      }

      console.log('✅ Created 5 test notifications!');

      // Fetch and display created notifications
      const newNotifs = await pool.query(`
        SELECT * FROM notifications 
        WHERE firebase_uid = $1 
        ORDER BY created_at DESC 
        LIMIT 10
      `, [user.firebase_uid]);

      console.log('\n📬 Created notifications:\n');
      console.table(newNotifs.rows.map(n => ({
        id: n.id,
        type: n.notification_type,
        title: n.title,
        is_read: n.is_read,
        created_at: new Date(n.created_at).toLocaleString()
      })));
    }

    // Check unread count
    const unreadCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE firebase_uid = $1 AND is_read = FALSE
    `, [user.firebase_uid]);

    console.log(`\n🔔 Unread notifications: ${unreadCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

testNotifications();
