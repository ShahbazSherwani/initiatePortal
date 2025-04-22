import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../../server/auth/auth";
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  UserIcon,
} from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Navbar } from "../../components/Navigation/navbar";
import { Testimonials } from "../../screens/LogIn/Testimonials";

export const RegisterStep = (): JSX.Element => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [termsChecked, setTermsChecked] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!termsChecked) return setError("You must accept the terms.");
    if (password !== confirm) return setError("Passwords must match.");

    try {
      const token = await registerUser(email, password, fullName);
      localStorage.setItem("fb_token", token);
      navigate("/borrower");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white min-h-screen w-full relative overflow-hidden">
      <Navbar activePage="register" showAuthButtons />
      <form onSubmit={handleSubmit} className="relative z-10 max-w-2xl mx-auto p-4 space-y-6">
        <Button variant="ghost" className="mb-4">
          <ArrowLeftIcon className="h-6 w-6" />
        </Button>
        <h1 className="text-3xl font-bold mb-2">Register a New Account</h1>
        <p className="text-sm mb-6">Enter your details to create your account</p>

        {/* Email Address */}
        <div>
          <label className="block mb-1">Email Address</label>
          <div className="relative">
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="h-[58px] rounded-2xl border border-black pl-12 pr-4 w-full"
            />
            <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" />
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block mb-1">Full Name</label>
          <div className="relative">
            <Input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Enter your name"
              className="h-[58px] rounded-2xl border border-black pl-12 pr-4 w-full"
            />
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block mb-1">Password</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Create a password"
              className="h-[58px] rounded-2xl border border-black pl-12 pr-4 w-full"
            />
            <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" />
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block mb-1">Re-type Password</label>
          <div className="relative">
            <Input
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Confirm password"
              className="h-[58px] rounded-2xl border border-black pl-12 pr-4 w-full"
            />
            <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" />
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => setShowConfirm(p => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8"
            >
              {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-center">
        <Checkbox
          checked={termsChecked}
          onCheckedChange={checked => setTermsChecked(checked === true)}
          className="mr-2"
         />

          <label htmlFor="terms" className="text-sm">
            I have reviewed and agreed to Investie's <span className="text-[#203863] underline">Terms of Use</span> and <span className="text-[#203863] underline">Privacy Policy</span>
          </label>
        </div>

        {error && <p className="text-red-500">{error}</p>}

        {/* Register Button & Social */}
        <div className="flex flex-col md:flex-row md:items-center md:gap-4">
          <Button type="submit" className="w-full md:w-[266px] h-[58px] bg-[#ffc00f] rounded-2xl text-black font-medium">
            Register
          </Button>
          <span className="text-center md:text-left mt-4 md:mt-0">or</span>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="w-full md:w-[107px] h-[58px] bg-[#ebeaea] rounded-2xl border-none">
              <img src="/image-3.png" alt="Google sign in" className="w-[33px] h-[34px] object-cover" />
            </Button>
            <Button variant="outline" className="w-full md:w-[107px] h-[58px] bg-[#ebeaea] rounded-2xl border-none">
              <img src="/image-6.png" alt="Facebook sign in" className="w-[33px] h-[34px] object-cover" />
            </Button>
          </div>
        </div>

        {/* Sign In Link */}
        <p className="text-center text-sm mt-6">
          Already a member? <Link to="/login" className="text-[#ffc628] font-semibold">Sign In</Link>
        </p>
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


// import {
//   ArrowLeftIcon,
//   EyeIcon,
//   EyeOffIcon,
//   LockIcon,
//   MailIcon,
//   UserIcon,
// } from "lucide-react";
// import React from "react";
// import { Link } from "react-router-dom";
// import { Button } from "../../components/ui/button";
// import { Checkbox } from "../../components/ui/checkbox";
// import { Input } from "../../components/ui/input";
// import { Navbar } from "../../components/Navigation/navbar";
// import { Testimonials } from "../../screens/LogIn/Testimonials";

// export const RegisterStep = (): JSX.Element => {
//   const [showPassword, setShowPassword] = React.useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
//   return (
//     <div className="bg-white min-h-screen w-full relative overflow-hidden">
//       <Navbar activePage="register" showAuthButtons />

//       {/* Form Section */}
//       <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-12 py-10">
//         <div className="w-full max-w-2xl">
//           <Button variant="ghost" className="mb-4">
//             <ArrowLeftIcon className="h-6 w-6" />
//           </Button>

//           <h1 className="text-3xl font-bold mb-2 font-poppins">Register a New Account</h1>
//           <p className="text-sm text-[#505050] mb-6">Enter your details to create your account</p>

//           <div className="space-y-5">
//             {["Email Address", "Full Name", "Password", "Re-type Password"].map((label, index) => {
//               const Icon = [MailIcon, UserIcon, LockIcon, LockIcon][index];
//               const isPassword = label.toLowerCase().includes("password");
//               const show = index === 2 ? showPassword : showConfirmPassword;
//               const toggle = index === 2 ? setShowPassword : setShowConfirmPassword;

//               return (
//                 <div key={index}>
//                   <label className="block mb-1 font-medium text-[17px]">{label}</label>
//                   <div className="relative w-full md:max-w-[65%]">
//                     <Input
//                       placeholder="Enter here"
//                       type={isPassword ? (show ? "text" : "password") : "text"}
//                       className="h-[58px] rounded-2xl border border-black pl-12 pr-10 w-full transition-all duration-300"
//                     />
//                     <Icon className="absolute top-1/2 left-5 transform -translate-y-1/2 w-5 h-5 text-black" />
//                     {isPassword && (
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
//                         onClick={() => toggle(prev => !prev)}
//                       >
//                         {show ? <EyeOffIcon className="h-6 w-6" /> : <EyeIcon className="h-6 w-6" />}
//                       </Button>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           <div className="flex items-start gap-2 mt-4">
//             <Checkbox id="terms" className="rounded border border-black" />
//             <label htmlFor="terms" className="text-sm text-black">
//               I have reviewed and agreed to Investie's <span className="text-[#203863] underline">Terms of Use</span> and <span className="text-[#203863] underline">Privacy Policy</span>
//             </label>
//           </div>

//           <div className="flex flex-col md:flex-row md:items-center md:gap-4 mt-6 md:max-w-[65%]">
//             <Button className="w-full md:w-[266px] h-[58px] bg-[#ffc00f] rounded-2xl text-black hover:text-[#ffffff] font-medium">
//               Register
//             </Button>
//             <span>or</span>
//             <div className="flex items-center gap-4 mt-4 md:mt-0">
//               <Button variant="outline" className="w-full md:w-[107px] h-[58px] bg-[#ebeaea] rounded-2xl border-none">
//                 <img src="/image-3.png" alt="Google sign in" className="w-[33px] h-[34px] object-cover" />
//               </Button>
//               <Button variant="outline" className="w-full md:w-[107px] h-[58px] bg-[#ebeaea] rounded-2xl border-none">
//                 <img src="/image-6.png" alt="Facebook sign in" className="w-[33px] h-[34px] object-cover" />
//               </Button>
//             </div>
//           </div>

//           <p className="text-center text-sm mt-6">
//             Already a member?{' '}
//             <Link to="/" className="text-[#ffc628] font-semibold">
//               Sign In
//             </Link>
//           </p>
//         </div>
//       </div>

//       <Testimonials />
//       {/* Testimonials Section */}
//       <style>{`
//         @keyframes fadeIn {
//           from { opacity: 0; transform: translateY(20px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         .animate-fadeIn {
//           animation: fadeIn 0.8s ease forwards;
//         }

//         @keyframes slideIn {
//           from { transform: translateX(100px) rotate(-30deg); opacity: 0; }
//           to { transform: translateX(0) rotate(-30deg); opacity: 1; }
//         }
//         .animate-slideIn {
//           animation: slideIn 1s ease-out forwards;
//         }
//         .delay-200 { animation-delay: 0.2s; }
//         .delay-300 { animation-delay: 0.3s; }
//         .delay-400 { animation-delay: 0.4s; }
//         .delay-500 { animation-delay: 0.5s; }
//         .delay-600 { animation-delay: 0.6s; }
//         .delay-[600ms] { animation-delay: 0.6s; }
//       `}</style>
//     </div>
//   );
// };


