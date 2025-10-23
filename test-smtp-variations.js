// Test different SMTP auth configurations
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const variations = [
  {
    name: 'Current configuration',
    config: {
      host: 'smtpout.secureserver.net',
      port: 587,
      secure: false,
      auth: {
        user: 'admin@initiateph.com',
        pass: '$Empire08'
      },
      tls: {
        rejectUnauthorized: false
      }
    }
  },
  {
    name: 'With explicit STARTTLS',
    config: {
      host: 'smtpout.secureserver.net',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: 'admin@initiateph.com',
        pass: '$Empire08'
      },
      tls: {
        rejectUnauthorized: false
      }
    }
  },
  {
    name: 'Port 465 with SSL',
    config: {
      host: 'smtpout.secureserver.net',
      port: 465,
      secure: true,
      auth: {
        user: 'admin@initiateph.com',
        pass: '$Empire08'
      },
      tls: {
        rejectUnauthorized: false
      }
    }
  },
  {
    name: 'Port 80 (HTTP fallback)',
    config: {
      host: 'smtpout.secureserver.net',
      port: 80,
      secure: false,
      auth: {
        user: 'admin@initiateph.com',
        pass: '$Empire08'
      },
      tls: {
        rejectUnauthorized: false
      }
    }
  },
  {
    name: 'Alternative host (smtp)',
    config: {
      host: 'smtp.secureserver.net',
      port: 587,
      secure: false,
      auth: {
        user: 'admin@initiateph.com',
        pass: '$Empire08'
      },
      tls: {
        rejectUnauthorized: false
      }
    }
  }
];

console.log('🧪 Testing SMTP Authentication Variations\n');
console.log('═'.repeat(60));

for (const variation of variations) {
  console.log(`\n📝 Testing: ${variation.name}`);
  console.log('─'.repeat(60));
  
  try {
    const transporter = nodemailer.createTransport(variation.config);
    await transporter.verify();
    console.log(`✅ SUCCESS! Configuration works!`);
    console.log(`   Host: ${variation.config.host}`);
    console.log(`   Port: ${variation.config.port}`);
    console.log(`   Secure: ${variation.config.secure}`);
    break; // Found working config
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }
}

console.log('\n' + '═'.repeat(60));
console.log('\n💡 Recommendation:');
console.log('If none work, the issue is likely:');
console.log('1. Password is incorrect in GoDaddy');
console.log('2. SMTP is disabled for this email account');
console.log('3. Two-factor authentication is blocking SMTP');
console.log('4. Account requires app-specific password\n');
