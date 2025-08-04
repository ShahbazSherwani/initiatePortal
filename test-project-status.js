// Test script to check what projects exist and their statuses
async function checkProjectStatuses() {
  console.log('🔍 Checking Project Statuses in Database...\n');

  try {
    // Test the debug endpoint to see all projects
    console.log('1. Checking all projects in database:');
    const debugResponse = await fetch('http://localhost:4000/api/debug/projects');
    
    if (debugResponse.ok) {
      const data = await debugResponse.json();
      console.log(`   Found ${data.totalProjects} projects:`);
      
      data.projects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.productName || 'Unnamed Project'}`);
        console.log(`      - Database ID: ${project.databaseId}`);
        console.log(`      - Status: ${project.status}`);
        console.log(`      - Approval Status: ${project.approvalStatus}`);
        console.log(`      - Type: ${project.type}`);
        console.log(`      - Created: ${project.createdAt}`);
        console.log('');
      });
      
      // Count by status
      const statusCounts = {};
      data.projects.forEach(p => {
        statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
      });
      
      console.log('   📊 Projects by Status:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`      - ${status}: ${count} projects`);
      });
      
    } else {
      console.log(`   ❌ Debug endpoint failed: ${debugResponse.status}`);
    }

    console.log('\n2. Testing what calendar endpoint would return:');
    console.log('   (This requires authentication - will show 401 but endpoint exists)');
    
    const calendarResponse = await fetch('http://localhost:4000/api/calendar/projects');
    console.log(`   Calendar endpoint status: ${calendarResponse.status}`);
    
    if (calendarResponse.status === 401) {
      console.log('   ✅ Calendar endpoint is accessible (requires auth as expected)');
    }

    console.log('\n💡 Next Steps:');
    console.log('1. If you see projects with "draft" status, they should now appear in investor calendar');
    console.log('2. Test the investor calendar at http://localhost:5173/investor/calendar');
    console.log('3. Login as an investor user and verify projects are visible');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProjectStatuses();
