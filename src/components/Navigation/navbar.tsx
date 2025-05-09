import React, { useState, useContext  } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { MenuIcon, XIcon } from "lucide-react";
import { AuthContext } from '../../contexts/AuthContext';

interface NavbarProps {
  activePage: string;
  showAuthButtons?: boolean;
  onBack?: () => void;
}


export const Navbar: React.FC<NavbarProps> = ({
  showAuthButtons = true,
  activePage,
  onBack,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: "Borrow", color: "text-[#ffc00f]" },
    { name: "Invest", color: "text-[#ffc00f]" },
    { name: "Donate", color: "text-[#ffc00f]" },
    { name: "About us", color: "text-black" },
    { name: "Farming & Livestock", color: "text-black" },
    { name: "MSME", color: "text-black" },
    { name: "Microlending", color: "text-black" },
    { name: "Skills & Creators", color: "text-black" },
    { name: "Unity", color: "text-black" },
  ];

  return (
    <nav className="w-full flex flex-col md:flex-row items-center justify-between px-6 py-4 relative z-50 border-b border-gray-200 bg-white">
      {/* Logo and Back */}
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="p-0">
            ←
          </Button>
        )}
        <img src="/group.png" alt="Logo" className="w-[132px] h-auto" />
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden absolute right-6 top-6">
        <Button variant="ghost" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </Button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-white z-50 p-6 overflow-y-auto animate-slideIn">
          <div className="flex justify-between items-center mb-6">
            <img src="/group.png" alt="Logo" className="w-[132px] h-auto" />
            <Button variant="ghost" onClick={() => setMobileOpen(false)}>
              <XIcon className="w-6 h-6" />
            </Button>
          </div>
          <div className="flex flex-col space-y-2">
            {navItems.map((item, index) => (
              <span
                key={index}
                className={`block w-full text-left text-lg py-2 px-3 border-b border-gray-100 font-['Poppins',Helvetica] ${item.color} hover:text-white hover:bg-[#203863] transition-all duration-200 shadow-sm hover:shadow-md`}
              >
                {item.name}
              </span>
            ))}

            {showAuthButtons && (
              <div className="mt-6">
                {activePage === "register" ? (
                  <Link to="/">
                    <Button className="w-full bg-[#203863] text-white hover:bg-[#1a2f52] hover:shadow-md">Sign In</Button>
                  </Link>
                ) : (
                  <Link to="/register">
                    <Button className="w-full bg-[#203863] text-white hover:bg-[#1a2f52] hover:shadow-md">Sign Up</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop Menu Items */}
      <div className="hidden md:flex flex-wrap items-center gap-4">
        {navItems.map((item, index) => (
          <span
            key={index}
            className={`font-['Poppins',Helvetica] text-base ${item.color} break-words whitespace-normal px-3 py-1 rounded-md hover:bg-[#203863] hover:text-white transition-all duration-200 shadow-sm hover:shadow-md`}
          >
            {item.name}
          </span>
        ))}
      </div>

      {/* Desktop Auth Buttons */}
      {showAuthButtons && (
        <div className="hidden md:flex flex-col md:flex-row items-center gap-4 mt-4 md:mt-0">
          {activePage === "register" ? (
            <div className="flex items-center gap-2">
              <span className="text-black text-sm">Already a member?</span>
              <Link to="/">
                <Button className="bg-[#203863] text-white text-sm px-4 py-2 rounded-md hover:bg-[#1a2f52] hover:shadow-md">
                  Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-black text-sm">Don't have an account?</span>
              <Link to="/register">
                <Button className="bg-[#203863] text-white text-sm px-4 py-2 rounded-md hover:bg-[#1a2f52] hover:shadow-md">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

          <div className="flex items-center gap-2">
            <img className="w-7 h-[21px]" alt="Flag" src="/flag.png" />
            <span className="font-semibold text-black text-base">PH</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </nav>
  );
};
