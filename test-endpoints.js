// Simple script to test API endpoints directly
async function testProjectStatus() {
  console.log('🔍 Testing Project Status Issues...\n');

  try {
    // Test the calendar endpoint that investors use
    console.log('1. Testing Calendar API (what investors see):');
    const calendarResponse = await fetch('http://localhost:4000/api/calendar/projects', {
      headers: {
        'Authorization': 'Bearer test-token' // This will fail auth but show us the structure
      }
    });
    
    console.log(`   Status: ${calendarResponse.status}`);
    if (calendarResponse.status === 401) {
      console.log('   ✅ Calendar endpoint exists but requires authentication (expected)');
    }

    // Test the main projects endpoint 
    console.log('\n2. Testing Main Projects API:');
    const projectsResponse = await fetch('http://localhost:4000/api/projects', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log(`   Status: ${projectsResponse.status}`);
    if (projectsResponse.status === 401) {
      console.log('   ✅ Projects endpoint exists but requires authentication (expected)');
    }

    // Test server health
    console.log('\n3. Testing Server Health:');
    const healthResponse = await fetch('http://localhost:4000/api/health');
    console.log(`   Status: ${healthResponse.status}`);
    
    if (healthResponse.status === 404) {
      console.log('   ⚠️  No health endpoint, but server is responding');
    }

    console.log('\n📋 Summary:');
    console.log('The issue is likely that borrower projects need to be PUBLISHED to appear in investor calendar.');
    console.log('');
    console.log('💡 To fix this issue:');
    console.log('1. Login as a borrower who created projects');
    console.log('2. Go to "My Projects" page (/borwMyProj)');
    console.log('3. Find projects with "Draft" status');
    console.log('4. Click "Publish" button on each project');
    console.log('5. Projects should then appear in investor calendar');
    console.log('');
    console.log('Or we can modify the calendar endpoint to show draft projects too.');

  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
  }
}

testProjectStatus();
