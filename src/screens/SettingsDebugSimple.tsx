import { useEffect, useState } from 'react';
import { getUserProfile } from "../lib/api";

const SettingsDebugSimple = () => {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log('🧪 Testing getUserProfile API...');
        const response = await getUserProfile();
        console.log('📦 Full API Response:', response);
        
        if (response.success && response.profile) {
          console.log('✅ Profile loaded successfully');
          console.log('👤 Personal Info:', response.profile.personalInfo);
          console.log('🏛️ Bank Account:', response.profile.bankAccount);
          console.log('🎯 Account Type:', response.profile.accountType);
          console.log('🔍 accountType check:', response.profile.accountType?.toLowerCase() === 'individual');
          
          setProfileData(response.profile);
        }
      } catch (err) {
        console.error('❌ API Error:', err);
      } finally {
        setLoading(false);
      }
    };

    testAPI();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!profileData) return <div className="p-4">No data</div>;

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Settings Data Debug</h1>
      
      <div className="bg-yellow-100 p-4 rounded">
        <h2 className="text-lg font-semibold">Account Type Check</h2>
        <p>accountType: "{profileData.accountType}"</p>
        <p>toLowerCase(): "{profileData.accountType?.toLowerCase()}"</p>
        <p>Is Individual: {profileData.accountType?.toLowerCase() === 'individual' ? '✅ YES' : '❌ NO'}</p>
      </div>

      <div className="bg-blue-100 p-4 rounded">
        <h2 className="text-lg font-semibold">Personal Info Values</h2>
        <p>placeOfBirth: "{profileData.personalInfo?.placeOfBirth}"</p>
        <p>gender: "{profileData.personalInfo?.gender}"</p>
        <p>civilStatus: "{profileData.personalInfo?.civilStatus}"</p>
        <p>nationality: "{profileData.personalInfo?.nationality}"</p>
      </div>

      <div className="bg-green-100 p-4 rounded">
        <h2 className="text-lg font-semibold">Bank Account Values</h2>
        <p>bankName: "{profileData.bankAccount?.bankName}"</p>
        <p>accountType: "{profileData.bankAccount?.accountType}"</p>
        <p>accountNumber: "{profileData.bankAccount?.accountNumber}"</p>
        <p>accountName: "{profileData.bankAccount?.accountName}"</p>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold">Form Field Tests</h2>
        <div className="space-y-2">
          <div>
            <label className="block font-medium">Place of Birth:</label>
            <input 
              type="text" 
              value={profileData.personalInfo?.placeOfBirth || ""} 
              className="w-full p-2 border rounded"
              readOnly
            />
          </div>
          <div>
            <label className="block font-medium">Bank Name:</label>
            <input 
              type="text" 
              value={profileData.bankAccount?.bankName || ""} 
              className="w-full p-2 border rounded"
              readOnly
            />
          </div>
        </div>
      </div>

      <details className="bg-red-50 p-4 rounded">
        <summary className="font-semibold cursor-pointer">Raw Profile Data</summary>
        <pre className="text-xs mt-2 overflow-auto max-h-64">
          {JSON.stringify(profileData, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default SettingsDebugSimple;