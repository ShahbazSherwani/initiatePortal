// Script to update missing is_individual_account field
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './src/server/.env' });

async function updateBorrowerAccountType() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const firebaseUid = 'hfAt4L2H4Pgzchk2Xcw15IKcMYJ2'; // Your Firebase UID

    // Check current status
    console.log('\n=== BEFORE UPDATE ===');
    const beforeResult = await client.query(`
      SELECT firebase_uid, full_name, is_individual_account 
      FROM borrower_profiles 
      WHERE firebase_uid = $1
    `, [firebaseUid]);
    
    if (beforeResult.rows.length > 0) {
      const profile = beforeResult.rows[0];
      console.log(`User: ${profile.full_name}`);
      console.log(`Firebase UID: ${profile.firebase_uid}`);
      console.log(`is_individual_account: ${profile.is_individual_account}`);
      console.log(`Account Type: ${profile.is_individual_account === true ? 'Individual' : profile.is_individual_account === false ? 'Company/MSME' : 'Not Set'}`);
    } else {
      console.log('No borrower profile found. Creating one...');
      
      // Create borrower profile with basic information
      const insertResult = await client.query(`
        INSERT INTO borrower_profiles 
        (firebase_uid, full_name, is_individual_account, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *
      `, [firebaseUid, 'Shahbaz Sherwani', true]);
      
      console.log('✅ Created borrower profile:', insertResult.rows[0]);
      
      console.log('\n=== AFTER CREATION ===');
      const afterResult = await client.query(`
        SELECT firebase_uid, full_name, is_individual_account 
        FROM borrower_profiles 
        WHERE firebase_uid = $1
      `, [firebaseUid]);
      
      if (afterResult.rows.length > 0) {
        const profile = afterResult.rows[0];
        console.log(`User: ${profile.full_name}`);
        console.log(`Firebase UID: ${profile.firebase_uid}`);
        console.log(`is_individual_account: ${profile.is_individual_account}`);
        console.log(`Account Type: ${profile.is_individual_account === true ? 'Individual' : profile.is_individual_account === false ? 'Company/MSME' : 'Not Set'}`);
      }
      
      return;
    }

    // Update the field to Individual (true)
    console.log('\n=== UPDATING ===');
    const updateResult = await client.query(`
      UPDATE borrower_profiles 
      SET is_individual_account = true, 
          updated_at = NOW()
      WHERE firebase_uid = $1
      RETURNING firebase_uid, full_name, is_individual_account
    `, [firebaseUid]);

    console.log('Update completed successfully');

    // Check after update
    console.log('\n=== AFTER UPDATE ===');
    if (updateResult.rows.length > 0) {
      const profile = updateResult.rows[0];
      console.log(`User: ${profile.full_name}`);
      console.log(`Firebase UID: ${profile.firebase_uid}`);
      console.log(`is_individual_account: ${profile.is_individual_account}`);
      console.log(`Account Type: ${profile.is_individual_account === true ? 'Individual' : profile.is_individual_account === false ? 'Company/MSME' : 'Not Set'}`);
    }

    console.log('\n✅ Successfully updated borrower account type to Individual');
    console.log('🔄 Please refresh your browser to see the changes');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

updateBorrowerAccountType();