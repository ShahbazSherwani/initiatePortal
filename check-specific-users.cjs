const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ixqjqjkpdycsjbztrvkh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxamtwZHljc2pienRydmtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjA3NTI5NSwiZXhwIjoyMDQ3NjUxMjk1fQ.XDUaGGLHuqJMYA8Z5Uvs2APKYX0iqJt7xikf-ZpMbTc'
);

const firebaseUids = [
  'U7tobF2zFNYxYFKHCIf5PLjBExw2',  // westharborinc@aol.com
  '53liPMYkzFMs7q83zprzW29ymWl2',  // carter.b.williams@gmail.com
  'uKQ3sVnbPQffilrnbLizh4tNRzl',   // barringerrosa@gmail.com
  'IzuGirfqO0QVW9Mv3HGiAYb7FXc2'   // ass@ass.com
];

async function checkUsers() {
  console.log('=== Checking How Users Were Created ===\n');
  
  const { data, error } = await supabase
    .from('users')
    .select('id, firebase_uid, email, first_name, last_name, source_system, global_user_id, email_verified, created_at')
    .in('firebase_uid', firebaseUids);
  
  if (error) {
    console.log('Error:', error.message);
    return;
  }
  
  console.log(`Found ${data.length} of 4 users in database\n`);
  
  data.forEach((u, i) => {
    console.log(`--- User ${i + 1} ---`);
    console.log(`Email: ${u.email}`);
    console.log(`Firebase UID: ${u.firebase_uid}`);
    console.log(`Name: ${u.first_name || ''} ${u.last_name || ''}`);
    console.log(`Source System: ${u.source_system || 'NULL (registered on InitiatePH)'}`);
    console.log(`Global User ID: ${u.global_user_id || 'N/A'}`);
    console.log(`Email Verified: ${u.email_verified}`);
    console.log(`Created: ${u.created_at}`);
    
    // Determine how user was created
    if (u.source_system === 'GLOBAL') {
      console.log(`\n🌐 ORIGIN: Synced FROM WordPress (InitiateGlobal)`);
    } else if (u.source_system === 'PH') {
      console.log(`\n🇵🇭 ORIGIN: Created on InitiatePH, synced to Global`);
    } else {
      console.log(`\n🔥 ORIGIN: Direct registration on InitiatePH (no sync yet)`);
    }
    console.log('');
  });
  
  // Check which ones are missing
  const foundUids = data.map(u => u.firebase_uid);
  const missingUids = firebaseUids.filter(uid => !foundUids.includes(uid));
  
  if (missingUids.length > 0) {
    console.log('--- Missing Users (not in database) ---');
    missingUids.forEach(uid => {
      console.log(`Firebase UID: ${uid} - NOT FOUND IN DATABASE`);
    });
  }
}

checkUsers().catch(console.error);
