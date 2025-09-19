import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from '../contexts/AccountContext';
import { getWalletBalance } from "../lib/wallet";
import { TopUpModal } from '../components/TopUpModal';
import { generateProfileCode } from '../lib/profileUtils';

import { EyeIcon, EyeOffIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "../../src/components/ui/avatar";
import { Button } from "../../src/components/ui/button";
import { Card, CardContent } from "../../src/components/ui/card";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { DashboardStats } from "../components/DashboardStats";
import { useAuth } from '../contexts/AuthContext';

import "../../src/styles/animations.css";

export const BorrowerHome: React.FC = () => {
  const { profile, token, profilePicture } = useAuth();
  const { 
    currentAccountType, 
    borrowerProfile, 
    investorProfile, 
    hasAccount, 
    switchAccount,
    loading: accountLoading 
  } = useAccount();
  const [balance, setBalance] = useState<number | null>(null);
  const [showProfileCode, setShowProfileCode] = useState(false);
  const [switching, setSwitching] = useState(false);
  const navigate = useNavigate();
  
  // NEW: Track if registration is complete
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

    // Wait until account data has loaded so we can determine whether the user has any account
    if (accountLoading) {
      // keep profileLoaded false until we have account info
      setProfileLoaded(false);
      return;
    }

    setProfileLoaded(true);

    // If user has any account (borrower or investor), treat them as a returning user
    const userHasAnyAccount = Boolean(borrowerProfile) || Boolean(investorProfile);

    // Consider user a new user only if they haven't completed registration AND they have no accounts
    setIsNewUser(!profile?.hasCompletedRegistration && !userHasAnyAccount);
  }, [profile, accountLoading, borrowerProfile, investorProfile]);

  // fetch wallet balance on mount
  useEffect(() => {
    if (token) {
      getWalletBalance(token).then(b => setBalance(b)).catch(console.error);
    }
  }, [token]);

  // Account creation options for new users
  const accountTypes = [
    { key: "investor", title: "Invest/Lender Account", image: "/investor-1.png", description: "Browse and invest in projects, earn returns" },
    { key: "borrower", title: "Issue/Borrow Account", image: "/debt-1.png", description: "Create projects and seek funding for your business" },
  ];

  // action cards (static)
  const actionCards = [
    { title: "Initiate Donation Campaign", image: "/donate-1.png" },
    { title: "Raise Tickets", image: "/leader-1.png" },
  ];

  // Updated: Account creation function
  const handleAccountCreation = async (accountType: 'borrower' | 'investor') => {
    try {
      console.log(`🏗️ Creating ${accountType} account`);
      // Preview the requested account type in the UI by storing it locally.
      // This makes the navbar / account indicator reflect the intended flow during registration.
      try {
        localStorage.setItem('currentAccountType', accountType);
        // notify any listeners
        window.dispatchEvent(new Event('account-switched'));
      } catch (e) {
        console.warn('Failed to persist preview account type', e);
      }

      if (accountType === 'borrower') {
        navigate('/borrowreg', { state: { accountType: 'borrower' } });
      } else {
        navigate('/investor/register', { state: { accountType: 'investor' } });
      }
    } catch (error) {
      console.error(`Error initiating ${accountType} account creation:`, error);
    }
  };

  // NEW: Handle account switching
  const handleAccountSwitch = async (accountType: 'borrower' | 'investor') => {
    if (accountType === currentAccountType) return;
    
    console.log(`🔄 Switching from ${currentAccountType} to ${accountType}`);
    
    setSwitching(true);
    try {
      await switchAccount(accountType);
      
      // Navigate to appropriate dashboard
      if (accountType === 'borrower') {
        navigate('/borrow', { replace: true });
      } else {
        navigate('/investor/discover', { replace: true });
      }
      
      // Force a small delay to allow context to update
      setTimeout(() => {
        window.dispatchEvent(new Event('account-switched'));
      }, 100);
    } catch (error) {
      console.error('Error switching account:', error);
    } finally {
      setSwitching(false);
    }
  };

  const SHOW_ACCOUNT_SECTION = true; 
      
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
            {/* Show sidebar for all screen sizes when not in new user mode */}
            {!isNewUser && (
              <div className="w-0 md:w-[280px] flex-shrink-0">
                <Sidebar activePage="home" />
              </div>
            )}

          {/* Main content - use full width */}
          <main className={`flex-1 overflow-y-auto p-4 md:p-8 w-full ${isNewUser ? 'flex justify-center items-center' : 'flex justify-center'}`}>
            {isNewUser ? (
              /* NEW USER EXPERIENCE - ACCOUNT CREATION */
              <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8 animate-fadeIn">
                <h1 className="text-3xl font-bold mb-2 text-center">Welcome to Initiate!</h1>
                <p className="text-gray-600 mb-8 text-center">
                  Create your account(s) to start using the platform. You can have both investor and borrower accounts.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {accountTypes.map((type) => (
                    <button
                      key={type.key}
                      onClick={() => handleAccountCreation(type.key as 'borrower' | 'investor')}
                      className="flex flex-col items-center p-6 border-2 border-[#0C4B20] rounded-xl hover:bg-[#fff8e6] transition-all transform hover:scale-105"
                    >
                      <h3 className="text-xl font-bold mb-4">{type.title}</h3>
                      <img
                        className="w-32 h-32 object-contain mb-4"
                        src={type.image}
                        alt={type.title}
                      />
                      <p className="text-sm text-gray-600 text-center">
                        {type.description}
                      </p>
                    </button>
                  ))}
                </div>

                <p className="text-sm text-gray-500 text-center">
                  You can create both account types and switch between them anytime using the account switcher in the top navigation.
                </p>
              </div>
            ) : (
              /* RETURNING USER EXPERIENCE */
              <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 animate-fadeIn">
                {/* Profile / iFunds Section */}
                <section className="flex flex-col md:flex-row items-center md:items-start justify-center md:justify-start mb-12 gap-6 text-center md:text-left">
                  <Avatar className="w-[100px] md:w-[123px] h-[100px] md:h-[123px] mx-auto md:mx-0">
                    <AvatarImage src={profilePicture || "/ellipse-1.png"} alt="User profile" />
                    <AvatarFallback>AJ</AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col flex-1 w-full items-center md:items-start">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center w-full space-y-6 md:space-y-0">
                      {/* Legal Name */}
                      <div className="text-center md:text-left">
                        <h2 className="text-xl opacity-70">Account Name:</h2>
                        <p className="text-2xl font-semibold">{profile?.name}</p>
                        <p className="mt-1 text-sm opacity-60">
                          Member since {profile ? new Date(profile.joined).toLocaleDateString() : "--"}
                        </p>
                        {/* Account Type & Profile Code Display */}
                        <h2 className="text-xl opacity-70 mt-4">Current Account:</h2>
                        <p className="text-2xl font-semibold">
                          {currentAccountType === 'borrower' ? 'Issue/Borrow Account' : 'Invest/Lender Account'}
                        </p>
                        {/* {profile?.profileCode && (
                          <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                            <span className="text-sm text-gray-600">
                              Profile Code: {showProfileCode ? profile.profileCode : '••••••'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowProfileCode(!showProfileCode)}
                              className="p-0 h-auto"
                            >
                              {showProfileCode ? <EyeOffIcon className="w-3 h-3" /> : <EyeIcon className="w-3 h-3" />}
                            </Button>
                          </div>
                        )} */}
                      </div>

                      {/* iFunds Balance & Actions */}
                      <div className="text-center md:text-right md:ml-auto">
                        <h2 className="text-xl opacity-70">iFunds Balance:</h2>
                        <p className="text-2xl font-semibold">
                          {balance !== null ? balance.toFixed(2) : "—"}
                        </p>
                        <div className="mt-4 flex gap-4 justify-center md:justify-end">
                          <button 
                            onClick={() => setShowTopUpModal(true)}
                            className="px-6 py-3 rounded-xl border hover:bg-gray-50 transition-colors"
                          >
                            Top-up
                          </button>
                          <button className="px-6 py-3 rounded-xl bg-[#0C4B20] text-white hover:bg-[#90B200] transition-colors">
                            Withdraw
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Username & Profile Code */}
                    <div className="mt-6 flex flex-col sm:flex-row gap-6 justify-center md:justify-start w-full">
                      <div className="text-center md:text-left">
                        <div className="opacity-70 font-poppins font-medium text-black text-base md:text-xl">
                          Username:
                        </div>
                        <div className="font-poppins font-medium text-black text-base md:text-xl">
                          {profile?.email?.split('@')[0] || 'alexa_john'}
                        </div>
                      </div>

                      <div className="text-center md:text-left">
                        <div className="opacity-70 font-poppins font-medium text-black text-base md:text-xl">
                          Profile Code:
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-2">
                          <div className="font-poppins font-medium text-black text-base md:text-xl">
                            {showProfileCode 
                              ? (profile?.profileCode || generateProfileCode(profile?.id || ''))
                              : '••••••'
                            }
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowProfileCode(!showProfileCode)}
                            className="p-1 h-auto"
                          >
                            {showProfileCode ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Account Type Selectors - Show current account highlighted and others as switchable */}
                <section className="mt-12">
                  {SHOW_ACCOUNT_SECTION && (
                    <div>
                      <h3 className="font-poppins font-semibold text-black text-xl md:text-[26px] mb-6 text-center md:text-left">
                        Account type
                      </h3>
                      <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                        {accountTypes.map((type) => {
                          const accountType = type.key as 'borrower' | 'investor';
                          const isCurrentAccount = currentAccountType === accountType;
                          const hasThisAccount = hasAccount(accountType);
                          
                          return (
                            <div key={type.key} className="w-full sm:w-[216px] flex flex-col items-center">
                              <button
                                onClick={() => {
                                  console.log(`🖱️ Main card clicked: ${accountType}`, {
                                    hasThisAccount,
                                    isCurrentAccount,
                                    action: hasThisAccount && !isCurrentAccount ? 'switch' : !hasThisAccount ? 'create' : 'none'
                                  });
                                  
                                  if (hasThisAccount && !isCurrentAccount) {
                                    handleAccountSwitch(accountType);
                                  } else if (!hasThisAccount) {
                                    handleAccountCreation(accountType);
                                  }
                                }}
                                className={`w-full flex flex-col items-center focus:outline-none ${
                                  isCurrentAccount ? 'cursor-default' : 'cursor-pointer'
                                }`}
                                disabled={isCurrentAccount || switching}
                              >
                                <Card className={`w-full h-[158px] flex items-center justify-center rounded-2xl transition ${
                                  isCurrentAccount 
                                    ? 'bg-[#0C4B20] border-[#0C4B20] border-2 shadow-lg' 
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
                                <span className={`mt-2 font-poppins font-medium text-base md:text-lg ${
                                  isCurrentAccount 
                                    ? 'text-[#0C4B20] font-bold' 
                                    : 'text-black opacity-70'
                                }`}>
                                  {type.title}
                                </span>
                              </button>
                              
                              {/* Status and Action Button */}
                              <div className="mt-2 text-center">
                                {isCurrentAccount ? (
                                  <span className="inline-block px-3 py-1 bg-[#0C4B20] text-white text-xs font-semibold rounded-full">
                                    Current Account
                                  </span>
                                ) : hasThisAccount ? (
                                  <button
                                    onClick={() => handleAccountSwitch(accountType)}
                                    disabled={switching}
                                    className="inline-block px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    {switching ? 'Switching...' : 'Switch to This Account'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      console.log(`🖱️ Create Account button clicked: ${accountType}`);
                                      handleAccountCreation(accountType);
                                    }}
                                    className="inline-block px-3 py-1 bg-gray-500 text-white text-xs font-semibold rounded-full hover:bg-gray-600 transition-colors"
                                  >
                                    Create Account
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section> 
                
                

                {/* Start Investing Button - Show for current investors or if user has investor account */}
                {(currentAccountType === 'investor' || hasAccount('investor')) && (
                  <section className="mt-8">
                    <Button 
                      onClick={() => {
                        if (currentAccountType === 'investor') {
                          navigate('/investor/discover');
                        } else if (hasAccount('investor')) {
                          handleAccountSwitch('investor');
                        }
                      }}
                      className="bg-[#0C4B20] text-white px-8 py-4 text-lg font-semibold rounded-xl hover:bg-[#8FB200] transition-colors"
                      disabled={switching}
                    >
                      {currentAccountType === 'investor' ? 'Start Investing' : 'Switch & Start Investing'}
                    </Button>
                  </section>
                )}

                {/* Investment Stats Dashboard - Show only for current investor accounts */}
                {currentAccountType === 'investor' && (
                  <section className="mt-12">
                    <DashboardStats />
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
