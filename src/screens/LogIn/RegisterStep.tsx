// src/screens/LogIn/RegisterStep.tsx
import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  UserIcon,
} from "lucide-react";
import { Navbar } from "../../components/Navigation/navbar";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Testimonials } from "./Testimonials";
import { AuthContext } from "../../contexts/AuthContext";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { upsertProfile, fetchProfile } from "../../lib/profile";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!termsChecked) {
      setError("You must accept the terms.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
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
    
      // 3) populate context + navigate
      setProfile({ name: prof.full_name, joined: prof.created_at });
      navigate("/borrow");
    } catch (err: any) {
      // handle specific Firebase errors
      if (err.code === "auth/email-already-in-use") {
        setError("That email is already registered. Please log in instead.");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="bg-white min-h-screen w-full relative overflow-hidden">
      <Navbar activePage="register" showAuthButtons />
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

        <h1 className="text-3xl font-bold mb-2">Register a New Account</h1>
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
              placeholder="Enter your email"
              className="h-[58px] rounded-2xl border border-black pl-12 pr-4 w-full"
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
              placeholder="Enter your name"
              className="h-[58px] rounded-2xl border border-black pl-12 pr-4 w-full"
            />
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block mb-1 font-medium">Password</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="h-[58px] rounded-2xl border border-black pl-12 pr-4 w-full"
            />
            <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8"
              onClick={() => setShowPassword((p) => !p)}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
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
              placeholder="Confirm password"
              className="h-[58px] rounded-2xl border border-black pl-12 pr-4 w-full"
            />
            <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8"
              onClick={() => setShowConfirm((p) => !p)}
            >
              {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="flex items-center">
          <Checkbox
            checked={termsChecked}
            onCheckedChange={(checked) => setTermsChecked(checked === true)}
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

        {error && <p className="text-red-500">{error}</p>}

        {/* Register Button & Social */}
        <div className="flex flex-col md:flex-row md:items-center md:gap-4">
          <Button
            type="submit"
            className="w-full md:w-[266px] h-[58px] bg-[#ffc00f] rounded-2xl text-black font-medium"
          >
            Register
          </Button>
          <span className="mx-4 md:mx-2">or</span>
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

        <p className="text-center text-sm mt-6">
          Already a member?{" "}
          <Link to="/" className="text-[#ffc628] font-semibold">
            Sign In
          </Link>
        </p>
      </form>
</div>
<div className="flex items-center justify-center">

      <Testimonials />
</div>

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
      `}</style>
    </div>
  );
};
