import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '../config/environment';

export const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'validating' | 'valid' | 'invalid' | 'resetting' | 'success' | 'error'>('validating');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  // Password strength validation
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    strength: 0
  });

  useEffect(() => {
    validateToken();
  }, [token]);

  useEffect(() => {
    if (password) {
      const checks = {
        length: password.length >= 12,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      };
      
      const strength = Object.values(checks).filter(Boolean).length;
      
      setPasswordValidation({
        ...checks,
        strength
      });
    }
  }, [password]);

  const validateToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/validate-reset-token/${token}`);
      const data = await response.json();

      if (response.ok) {
        setStatus('valid');
        setEmail(data.email);
      } else {
        setStatus('invalid');
        setMessage(data.error || 'Invalid or expired reset link');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setStatus('invalid');
      setMessage('An error occurred while validating the reset link');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 12) {
      setError('Password must be at least 12 characters long');
      return;
    }

    if (passwordValidation.strength < 4) {
      setError('Password is too weak. Please include uppercase, lowercase, numbers, and special characters.');
      return;
    }

    try {
      setStatus('resetting');
      
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          newPassword: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Your password has been reset successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setStatus('error');
      setMessage('An error occurred while resetting your password');
    }
  };

  const getStrengthColor = () => {
    if (passwordValidation.strength <= 2) return 'bg-red-500';
    if (passwordValidation.strength <= 3) return 'bg-yellow-500';
    if (passwordValidation.strength <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordValidation.strength <= 2) return 'Weak';
    if (passwordValidation.strength <= 3) return 'Fair';
    if (passwordValidation.strength <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            {status === 'validating' && (
              <RefreshCw className="w-16 h-16 text-blue-600 animate-spin" />
            )}
            {status === 'valid' && (
              <div className="bg-blue-100 rounded-full p-4">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            )}
            {status === 'invalid' && (
              <XCircle className="w-16 h-16 text-red-600" />
            )}
            {status === 'resetting' && (
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
            {status === 'validating' && 'Validating Reset Link...'}
            {status === 'valid' && 'Reset Your Password'}
            {status === 'invalid' && 'Invalid Reset Link'}
            {status === 'resetting' && 'Resetting Password...'}
            {status === 'success' && 'Password Reset Successful!'}
            {status === 'error' && 'Reset Failed'}
          </h1>

          {status === 'invalid' && (
            <div className="space-y-4">
              <p className="text-gray-600 text-center">{message}</p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  This reset link is invalid or has expired. Password reset links are valid for 1 hour.
                </p>
              </div>
              <button
                onClick={() => navigate('/forgot-password')}
                className="w-full bg-[#0C4B20] text-white py-3 rounded-lg font-semibold hover:bg-[#0A3D1A] transition-colors"
              >
                Request New Reset Link
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Back to Login
              </button>
            </div>
          )}

          {status === 'valid' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Resetting password for: <strong>{email}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4B20] focus:border-transparent"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {password && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Password Strength:</span>
                      <span className={`text-xs font-semibold ${
                        passwordValidation.strength <= 2 ? 'text-red-600' :
                        passwordValidation.strength <= 3 ? 'text-yellow-600' :
                        passwordValidation.strength <= 4 ? 'text-blue-600' :
                        'text-green-600'
                      }`}>
                        {getStrengthText()}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${(passwordValidation.strength / 5) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs space-y-1">
                      <div className={passwordValidation.length ? 'text-green-600' : 'text-gray-500'}>
                        {passwordValidation.length ? '✓' : '○'} At least 12 characters
                      </div>
                      <div className={passwordValidation.uppercase ? 'text-green-600' : 'text-gray-500'}>
                        {passwordValidation.uppercase ? '✓' : '○'} One uppercase letter
                      </div>
                      <div className={passwordValidation.lowercase ? 'text-green-600' : 'text-gray-500'}>
                        {passwordValidation.lowercase ? '✓' : '○'} One lowercase letter
                      </div>
                      <div className={passwordValidation.number ? 'text-green-600' : 'text-gray-500'}>
                        {passwordValidation.number ? '✓' : '○'} One number
                      </div>
                      <div className={passwordValidation.special ? 'text-green-600' : 'text-gray-500'}>
                        {passwordValidation.special ? '✓' : '○'} One special character
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4B20] focus:border-transparent"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'resetting' || passwordValidation.strength < 4}
                className="w-full bg-[#0C4B20] text-white py-3 rounded-lg font-semibold hover:bg-[#0A3D1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'resetting' ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <p className="text-gray-600 text-center">{message}</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-sm text-green-800">
                  ✅ Redirecting to login page...
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
              <p className="text-gray-600 text-center">{message}</p>
              <button
                onClick={() => setStatus('valid')}
                className="w-full bg-[#0C4B20] text-white py-3 rounded-lg font-semibold hover:bg-[#0A3D1A] transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/forgot-password')}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Request New Reset Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
