// test-kyc-implementation.js
// Simple test to verify KYC implementation works

const testKYCEndpoint = async () => {
  console.log('🧪 Testing KYC Implementation...');
  
  // Test data for individual account
  const individualKYCData = {
    accountType: 'borrower',
    kycData: {
      isIndividualAccount: true,
      placeOfBirth: 'Manila, Philippines',
      gender: 'Male',
      civilStatus: 'Single',
      nationality: 'Filipino',
      contactEmail: 'test@example.com',
      secondaryIdType: 'Drivers License',
      secondaryIdNumber: 'A01-12-123456',
      emergencyContactName: 'John Doe',
      emergencyContactRelationship: 'Father',
      emergencyContactPhone: '+639123456789',
      emergencyContactEmail: 'emergency@example.com',
      isPoliticallyExposedPerson: false
    }
  };
  
  // Test data for business account
  const businessKYCData = {
    accountType: 'investor',
    kycData: {
      isIndividualAccount: false,
      businessRegistrationType: 'SEC',
      businessRegistrationNumber: 'CS201234567',
      businessRegistrationDate: '2020-01-15',
      corporateTin: '123-456-789-000',
      natureOfBusiness: 'Financial Services',
      principalOfficeStreet: '123 Business Ave',
      principalOfficeBarangay: 'Poblacion',
      principalOfficeMunicipality: 'Makati City',
      principalOfficeProvince: 'Metro Manila',
      principalOfficeCountry: 'Philippines',
      principalOfficePostalCode: '1200',
      gisTotalAssets: 10000000,
      gisTotalLiabilities: 2000000,
      gisPaidUpCapital: 5000000,
      gisNumberOfStockholders: 3,
      gisNumberOfEmployees: 25,
      isPoliticallyExposedPerson: false,
      authorizedSignatoryName: 'Jane Smith',
      authorizedSignatoryPosition: 'CEO',
      authorizedSignatoryIdType: 'Passport',
      authorizedSignatoryIdNumber: 'P1234567'
    }
  };
  
  console.log('📋 Individual Account Test Data:', individualKYCData);
  console.log('📋 Business Account Test Data:', businessKYCData);
  
  return {
    individualKYCData,
    businessKYCData,
    testInstructions: [
      '1. Start the development server: npm run start:dev',
      '2. Open browser to http://localhost:5173',
      '3. Navigate to /register',
      '4. Create a new account with test data',
      '5. Should redirect to /register-kyc automatically',
      '6. Test both Individual and Business account flows',
      '7. Verify data is saved in database',
      '8. Check server logs for any errors'
    ]
  };
};

// Database verification queries
const verificationQueries = {
  checkBorrowerKYC: `
    SELECT 
      firebase_uid,
      is_individual_account,
      place_of_birth,
      gender,
      civil_status,
      nationality,
      contact_email,
      emergency_contact_name,
      business_registration_type,
      corporate_tin,
      is_politically_exposed_person,
      is_complete,
      created_at
    FROM borrower_profiles 
    WHERE firebase_uid = $1;
  `,
  
  checkInvestorKYC: `
    SELECT 
      firebase_uid,
      is_individual_account,
      business_registration_number,
      nature_of_business,
      authorized_signatory_name,
      principal_office_municipality,
      gis_total_assets,
      is_complete,
      created_at
    FROM investor_profiles 
    WHERE firebase_uid = $1;
  `,
  
  checkUserFlags: `
    SELECT 
      firebase_uid,
      full_name,
      role,
      has_borrower_account,
      has_investor_account,
      current_account_type,
      has_completed_registration,
      updated_at
    FROM users 
    WHERE firebase_uid = $1;
  `
};

// Export for use in testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testKYCEndpoint,
    verificationQueries
  };
} else {
  // Browser environment
  window.testKYC = testKYCEndpoint;
  window.kycQueries = verificationQueries;
}

console.log('✅ KYC Test Setup Complete');
console.log('🔧 Run testKYCEndpoint() to see test data');
console.log('📊 Use verificationQueries to check database');

// Auto-run test setup
testKYCEndpoint().then(result => {
  console.log('🎯 KYC Implementation Ready for Testing!');
  console.log('📝 Follow these steps:');
  result.testInstructions.forEach(instruction => {
    console.log(`   ${instruction}`);
  });
});
