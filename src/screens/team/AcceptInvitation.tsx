import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../../lib/api';
import { CheckCircleIcon, XCircleIcon, Loader2Icon } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const AcceptInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    acceptInvitation();
  }, [token]);

  const acceptInvitation = async () => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid invitation link');
      return;
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/team/accept-invitation/${token}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to accept invitation');
      }

      setStatus('success');
      setMessage('Invitation accepted successfully!');
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/owner/dashboard');
      }, 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to accept invitation');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0C4B20] to-[#8FB200] p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2Icon className="w-16 h-16 text-[#0C4B20] mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Processing Invitation
              </h2>
              <p className="text-gray-600">
                Please wait while we verify your invitation...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to the Team! 🎉
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">
                Redirecting you to the dashboard...
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/owner/dashboard')}
                  className="inline-flex items-center px-6 py-3 bg-[#0C4B20] text-white rounded-lg hover:bg-[#0A3D1A] transition-colors font-medium"
                >
                  Go to Dashboard Now
                </button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircleIcon className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Invitation Error
              </h2>
              <p className="text-red-600 mb-4">{message}</p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Common Issues:
                </h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Invitation may have expired (7 days limit)</li>
                  <li>You need to log in with the invited email address</li>
                  <li>Invitation may have already been accepted</li>
                  <li>Link may be invalid or incomplete</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Back to Login
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-6 py-3 bg-[#0C4B20] text-white rounded-lg hover:bg-[#0A3D1A] transition-colors font-medium"
                >
                  Try Again
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>Need help? Contact your team administrator</p>
        </div>
      </div>
    </div>
  );
};
