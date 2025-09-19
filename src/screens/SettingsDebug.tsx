import React, { useEffect, useState } from 'react';

const SettingsDebug = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testSettingsAPI = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        console.log('🧪 Testing Settings API...');
        
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/settings/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📦 Full API Response:', data);
        
        if (data.success && data.profile) {
          console.log('✅ Profile Data:', data.profile);
          console.log('👤 Personal Info:', data.profile.personalInfo);
          console.log('🏛️ Bank Account:', data.profile.bankAccount);
          console.log('🎯 Account Type:', data.profile.accountType);
          console.log('✅ Should show individual fields?', data.profile.accountType?.toLowerCase() === 'individual');
          
          setProfileData(data.profile);
        } else {
          setError('API returned invalid data structure');
        }
      } catch (err) {
        console.error('❌ API Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    testSettingsAPI();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!profileData) return <div className="p-4">No data received</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Settings API Debug</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold">Account Type</h2>
        <p>Value: "{profileData.accountType}"</p>
        <p>Is Individual: {profileData.accountType?.toLowerCase() === 'individual' ? 'YES' : 'NO'}</p>
      </div>

      <div className="bg-blue-100 p-4 rounded">
        <h2 className="text-lg font-semibold">Personal Info</h2>
        <pre>{JSON.stringify(profileData.personalInfo, null, 2)}</pre>
      </div>

      <div className="bg-green-100 p-4 rounded">
        <h2 className="text-lg font-semibold">Bank Account</h2>
        <pre>{JSON.stringify(profileData.bankAccount, null, 2)}</pre>
      </div>

      <div className="bg-yellow-100 p-4 rounded">
        <h2 className="text-lg font-semibold">Should Show Individual Fields?</h2>
        <p className="text-2xl">{profileData.accountType?.toLowerCase() === 'individual' ? '✅ YES' : '❌ NO'}</p>
      </div>

      {profileData.accountType?.toLowerCase() === 'individual' && (
        <div className="bg-green-200 p-4 rounded border-2 border-green-500">
          <h2 className="text-lg font-semibold">Individual Fields Test</h2>
          <div className="space-y-2">
            <div>
              <label className="font-medium">Place of Birth:</label>
              <input 
                type="text" 
                value={profileData.personalInfo?.placeOfBirth || ''} 
                className="ml-2 p-1 border rounded"
                readOnly
              />
            </div>
            <div>
              <label className="font-medium">Gender:</label>
              <input 
                type="text" 
                value={profileData.personalInfo?.gender || ''} 
                className="ml-2 p-1 border rounded"
                readOnly
              />
            </div>
            <div>
              <label className="font-medium">Civil Status:</label>
              <input 
                type="text" 
                value={profileData.personalInfo?.civilStatus || ''} 
                className="ml-2 p-1 border rounded"
                readOnly
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-200 p-4 rounded">
        <h2 className="text-lg font-semibold">Full Profile Data</h2>
        <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(profileData, null, 2)}</pre>
      </div>
    </div>
  );
};

export default SettingsDebug;