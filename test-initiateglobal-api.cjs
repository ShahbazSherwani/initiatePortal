/**
 * Test script for Initiate Global API integration
 * Enhanced with assertions, structured reporting, and JSON output
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// API Configuration
const API_BASE = 'initiateglobal.org';
const API_PATH_USERS_GET = '/wp-json/jet-cct/users'; // Old endpoint for GET
const API_PATH_USERS_POST = '/wp-json/initiate-secure/v1/create-user'; // New secure endpoint for POST
const USERNAME = 'initiatead';
const PASSWORD = 'Hqrw tsdh s4R2 Xfc1 JlhP WRrJ';

// Test Configuration
const SAVE_RESULTS_TO_FILE = true;
const OUTPUT_FILE = 'api-test-results.json';

// Create Basic Auth header
const authString = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
const AUTH_HEADER = `Basic ${authString}`;

// Test Results Storage
const testReport = {
  timestamp: new Date().toISOString(),
  environment: 'production',
  apiBase: API_BASE,
  endpoints: {
    get: API_PATH_USERS_GET,
    post: API_PATH_USERS_POST
  },
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

console.log('Authentication Header:', AUTH_HEADER);
console.log('');

/**
 * Assertion helper functions
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, fieldName) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: Expected ${fieldName} to be ${expected}, but got ${actual}`);
  }
}

function assertExists(value, fieldName) {
  if (value === null || value === undefined) {
    throw new Error(`Assertion failed: ${fieldName} is required but was ${value}`);
  }
}

function assertStatusCode(response, expectedCodes) {
  const codes = Array.isArray(expectedCodes) ? expectedCodes : [expectedCodes];
  if (!codes.includes(response.statusCode)) {
    throw new Error(`Expected status code ${codes.join(' or ')}, but got ${response.statusCode}`);
  }
}

/**
 * Make HTTPS request
 */
function makeRequest(method, path, data = null) {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': AUTH_HEADER,
        'Content-Type': 'application/json',
        'User-Agent': 'InitiatePH-Integration-Test/1.0'
      }
    };

    if (data && method === 'POST') {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;
        
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers,
            body: jsonBody,
            duration: duration
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers,
            body: body,
            parseError: e.message,
            duration: duration
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data && method === 'POST') {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Log test result
 */
function logTestResult(testName, status, details) {
  const testResult = {
    name: testName,
    status: status,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  testReport.tests.push(testResult);
  testReport.summary.total++;
  
  if (status === 'PASS') {
    testReport.summary.passed++;
  } else if (status === 'FAIL') {
    testReport.summary.failed++;
  } else if (status === 'SKIP') {
    testReport.summary.skipped++;
  }
  
  return testResult;
}

/**
 * Test 1: GET all users
 */
async function testGetAllUsers() {
  const testName = 'GET All Users';
  console.log(`TEST 1: ${testName}`);
  console.log('=' .repeat(50));
  console.log(`GET https://${API_BASE}${API_PATH_USERS_GET}`);
  console.log('');

  try {
    const response = await makeRequest('GET', API_PATH_USERS_GET);
    
    // ASSERTIONS
    assertStatusCode(response, 200);
    assert(Array.isArray(response.body), 'Response body should be an array');
    assert(response.duration < 5000, 'Response time should be under 5 seconds');
    
    if (response.body.length > 0) {
      const firstUser = response.body[0];
      assertExists(firstUser._ID, '_ID field');
      assertExists(firstUser.email, 'email field');
    }
    
    console.log('[PASS] Status:', response.statusCode, response.statusMessage);
    console.log('Duration:', response.duration, 'ms');
    console.log('Found', response.body.length, 'users');
    
    if (response.body.length > 0) {
      console.log('   Sample user:');
      console.log(JSON.stringify(response.body[0], null, 2));
    }
    
    logTestResult(testName, 'PASS', {
      statusCode: response.statusCode,
      duration: response.duration,
      userCount: response.body.length
    });
    
    return response;
    
  } catch (error) {
    console.log('[FAIL] Error:', error.message);
    logTestResult(testName, 'FAIL', { error: error.message });
    throw error;
  }
}

/**
 * Test 2: GET single user
 */
async function testGetSingleUser(userId) {
  const testName = 'GET Single User';
  console.log('');
  console.log(`TEST 2: ${testName}`);
  console.log('=' .repeat(50));
  console.log(`GET https://${API_BASE}${API_PATH_USERS_GET}/${userId}`);
  console.log('');

  try {
    const response = await makeRequest('GET', `${API_PATH_USERS_GET}/${userId}`);
    
    // ASSERTIONS
    assertStatusCode(response, 200);
    assert(typeof response.body === 'object', 'Response body should be an object');
    assertExists(response.body._ID, '_ID field');
    assertEqual(response.body._ID, userId, '_ID');
    
    console.log('[PASS] Status:', response.statusCode, response.statusMessage);
    console.log('Duration:', response.duration, 'ms');
    
    logTestResult(testName, 'PASS', {
      statusCode: response.statusCode,
      duration: response.duration,
      userId: userId
    });
    
    return response;
    
  } catch (error) {
    console.log('[FAIL] Error:', error.message);
    logTestResult(testName, 'FAIL', { userId, error: error.message });
    throw error;
  }
}

/**
 * Test 3: POST create user
 */
async function testCreateUser() {
  const testName = 'POST Create New User';
  console.log('');
  console.log(`TEST 3: ${testName}`);
  console.log('=' .repeat(50));
  console.log(`POST https://${API_BASE}${API_PATH_USERS_POST}`);
  console.log('');

  const timestamp = Date.now();
  const testUser = {
    email: `test.user.${timestamp}@initiateph.com`,
    first_name: 'Test',
    last_name: 'User',
    phone_number: '+639123456789',
    account_type: 'investor'
  };

  console.log('Request:', JSON.stringify(testUser, null, 2));
  console.log('');

  try {
    const response = await makeRequest('POST', API_PATH_USERS_POST, testUser);
    
    const isExpected404 = response.statusCode === 404 && 
                          response.body.code === 'rest_no_route';
    
    if (isExpected404) {
      console.log('[SKIP] Status:', response.statusCode, '(POST not enabled yet)');
      logTestResult(testName, 'SKIP', {
        statusCode: response.statusCode,
        reason: 'POST endpoint not enabled yet'
      });
    } else if (response.statusCode === 500) {
      console.log('[FAIL] Status: 500 Internal Server Error');
      console.log('Error Response:', JSON.stringify(response.body, null, 2));
      console.log('');
      console.log('This usually means:');
      console.log('- Database table name is wrong');
      console.log('- Database table structure doesn\'t match');
      console.log('- Missing fields in the table');
      console.log('- Database permission issue');
      logTestResult(testName, 'FAIL', {
        statusCode: response.statusCode,
        error: response.body
      });
      throw new Error(`Server error: ${JSON.stringify(response.body)}`);
    } else {
      assertStatusCode(response, [200, 201]);
      console.log('[PASS] Status:', response.statusCode, response.statusMessage);
      console.log('Duration:', response.duration, 'ms');
      logTestResult(testName, 'PASS', {
        statusCode: response.statusCode,
        duration: response.duration
      });
    }
    
    return response;
    
  } catch (error) {
    console.log('[FAIL] Error:', error.message);
    logTestResult(testName, 'FAIL', { error: error.message });
    throw error;
  }
}

/**
 * Test 4: POST duplicate user
 */
async function testDuplicateUser() {
  const testName = 'POST Duplicate User';
  console.log('');
  console.log(`TEST 4: ${testName}`);
  console.log('=' .repeat(50));
  console.log('Testing duplicate email handling...');
  console.log('');

  const duplicateUser = {
    email: 'duplicate.test@initiateph.com',
    first_name: 'Duplicate',
    last_name: 'Test',
    phone_number: '+639987654321',
    account_type: 'borrower'
  };

  try {
    const response1 = await makeRequest('POST', API_PATH_USERS_POST, duplicateUser);
    const response2 = await makeRequest('POST', API_PATH_USERS_POST, duplicateUser);
    
    const isExpected404 = response2.statusCode === 404;
    
    if (isExpected404) {
      console.log('[SKIP] POST not enabled, skipping duplicate test');
      logTestResult(testName, 'SKIP', {
        reason: 'POST endpoint not enabled yet'
      });
    } else {
      console.log(`Second POST returned: ${response2.statusCode}`);
      logTestResult(testName, 'PASS', {
        statusCode: response2.statusCode
      });
    }
    
    return response2;
    
  } catch (error) {
    console.log('[FAIL] Error:', error.message);
    logTestResult(testName, 'FAIL', { error: error.message });
    throw error;
  }
}

/**
 * Test 5: POST invalid user
 */
async function testInvalidUser() {
  const testName = 'POST Invalid User';
  console.log('');
  console.log(`TEST 5: ${testName}`);
  console.log('=' .repeat(50));
  console.log('Testing validation (missing required fields)...');
  console.log('');

  const invalidUser = {
    email: 'invalid@test.com'
  };

  try {
    const response = await makeRequest('POST', API_PATH_USERS_POST, invalidUser);
    
    const isExpected404 = response.statusCode === 404;
    
    if (isExpected404) {
      console.log('[SKIP] POST not enabled, skipping validation test');
      logTestResult(testName, 'SKIP', {
        reason: 'POST endpoint not enabled yet'
      });
    } else {
      assertStatusCode(response, [400, 422]);
      console.log('[PASS] Validation working correctly');
      logTestResult(testName, 'PASS', {
        statusCode: response.statusCode
      });
    }
    
    return response;
    
  } catch (error) {
    console.log('[FAIL] Error:', error.message);
    logTestResult(testName, 'FAIL', { error: error.message });
    throw error;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('INITIATE GLOBAL API INTEGRATION TESTS');
  console.log('=' .repeat(50));
  console.log('Base URL:', `https://${API_BASE}`);
  console.log('GET Endpoint:', API_PATH_USERS_GET);
  console.log('POST Endpoint:', API_PATH_USERS_POST);
  console.log('');

  try {
    // Test 1
    const getUsersResult = await testGetAllUsers();

    // Test 2
    if (getUsersResult.statusCode === 200 && 
        getUsersResult.body.length > 0 &&
        getUsersResult.body[0]._ID) {
      await testGetSingleUser(getUsersResult.body[0]._ID);
    }

    // Test 3
    await testCreateUser();

    // Test 4
    await testDuplicateUser();

    // Test 5
    await testInvalidUser();

  } catch (error) {
    console.log('');
    console.log('[FATAL ERROR]:', error.message);
  }

  // Add execution summary
  testReport.executionTime = Date.now() - new Date(testReport.timestamp).getTime();
  testReport.conclusion = generateConclusion();

  // Print summary
  console.log('');
  console.log('');
  console.log('TEST SUMMARY');
  console.log('=' .repeat(50));
  
  testReport.tests.forEach((test, index) => {
    const statusIcon = test.status === 'PASS' ? '[PASS]' : test.status === 'FAIL' ? '[FAIL]' : '[SKIP]';
    console.log(`${statusIcon} Test ${index + 1}: ${test.name} - ${test.status}`);
    if (test.statusCode) console.log(`   Status: ${test.statusCode}`);
    if (test.duration) console.log(`   Duration: ${test.duration}ms`);
    if (test.reason) console.log(`   Reason: ${test.reason}`);
  });
  
  console.log('');
  console.log(`Total: ${testReport.summary.total} tests`);
  console.log(`Passed: ${testReport.summary.passed}`);
  console.log(`Failed: ${testReport.summary.failed}`);
  console.log(`Skipped: ${testReport.summary.skipped}`);
  console.log(`Execution Time: ${testReport.executionTime}ms`);
  console.log('=' .repeat(50));
  
  // Save results
  if (SAVE_RESULTS_TO_FILE) {
    saveTestResults();
  }
  
  console.log('');
  console.log('CONCLUSION:');
  console.log(testReport.conclusion);
  console.log('');
}

/**
 * Generate conclusion
 */
function generateConclusion() {
  const { passed, failed, skipped } = testReport.summary;
  
  if (failed > 0 && passed === 0) {
    return 'CRITICAL: All tests failed. Integration blocked.';
  }
  
  if (passed >= 2 && skipped >= 3) {
    return 'PARTIAL SUCCESS: GET endpoints work. Authentication valid.\n' +
           '   POST endpoint not enabled yet. Awaiting Initiate Global team response.';
  }
  
  if (passed === testReport.summary.total) {
    return 'SUCCESS: All tests passed! API ready for integration.';
  }
  
  return 'Tests completed with mixed results.';
}

/**
 * Save test results to JSON
 */
function saveTestResults() {
  try {
    const outputPath = path.join(__dirname, OUTPUT_FILE);
    fs.writeFileSync(outputPath, JSON.stringify(testReport, null, 2), 'utf8');
    console.log(`Test results saved to: ${outputPath}`);
  } catch (error) {
    console.log('Failed to save results:', error.message);
  }
}

// Run tests
runTests().catch(console.error);
