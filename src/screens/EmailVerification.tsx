import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config/environment';

export const EmailVerification: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      // Fixed: API_BASE_URL already includes /api, so don't add it again
      const response = await fetch(`${API_BASE_URL}/verify-email/${token}`);
      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Your email has been verified successfully! You can now log in to your account.');
        setEmail(data.email);
        
        // No automatic redirect - let user click the login button
      } else {
        setStatus('error');
        setMessage(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('An error occurred during verification');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            {status === 'verifying' && (
              <RefreshCw className="w-16 h-16 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-16 h-16 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="w-16 h-16 text-red-600" />
            )}
          </div>

          <h1 className="text-2xl font-bold text-center mb-4">
            {status === 'verifying' && 'Verifying Your Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h1>

          <p className="text-gray-600 text-center mb-6">{message}</p>
          
          {status === 'success' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 text-center">
                Email: <strong>{email}</strong>
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-sm text-green-800">
                  ✅ You can now log in with your credentials
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-[#0C4B20] text-white py-3 rounded-lg font-semibold hover:bg-[#0A3D1A] transition-colors"
              >
                Continue to Login
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <button
                onClick={() => navigate('/verification-pending')}
                className="w-full bg-[#0C4B20] text-white py-3 rounded-lg font-semibold hover:bg-[#0A3D1A] transition-colors"
              >
                Request New Verification Link
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Go to Login
              </button>
              <p className="text-xs text-gray-500 text-center">
                Need help? Contact{' '}
                <a href="mailto:support@initiate.ph" className="text-blue-600 hover:underline">
                  support@initiate.ph
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
