const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.hruwzvreotstwnaarucf:ofLsAuJ9aqFYbVwX@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function securityAudit() {
  const client = await pool.connect();
  
  try {
    console.log('========================================');
    console.log('       SECURITY AUDIT REPORT');
    console.log('========================================\n');
    
    // 1. Check total users
    const users = await client.query('SELECT COUNT(*) as total FROM users');
    console.log('📊 Total users in database:', users.rows[0].total);
    
    // 2. Check for recent signups (potential attack vectors)
    const recentUsers = await client.query(`
      SELECT email, created_at, firebase_uid 
      FROM users 
      WHERE created_at > NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
    `);
    console.log('\n📅 Users created in last 7 days:', recentUsers.rows.length);
    recentUsers.rows.forEach(r => {
      console.log('   -', r.email, '|', new Date(r.created_at).toLocaleString());
    });
    
    // 3. Check for suspicious patterns (many users with similar emails)
    const emailPatterns = await client.query(`
      SELECT SUBSTRING(email FROM '@(.*)$') as domain, COUNT(*) as count
      FROM users
      GROUP BY domain
      ORDER BY count DESC
      LIMIT 10
    `);
    console.log('\n📧 Top email domains:');
    emailPatterns.rows.forEach(r => {
      console.log('   -', r.domain + ':', r.count, 'users');
    });
    
    // 4. List all tables and their row counts
    const tables = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `);
    console.log('\n📁 PUBLIC TABLES:');
    for (const t of tables.rows) {
      try {
        const count = await client.query(`SELECT COUNT(*) as c FROM "${t.tablename}"`);
        console.log('   -', t.tablename + ':', count.rows[0].c, 'rows');
      } catch (e) {
        console.log('   -', t.tablename + ': ERROR reading');
      }
    }
    
    // 5. Check RLS status for all tables
    const rlsStatus = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    console.log('\n🔒 ROW LEVEL SECURITY STATUS:');
    let rlsDisabledCount = 0;
    rlsStatus.rows.forEach(t => {
      const status = t.rowsecurity ? '✅ ENABLED' : '❌ DISABLED';
      if (!t.rowsecurity) rlsDisabledCount++;
      console.log('   ', t.tablename + ':', status);
    });
    
    console.log('\n========================================');
    console.log('           SUMMARY');
    console.log('========================================');
    console.log('Tables with RLS DISABLED:', rlsDisabledCount, '/', rlsStatus.rows.length);
    console.log('\n⚠️  CRITICAL: Your database password is LEAKED!');
    console.log('   Anyone with the connection string can access ALL data.');
    console.log('\n🔴 IMMEDIATE ACTIONS REQUIRED:');
    console.log('   1. Go to Supabase Dashboard → Settings → Database');
    console.log('   2. Reset your database password IMMEDIATELY');
    console.log('   3. Update .env files and Render environment variables');
    console.log('   4. Enable RLS on critical tables (run enable-rls.sql)');
    
  } finally {
    client.release();
    await pool.end();
  }
}

securityAudit().catch(console.error);
