// Check how the password is being read from .env
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '.env') });

console.log('\n🔍 Checking .env password configuration...\n');

const password = process.env.EMAIL_PASSWORD;

console.log('Raw value:', JSON.stringify(password));
console.log('Length:', password?.length);
console.log('First char:', password?.[0]);
console.log('Last char:', password?.[password.length - 1]);
console.log('Contains $:', password?.includes('$'));
console.log('Starts with $:', password?.startsWith('$'));
console.log('Full value (masked):', password?.replace(/./g, '*'));

// Check for hidden characters
if (password) {
  console.log('\n📊 Character codes:');
  for (let i = 0; i < password.length; i++) {
    console.log(`  [${i}]: '${password[i]}' (code: ${password.charCodeAt(i)})`);
  }
}

// Expected value
const expected = '$Empire08';
console.log('\n✅ Expected:', expected);
console.log('📋 Actual:  ', password);
console.log('🔍 Match:   ', password === expected ? 'YES ✅' : 'NO ❌');

if (password !== expected) {
  console.log('\n⚠️  Password mismatch detected!');
  console.log('Expected length:', expected.length);
  console.log('Actual length:  ', password?.length);
  
  if (password) {
    console.log('\nDifferences:');
    const maxLen = Math.max(expected.length, password.length);
    for (let i = 0; i < maxLen; i++) {
      if (expected[i] !== password[i]) {
        console.log(`  Position ${i}: expected '${expected[i]}' (${expected.charCodeAt(i)}), got '${password[i]}' (${password?.charCodeAt(i)})`);
      }
    }
  }
}
