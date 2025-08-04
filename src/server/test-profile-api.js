// Test profile API endpoint
async function testProfileAPI() {
  const testToken = 'test-token-for-KTRAtY1dHidvZ3pGcQrLD1IMWy23';
  
  try {
    console.log('=== Testing Profile API ===');
    
    const response = await fetch('http://localhost:4000/api/profile', {
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', data);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testProfileAPI();
