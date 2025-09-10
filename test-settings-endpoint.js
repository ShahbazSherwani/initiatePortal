// Quick test to verify the settings profile endpoint works
import fetch from 'node-fetch';

async function testSettingsEndpoint() {
  try {
    console.log('🧪 Testing Settings Profile Endpoint');
    
    // Test the endpoint without auth (should get 401)
    const response = await fetch('http://localhost:3001/api/settings/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Response Status:', response.status);
    const data = await response.text();
    console.log('📡 Response:', data);
    
    if (response.status === 401) {
      console.log('✅ Endpoint is responding correctly (401 without auth token)');
    } else {
      console.log('❌ Unexpected response status');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSettingsEndpoint();
