// Debug connection string
import dotenv from 'dotenv';
import { lookup } from 'dns';
import { promisify } from 'util';

dotenv.config();

const lookupAsync = promisify(lookup);

async function debugConnection() {
  console.log('=== Supabase Connection Debug ===');
  console.log('DATABASE_URL from .env:', process.env.DATABASE_URL);

  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      console.log('\n=== Parsed Connection Details ===');
      console.log('Protocol:', url.protocol);
      console.log('Username:', url.username);
      console.log('Password:', url.password ? '***hidden***' : 'NOT SET');
      console.log('Hostname:', url.hostname);
      console.log('Port:', url.port);
      console.log('Database:', url.pathname.substring(1));
      
      console.log('\n=== Testing hostname resolution ===');
      console.log('Hostname to test:', url.hostname);
      
      try {
        const result = await lookupAsync(url.hostname);
        console.log('✅ DNS Resolution successful:', result);
      } catch (dnsError) {
        console.log('❌ DNS Resolution failed:', dnsError.message);
        console.log('\n🔧 This means the hostname is not valid or the Supabase project doesn\'t exist');
      }
      
    } catch (parseError) {
      console.log('❌ Failed to parse DATABASE_URL:', parseError.message);
    }
  } else {
    console.log('❌ DATABASE_URL is not set in .env file');
  }

  console.log('\n=== Next Steps ===');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Navigate to Settings → Database');
  console.log('3. Copy the exact connection string (URI format)');
  console.log('4. Replace the DATABASE_URL in your .env file');
  console.log('5. Make sure to replace [YOUR-PASSWORD] with your actual password');
}

debugConnection();
