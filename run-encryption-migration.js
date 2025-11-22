// run-encryption-migration.js
// Runs the encryption columns migration and then encrypts existing data
import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { encrypt, isEncrypted, ENCRYPTED_FIELDS } from './src/server/encryption.js';

dotenv.config();

const { Pool } = pg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? {
    rejectUnauthorized: false
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

async function runMigration() {
  console.log('📋 Running encryption columns migration...\n');
  
  try {
    // Step 1: Run SQL migration to add encryption_version columns
    const sql = readFileSync('migrations/010_add_encryption_columns.sql', 'utf8');
    await db.query(sql);
    console.log('✅ Encryption columns added successfully!\n');
    
    // Step 2: Check for ENCRYPTION_KEY
    if (!process.env.ENCRYPTION_KEY) {
      console.log('⚠️  ENCRYPTION_KEY not found in environment variables.');
      console.log('Please add ENCRYPTION_KEY to your .env file before encrypting data.');
      console.log('\nTo generate a secure key, run:');
      console.log('  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
      console.log('\nThen add to .env:');
      console.log('  ENCRYPTION_KEY=<generated_key>');
      process.exit(0);
    }
    
    // Step 3: Encrypt existing data
    console.log('🔐 Encrypting existing sensitive data...\n');
    
    await encryptExistingData();
    
    console.log('\n✅ Encryption migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await db.end();
  }
}

async function encryptExistingData() {
  let totalEncrypted = 0;
  
  // Encrypt users table
  console.log('📊 Encrypting users table...');
  const usersResult = await encryptTable('users', ENCRYPTED_FIELDS.users, 'firebase_uid');
  console.log(`   ✅ Encrypted ${usersResult} users records`);
  totalEncrypted += usersResult;
  
  // Encrypt topup_requests table
  console.log('📊 Encrypting topup_requests table...');
  const topupResult = await encryptTable('topup_requests', ENCRYPTED_FIELDS.topup_requests, 'id');
  console.log(`   ✅ Encrypted ${topupResult} topup_requests records`);
  totalEncrypted += topupResult;
  
  // Encrypt investor_profiles table
  console.log('📊 Encrypting investor_profiles table...');
  const investorResult = await encryptTable('investor_profiles', ENCRYPTED_FIELDS.investor_profiles, 'id');
  console.log(`   ✅ Encrypted ${investorResult} investor_profiles records`);
  totalEncrypted += investorResult;
  
  // Encrypt borrower_profiles table
  console.log('📊 Encrypting borrower_profiles table...');
  const borrowerResult = await encryptTable('borrower_profiles', ENCRYPTED_FIELDS.borrower_profiles, 'id');
  console.log(`   ✅ Encrypted ${borrowerResult} borrower_profiles records`);
  totalEncrypted += borrowerResult;
  
  console.log(`\n📈 Total records encrypted: ${totalEncrypted}`);
}

async function encryptTable(tableName, fields, primaryKey) {
  let encryptedCount = 0;
  
  // Get all records that haven't been encrypted yet (encryption_version = 0)
  const query = `SELECT * FROM ${tableName} WHERE encryption_version = 0`;
  const result = await db.query(query);
  
  if (result.rows.length === 0) {
    return 0;
  }
  
  // Process each record
  for (const row of result.rows) {
    const updates = [];
    const values = [];
    let paramIndex = 1;
    let hasChanges = false;
    
    // Encrypt each sensitive field
    for (const field of fields) {
      if (row[field] && !isEncrypted(row[field])) {
        const encrypted = encrypt(row[field]);
        updates.push(`${field} = $${paramIndex}`);
        values.push(encrypted);
        paramIndex++;
        hasChanges = true;
      }
    }
    
    // Update encryption_version
    updates.push(`encryption_version = $${paramIndex}`);
    values.push(1); // Version 1 = AES-256-GCM
    paramIndex++;
    
    // Add primary key to WHERE clause
    values.push(row[primaryKey]);
    
    if (hasChanges || true) { // Always update encryption_version
      const updateQuery = `
        UPDATE ${tableName}
        SET ${updates.join(', ')}
        WHERE ${primaryKey} = $${paramIndex}
      `;
      
      await db.query(updateQuery, values);
      encryptedCount++;
    }
  }
  
  return encryptedCount;
}

// Run migration
runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
