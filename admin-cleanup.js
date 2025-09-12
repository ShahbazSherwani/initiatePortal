// Admin Database Cleanup Utility
// This script allows admin users to clear all projects and investment requests from the database

// Instructions:
// 1. Make sure you're logged in as an admin user in the application
// 2. Open browser Developer Tools (F12)
// 3. Go to Network tab and find any recent API request
// 4. Copy the Authorization header value (starts with "Bearer ")
// 5. Replace the TOKEN below with your actual token
// 6. Run: node admin-cleanup.js

const TOKEN = "Bearer YOUR_TOKEN_HERE"; // Replace with your actual token from browser dev tools

async function cleanupDatabase() {
  try {
    console.log('🗑️ Starting database cleanup...');
    
    const response = await fetch('http://localhost:3001/api/admin/clear-all-data', {
      method: 'DELETE',
      headers: {
        'Authorization': TOKEN,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Database cleanup successful!');
      console.log('📊 Cleanup results:', result.deleted);
      console.log(`🎯 Deleted ${result.deleted.projects} projects`);
      console.log(`🎯 Deleted ${result.deleted.borrowRequests} borrow requests`);
      console.log(`🎯 Deleted ${result.deleted.topupRequests} topup requests`);
      console.log(`🎯 Reset ${result.deleted.walletsReset} wallet balances`);
    } else {
      console.error('❌ Cleanup failed:', result.error);
      if (response.status === 403) {
        console.log('💡 Make sure you are logged in as an admin user');
      } else if (response.status === 401) {
        console.log('💡 Your token might be expired. Get a fresh token from browser dev tools');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Make sure the server is running on http://localhost:3001');
  }
}

// Check if token is provided
if (TOKEN === "Bearer YOUR_TOKEN_HERE") {
  console.log('❌ Please replace TOKEN with your actual authorization token');
  console.log('📝 Instructions:');
  console.log('1. Login to the app as admin');
  console.log('2. Open browser dev tools (F12)');
  console.log('3. Go to Network tab');
  console.log('4. Make any API request (like refresh page)');
  console.log('5. Find a request and copy the Authorization header');
  console.log('6. Replace TOKEN in this file');
  console.log('7. Run: node admin-cleanup.js');
} else {
  cleanupDatabase();
}
