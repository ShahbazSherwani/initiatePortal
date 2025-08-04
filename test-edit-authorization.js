// Test script to verify edit authorization is working
import fetch from 'node-fetch';

async function testEditAuthorization() {
  const projectId = '1'; // Use a known project ID
  const validToken = 'KTRAtY1dHidvZ3pGcQrLD1IMWy23'; // User who owns the project (assuming it's user 1)
  const invalidToken = 'fake-token'; // User who doesn't own the project

  console.log('Testing edit authorization...\n');

  try {
    // Test 1: Valid user trying to access project for editing
    console.log('Test 1: Valid user accessing project for editing');
    const validResponse = await fetch(`http://localhost:4000/api/projects/${projectId}?edit=true`, {
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'x-edit-mode': 'true'
      }
    });
    
    console.log('Valid user response status:', validResponse.status);
    if (validResponse.status === 200) {
      console.log('✅ Valid user can access project for editing\n');
    } else {
      console.log('❌ Valid user cannot access project for editing\n');
    }

    // Test 2: Invalid user trying to access project for editing
    console.log('Test 2: Invalid user accessing project for editing');
    const invalidResponse = await fetch(`http://localhost:4000/api/projects/${projectId}?edit=true`, {
      headers: {
        'Authorization': `Bearer ${invalidToken}`,
        'x-edit-mode': 'true'
      }
    });
    
    console.log('Invalid user response status:', invalidResponse.status);
    if (invalidResponse.status === 403) {
      console.log('✅ Invalid user correctly blocked from editing\n');
    } else {
      console.log('❌ Invalid user can access project for editing (security issue!)\n');
    }

    // Test 3: Valid user accessing project without edit mode (should work)
    console.log('Test 3: Valid user accessing project without edit mode');
    const viewResponse = await fetch(`http://localhost:4000/api/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${validToken}`
      }
    });
    
    console.log('View response status:', viewResponse.status);
    if (viewResponse.status === 200) {
      console.log('✅ Project can be viewed normally\n');
    } else {
      console.log('❌ Project cannot be viewed normally\n');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testEditAuthorization();
