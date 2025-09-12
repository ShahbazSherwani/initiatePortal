// src/components/Navigation/AccountSwitcher.tsx
import React, { useState } from "react";
import { useAccount, AccountType } from "../../contexts/AccountContext";
import { useAuth } from "../../contexts/AuthContext";
import { ChevronDownIcon, UserIcon, TrendingUpIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

export const AccountSwitcher: React.FC = () => {
  const { 
    currentAccountType, 
    borrowerProfile, 
    investorProfile, 
    hasAccount, 
    switchAccount, 
    loading 
  } = useAccount();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);
  const [showProfileCode, setShowProfileCode] = useState(false);

  const handleAccountSwitch = async (accountType: AccountType) => {
    if (accountType === currentAccountType) return;
    
    setSwitching(true);
    try {
      await switchAccount(accountType);
      
      // Navigate to appropriate dashboard - React routing will handle the UI updates
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

  const handleCreateAccount = (accountType: AccountType) => {
    // Navigate to account creation flow
    if (accountType === 'borrower') {
      navigate('/borrowreg');
    } else {
      navigate('/investor/register');
    }
  };

  const getCurrentAccountLabel = () => {
    const currentProfile = currentAccountType === 'borrower' ? borrowerProfile : investorProfile;
    const fullName = currentProfile?.data?.fullName || profile?.name || 'User';
    return fullName; // Just return the name, not the role
  };

  const getProfileCode = () => {
    const currentProfile = currentAccountType === 'borrower' ? borrowerProfile : investorProfile;
    return currentProfile?.id || profile?.profileCode || 'N/A';
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center space-x-3 px-4 py-3 h-auto"
          disabled={switching}
        >
          {/* Account Info */}
          <div className="flex flex-col items-start">
            <span className="text-sm text-gray-600">Account:</span>
            <span className="text-sm font-semibold text-gray-900">
              {currentAccountType === 'borrower' ? 'Issue/Borrow' : 'Invest/Lender'}
            </span>
          </div>
          
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Switch Account To:</h3>
        </div>

        {/* Investor/Lender Account */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <TrendingUpIcon className="w-6 h-6 text-gray-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Invest/Lender Account</span>
            </div>
            {hasAccount('investor') && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">Active</span>
              </div>
            )}
          </div>
          
          {hasAccount('investor') ? (
            // Show switch button if account exists
            <Button 
              variant={currentAccountType === 'investor' ? "default" : "outline"}
              className={`w-full h-12 ${
                currentAccountType === 'investor' 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'text-gray-700 border-gray-300 hover:bg-green-50'
              }`}
              onClick={() => handleAccountSwitch('investor')}
              disabled={switching || currentAccountType === 'investor'}
            >
              {currentAccountType === 'investor' ? 'Current Account' : 'Switch to Investor Account'}
            </Button>
          ) : (
            // Show registration buttons if account doesn't exist
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-12 text-gray-700 border-gray-300 hover:bg-blue-50"
                onClick={() => handleCreateAccount('investor')}
                disabled={switching}
              >
                + Company Account
              </Button>
              <Button 
                variant="outline" 
                className="h-12 text-gray-700 border-gray-300 hover:bg-blue-50"
                onClick={() => handleCreateAccount('investor')}
                disabled={switching}
              >
                + Individual Account
              </Button>
            </div>
          )}
        </div>

        {/* Issue/Borrow Account */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-yellow-700" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Issue/Borrow Account</span>
            </div>
            {hasAccount('borrower') && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">Active</span>
              </div>
            )}
          </div>
          
          {hasAccount('borrower') ? (
            // Show switch button if account exists
            <Button 
              variant={currentAccountType === 'borrower' ? "default" : "outline"}
              className={`w-full h-12 ${
                currentAccountType === 'borrower' 
                  ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500' 
                  : 'text-gray-700 border-gray-300 hover:bg-yellow-50'
              }`}
              onClick={() => handleAccountSwitch('borrower')}
              disabled={switching || currentAccountType === 'borrower'}
            >
              {currentAccountType === 'borrower' ? 'Current Account' : 'Switch to Borrower Account'}
            </Button>
          ) : (
            // Show registration buttons if account doesn't exist
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline"
                className="h-12 text-gray-700 border-gray-300 hover:bg-yellow-100"
                onClick={() => handleCreateAccount('borrower')}
                disabled={switching}
              >
                + Company Account
              </Button>
              <Button 
                variant="outline"
                className="h-12 text-gray-700 border-gray-300 hover:bg-yellow-100"
                onClick={() => handleCreateAccount('borrower')}
                disabled={switching}
              >
                + Individual Account
              </Button>
            </div>
          )}
        </div>

        {/* User Info Section */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>User: {getCurrentAccountLabel()}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProfileCode(!showProfileCode)}
              className="p-1 h-auto text-xs"
            >
              {showProfileCode ? 
                <EyeOffIcon className="w-3 h-3 mr-1" /> : 
                <EyeIcon className="w-3 h-3 mr-1" />
              }
              Profile Code
            </Button>
          </div>
          {showProfileCode && (
            <div className="mt-2 text-xs text-gray-500">
              Profile Code: {getProfileCode()}
            </div>
          )}
          
          {/* Debug Info - Hidden for now, will check later */}
          {/* 
          <div className="mt-2 text-xs text-gray-400 bg-gray-50 p-2 rounded">
            <div>Has Borrower: {hasAccount('borrower') ? '✅' : '❌'}</div>
            <div>Has Investor: {hasAccount('investor') ? '✅' : '❌'}</div>
            <div>Current: {currentAccountType}</div>
            <div>Loading: {loading ? '⏳' : '✅'}</div>
          </div>
          */}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
