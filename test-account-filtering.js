const fetch = require('node-fetch');

async function testProjectsAPI() {
  try {
    console.log('Testing projects API endpoint...');
    
    // Note: You'll need to replace this with a valid auth token
    const response = await fetch('http://localhost:3000/api/projects?status=published', {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });
    
    const projects = await response.json();
    console.log(`Returned ${projects.length} projects`);
    
    // Check if creator_is_individual field is present
    projects.forEach((project, index) => {
      console.log(`Project ${index + 1}:`);
      console.log(`  ID: ${project.id}`);
      console.log(`  Creator UID: ${project.firebase_uid}`);
      console.log(`  Creator is Individual: ${project.creator_is_individual}`);
      console.log(`  Product: ${project.project_data?.details?.product || 'Unknown'}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testProjectsAPI();