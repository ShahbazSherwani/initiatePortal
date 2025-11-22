// generate-encryption-key.js
// Generates a secure 256-bit encryption key for AES-256-GCM
import crypto from 'crypto';

console.log('🔐 Generating secure encryption key...\n');

const key = crypto.randomBytes(32).toString('hex');

console.log('✅ Encryption key generated successfully!\n');
console.log('📋 Copy this key to your .env file:\n');
console.log(`ENCRYPTION_KEY=${key}\n`);
console.log('⚠️  IMPORTANT:');
console.log('   1. Keep this key SECRET - never commit to git');
console.log('   2. Store it securely - losing it means you cannot decrypt data');
console.log('   3. Use the same key across all environments (dev, staging, prod)');
console.log('   4. Back up this key in a secure location\n');
console.log('📝 Key details:');
console.log(`   Length: ${key.length} characters (${Buffer.from(key, 'hex').length} bytes)`);
console.log(`   Algorithm: AES-256-GCM`);
console.log(`   Format: Hexadecimal\n`);
