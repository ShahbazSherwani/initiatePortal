// Script to check all users' account type status
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './src/server/.env' });

async function checkAllUsersAccountTypes() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    console.log('\n🔍 SCANNING ALL USER ACCOUNT TYPES\n');
    console.log('=' .repeat(80));

    // Check borrower profiles
    console.log('\n📋 BORROWER PROFILES ANALYSIS:');
    const borrowerQuery = `
      SELECT 
        firebase_uid, 
        full_name, 
        is_individual_account,
        created_at
      FROM borrower_profiles 
      ORDER BY created_at DESC
    `;
    
    const borrowerResult = await client.query(borrowerQuery);
    console.log(`\nTotal borrower profiles: ${borrowerResult.rows.length}`);
    
    let borrowerMissing = 0;
    let borrowerIndividual = 0;
    let borrowerBusiness = 0;
    
    borrowerResult.rows.forEach((profile, index) => {
      const accountType = profile.is_individual_account === true ? 'Individual' : 
                         profile.is_individual_account === false ? 'Business' : 'NOT SET';
      
      console.log(`${index + 1}. ${profile.full_name}`);
      console.log(`   UID: ${profile.firebase_uid}`);
      console.log(`   Account Type: ${accountType}`);
      console.log(`   Created: ${profile.created_at}`);
      console.log('');
      
      if (profile.is_individual_account === null || profile.is_individual_account === undefined) {
        borrowerMissing++;
      } else if (profile.is_individual_account === true) {
        borrowerIndividual++;
      } else {
        borrowerBusiness++;
      }
    });
    
    // Check investor profiles
    console.log('\n💼 INVESTOR PROFILES ANALYSIS:');
    const investorQuery = `
      SELECT 
        firebase_uid, 
        full_name, 
        is_individual_account,
        created_at
      FROM investor_profiles 
      ORDER BY created_at DESC
    `;
    
    const investorResult = await client.query(investorQuery);
    console.log(`\nTotal investor profiles: ${investorResult.rows.length}`);
    
    let investorMissing = 0;
    let investorIndividual = 0;
    let investorBusiness = 0;
    
    investorResult.rows.forEach((profile, index) => {
      const accountType = profile.is_individual_account === true ? 'Individual' : 
                         profile.is_individual_account === false ? 'Business' : 'NOT SET';
      
      console.log(`${index + 1}. ${profile.full_name}`);
      console.log(`   UID: ${profile.firebase_uid}`);
      console.log(`   Account Type: ${accountType}`);
      console.log(`   Created: ${profile.created_at}`);
      console.log('');
      
      if (profile.is_individual_account === null || profile.is_individual_account === undefined) {
        investorMissing++;
      } else if (profile.is_individual_account === true) {
        investorIndividual++;
      } else {
        investorBusiness++;
      }
    });

    // Summary
    console.log('\n📊 SUMMARY REPORT:');
    console.log('=' .repeat(50));
    console.log('\n👤 BORROWER PROFILES:');
    console.log(`   ✅ Individual accounts: ${borrowerIndividual}`);
    console.log(`   🏢 Business accounts: ${borrowerBusiness}`);
    console.log(`   ❌ Missing account type: ${borrowerMissing}`);
    console.log(`   📊 Total: ${borrowerResult.rows.length}`);
    
    console.log('\n💼 INVESTOR PROFILES:');
    console.log(`   ✅ Individual accounts: ${investorIndividual}`);
    console.log(`   🏢 Business accounts: ${investorBusiness}`);
    console.log(`   ❌ Missing account type: ${investorMissing}`);
    console.log(`   📊 Total: ${investorResult.rows.length}`);
    
    const totalMissing = borrowerMissing + investorMissing;
    const totalProfiles = borrowerResult.rows.length + investorResult.rows.length;
    
    console.log('\n🚨 OVERALL STATUS:');
    console.log(`   Total profiles: ${totalProfiles}`);
    console.log(`   Missing account types: ${totalMissing}`);
    console.log(`   Completion rate: ${((totalProfiles - totalMissing) / totalProfiles * 100).toFixed(1)}%`);
    
    if (totalMissing > 0) {
      console.log('\n⚠️  ACTION REQUIRED:');
      console.log(`   ${totalMissing} profiles need account type updates`);
      
      // List specific users that need fixing
      console.log('\n🔧 USERS NEEDING FIXES:');
      
      if (borrowerMissing > 0) {
        console.log('\n📋 Borrower profiles to fix:');
        borrowerResult.rows.forEach((profile, index) => {
          if (profile.is_individual_account === null || profile.is_individual_account === undefined) {
            console.log(`   • ${profile.full_name} (${profile.firebase_uid})`);
          }
        });
      }
      
      if (investorMissing > 0) {
        console.log('\n💼 Investor profiles to fix:');
        investorResult.rows.forEach((profile, index) => {
          if (profile.is_individual_account === null || profile.is_individual_account === undefined) {
            console.log(`   • ${profile.full_name} (${profile.firebase_uid})`);
          }
        });
      }
    } else {
      console.log('\n✅ ALL PROFILES HAVE ACCOUNT TYPES SET!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

// Run the check
checkAllUsersAccountTypes().catch(console.error);