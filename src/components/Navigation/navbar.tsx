// src/components/Navigation/Navbar.tsx
import React, { useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { MenuIcon, XIcon, BellIcon, ChevronDownIcon } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from '../../contexts/AuthContext';

export interface NavbarProps {
  activePage: string;
  onBack?: () => void;
  showAuthButtons?: boolean; // Add this property to the NavbarProps interface
  onLogout?: () => void;


}

export const Navbar: React.FC<NavbarProps> = ({ activePage, onBack }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { token, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: "Borrow", to: "/borrow", color: "text-[#ffc00f]" },
    ...(profile?.role === 'admin' ? [{ name: "Invest", to: "/invest", color: "text-[#ffc00f]" }] : []),
    { name: "Donate", to: "/donate", color: "text-[#ffc00f]" },
    { name: "About us", to: "/about", color: "text-black" },
    { name: "Farming & Livestock", to: "/farming", color: "text-black" },
    { name: "MSME", to: "/msme", color: "text-black" },
    { name: "Microlending", to: "/microlending", color: "text-black" },
    { name: "Skills & Creators", to: "/skills", color: "text-black" },
    { name: "Unity", to: "/unity", color: "text-black" },
  ];

  const AccountDisplay = () => {
    const { profile } = useAuth();
    
    return (
      <div className="flex items-center">
        <span className="text-gray-600 mr-1">Account:</span>
        <span className="font-medium">
          {profile?.name} 
          {profile?.role && `(${profile.role === 'investor' ? 'Investor' : 'Borrower'})`}
        </span>
      </div>
    );
  };

  return (
    <nav className="relative z-50 w-full bg-white border-b border-gray-200 px-6 py-4" style={{ position: 'sticky', top: 0 }}>
      {/* Role indicator banner - will only appear once */}
      {profile?.role && (
        <div className={`absolute top-0 left-0 w-full text-center py-1 text-xs font-medium ${
          profile.role === 'investor' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          Currently in {profile.role === 'investor' ? 'Investor' : 'Borrower'} mode
        </div>
      )}
      
      {/* Mobile: logo + hamburger */}
      <div className="flex items-center justify-between md:hidden">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="p-0">
              ←
            </Button>
          )}
          <img src="/initiate_logo.png" alt="Initiate PH Logo" className="w-[132px]" />
        </div>
        <Button variant="ghost" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </Button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden mt-4 space-y-4 overflow-y-auto animate-slideIn">
          {navItems.map((item) => (
            <Link key={item.name} to={item.to}>
              <span className={`block w-full text-left text-lg py-2 px-3 border-b border-gray-100 font-['Poppins',Helvetica] ${item.color} hover:text-white hover:bg-[#203863] transition-all duration-200 shadow-sm hover:shadow-md ${item.color}`}>
                {item.name}
              </span>
            </Link>
          ))}

          {token ? (
            <Button
              className="w-full bg-red-500 text-white mt-4"
              onClick={() => {
                logout();
                setMobileOpen(false);
              }}
            >
              Log Out
            </Button>
          ) : (
            <>
              <Link to="/">
                <Button className="w-full bg-[#203863] text-white">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button className="w-full bg-[#203863] text-white">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      )}

      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between">
        {/* Logo + (optional) back */}
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="p-0">
              ←
            </Button>
          )}
          <img src="/initiate_logo.png" alt="Initiate PH Logo" className="w-[132px]" />
        </div>

        {/* Nav links */}
        <div className="flex flex-wrap items-center gap-6">
          {navItems.map((item) => (
            <Link key={item.name} to={item.to}>
              <span
                className={`
                  font-['Poppins',Helvetica] text-base ${item.color}
                  hover:bg-[#203863] hover:text-white
                  px-3 py-1 rounded-md transition-shadow duration-200
                  `}
              >
                {item.name}
              </span>
            </Link>
          ))}
        </div>

        {/* Right side: either logged-in header or auth buttons */}
        {token && profile ? (
          <div className="flex items-center gap-6">
            <div className="relative">
              <BellIcon className="w-6 h-6 text-black" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full" />
            </div>

            <Avatar className="w-10 h-10">
              <AvatarImage src="/ellipse-1.png" alt="avatar" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>

            <AccountDisplay />

            {/* Admin Tools button - only visible to admins */}
            {profile?.isAdmin && (
              <Button 
                onClick={() => navigate('/admin/projects')}
                className="bg-[#ffc628] text-black ml-4"
              >
                Admin Panel
              </Button>
            )}

            <Button
              variant="outline"
              className="text-red-600 border-red-600"
              onClick={logout}
            >
              Log Out
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button className="bg-[#203863] text-white">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button className="bg-[#203863] text-white">Sign Up</Button>
            </Link>
          </div>
        )}
      </div>
      
    </nav>
    
  );
};
