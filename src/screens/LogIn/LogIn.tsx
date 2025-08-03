import React, { useState, useContext } from "react";
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon
} from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Navbar } from "../../components/Navigation/navbar";
import { Link, useNavigate } from "react-router-dom";
import { Testimonials } from "../../screens/LogIn/Testimonials";
import { AuthContext } from "../../contexts/AuthContext";
import { useAuth } from '../../contexts/AuthContext'; // Ensure this is the correct path to your AuthContext

import { upsertProfile, fetchProfile } from '../../lib/profile';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase"; // your client init


export const LogIn = (): JSX.Element => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const { setProfile } = useAuth();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
  
    try {
      // 1) Attempt to sign in
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      localStorage.setItem("fb_token", idToken);
  
      // 2) Fetch their profile with complete data
      const prof = await fetchProfile(idToken);
      setProfile({ 
        id: cred.user.uid,
        email: cred.user.email,
        name: prof.full_name, 
        role: prof.role || null,
        joined: prof.created_at,
        hasCompletedRegistration: prof.has_completed_registration || false,
        isAdmin: prof.is_admin || false
      });
  
      // 3) Navigate into the protected area
      navigate("/borrow");
    } catch (err: any) {
      // 4) If the email is already registered, the user should go to login instead
      if (err.code === "auth/user-not-found") {
        setError("No account found with that email. Please register first.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else {
        // Generic fallback
        setError(err.message);
      }
    }
  };
  

  return (
    <div className="bg-white min-h-screen w-full relative overflow-hidden">
      <div className="transform-none animate-none">
        <Navbar activePage="login" showAuthButtons />
      </div>
      <form onSubmit={handleSubmit} className="relative z-10 max-w-6xl mx-auto px-4 md:px-12 py-10">
        <div className="w-full max-w-2xl">
          <Button variant="ghost" className="mb-4" type="button">
            <ArrowLeftIcon className="h-6 w-6" />
          </Button>

          <h1 className="text-3xl font-bold mb-2 font-poppins">Log In</h1>
          <p className="text-sm text-[#505050] mb-6">Enter your details to log in your account</p>

          <div className="space-y-5">
            {[
              { label: "Email Address", icon: MailIcon, type: "email" },
              { label: "Password", icon: LockIcon, type: showPassword ? "text" : "password" },
            ].map((field, index) => (
              <div key={index}>
                <label className="block mb-1 font-medium text-[17px]">{field.label}</label>
                <div className="relative w-full md:max-w-[65%]">
                  <Input
                    type={field.type}
                    value={field.label === "Email Address" ? email : password}
                    onChange={(e) =>
                      field.label === "Email Address"
                        ? setEmail(e.target.value)
                        : setPassword(e.target.value)
                    }
                    placeholder="Enter here"
                    className="h-[58px] rounded-2xl border border-black pl-12 pr-10 w-full transition-all duration-300"
                  />
                  <field.icon className="absolute top-1/2 left-5 transform -translate-y-1/2 w-5 h-5 text-black" />
                  {field.label === "Password" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword((p) => !p)}
                    >
                      {showPassword ? <EyeOffIcon className="h-6 w-6" /> : <EyeIcon className="h-6 w-6" />}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-right text-sm mt-2 mb-6 font-medium text-black w-full md:max-w-[65%]">
            Forgot Password?
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:gap-4 md:max-w-[65%]">
            <Button type="submit" className="w-full md:w-[266px] h-[58px] bg-[#ffc00f] rounded-2xl text-black hover:text-[#ffffff] font-medium">
              Log In
            </Button>
            <span>or</span>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <Button variant="outline" className="w-full md:w-[107px] h-[58px] bg-[#ebeaea] rounded-2xl border-none" type="button">
                <img src="/image-3.png" alt="Google sign in" className="w-[33px] h-[34px] object-cover" />
              </Button>
              <Button variant="outline" className="w-full md:w-[107px] h-[58px] bg-[#ebeaea] rounded-2xl border-none" type="button">
                <img src="/image-6.png" alt="Facebook sign in" className="w-[33px] h-[34px] object-cover" />
              </Button>
            </div>
          </div>

          {error && <p className="text-red-500 mt-4">{error}</p>}

          <p className="text-center text-sm mt-6">
            Don’t have an account?{' '}
            <Link to="/register" className="text-[#ffc628] font-semibold">
              Sign Up
            </Link>
          </p>
        </div>
      </form>

      <Testimonials />
      <style>{`
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
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-[600ms] { animation-delay: 0.6s; }
      `}</style>
    </div>
  );
};
