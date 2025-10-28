import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export const EmailVerificationPending: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [resending, setResending] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // REMOVED: Auto-polling completely removed to prevent page refreshing and Firebase quota exceeded
  // Users must click the verification link in their email
  // If they want to check status, they can manually refresh the page or click "Resend Email"
  
  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    try {
      setResending(true);
      setError('');
      setSuccess('');
      
      const data = await authFetch(`${API_BASE_URL}/resend-verification-email`, {
        method: 'POST'
      });

      if (data.success || data.message) {
        setSuccess(data.message || 'Verification email sent! Please check your inbox.');
        
        // Start 5-minute countdown
        setCanResend(false);
        setCountdown(300); // 5 minutes in seconds
        
        const interval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setCanResend(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.error || 'Failed to resend email');
      }

    } catch (error: any) {
      setError(error.message || 'Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBackToLogin = async () => {
    try {
      // Sign out the user from Firebase
      await signOut(auth);
      // Navigate to login page
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      // Navigate anyway even if signout fails
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 rounded-full p-4">
              <Mail className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-4">
            Verify Your Email
          </h1>

          <div className="space-y-6">
            <div>
              <p className="text-gray-600 text-center mb-2">
                We've sent a verification email to:
              </p>
              <p className="font-semibold text-lg text-center text-[#0C4B20]">
                {profile?.email}
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 font-semibold mb-2">
                Next Steps:
              </p>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Check your inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>Complete your registration</li>
              </ol>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 font-semibold mb-2">
                📧 Email in spam folder?
              </p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Search for "admin@initiateph.com"</li>
                <li>Mark the email as "Not Spam"</li>
                <li>Add sender to your contacts</li>
              </ul>
            </div>

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700 text-center">{success}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700 text-center">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={!canResend || resending}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors ${
                  !canResend || resending
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {resending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : !canResend ? (
                  <>Resend in {formatTime(countdown)}</>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Resend Verification Email
                  </>
                )}
              </button>

              <button
                onClick={handleBackToLogin}
                className="w-full text-gray-600 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Back to Login
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-6">
              Didn't receive the email? Check your spam folder or contact{' '}
              <a 
                href="mailto:support@initiate.ph" 
                className="text-blue-600 hover:underline"
              >
                support@initiate.ph
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
