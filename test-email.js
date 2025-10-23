import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('📧 Testing GoDaddy Email Configuration...');
console.log('=======================================\n');
console.log('Email User:', process.env.EMAIL_USER || '❌ NOT SET');
console.log('Email Host:', process.env.EMAIL_HOST || '❌ NOT SET');
console.log('Email Port:', process.env.EMAIL_PORT || '❌ NOT SET');
console.log('Email From:', process.env.EMAIL_FROM || '❌ NOT SET');
console.log('Email From Name:', process.env.EMAIL_FROM_NAME || '❌ NOT SET');
console.log('');

if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('❌ Error: Email configuration missing in .env file!');
  console.log('\nRequired variables:');
  console.log('  EMAIL_HOST=smtpout.secureserver.net');
  console.log('  EMAIL_PORT=465');
  console.log('  EMAIL_SECURE=true');
  console.log('  EMAIL_USER=admin@initiateph.com');
  console.log('  EMAIL_PASSWORD=your_password_here');
  console.log('  EMAIL_FROM=admin@initiateph.com');
  console.log('  EMAIL_FROM_NAME=Initiate PH');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 465,
  secure: process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // For GoDaddy SSL certificates
  }
});

async function testConnection() {
  try {
    console.log('🔄 Step 1: Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ Step 1: Connection successful!\n');
    
    console.log('📨 Step 2: Sending test email...');
    const testEmailAddress = process.env.EMAIL_USER; // Send to yourself
    
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Initiate PH'}" <${process.env.EMAIL_FROM}>`,
      to: testEmailAddress,
      subject: '✅ Test Email - Initiate PH Email System Working!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0C4B20, #8FB200); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
            .success-box { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .info-box { background: #f9f9f9; padding: 15px; border-left: 4px solid #0C4B20; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Email System Test</h1>
            </div>
            <div class="content">
              <div class="success-box">
                <strong>🎉 Success!</strong> Your GoDaddy SMTP email configuration is working correctly!
              </div>
              
              <h2>Configuration Details</h2>
              <div class="info-box">
                <strong>Email Settings:</strong><br>
                • From: ${process.env.EMAIL_FROM}<br>
                • Host: ${process.env.EMAIL_HOST}<br>
                • Port: ${process.env.EMAIL_PORT}<br>
                • Secure: ${process.env.EMAIL_SECURE || 'true'}<br>
                • Test Date: ${new Date().toLocaleString()}
              </div>

              <h2>What's Working:</h2>
              <ul>
                <li>✅ SMTP connection successful</li>
                <li>✅ Authentication successful</li>
                <li>✅ Email sending functional</li>
                <li>✅ HTML email template rendering</li>
              </ul>

              <h2>Next Steps:</h2>
              <ol>
                <li>Restart your server: <code>cd src/server && npm start</code></li>
                <li>Look for: "✅ Email transporter ready (GoDaddy SMTP)"</li>
                <li>Test user registration flow</li>
                <li>Check verification emails are sent</li>
              </ol>

              <p style="margin-top: 30px; color: #666;">
                This test email was sent from your Initiate PH email verification system.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Initiate PH. All rights reserved.</p>
              <p>Unit 1915 Capital House 9th Avenue, corner 34th<br>Bonifacio Global City, Taguig City</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    
    console.log('✅ Step 2: Test email sent successfully!\n');
    console.log('=======================================');
    console.log('📬 Email Details:');
    console.log('   To:', testEmailAddress);
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    console.log('=======================================\n');
    
    console.log('🎉 SUCCESS! Your email system is ready!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Check your inbox at', testEmailAddress);
    console.log('2. Restart your server: cd src/server && npm start');
    console.log('3. Look for: ✅ Email transporter ready (GoDaddy SMTP)');
    console.log('4. Test user registration with email verification');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('🔍 Troubleshooting Steps:');
    console.log('=======================================');
    
    if (error.message.includes('Invalid login')) {
      console.log('❌ Authentication Failed');
      console.log('   • Check your email password is correct');
      console.log('   • This is the EMAIL password, not your GoDaddy account password');
      console.log('   • Reset password in GoDaddy Email & Office dashboard');
    } else if (error.message.includes('ETIMEDOUT') || error.message.includes('ECONNREFUSED')) {
      console.log('❌ Connection Timeout');
      console.log('   • Try port 587 instead of 465');
      console.log('   • Update .env: EMAIL_PORT=587 and EMAIL_SECURE=false');
      console.log('   • Check your internet connection');
      console.log('   • Verify GoDaddy SMTP server is accessible');
    } else if (error.message.includes('certificate')) {
      console.log('❌ SSL Certificate Issue');
      console.log('   • Try port 587 with STARTTLS');
      console.log('   • Update .env: EMAIL_PORT=587 and EMAIL_SECURE=false');
    } else {
      console.log('❌ Unknown Error');
      console.log('   • Full error:', error);
    }
    
    console.log('');
    console.log('📚 Documentation:');
    console.log('   • See GODADDY_EMAIL_SETUP.md for detailed troubleshooting');
    console.log('   • See NEXT_STEPS_EMAIL_SETUP.md for setup guide');
    console.log('');
    
    process.exit(1);
  }
}

console.log('Starting test...\n');
testConnection();
