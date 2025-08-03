import React, { useContext, useEffect, useState } from "react";
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { getWalletBalance } from "../lib/wallet";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "../contexts/RegistrationContext";
import { authFetch } from '../lib/api';
import { TopUpModal } from '../components/TopUpModal';

import {
  BellIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  HelpCircleIcon,
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  SettingsIcon,
  WalletIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "../../src/components/ui/avatar";
import { Button } from "../../src/components/ui/button";
import { Card, CardContent } from "../../src/components/ui/card";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { useAuth } from '../contexts/AuthContext';

import "../../src/styles/animations.css";

export const BorrowerHome: React.FC = () => {
  const { profile, setProfile, token, logout } = useAuth();
  const { registration, setRegistration } = useRegistration();
  const [balance, setBalance] = useState<number | null>(null);
  const navigate = useNavigate();
  
  // NEW: Track if registration is complete
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(true);
  // NEW: Track if this is a new user (no role selected yet)
  const [isNewUser, setIsNewUser] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  
  // Top-up modal state
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  
  // Handle successful top-up submission
  const handleTopUpSuccess = async () => {
    // Refresh wallet balance
    if (token) {
      try {
        const newBalance = await getWalletBalance(token);
        setBalance(newBalance);
      } catch (error) {
        console.error('Error refreshing wallet balance:', error);
      }
    }
  };

  useEffect(() => {
    // Wait for profile to be loaded
    if (!profile) {
      setProfileLoaded(false);
      return;
    }
    
    setProfileLoaded(true);
    
    // Check if user has a role and has completed registration
    if (!profile?.role || !profile?.hasCompletedRegistration) {
      setIsNewUser(true);
      setIsRegistrationComplete(false);
    } else {
      // User has role and completed registration - show returning user experience
      setIsNewUser(false);
      setIsRegistrationComplete(true);
    }
  }, [profile, navigate]);

  // fetch wallet balance on mount
  useEffect(() => {
    if (token) {
      getWalletBalance(token).then(b => setBalance(b)).catch(console.error);
    }
  }, [token]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // account‑type toggle
  const accountTypes = [
    { key: "individual", title: "Invest/Lender", image: "/investor-1.png" },
    { key: "borrower", title: "Issue/Borrower", image: "/debt-1.png" },
    { key: "guarantee", title: "Guarantee", image: "/cashback-1.png" },
  ];

  // action cards (static)
  const actionCards = [
    { title: "Initiate Donation Campaign", image: "/donate-1.png" },
    { title: "Initiate Request", image: "/leader-1.png" },
  ];

  // IMPROVED: Role switching function that starts registration flow
  const handleRoleSelection = async (roleKey) => {
    try {
      console.log(`Selecting role: ${roleKey}`);
      
      // Convert roleKey to proper API format
      let apiRoleValue;
      switch(roleKey) {
        case "individual": 
          apiRoleValue = "investor"; 
          break;
        case "borrower": 
          apiRoleValue = "borrower"; 
          break;
        case "guarantee": 
          apiRoleValue = "guarantor"; 
          break;
        default:
          apiRoleValue = roleKey;
      }
      
      // Update role in database
      const result = await authFetch('http://localhost:4000/api/profile/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: apiRoleValue })
      });
      
      if (result.success) {
        console.log(`Role set to ${apiRoleValue} in database`);
        
        // Update the profile in context
        setProfile(prev => ({
          ...prev,
          role: apiRoleValue,
          // Mark as not completed registration yet
          hasCompletedRegistration: false
        }));
        
        // Update registration context
        setRegistration(prev => ({
          ...prev,
          accountType: roleKey
        }));
        
        // Start registration flow
        navigate("/borrowreg");
      } else {
        console.error("Failed to set role:", result);
        alert("Failed to switch role. Please try again.");
      }
    } catch (error) {
      console.error("Role switch error:", error);
      alert("An error occurred. Please try again.");
    }
  };
  
  return (
    <>
      {/* Show loading state while profile is loading */}
      {!profileLoaded ? (
        <div className="flex min-h-screen items-center justify-center">
          <div>Loading your profile...</div>
        </div>
      ) : (
        <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
          <div className="flex flex-1 overflow-hidden">
            {/* Only show sidebar if not in registration mode */}
            {!isNewUser && (
              <div className="hidden md:block w-[280px] flex-shrink-0">
                <Sidebar activePage="home" />
              </div>
            )}

          {/* Main content - use full width */}
          <main className={`flex-1 overflow-y-auto p-4 md:p-8 w-full ${isNewUser ? 'flex justify-center items-center' : ''}`}>
            {isNewUser ? (
              /* NEW USER EXPERIENCE - ROLE SELECTION */
              <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8 animate-fadeIn">
                <h1 className="text-3xl font-bold mb-2 text-center">Welcome to Investie!</h1>
                <p className="text-gray-600 mb-8 text-center">
                  Please select how you would like to use the platform.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {accountTypes.map((type) => (
                    <button
                      key={type.key}
                      onClick={() => handleRoleSelection(type.key)}
                      className="flex flex-col items-center p-6 border-2 border-[#ffc628] rounded-xl hover:bg-[#fff8e6] transition-all transform hover:scale-105"
                    >
                      <h3 className="text-xl font-bold mb-4">{type.title}</h3>
                      <img
                        className="w-32 h-32 object-contain mb-4"
                        src={type.image}
                        alt={type.title}
                      />
                      <p className="text-sm text-gray-600 text-center">
                        {type.key === "individual" ? "Browse projects and invest in opportunities" :
                         type.key === "borrower" ? "Create projects and seek funding" :
                         "Provide guarantees for borrowers"}
                      </p>
                    </button>
                  ))}
                </div>

                <p className="text-sm text-gray-500 text-center">
                  After selecting a role, you'll be guided through a registration process to set up your account.
                </p>
              </div>
            ) : (
              /* RETURNING USER EXPERIENCE */
              <div className="w-full max-w-none">
                {/* Profile / Wallet Section */}
                <section className="flex flex-col md:flex-row items-start md:items-center mb-12 gap-6">
                  <Avatar className="w-[100px] md:w-[123px] h-[100px] md:h-[123px]">
                    <AvatarImage src="/ellipse-1.png" alt="User profile" />
                    <AvatarFallback>AJ</AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col flex-1 w-full">
                    <div className="flex justify-between items-center w-full">
                      {/* Legal Name */}
                      <div>
                        <h2 className="text-xl opacity-70">Legal Name:</h2>
                        <p className="text-2xl font-semibold">{profile?.name}</p>
                        <p className="mt-1 text-sm opacity-60">
                          Member since {profile ? new Date(profile.joined).toLocaleDateString() : "--"}
                        </p>
                        {/* Account Type Display */}
                        <h2 className="text-xl opacity-70 mt-4">Account Type:</h2>
                        <p className="text-2xl font-semibold">
                          {profile?.role ? profile.role.toUpperCase() : "Not selected"}
                        </p>
                      </div>

                      {/* Wallet Balance & Actions */}
                      <div className="ml-auto text-right">
                        <h2 className="text-xl opacity-70">Wallet Balance:</h2>
                        <p className="text-2xl font-semibold">
                          {balance !== null ? balance.toFixed(2) : "—"}
                        </p>
                        <div className="mt-4 flex gap-4">
                          <button 
                            onClick={() => setShowTopUpModal(true)}
                            className="px-6 py-3 rounded-xl border hover:bg-gray-50 transition-colors"
                          >
                            Top-up
                          </button>
                          <button className="px-6 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-500 transition-colors">
                            Withdraw
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Username & Profile Code */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-4">
                      <div>
                        <div className="opacity-70 font-poppins font-medium text-black text-base md:text-xl">
                          Username:
                        </div>
                        <div className="font-poppins font-medium text-black text-base md:text-xl">
                          {profile?.email?.split('@')[0] || 'alexa_john'}
                        </div>
                      </div>

                      <div>
                        <div className="opacity-70 font-poppins font-medium text-black text-base md:text-xl">
                          Profile Code:
                        </div>
                        <div className="font-poppins font-medium text-black text-base md:text-xl">
                          554Xd1
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Account Type Selectors - Show current role highlighted and others as switchable */}
                <section className="mt-12">
                  <h3 className="font-poppins font-semibold text-black text-xl md:text-[26px] mb-6">
                    Account type
                  </h3>
                  <div className="flex flex-wrap gap-6">
                    {accountTypes.map((type) => {
                      // Check if this is the current role
                      const isCurrentRole = 
                        (profile?.role === 'investor' && type.key === 'individual') ||
                        (profile?.role === 'borrower' && type.key === 'borrower') ||
                        (profile?.role === 'guarantor' && type.key === 'guarantee');
                      
                      return (
                        <button
                          key={type.key}
                          onClick={() => !isCurrentRole && handleRoleSelection(type.key)}
                          className={`w-full sm:w-[216px] flex flex-col items-center focus:outline-none ${
                            isCurrentRole ? 'cursor-default' : 'cursor-pointer'
                          }`}
                          disabled={isCurrentRole}
                        >
                          <Card className={`w-full h-[158px] flex items-center justify-center rounded-2xl transition ${
                            isCurrentRole 
                              ? 'bg-[#ffc628] border-[#ffc628] border-2 shadow-lg' 
                              : 'bg-white border border-black hover:shadow-md'
                          }`}>
                            <CardContent className="p-0 flex items-center justify-center">
                              <img
                                className="w-[115px] h-[115px] object-cover"
                                src={type.image}
                                alt={type.title}
                              />
                            </CardContent>
                          </Card>
                          <span className={`mt-4 font-poppins font-medium text-base md:text-xl ${
                            isCurrentRole 
                              ? 'text-[#ffc628] font-bold' 
                              : 'text-black opacity-70'
                          }`}>
                            {type.title} {isCurrentRole && '(Current)'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Invest Button - Only for Investors and Admins */}
                {(profile?.role === 'investor' || profile?.role === 'admin') && (
                  <section className="mt-8">
                    <Button 
                      onClick={() => navigate('/investor/discover')}
                      className="bg-[#ffc628] text-black px-8 py-4 text-lg font-semibold rounded-xl hover:bg-[#e6b324] transition-colors"
                    >
                      🎯 Start Investing
                    </Button>
                  </section>
                )}

                {/* Action Cards */}
                <section className="mt-12">
                  <h4 className="font-poppins font-medium text-black text-lg md:text-[22px] mb-6">
                    You can run the donation campaign or initiate a request also
                  </h4>
                  <div className="flex flex-wrap gap-6">
                    {actionCards.map((card, idx) => (
                      <Card
                        key={idx}
                        className="w-full md:w-[337px] h-24 bg-white rounded-2xl border border-black flex items-center p-4 hover:shadow-lg transition-shadow duration-300"
                      >
                        <CardContent className="p-0 flex items-center">
                          <img
                            className="w-[62px] h-[62px] object-cover"
                            alt={card.title}
                            src={card.image}
                          />
                          <div className="ml-6 font-poppins font-medium text-black text-base md:text-xl">
                            {card.title}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </main>
        </div>
      </div>
      )}
      
      {/* Top-up Modal */}
      <TopUpModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        onSuccess={handleTopUpSuccess}
      />
    </>
  );
};

export default BorrowerHome;
