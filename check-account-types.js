// Test script to check account types in database
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './src/server/.env' });

async function checkAccountTypes() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check users table account types
    console.log('\n=== USERS TABLE - Account Types ===');
    const userAccountTypes = await client.query(`
      SELECT firebase_uid, full_name, current_account_type, has_borrower_account, has_investor_account 
      FROM users 
      WHERE firebase_uid IS NOT NULL 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    userAccountTypes.rows.forEach(user => {
      console.log(`User: ${user.full_name || 'No name'}`);
      console.log(`  Firebase UID: ${user.firebase_uid}`);
      console.log(`  Current Account Type: ${user.current_account_type || 'Not set'}`);
      console.log(`  Has Borrower: ${user.has_borrower_account}`);
      console.log(`  Has Investor: ${user.has_investor_account}`);
      console.log('---');
    });

    // Check borrower profiles account types
    console.log('\n=== BORROWER PROFILES - Individual Account Status ===');
    const borrowerProfiles = await client.query(`
      SELECT bp.firebase_uid, u.full_name, bp.is_individual_account, bp.business_registration_type, bp.nature_of_business
      FROM borrower_profiles bp
      LEFT JOIN users u ON bp.firebase_uid = u.firebase_uid
      ORDER BY bp.created_at DESC 
      LIMIT 10
    `);
    
    borrowerProfiles.rows.forEach(profile => {
      console.log(`Borrower: ${profile.full_name || 'No name'}`);
      console.log(`  Firebase UID: ${profile.firebase_uid}`);
      console.log(`  Is Individual Account: ${profile.is_individual_account}`);
      console.log(`  Account Type: ${profile.is_individual_account ? 'Individual' : 'Company/MSME'}`);
      console.log(`  Business Registration: ${profile.business_registration_type || 'N/A'}`);
      console.log(`  Nature of Business: ${profile.nature_of_business || 'N/A'}`);
      console.log('---');
    });

    // Check projects with creator account types
    console.log('\n=== PROJECTS WITH CREATOR ACCOUNT TYPES ===');
    const projectsWithAccountTypes = await client.query(`
      SELECT p.id, p.project_data->>'details'->>'product' as product_name, 
             u.full_name as creator_name, bp.is_individual_account as creator_is_individual
      FROM projects p
      LEFT JOIN users u ON p.firebase_uid = u.firebase_uid
      LEFT JOIN borrower_profiles bp ON p.firebase_uid = bp.firebase_uid
      WHERE p.project_data->>'status' = 'published'
      ORDER BY p.created_at DESC 
      LIMIT 10
    `);
    
    projectsWithAccountTypes.rows.forEach(project => {
      console.log(`Project: ${project.product_name || 'No name'}`);
      console.log(`  Creator: ${project.creator_name || 'Unknown'}`);
      console.log(`  Creator Account Type: ${project.creator_is_individual === true ? 'Individual' : project.creator_is_individual === false ? 'Company/MSME' : 'Unknown'}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkAccountTypes();