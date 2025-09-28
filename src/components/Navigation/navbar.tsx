// src/components/Navigation/Navbar.tsx
import React, { useState, useContext, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { MenuIcon, XIcon, ChevronDownIcon } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from '../../contexts/AuthContext';
import { useAccount } from '../../contexts/AccountContext';
import { AccountSwitcher } from './AccountSwitcher';
import NotificationDropdown from '../Notifications/NotificationDropdown';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export interface NavbarProps {
  activePage: string;
  onBack?: () => void;
  showAuthButtons?: boolean; // Add this property to the NavbarProps interface
  onLogout?: () => void;


}

export const Navbar: React.FC<NavbarProps> = ({ activePage, onBack }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountTypeKey, setAccountTypeKey] = useState(0); // Force re-render key
  const { token, profile, logout, profilePicture } = useAuth();
  const { currentAccountType, borrowerProfile, investorProfile } = useAccount();
  const location = useLocation();
  const navigate = useNavigate();

  // Listen for account switches and force re-render
  useEffect(() => {
    const handleAccountSwitch = () => {
      console.log('🔄 Navbar detected account switch event');
      setAccountTypeKey(prev => prev + 1); // Force re-render
    };

    window.addEventListener('account-switched', handleAccountSwitch);
    return () => window.removeEventListener('account-switched', handleAccountSwitch);
  }, []);

  // Also listen to currentAccountType changes directly
  useEffect(() => {
    console.log('🔄 Navbar currentAccountType changed to:', currentAccountType);
    setAccountTypeKey(prev => prev + 1); // Force re-render
  }, [currentAccountType]);

  // Get current account name
  const getCurrentAccountName = () => {
    const currentProfile = currentAccountType === 'borrower' ? borrowerProfile : investorProfile;
    return currentProfile?.data?.fullName || profile?.name || 'User';
  };

  const navItems = [
    { name: "Borrow", to: "/borrow", color: "text-[#0C4B20]" },
    ...(profile?.role === 'admin' ? [{ name: "Invest", to: "/invest", color: "text-[#0C4B20]" }] : []),
    { name: "Donate", to: "/donate", color: "text-[#0C4B20]" },
    { name: "About us", to: "/about", color: "text-black" },
    { name: "Farming & Livestock", to: "/farming", color: "text-black" },
    { name: "MSME", to: "/msme", color: "text-black" },
    { name: "Microlending", to: "/microlending", color: "text-black" },
    { name: "Skills & Creators", to: "/skills", color: "text-black" },
    { name: "Unity", to: "/unity", color: "text-black" },
  ];

  return (
    <nav 
      key={`navbar-${currentAccountType}-${accountTypeKey}`}
      className="relative z-50 w-full bg-white border-b border-gray-200 px-6 py-4" 
      style={{ position: 'sticky', top: 0 }}
    >
      {/* Role indicator banner - now shows current account type */}
      {currentAccountType && (
        <div 
          key={`account-banner-${accountTypeKey}`}
          className={`absolute top-0 left-0 w-full text-center py-1 text-xs font-medium ${
            currentAccountType === 'investor' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
          }`}
        >
          Currently in {currentAccountType === 'investor' ? 'Investor' : 'Borrower'} mode
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
          <img src="/Initiate_Logo_full.png" alt="Initiate PH Logo" className="w-[200px]" />
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
              <span className={`block w-full text-left text-lg py-2 px-3 border-b border-gray-100 ${item.color} hover:text-white hover:bg-[#203863] transition-all duration-200 shadow-sm hover:shadow-md ${item.color}`}>
                {item.name}
              </span>
            </Link>
          ))}
          {/* Mobile Account Switcher + profile display */}
          <div className="px-3 mt-2 border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={profilePicture || "/ellipse-1.png"} alt="avatar" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
                    {getCurrentAccountName().charAt(0).toUpperCase()}
                 </AvatarFallback>
                </Avatar>
               <div className="text-sm">
                  <div className="font-medium">{getCurrentAccountName()}</div>
                  <div className="text-xs text-gray-500">{currentAccountType}</div>
               </div>
              </div>
                <div className="ml-4 flex-shrink-0">
                  <AccountSwitcher />
              </div>
            </div>
          </div>

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
                <Button className="w-full bg-[#0C4B20] text-white mb-3 mt-2">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button className="w-full bg-[#0C4B20] text-white mb-3 mt-2">
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
          <img src="/Initiate_Logo_full.png" alt="Initiate PH Logo" className="w-[300px]" />
        </div>

        {/* Right side: Nav dropdown + Auth/Profile */}
        <div className="flex items-center gap-4">
          {/* Nav links - Desktop Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                Menu <ChevronDownIcon className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {navItems.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link to={item.to} className={`${item.color}`}>
                    {item.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Auth/Profile section */}
          {token && profile ? (
            <div className="flex items-center gap-4">
              <NotificationDropdown />

              <Avatar className="w-10 h-10">
                <AvatarImage src={profilePicture || "/ellipse-1.png"} alt="avatar" />
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
                  {getCurrentAccountName().charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Unified Account Switcher - replaces both AccountSwitcher and AccountDisplay */}
              <AccountSwitcher />

              {/* Admin Tools button - only visible to admins */}
              {profile?.isAdmin && (
                <Button 
                  onClick={() => navigate('/admin/projects')}
                  className="bg-[#0C4B20] text-white ml-4"
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
      </div>
      
    </nav>
    
  );
};
