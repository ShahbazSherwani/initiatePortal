import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://initiatePortal_owner:fLr9gePcYSVs@ep-silent-term-a5vur5ze.us-east-2.aws.neon.tech/initiatePortal?sslmode=require'
});

async function checkProjects() {
  try {
    const result = await pool.query('SELECT id, firebase_uid, project_data, created_at FROM projects ORDER BY created_at DESC LIMIT 10');
    console.log('Recent projects in database:');
    console.log('========================');
    result.rows.forEach(project => {
      const data = project.project_data;
      console.log(`ID: ${project.id}`);
      console.log(`Created: ${project.created_at}`);
      console.log(`User: ${project.firebase_uid}`);
      console.log(`Product: ${data?.details?.product || 'No product name'}`);
      console.log(`Status: ${data?.status || 'No status'}`);
      console.log(`Approval Status: ${data?.approvalStatus || 'No approval status'}`);
      console.log(`Type: ${data?.type || 'No type'}`);
      console.log('---');
    });
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkProjects();
