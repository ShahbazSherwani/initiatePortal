// Simple test to check projects exist
const response = fetch('http://localhost:4000/api/debug/projects')
  .then(res => res.json())
  .then(data => {
    console.log('📊 Projects found:', data.totalProjects || data.length);
    console.log('Projects:', JSON.stringify(data, null, 2));
  })
  .catch(err => console.error('Error:', err));
