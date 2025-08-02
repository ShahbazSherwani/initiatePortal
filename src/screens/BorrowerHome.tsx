import React, { useContext, useEffect, useState } from "react";
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { getWalletBalance } from "..//lib/wallet"; // we’ll build this next
import { useNavigate } from "react-router-dom";
import { useRegistration } from "../contexts/RegistrationContext";
import { authFetch } from '../lib/api';



import {
  BellIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  HelpCircleIcon,
  HomeIcon,
  LogOutIcon,
  MenuIcon, // Add this
  SettingsIcon,
  WalletIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "../../src/components/ui/avatar";
import { Button } from "../../src/components/ui/button";
import { Card, CardContent } from "../../src/components/ui/card";
import { Navbar } from "../../src/components/Navigation/navbar";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { useAuth } from '../contexts/AuthContext';


import "../../src/styles/animations.css";



function PrivateRoute({ children }: { children: React.ReactNode }) {
  const authContext = useContext(AuthContext);
  const token = authContext?.token || null;
  return token ? children : <Navigate to="/login" />;
}


export const BorrowerHome: React.FC = () => {
  const { profile, setProfile, token, logout } = useAuth(); // Add setProfile here
    const { registration, setRegistration } = useRegistration();
  const [balance, setBalance] = useState<number | null>(null);
  const navigate = useNavigate();


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
  const [selectedAccountIdx, setSelectedAccountIdx] = useState(1);

  // action cards (static)
  const actionCards = [
    { title: "Initiate Donation Campaign", image: "/donate-1.png" },
    { title: "Initiate Request",        image: "/leader-1.png" },
  ];
// map each index to the route you want:
const accountRoutes = [
 "/investor",    // invest/lender page
"/borrow/request",// issue/borrow page
 "/guarantee",   // guarantee page
];

  // Map account type to sidebar index
  const sidebarAccountMap = {
    individual: 0, // Invest/Lender
    borrower: 1,   // Issue/Borrower
    guarantee: 2,  // Guarantee
  };
const validAccountTypes = ["individual", "borrower", "guarantee"] as const;
type AccountTypeKey = typeof validAccountTypes[number];

const selectedSidebarIdx =
  validAccountTypes.includes(registration.accountType as AccountTypeKey)
    ? sidebarAccountMap[registration.accountType as AccountTypeKey]
    : 1;

    // Role switching function
    const handleRoleSwitch = async (roleKey) => {
      try {
        console.log(`Attempting to switch to role: ${roleKey}`);
        
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
            role: apiRoleValue
          }));
          
          // Update registration context
          setRegistration(prev => ({
            ...prev,
            accountType: roleKey
          }));
          
          // Navigate based on role
          switch(roleKey) {
            case "individual":
              navigate("/investor/discover");
              break;
            case "borrower":
              navigate("/borrow");
              break;
            case "guarantee":
              navigate("/guarantee");
              break;
            default:
              navigate("/");
          }
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
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:block w-[280px] flex-shrink-0">
          <Sidebar activePage="home" />
        </div>

        {/* Main content - use full width */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
          {/* Content goes here */}
          <div className="w-full max-w-none">
            {/* Your cards and content */}
            {/* Header */}
            {/* <header className="flex flex-col md:flex-row items-start md:items-center justify-between px-6 md:px-20 pt-6 md:pt-9 gap-4 md:gap-0">
              <div className="flex items-center gap-4 ml-auto animate-fadeIn delay-300">
                <div className="relative">
                  <BellIcon className="w-6 md:w-7 h-6 md:h-8" />
                  <div className="absolute w-3 h-3 top-0 right-0 bg-[#ff0000] rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="w-[50px] md:w-[61px] h-[50px] md:h-[61px]">
                    <AvatarImage src="/ellipse-1.png" alt="User avatar" />
                    <AvatarFallback>AJ</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm md:text-lg opacity-70 font-poppins font-medium text-black">
                      Account:
                    </span>
                    <span className="font-poppins font-medium text-black text-base md:text-xl flex items-center">
                      Issue/Borrow
                      <ChevronDownIcon className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </div>
              </div>
            </header> */}

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
                        {registration.accountType ? registration.accountType.toUpperCase() : "Not selected"}
                      </p>
                  </div>

                  {/* Wallet Balance & Actions */}
                  <div className="ml-auto text-right">
                    <h2 className="text-xl opacity-70">Wallet Balance:</h2>
                    <p className="text-2xl font-semibold">
                      {balance !== null ? balance.toFixed(2) : "—"}
                    </p>
                    <div className="mt-4 flex gap-4">
                      <button className="px-6 py-3 rounded-xl border" onClick={() => { /* show top-up modal */ }}>
                        Top-up
                      </button>
                      <button className="px-6 py-3 rounded-xl bg-yellow-400" onClick={() => {/* show withdraw modal */}}>
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
                      alexa_john
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

            {/* Account Type Selectors */}
            <section className="mt-12">
              <h3 className="font-poppins font-semibold text-black text-xl md:text-[26px] mb-6">
                Choose account type
              </h3>
              <div className="flex flex-wrap gap-6">
                {accountTypes
  .filter(type => type.key !== registration.accountType) // Hide current account type
  .map((type, idx) => {
    return (
      <button
        key={type.key}
        onClick={async () => {
          handleRoleSwitch(type.key)
        }}
        className="w-full sm:w-[216px] flex flex-col items-center focus:outline-none"
      >
        <Card
          className={`w-full h-[158px] flex items-center justify-center rounded-2xl transition bg-white border border-black`}
        >
          <CardContent className="p-0 flex items-center justify-center">
            <img
              className="w-[115px] h-[115px] object-cover"
              src={type.image}
              alt={type.title}
            />
          </CardContent>
        </Card>
        <span className="mt-4 font-poppins font-medium text-black text-base md:text-xl opacity-70">
          {type.title}
        </span>
      </button>
    );
  })}
              </div>
            </section>

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
        </main>
      </div>
    </div>

  </>
  );
};

export default BorrowerHome;
