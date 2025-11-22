// test-security.js
// Test script to verify security implementations

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/api';

console.log('🔒 Testing Security Features...\n');

// Test 1: Rate Limiting on Auth Endpoints
async function testRateLimiting() {
  console.log('1️⃣  Testing Rate Limiting (Auth Endpoints)...');
  
  try {
    const requests = [];
    // Make 6 requests (limit is 5)
    for (let i = 0; i < 6; i++) {
      requests.push(
        fetch(`${API_URL}/auth/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true })
        })
      );
    }
    
    const responses = await Promise.all(requests);
    const statusCodes = responses.map(r => r.status);
    const rateLimited = statusCodes.filter(code => code === 429).length;
    
    if (rateLimited > 0) {
      console.log('✅ Rate limiting working! ' + rateLimited + ' requests blocked');
    } else {
      console.log('⚠️  Rate limiting may not be working (all requests succeeded)');
    }
  } catch (error) {
    console.log('❌ Error testing rate limiting:', error.message);
  }
  console.log('');
}

// Test 2: Security Headers (Helmet)
async function testSecurityHeaders() {
  console.log('2️⃣  Testing Security Headers (Helmet)...');
  
  try {
    const response = await fetch(`${API_URL}/health`);
    const headers = response.headers;
    
    const securityHeaders = {
      'x-frame-options': headers.get('x-frame-options'),
      'x-content-type-options': headers.get('x-content-type-options'),
      'x-xss-protection': headers.get('x-xss-protection'),
      'strict-transport-security': headers.get('strict-transport-security'),
      'content-security-policy': headers.get('content-security-policy')
    };
    
    let passedCount = 0;
    for (const [header, value] of Object.entries(securityHeaders)) {
      if (value) {
        console.log(`   ✅ ${header}: ${value.substring(0, 50)}...`);
        passedCount++;
      } else {
        console.log(`   ❌ ${header}: Missing`);
      }
    }
    
    if (passedCount >= 3) {
      console.log('✅ Security headers configured correctly');
    } else {
      console.log('⚠️  Some security headers missing');
    }
  } catch (error) {
    console.log('❌ Error testing security headers:', error.message);
  }
  console.log('');
}

// Test 3: General API Rate Limiting
async function testAPIRateLimiting() {
  console.log('3️⃣  Testing General API Rate Limiting...');
  
  try {
    const requests = [];
    // Make 101 requests (limit is 100 per 15 min)
    for (let i = 0; i < 101; i++) {
      requests.push(fetch(`${API_URL}/health`));
    }
    
    const responses = await Promise.all(requests);
    const statusCodes = responses.map(r => r.status);
    const rateLimited = statusCodes.filter(code => code === 429).length;
    
    if (rateLimited > 0) {
      console.log('✅ API rate limiting working! ' + rateLimited + ' requests blocked');
    } else {
      console.log('⚠️  API rate limiting may not be strict enough');
    }
  } catch (error) {
    console.log('❌ Error testing API rate limiting:', error.message);
  }
  console.log('');
}

// Test 4: CORS Headers
async function testCORS() {
  console.log('4️⃣  Testing CORS Configuration...');
  
  try {
    const response = await fetch(`${API_URL}/health`, {
      headers: {
        'Origin': 'https://initiate-portal.vercel.app'
      }
    });
    
    const corsHeader = response.headers.get('access-control-allow-origin');
    
    if (corsHeader) {
      console.log(`✅ CORS configured: ${corsHeader}`);
    } else {
      console.log('⚠️  CORS header not found');
    }
  } catch (error) {
    console.log('❌ Error testing CORS:', error.message);
  }
  console.log('');
}

// Run all tests
async function runAllTests() {
  console.log('Starting security tests...');
  console.log('Make sure the server is running on http://localhost:5001\n');
  
  await testSecurityHeaders();
  await testCORS();
  await testRateLimiting();
  await testAPIRateLimiting();
  
  console.log('🏁 Security tests completed!');
}

runAllTests().catch(console.error);
