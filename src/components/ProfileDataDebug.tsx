import React, { useEffect, useState } from 'react';
import { getUserProfile } from '../lib/api';

export const ProfileDataDebug: React.FC = () => {
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testApiCall = async () => {
      try {
        console.log('🔍 Testing getUserProfile API call...');
        const response = await getUserProfile();
        console.log('📦 Raw API Response:', response);
        setApiResponse(response);
      } catch (error) {
        console.error('❌ API Call failed:', error);
        setApiResponse({ error: String(error) });
      } finally {
        setLoading(false);
      }
    };

    testApiCall();
  }, []);

  if (loading) {
    return <div>Loading debug data...</div>;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '2px solid red', 
      padding: '10px', 
      maxWidth: '400px', 
      maxHeight: '300px', 
      overflow: 'auto', 
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <h3>Profile API Debug</h3>
      <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
    </div>
  );
};