// Test GoDaddy SMTP Authentication
// Run: node test-email-auth.js

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function testEmailAuth() {
  console.log('🔍 Testing GoDaddy SMTP Authentication...\n');
  
  console.log('📧 Configuration:');
  console.log('  Host:', process.env.EMAIL_HOST);
  console.log('  Port:', process.env.EMAIL_PORT);
  console.log('  User:', process.env.EMAIL_USER);
  console.log('  Password Length:', process.env.EMAIL_PASSWORD?.length);
  console.log('  Password (masked):', process.env.EMAIL_PASSWORD?.replace(/./g, '*'));
  console.log('');

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: true, // Enable debug output
    logger: true // Enable logging
  });

  try {
    console.log('🔐 Attempting to connect and authenticate...\n');
    await transporter.verify();
    console.log('\n✅ SUCCESS! SMTP authentication works!');
    console.log('✅ You can now send emails.');
    
    // Optional: Send test email
    console.log('\n📧 Sending test email...');
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: 'sshabbir02@gmail.com',
      subject: 'Test Email - GoDaddy SMTP Working',
      html: '<h1>Success!</h1><p>Your GoDaddy SMTP is configured correctly.</p>',
      text: 'Success! Your GoDaddy SMTP is configured correctly.'
    });
    
    console.log('✅ Test email sent!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.log('\n❌ AUTHENTICATION FAILED!\n');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Server Response:', error.response);
    console.error('Server Response Code:', error.responseCode);
    console.log('\n📋 Troubleshooting Steps:\n');
    
    if (error.responseCode === 535) {
      console.log('🔴 Error 535: Invalid credentials');
      console.log('');
      console.log('Possible causes:');
      console.log('  1. Wrong email address or password');
      console.log('  2. Password has special characters that need escaping');
      console.log('  3. GoDaddy requires app-specific password');
      console.log('  4. Two-factor authentication is enabled');
      console.log('  5. Account is locked or suspended');
      console.log('');
      console.log('Solutions:');
      console.log('  1. Log into GoDaddy Webmail (https://email.godaddy.com)');
      console.log('     - Verify you can login with these credentials');
      console.log('  2. Check GoDaddy Email Settings:');
      console.log('     - Email & Office Dashboard → Your email → Settings');
      console.log('     - Look for "App Passwords" or "SMTP Access"');
      console.log('  3. Generate an app-specific password:');
      console.log('     - Some GoDaddy accounts require this for SMTP');
      console.log('  4. Contact GoDaddy Support:');
      console.log('     - Phone: 1-480-505-8877');
      console.log('     - Ask about SMTP authentication for admin@initiateph.com');
      console.log('');
      console.log('Current password starts with:', process.env.EMAIL_PASSWORD?.[0]);
      console.log('Current password ends with:', process.env.EMAIL_PASSWORD?.[process.env.EMAIL_PASSWORD?.length - 1]);
      console.log('Current password length:', process.env.EMAIL_PASSWORD?.length);
    } else {
      console.log('Error details:', error);
    }
    
    process.exit(1);
  }
}

testEmailAuth();
