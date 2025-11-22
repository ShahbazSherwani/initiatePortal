// test-encryption.js
// Tests the encryption system to verify it works correctly
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

import { encrypt, decrypt, isEncrypted, encryptFields, decryptFields, ENCRYPTED_FIELDS } from './src/server/encryption.js';

console.log('🔐 Testing Encryption System...\n');

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(description, testFn) {
  testsRun++;
  try {
    testFn();
    testsPassed++;
    console.log(`✅ ${description}`);
  } catch (error) {
    testsFailed++;
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}`);
  }
}

// Test 1: Basic encryption/decryption
test('Basic encryption/decryption', () => {
  const plaintext = '123-456-7890';
  const encrypted = encrypt(plaintext);
  const decrypted = decrypt(encrypted);
  
  if (encrypted === plaintext) {
    throw new Error('Encrypted data should not equal plaintext');
  }
  
  if (decrypted !== plaintext) {
    throw new Error(`Decryption failed: expected "${plaintext}", got "${decrypted}"`);
  }
  
  if (!encrypted.includes(':')) {
    throw new Error('Encrypted data should contain colons as separators');
  }
});

// Test 2: Encryption format validation
test('Encryption format validation', () => {
  const plaintext = 'PASSPORT-ABC123';
  const encrypted = encrypt(plaintext);
  
  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    throw new Error(`Expected 3 parts separated by colons, got ${parts.length}`);
  }
  
  // IV should be 32 hex chars (16 bytes)
  if (parts[0].length !== 32) {
    throw new Error(`IV should be 32 hex chars, got ${parts[0].length}`);
  }
  
  // Auth tag should be 32 hex chars (16 bytes)
  if (parts[1].length !== 32) {
    throw new Error(`Auth tag should be 32 hex chars, got ${parts[1].length}`);
  }
});

// Test 3: isEncrypted detection
test('isEncrypted() detection', () => {
  const plaintext = '123-456-7890';
  const encrypted = encrypt(plaintext);
  
  if (isEncrypted(plaintext)) {
    throw new Error('Plaintext should not be detected as encrypted');
  }
  
  if (!isEncrypted(encrypted)) {
    throw new Error('Encrypted data should be detected as encrypted');
  }
  
  if (isEncrypted(null)) {
    throw new Error('null should not be detected as encrypted');
  }
  
  if (isEncrypted('')) {
    throw new Error('Empty string should not be detected as encrypted');
  }
});

// Test 4: Null/empty handling
test('Null and empty string handling', () => {
  const nullResult = encrypt(null);
  if (nullResult !== null) {
    throw new Error('encrypt(null) should return null');
  }
  
  const emptyResult = encrypt('');
  if (emptyResult !== null) {
    throw new Error('encrypt("") should return null');
  }
  
  const decryptNull = decrypt(null);
  if (decryptNull !== null) {
    throw new Error('decrypt(null) should return null');
  }
});

// Test 5: Different data types
test('Encrypting different data types', () => {
  const testCases = [
    '123-45-6789',  // SSN format
    'P1234567',     // Passport format
    '000-123-456-789',  // TIN format
    '1234567890123456', // Bank account
    'AB@#$%^&*()CD'     // Special characters
  ];
  
  for (const plaintext of testCases) {
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    
    if (decrypted !== plaintext) {
      throw new Error(`Failed for "${plaintext}": expected "${plaintext}", got "${decrypted}"`);
    }
  }
});

// Test 6: encryptFields() utility
test('encryptFields() utility function', () => {
  const user = {
    name: 'John Doe',
    national_id: '123-45-6789',
    passport: 'P1234567',
    tin_number: '000-123-456'
  };
  
  const encrypted = encryptFields(user, ENCRYPTED_FIELDS.users);
  
  if (encrypted.name !== 'John Doe') {
    throw new Error('Non-encrypted fields should remain unchanged');
  }
  
  if (!isEncrypted(encrypted.national_id)) {
    throw new Error('national_id should be encrypted');
  }
  
  if (!isEncrypted(encrypted.passport)) {
    throw new Error('passport should be encrypted');
  }
  
  if (!isEncrypted(encrypted.tin_number)) {
    throw new Error('tin_number should be encrypted');
  }
});

// Test 7: decryptFields() utility
test('decryptFields() utility function', () => {
  const user = {
    name: 'John Doe',
    national_id: encrypt('123-45-6789'),
    passport: encrypt('P1234567'),
    tin_number: encrypt('000-123-456')
  };
  
  const decrypted = decryptFields(user, ENCRYPTED_FIELDS.users);
  
  if (decrypted.name !== 'John Doe') {
    throw new Error('Non-encrypted fields should remain unchanged');
  }
  
  if (decrypted.national_id !== '123-45-6789') {
    throw new Error('national_id should be decrypted correctly');
  }
  
  if (decrypted.passport !== 'P1234567') {
    throw new Error('passport should be decrypted correctly');
  }
  
  if (decrypted.tin_number !== '000-123-456') {
    throw new Error('tin_number should be decrypted correctly');
  }
});

// Test 8: Legacy data handling
test('Legacy unencrypted data handling', () => {
  const legacyData = '123-45-6789'; // Unencrypted legacy data
  const decrypted = decrypt(legacyData);
  
  // Should return as-is since it's not in encrypted format
  if (decrypted !== legacyData) {
    throw new Error('Legacy data should be returned as-is');
  }
});

// Test 9: Encryption consistency
test('Encryption consistency (different encryptions)', () => {
  const plaintext = '123-45-6789';
  const encrypted1 = encrypt(plaintext);
  const encrypted2 = encrypt(plaintext);
  
  // Each encryption should produce different ciphertext (due to random IV)
  if (encrypted1 === encrypted2) {
    throw new Error('Multiple encryptions should produce different ciphertexts');
  }
  
  // But both should decrypt to the same plaintext
  if (decrypt(encrypted1) !== decrypt(encrypted2)) {
    throw new Error('Different encryptions should decrypt to the same plaintext');
  }
});

// Test 10: Large data encryption
test('Large data encryption (1KB)', () => {
  const largeData = 'A'.repeat(1024); // 1KB of data
  const encrypted = encrypt(largeData);
  const decrypted = decrypt(encrypted);
  
  if (decrypted !== largeData) {
    throw new Error('Large data encryption/decryption failed');
  }
});

// Test 11: Unicode support
test('Unicode character support', () => {
  const unicodeData = 'Hello世界🔐مرحبا';
  const encrypted = encrypt(unicodeData);
  const decrypted = decrypt(encrypted);
  
  if (decrypted !== unicodeData) {
    throw new Error(`Unicode support failed: expected "${unicodeData}", got "${decrypted}"`);
  }
});

// Test 12: ENCRYPTED_FIELDS configuration
test('ENCRYPTED_FIELDS configuration', () => {
  const requiredTables = ['users', 'topup_requests', 'investor_profiles', 'borrower_profiles'];
  
  for (const table of requiredTables) {
    if (!ENCRYPTED_FIELDS[table]) {
      throw new Error(`Missing ENCRYPTED_FIELDS configuration for ${table}`);
    }
    
    if (!Array.isArray(ENCRYPTED_FIELDS[table])) {
      throw new Error(`ENCRYPTED_FIELDS.${table} should be an array`);
    }
    
    if (ENCRYPTED_FIELDS[table].length === 0) {
      throw new Error(`ENCRYPTED_FIELDS.${table} should not be empty`);
    }
  }
  
  // Verify expected fields
  const expectedFields = {
    users: ['national_id', 'passport', 'tin_number'],
    topup_requests: ['account_number'],
    investor_profiles: ['bank_account_number'],
    borrower_profiles: ['bank_account_number']
  };
  
  for (const [table, fields] of Object.entries(expectedFields)) {
    for (const field of fields) {
      if (!ENCRYPTED_FIELDS[table].includes(field)) {
        throw new Error(`ENCRYPTED_FIELDS.${table} should include ${field}`);
      }
    }
  }
});

// Test 13: Encryption key validation
test('Encryption key validation', () => {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable not set');
  }
  
  const keyBuffer = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error(`Encryption key should be 32 bytes, got ${keyBuffer.length}`);
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Test Results:');
console.log('='.repeat(50));
console.log(`Total tests: ${testsRun}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log('='.repeat(50) + '\n');

if (testsFailed === 0) {
  console.log('🎉 All encryption tests passed successfully!');
  console.log('✅ Encryption system is working correctly');
  console.log('✅ Data is secure with AES-256-GCM encryption');
  console.log('✅ Ready to encrypt production data\n');
} else {
  console.log('⚠️  Some tests failed - please review the errors above\n');
  process.exit(1);
}
