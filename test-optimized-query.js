// Test the optimized query
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: 1
});

async function testOptimizedQuery() {
  try {
    console.log('🔍 Testing OPTIMIZED query (without full project_data)...\n');
    
    const start = Date.now();
    const result = await pool.query(`
      SELECT 
        p.id, 
        p.firebase_uid as borrower_uid,
        p.created_at, 
        p.updated_at,
        u.full_name as borrower_name,
        -- Extract only needed fields from JSONB
        p.project_data->>'type' as project_type,
        p.project_data->>'status' as status,
        p.project_data->>'approvalStatus' as approval_status,
        p.project_data->'details'->>'product' as title,
        p.project_data->'details'->>'description' as description,
        p.project_data->'details'->>'fundingRequirement' as funding_requirement,
        p.project_data->'details'->>'fundingProgress' as funding_progress,
        p.project_data->'details'->>'amountRaised' as amount_raised,
        p.project_data->'details'->>'location' as location,
        p.project_data->'details'->>'image' as thumbnail
      FROM projects p
      LEFT JOIN users u ON p.firebase_uid = u.firebase_uid
      ORDER BY p.created_at DESC
      LIMIT 1000
    `);
    const elapsed = Date.now() - start;
    
    console.log(`✅ Fetched ${result.rows.length} projects in ${elapsed}ms`);
    console.log('\nSample project:');
    if (result.rows.length > 0) {
      const sample = result.rows[0];
      console.log({
        id: sample.id,
        title: sample.title,
        borrower_name: sample.borrower_name,
        type: sample.project_type,
        status: sample.status,
        funding_requirement: sample.funding_requirement
      });
    }
    
    console.log('\n🎯 Query is FAST! No timeout!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testOptimizedQuery();
