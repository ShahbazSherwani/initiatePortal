// Test script to verify calendar functionality
import http from 'http';

const BASE_URL = 'http://localhost:4000';

// Test data
const testProject = {
  type: 'lending',
  details: {
    product: 'Test Product for Calendar',
    investmentAmount: '50000',
    overview: 'This is a test project to verify calendar display',
    image: 'https://via.placeholder.com/400x300?text=Test+Project'
  },
  status: 'published'
};

async function makeRequest(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testCalendarFunctionality() {
  console.log('🧪 Testing Calendar Functionality...\n');

  try {
    // Test 1: Check calendar endpoint without auth
    console.log('1. Testing calendar endpoint accessibility...');
    const calendarResponse = await makeRequest('/api/calendar/projects');
    console.log(`   Calendar endpoint status: ${calendarResponse.status}`);
    
    if (calendarResponse.status === 200) {
      console.log(`   ✅ Found ${calendarResponse.data.length} projects in calendar`);
      calendarResponse.data.forEach(project => {
        console.log(`      - Project: ${project.project_data?.details?.product || 'Unnamed'} (ID: ${project.id})`);
      });
    } else {
      console.log(`   ⚠️  Calendar endpoint returned status ${calendarResponse.status}`);
      console.log(`   Response: ${JSON.stringify(calendarResponse.data, null, 2)}`);
    }

    // Test 2: Check approved projects endpoint
    console.log('\n2. Testing approved projects endpoint...');
    const approvedResponse = await makeRequest('/api/projects/approved');
    console.log(`   Approved projects status: ${approvedResponse.status}`);
    
    if (approvedResponse.status === 200) {
      console.log(`   ✅ Found ${approvedResponse.data.length} approved projects`);
    }

    // Test 3: Check if server migration endpoint exists
    console.log('\n3. Testing migration endpoint...');
    const migrationResponse = await makeRequest('/api/migrate/approval-status', 'POST');
    console.log(`   Migration endpoint status: ${migrationResponse.status}`);
    console.log(`   Response: ${JSON.stringify(migrationResponse.data, null, 2)}`);

    console.log('\n✅ Calendar functionality test complete!');
    console.log('\nTo test the investor calendar:');
    console.log('1. Open http://localhost:5173');
    console.log('2. Login as an investor user');
    console.log('3. Navigate to /investor/calendar');
    console.log('4. Verify that projects appear on the calendar');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCalendarFunctionality();
