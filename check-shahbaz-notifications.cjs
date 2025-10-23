const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkShahbazNotifications() {
  try {
    console.log('🔍 Checking Shahbaz Sherwani notifications...\n');
    
    // Find Shahbaz
    const userResult = await pool.query(`
      SELECT firebase_uid, full_name, is_admin 
      FROM users 
      WHERE full_name = 'Shahbaz Sherwani'
    `);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Shahbaz Sherwani not found');
      return;
    }
    
    const shahbaz = userResult.rows[0];
    console.log('✅ Found user:');
    console.table(shahbaz);
    
    // Get notifications
    const notifs = await pool.query(`
      SELECT id, notification_type, title, message, is_read, created_at
      FROM notifications 
      WHERE firebase_uid = $1 
      ORDER BY created_at DESC
    `, [shahbaz.firebase_uid]);
    
    console.log(`\n📬 Total notifications: ${notifs.rows.length}\n`);
    
    if (notifs.rows.length > 0) {
      console.log('Notifications list:');
      console.table(notifs.rows.map(n => ({
        id: n.id,
        type: n.notification_type,
        title: n.title,
        is_read: n.is_read,
        created: new Date(n.created_at).toLocaleString()
      })));
      
      const unread = notifs.rows.filter(n => !n.is_read).length;
      console.log(`\n🔔 Unread: ${unread}`);
      console.log(`✅ Read: ${notifs.rows.length - unread}`);
      
      console.log('\n✅ These are REAL notifications from the database, NOT hard-coded!');
    } else {
      console.log('❌ No notifications found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkShahbazNotifications();
