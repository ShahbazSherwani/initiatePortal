/**
 * COMPREHENSIVE GODADDY SMTP DIAGNOSTIC
 * 
 * This script will help you fix the email issue by testing everything
 * and giving you exact steps for GoDaddy.
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('\n🔍 COMPREHENSIVE GODADDY SMTP DIAGNOSTIC');
console.log('═'.repeat(70));

// Step 1: Verify environment variables
console.log('\n📋 STEP 1: Checking Environment Variables');
console.log('─'.repeat(70));

const emailConfig = {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASSWORD
};

console.log(`Host: ${emailConfig.host} ${emailConfig.host === 'smtpout.secureserver.net' ? '✅' : '❌'}`);
console.log(`Port: ${emailConfig.port} ${emailConfig.port === '587' ? '✅' : '❌'}`);
console.log(`User: ${emailConfig.user} ${emailConfig.user === 'admin@initiateph.com' ? '✅' : '❌'}`);
console.log(`Pass: ${'*'.repeat(emailConfig.pass?.length || 0)} ${emailConfig.pass?.length === 9 ? '✅' : '❌'}`);

// Step 2: Test SMTP connection (without auth)
console.log('\n🌐 STEP 2: Testing SMTP Server Connection');
console.log('─'.repeat(70));

try {
  const testTransporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: parseInt(emailConfig.port),
    secure: false
  });
  
  // Just try to connect, not authenticate
  console.log('Attempting connection to GoDaddy SMTP server...');
  await testTransporter.verify();
  console.log('✅ Connection successful! Server is reachable.');
} catch (error) {
  console.log(`❌ Connection failed: ${error.message}`);
  console.log('\n⚠️  If connection fails, check:');
  console.log('   - Your internet connection');
  console.log('   - Firewall settings');
  console.log('   - ISP blocking port 587\n');
  process.exit(1);
}

// Step 3: Test authentication
console.log('\n🔐 STEP 3: Testing SMTP Authentication');
console.log('─'.repeat(70));

try {
  const authTransporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: parseInt(emailConfig.port),
    secure: false,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.pass
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: true,
    logger: false
  });
  
  console.log('Attempting authentication with GoDaddy...');
  await authTransporter.verify();
  console.log('✅ Authentication successful! Email system is working!');
  
  // Try sending a test email
  console.log('\n📧 STEP 4: Sending Test Email');
  console.log('─'.repeat(70));
  
  const testEmail = await authTransporter.sendMail({
    from: '"Initiate PH" <admin@initiateph.com>',
    to: 'sshabbir02@gmail.com',
    subject: '✅ SMTP Test Successful - ' + new Date().toLocaleTimeString(),
    html: `
      <h2>🎉 Success!</h2>
      <p>Your GoDaddy SMTP is now working correctly!</p>
      <p>Test performed at: ${new Date().toLocaleString()}</p>
    `
  });
  
  console.log(`✅ Test email sent! Message ID: ${testEmail.messageId}`);
  console.log(`\n✅ ✅ ✅ ALL TESTS PASSED! ✅ ✅ ✅`);
  console.log('\nYour email system is working. You can now:');
  console.log('1. Restart your backend server');
  console.log('2. Try registering a new user');
  console.log('3. Check your inbox for verification email\n');
  
} catch (error) {
  console.log(`\n❌ AUTHENTICATION FAILED!`);
  console.log(`Error: ${error.message}`);
  console.log(`Response Code: ${error.responseCode || 'N/A'}`);
  
  console.log('\n' + '═'.repeat(70));
  console.log('🔧 HOW TO FIX THIS IN GODADDY:');
  console.log('═'.repeat(70));
  
  console.log('\n1️⃣  LOG INTO GODADDY WEBMAIL:');
  console.log('   →  Go to: https://email.godaddy.com');
  console.log('   →  Email: admin@initiateph.com');
  console.log('   →  Password: $Empire08');
  console.log('   →  Can you log in? If NO, password is wrong!');
  
  console.log('\n2️⃣  CHECK IF LOGIN WORKS:');
  console.log('   →  If webmail login FAILS:');
  console.log('      • Go to https://account.godaddy.com');
  console.log('      • Click "Email & Office"');
  console.log('      • Reset password for admin@initiateph.com');
  console.log('      • Update .env with new password');
  
  console.log('\n3️⃣  IF WEBMAIL LOGIN WORKS, CHECK SMTP SETTINGS:');
  console.log('   →  In GoDaddy Webmail, click Settings (⚙️ icon)');
  console.log('   →  Look for "Forwarding & POP/IMAP" or "SMTP Settings"');
  console.log('   →  Check if "Enable SMTP Access" is turned ON');
  console.log('   →  Check if "Enable IMAP" is turned ON');
  
  console.log('\n4️⃣  CHECK FOR TWO-FACTOR AUTHENTICATION (2FA):');
  console.log('   →  Go to https://account.godaddy.com');
  console.log('   →  Click your profile → Account Settings → Security');
  console.log('   →  If 2FA is enabled:');
  console.log('      • Look for "App Passwords" or "App-Specific Passwords"');
  console.log('      • Generate new app password for "Initiate PH SMTP"');
  console.log('      • Copy the generated password (e.g., "abcd-efgh-ijkl-mnop")');
  console.log('      • Update .env: EMAIL_PASSWORD=abcd-efgh-ijkl-mnop');
  
  console.log('\n5️⃣  CHECK GODADDY WORKSPACE EMAIL SETTINGS:');
  console.log('   →  Go to https://account.godaddy.com');
  console.log('   →  Click "Email & Office" → Manage (for your domain)');
  console.log('   →  Click Settings for admin@initiateph.com');
  console.log('   →  Look for:');
  console.log('      • SMTP Access: Should be ENABLED');
  console.log('      • Security Settings: Check if restrictions exist');
  console.log('      • Email Client Access: Should be ALLOWED');
  
  console.log('\n6️⃣  ALTERNATIVE: USE GMAIL SMTP INSTEAD:');
  console.log('   If GoDaddy keeps failing, switch to Gmail:');
  console.log('   →  Update .env:');
  console.log('      EMAIL_HOST=smtp.gmail.com');
  console.log('      EMAIL_PORT=587');
  console.log('      EMAIL_USER=your-gmail@gmail.com');
  console.log('      EMAIL_PASSWORD=your-app-password');
  console.log('   →  Enable 2FA in Gmail');
  console.log('   →  Generate App Password at: https://myaccount.google.com/apppasswords');
  
  console.log('\n7️⃣  CONTACT GODADDY SUPPORT:');
  console.log('   If nothing works:');
  console.log('   →  Phone: 1-480-505-8877');
  console.log('   →  Chat: https://www.godaddy.com/contact-us');
  console.log('   →  Tell them: "SMTP authentication failing with error 535"');
  console.log('   →  Ask them to verify:');
  console.log('      • SMTP is enabled for admin@initiateph.com');
  console.log('      • No security blocks on the account');
  console.log('      • Correct SMTP settings (smtpout.secureserver.net:587)');
  
  console.log('\n' + '═'.repeat(70));
  console.log('🎯 MOST LIKELY CAUSES (in order of probability):');
  console.log('═'.repeat(70));
  console.log('1. Two-factor authentication is enabled (needs app password)');
  console.log('2. SMTP access is disabled in GoDaddy account settings');
  console.log('3. Password was recently changed but .env not updated');
  console.log('4. GoDaddy account has security restrictions');
  console.log('5. Account suspended or has payment issues\n');
  
  process.exit(1);
}
