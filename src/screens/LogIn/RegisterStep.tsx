// src/screens/LogIn/RegisterStep.tsx
import React, { useState, useContext, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  UserIcon,
  CheckIcon,
  XIcon,
  RefreshCwIcon,
  CopyIcon,
} from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Testimonials } from "./Testimonials";
import { AuthContext } from "../../contexts/AuthContext";
import { LoadingSpinner, LoadingOverlay } from "../../components/ui/loading-spinner";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { upsertProfile, fetchProfile } from "../../lib/profile";
import { generateProfileCode } from "../../lib/profileUtils";

export const RegisterStep = (): JSX.Element => {
  const navigate = useNavigate();
  const { setProfile } = useContext(AuthContext)!;

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [termsChecked, setTermsChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

  // Common password check function
  const isCommonPassword = (pwd: string): boolean => {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'dragon',
      'master', 'login', 'passw0rd', 'football', 'baseball', 'princess'
    ];
    return commonPasswords.some(common => 
      pwd.toLowerCase().includes(common.toLowerCase())
    );
  };

  // Personal info check function
  const containsPersonalInfo = (pwd: string, name: string, emailAddr: string): boolean => {
    if (!pwd || pwd.length < 3) return false;
    
    const lowerPwd = pwd.toLowerCase();
    const nameParts = name.toLowerCase().split(' ').filter(part => part.length > 2);
    const emailLocal = emailAddr.split('@')[0]?.toLowerCase() || '';
    
    return nameParts.some(part => lowerPwd.includes(part)) || 
           (emailLocal.length > 2 && lowerPwd.includes(emailLocal));
  };

  // Password validation functions
  const passwordValidation = useMemo(() => {
    const checks = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password),
      noCommon: !isCommonPassword(password),
      noPersonal: !containsPersonalInfo(password, fullName, email),
    };

    const strength = Object.values(checks).filter(Boolean).length;
    let strengthText = 'Very Weak';
    let strengthColor = 'text-red-600';
    
    if (strength >= 7) {
      strengthText = 'Very Strong';
      strengthColor = 'text-green-600';
    } else if (strength >= 6) {
      strengthText = 'Strong';
      strengthColor = 'text-green-500';
    } else if (strength >= 4) {
      strengthText = 'Moderate';
      strengthColor = 'text-yellow-500';
    } else if (strength >= 2) {
      strengthText = 'Weak';
      strengthColor = 'text-orange-500';
    }

    return { checks, strength, strengthText, strengthColor };
  }, [password, fullName, email]);

  // Generate secure password function
  const generateSecurePassword = (): string => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let password = '';
    
    // Ensure at least one character from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest with random characters
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < 16; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword();
    setPassword(newPassword);
    setConfirm(newPassword);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy password');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    // Set up timer to show loading overlay after 1 second
    const loadingTimer = setTimeout(() => {
      setShowLoadingOverlay(true);
    }, 1000);

    if (!termsChecked) {
      setError("You must accept the terms.");
      clearTimeout(loadingTimer);
      setIsLoading(false);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      clearTimeout(loadingTimer);
      setIsLoading(false);
      return;
    }
    
    // Enhanced password validation - enforce strong security requirements
    if (password.length < 12) {
      setError("Password must be at least 12 characters long for security.");
      clearTimeout(loadingTimer);
      setIsLoading(false);
      return;
    }
    
    if (passwordValidation.strength < 6) {
      setError("Password is not strong enough. Please ensure it meets at least 6 out of 7 security requirements.");
      clearTimeout(loadingTimer);
      setIsLoading(false);
      return;
    }
    
    // Check for specific critical requirements
    if (!passwordValidation.checks.uppercase) {
      setError("Password must contain at least one uppercase letter (A-Z).");
      clearTimeout(loadingTimer);
      setIsLoading(false);
      return;
    }
    
    if (!passwordValidation.checks.lowercase) {
      setError("Password must contain at least one lowercase letter (a-z).");
      clearTimeout(loadingTimer);
      setIsLoading(false);
      return;
    }
    
    if (!passwordValidation.checks.numbers) {
      setError("Password must contain at least one number (0-9).");
      clearTimeout(loadingTimer);
      setIsLoading(false);
      return;
    }
    
    if (!passwordValidation.checks.symbols) {
      setError("Password must contain at least one special character (!@#$%^&*).");
      clearTimeout(loadingTimer);
      setIsLoading(false);
      return;
    }
    
    if (!passwordValidation.checks.noCommon) {
      setError("Password is too common. Please choose a more unique password.");
      clearTimeout(loadingTimer);
      setIsLoading(false);
      return;
    }
    
    if (!passwordValidation.checks.noPersonal) {
      setError("Password cannot contain your name or email. Please choose a different password.");
      clearTimeout(loadingTimer);
      setIsLoading(false);
      return;
    }
    try {
      // 1) create user
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      localStorage.setItem("fb_token", idToken);
    
      // 2) upsert + fetch
      await upsertProfile(idToken, fullName);
      const prof = await fetchProfile(idToken);
    
      // 3) populate context + navigate - set complete profile data
      setProfile({ 
        id: cred.user.uid,
        email: cred.user.email,
        name: prof.full_name, 
        role: prof.role || null,
        joined: prof.created_at,
        hasCompletedRegistration: prof.has_completed_registration || false,
        isAdmin: prof.is_admin || false,
        profileCode: generateProfileCode(cred.user.uid)
      });
      
      // Navigate to KYC form instead of directly to borrow page
      navigate("/register-kyc", { state: { accountType: 'borrower' } });
    } catch (err: any) {
      // Handle Firebase authentication errors with user-friendly messages
      if (err.code === "auth/email-already-in-use") {
        setError("That email is already registered. Please log in instead.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please use at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection and try again.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        // Generic fallback for any other errors
        setError("Registration failed. Please check your information and try again.");
      }
    } finally {
      // Clear timer and reset loading states
      clearTimeout(loadingTimer);
      setIsLoading(false);
      setShowLoadingOverlay(false);
    }
  };

  return (
    <div className="bg-white min-h-screen w-full relative overflow-hidden">
    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-20 py-0">

      <form
        onSubmit={handleSubmit}
        className="relative z-10 mx-auto max-w-2xl px-0 py-10 space-y-6"
      >
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </Button>

        <h1 className="text-3xl font-bold font-poppins mb-2">Register a New Account</h1>
        <p className="text-sm mb-6">
          Enter your details to create your account
        </p>

        {/* Email */}
        <div>
          <label className="block mb-1 font-medium">Email Address</label>
          <div className="relative">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              placeholder="Enter your email"
              className="h-[58px] rounded-2xl border border-black pl-12 pr-4 w-full disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block mb-1 font-medium">Full Name</label>
          <div className="relative">
            <Input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              placeholder="Enter your name"
              className="h-[58px] rounded-2xl border border-black pl-12 pr-4 w-full disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="font-medium block mb-1">Password</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="Create a strong password"
              className="h-[58px] rounded-2xl border border-black pl-12 pr-16 w-full disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                type="button"
                className="w-8 h-8"
                onClick={handleGeneratePassword}
                title="Generate secure password"
              >
                <RefreshCwIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                className="w-8 h-8"
                onClick={() => setShowPassword((p) => !p)}
              >
                {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Password Strength:</span>
                <span className={`text-sm font-medium ${passwordValidation.strengthColor}`}>
                  {passwordValidation.strengthText}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    passwordValidation.strength >= 7 ? 'bg-[#0C4B20]' :
                    passwordValidation.strength >= 6 ? 'bg-[#98B813]' :
                    passwordValidation.strength >= 4 ? 'bg-yellow-500' :
                    passwordValidation.strength >= 2 ? 'bg-orange-500' : 'bg-red-600'
                  }`}
                  style={{ width: `${(passwordValidation.strength / 7) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Password Requirements - Always Visible */}
          <div className="mt-3 p-4 bg-white-50 rounded-xl border border-[#0C4B20]">
            <h4 className="font-medium text-[#0C4B20] mb-2">Password Security Requirements:</h4>
            <div className="grid grid-cols-1 gap-1 text-sm ">
              {[
                { key: 'length', text: 'At least 12 characters long' },
                { key: 'uppercase', text: 'Contains uppercase letters (A-Z)' },
                { key: 'lowercase', text: 'Contains lowercase letters (a-z)' },
                { key: 'numbers', text: 'Contains numbers (0-9)' },
                { key: 'symbols', text: 'Contains special characters (!@#$%^&*)' },
                { key: 'noCommon', text: 'Not a common password' },
                { key: 'noPersonal', text: 'Does not contain personal information' },
              ].map(({ key, text }) => (
                <div key={key} className="flex items-center gap-2">
                  {passwordValidation.checks[key as keyof typeof passwordValidation.checks] ? (
                    <CheckIcon className="w-4 h-4 text-[#0C4B20]" />
                  ) : (
                    <XIcon className="w-4 h-4 text-red-500" />
                  )}
                  <span className={passwordValidation.checks[key as keyof typeof passwordValidation.checks] ? 'text-[#0C4B20]' : 'text-red-500'}>
                    {text}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-3 pt-3 border-t border-blue-200">
              <Button
                type="button"
                onClick={handleGeneratePassword}
                className="w-full bg-[#0C4B20] hover:bg-[#8FB200] text-white py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <RefreshCwIcon className="w-4 h-4" />
                Generate Secure Password
              </Button>
              {password && passwordValidation.strength >= 6 && (
                <Button
                  type="button"
                  onClick={() => copyToClipboard(password)}
                  variant="outline"
                  className="w-full mt-2 py-2 rounded-lg flex items-center justify-center gap-2"
                >
                  <CopyIcon className="w-4 h-4" />
                  Copy Password
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block mb-1 font-medium">Re-type Password</label>
          <div className="relative">
            <Input
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={isLoading}
              placeholder="Confirm password"
              className={`h-[58px] rounded-2xl border pl-12 pr-12 w-full disabled:opacity-50 disabled:cursor-not-allowed ${
                confirm && password ? 
                  (password === confirm ? 'border-green-500' : 'border-red-500') 
                  : 'border-black'
              }`}
            />
            <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {confirm && password && (
                <div className="mr-1">
                  {password === confirm ? (
                    <CheckIcon className="w-4 h-4 text-green-600" />
                  ) : (
                    <XIcon className="w-4 h-4 text-red-500" />
                  )}
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                type="button"
                className="w-8 h-8"
                onClick={() => setShowConfirm((p) => !p)}
              >
                {showConfirm ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          {confirm && password && password !== confirm && (
            <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
          )}
          {confirm && password && password === confirm && (
            <p className="text-[#0C4B20] text-sm mt-1">Passwords match</p>
          )}
        </div>

        {/* Terms & Conditions */}
        <div className="flex items-center">
          <Checkbox
            checked={termsChecked}
            onCheckedChange={(checked) => setTermsChecked(checked === true)}
            disabled={isLoading}
            className="mr-2"
          />
          <label className="text-sm">
            I agree to Investie’s{" "}
            <Link to="#" className="underline text-[#203863]">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link to="#" className="underline text-[#203863]">
              Privacy Policy
            </Link>
          </label>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Password Requirements Status */}
        {password && (
          <div className="mb-4 p-3 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Security Requirements:</span>
              <span className={`text-sm ${passwordValidation.strength >= 6 ? 'text-[#0C4B20]' : 'text-red-500'}`}>
                {passwordValidation.strength}/7 met
              </span>
            </div>
            {passwordValidation.strength < 6 && (
              <p className="text-sm text-amber-600">
                Complete at least 6 requirements to register with a secure password.
              </p>
            )}
            {passwordValidation.strength >= 6 && (
              <p className="text-sm text-[#0C4B20]">
                ✅ Password meets security requirements!
              </p>
            )}
          </div>
        )}

        {/* Register Button & Social */}
        <div className="flex flex-col md:flex-row md:items-center md:gap-4">
          <Button
            type="submit"
            disabled={!password || !confirm || password !== confirm || passwordValidation.strength < 6 || !termsChecked || isLoading}
            className={`w-full md:w-[266px] h-[58px] rounded-2xl text-white font-medium transition-all ${
              password && confirm && password === confirm && passwordValidation.strength >= 6 && termsChecked && !isLoading
                ? 'bg-[#0C4B20] hover:bg-[#8FB200]'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" className="text-white" />
                <span>Creating Account...</span>
              </div>
            ) : (
              <>
                {!password || !confirm || password !== confirm || passwordValidation.strength < 6 || !termsChecked
                  ? 'Complete Requirements to Register'
                  : 'Register'
                }
              </>
            )}
          </Button>
          <span className="mx-4 md:mx-2 text-center p-5 md:p-0">or</span>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="w-full md:w-[107px] h-[58px] bg-[#ebeaea] rounded-2xl border-none"
            >
              <img
                src="/image-3.png"
                alt="Google sign in"
                className="w-[33px] h-[34px] object-cover"
              />
            </Button>
            <Button
              variant="outline"
              className="w-full md:w-[107px] h-[58px] bg-[#ebeaea] rounded-2xl border-none"
            >
              <img
                src="/image-6.png"
                alt="Facebook sign in"
                className="w-[33px] h-[34px] object-cover"
              />
            </Button>
          </div>
        </div>

        <p className="text-center md:text-right text-sm mt-6">
          Already a member?{" "}
          <Link to="/" className="text-[#0C4B20] font-semibold">
            Sign In
          </Link>
        </p>
      </form>
</div>
    <div className="flex items-center justify-center">

          <Testimonials />
    </div>

      <LoadingOverlay 
        show={showLoadingOverlay} 
        message="Creating your account..." 
      />

      {/* <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease forwards;
        }
        @keyframes slideIn {
          from { transform: translateX(100px) rotate(-30deg); opacity: 0; }
          to { transform: translateX(0) rotate(-30deg); opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 1s ease-out forwards;
        }
      `}</style> */}
    </div>
  );
};
