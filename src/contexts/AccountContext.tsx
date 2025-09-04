// src/contexts/AccountContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config/environment';

export type AccountType = 'borrower' | 'investor';

export interface AccountProfile {
  id: string;
  type: AccountType;
  userId: string;
  isComplete: boolean;
  hasActiveProject?: boolean; // For borrowers
  data: {
    fullName?: string;
    occupation?: string;
    location?: string;
    businessType?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    experience?: string;
    investmentPreference?: string; // For investors
    riskTolerance?: string; // For investors
    portfolioValue?: number; // For investors
  };
  createdAt: string;
  updatedAt: string;
}

interface AccountContextType {
  currentAccountType: AccountType;
  borrowerProfile: AccountProfile | null;
  investorProfile: AccountProfile | null;
  switchAccount: (accountType: AccountType) => Promise<void>;
  createAccount: (accountType: AccountType, data: any) => Promise<AccountProfile>;
  updateAccount: (accountType: AccountType, data: any) => Promise<AccountProfile>;
  hasAccount: (accountType: AccountType) => boolean;
  canCreateNewProject: boolean; // For borrower account
  loading: boolean;
  refreshAccounts: () => Promise<void>;
}

export const AccountContext = createContext<AccountContextType | null>(null);

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};

export const AccountProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  
  // Initialize current account type from localStorage if available
  const [currentAccountType, setCurrentAccountType] = useState<AccountType>(() => {
    const stored = localStorage.getItem('currentAccountType') as AccountType;
    const initialType = (stored === 'borrower' || stored === 'investor') ? stored : 'borrower';
    console.log('🚀 AccountContext initialized with account type:', initialType, '(from localStorage:', stored, ')');
    return initialType;
  });
  
  const [borrowerProfile, setBorrowerProfile] = useState<AccountProfile | null>(null);
  const [investorProfile, setInvestorProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [canCreateNewProject, setCanCreateNewProject] = useState(true);

  // Fetch account profiles when user authenticates
  const fetchAccounts = async () => {
    if (!user || !token) {
      setBorrowerProfile(null);
      setInvestorProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Use the new dual accounts API endpoint
      console.log('🔍 Fetching accounts from:', `${API_BASE_URL}/accounts`);
      const response = await fetch(`${API_BASE_URL}/accounts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('📡 Accounts API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Accounts API response data:', data);
        console.log('👤 Borrower data:', data.accounts?.borrower);
        console.log('💼 Investor data:', data.accounts?.investor);
        console.log('📋 User data:', data.user);
        
        // Transform the new API response to match our existing interface
        if (data.accounts?.borrower) {
          const borrower = data.accounts.borrower;
          console.log('👤 Setting borrower profile:', borrower);
          setBorrowerProfile({
            id: borrower.profile.id.toString(),
            type: 'borrower',
            userId: user.uid,
            isComplete: borrower.isComplete,
            hasActiveProject: borrower.hasActiveProject,
            data: {
              fullName: borrower.profile.full_name,
              occupation: borrower.profile.occupation,
              location: borrower.profile.location,
              businessType: borrower.profile.business_type,
              phoneNumber: borrower.profile.phone_number,
              dateOfBirth: borrower.profile.date_of_birth,
              experience: borrower.profile.experience,
            },
            createdAt: borrower.profile.created_at,
            updatedAt: borrower.profile.updated_at,
          });
          
          // Set canCreateNewProject based on hasActiveProject
          setCanCreateNewProject(!borrower.hasActiveProject);
        } else {
          console.log('❌ No borrower profile found in API response');
          setBorrowerProfile(null);
        }

        if (data.accounts?.investor) {
          const investor = data.accounts.investor;
          console.log('💼 Setting investor profile:', investor);
          setInvestorProfile({
            id: investor.profile.id.toString(),
            type: 'investor',
            userId: user.uid,
            isComplete: investor.isComplete,
            data: {
              fullName: investor.profile.full_name,
              location: investor.profile.location,
              phoneNumber: investor.profile.phone_number,
              dateOfBirth: investor.profile.date_of_birth,
              investmentPreference: investor.profile.investment_preference,
              riskTolerance: investor.profile.risk_tolerance,
              portfolioValue: investor.portfolioValue,
            },
            createdAt: investor.profile.created_at,
            updatedAt: investor.profile.updated_at,
          });
        } else {
          console.log('❌ No investor profile found in API response');
          setInvestorProfile(null);
        }

        // Set current account type from API response or localStorage
        const storedAccountType = localStorage.getItem('currentAccountType') as AccountType;
        console.log('🔍 Account type resolution:');
        console.log('  - Server currentAccountType:', data.user.currentAccountType);
        console.log('  - localStorage accountType:', storedAccountType);
        console.log('  - Current state before update:', currentAccountType);
        
        if (data.user.currentAccountType) {
          console.log('  - Using server account type:', data.user.currentAccountType);
          setCurrentAccountType(data.user.currentAccountType);
          localStorage.setItem('currentAccountType', data.user.currentAccountType);
        } else if (storedAccountType && (storedAccountType === 'borrower' || storedAccountType === 'investor')) {
          console.log('  - Using localStorage account type:', storedAccountType);
          setCurrentAccountType(storedAccountType);
        } else {
          console.log('  - No account type found, keeping current state:', currentAccountType);
        }

        // Temporary fallback: Create mock profiles if user has current account type but no profile
        // This handles cases where database flags are set but profile data is incomplete
        if (data.user.currentAccountType && !data.accounts?.borrower && !data.accounts?.investor) {
          console.log('🔧 Creating fallback account profile for:', data.user.currentAccountType);
          console.log('📝 Note: User has account flags set but profile data may be incomplete');
          
          const mockProfile: AccountProfile = {
            id: user.uid, // Use Firebase UID as fallback ID
            type: data.user.currentAccountType,
            userId: user.uid,
            isComplete: true, // Assume complete since user has access
            data: {
              fullName: data.user.full_name || 'User',
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          if (data.user.currentAccountType === 'borrower') {
            setBorrowerProfile(mockProfile);
            setCanCreateNewProject(true); // Allow project creation
          } else {
            setInvestorProfile(mockProfile);
          }
        }
      } else if (response.status === 404) {
        // User doesn't have accounts yet, that's okay
        console.log('ℹ️ No accounts found (404) - user needs to create accounts');
        setBorrowerProfile(null);
        setInvestorProfile(null);
      } else {
        console.error('❌ Error fetching account profiles:', response.status, response.statusText);
      }

    } catch (error) {
      console.error('Error fetching account profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh accounts data
  const refreshAccounts = async () => {
    await fetchAccounts();
  };

  useEffect(() => {
    fetchAccounts();
  }, [user, token]);

  const switchAccount = async (accountType: AccountType) => {
    if (accountType === 'borrower' && !borrowerProfile) {
      throw new Error('Borrower account does not exist');
    }
    if (accountType === 'investor' && !investorProfile) {
      throw new Error('Investor account does not exist');
    }
    
    try {
      // Use the new API endpoint to switch accounts
      const response = await fetch(`${API_BASE_URL}/accounts/switch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accountType })
      });

      if (!response.ok) {
        throw new Error(`Failed to switch to ${accountType} account`);
      }

      console.log('🔄 Account switch successful:', {
        from: currentAccountType,
        to: accountType,
        timestamp: new Date().toISOString()
      });

      setCurrentAccountType(accountType);
      localStorage.setItem('currentAccountType', accountType);
      
      console.log('✅ Account type updated in state and localStorage:', accountType);
      
    } catch (error) {
      console.error('Error switching account:', error);
      throw error;
    }
  };

  const createAccount = async (accountType: AccountType, data: any) => {
    if (!user || !token) {
      throw new Error('User must be authenticated to create account');
    }

    try {
      // Transform data to match the new API format
      const profileData: any = {};
      
      if (data.fullName) profileData.fullName = data.fullName;
      if (data.occupation) profileData.occupation = data.occupation;
      if (data.location) profileData.location = data.location;
      if (data.businessType) profileData.businessType = data.businessType;
      if (data.phoneNumber) profileData.phoneNumber = data.phoneNumber;
      if (data.dateOfBirth) profileData.dateOfBirth = data.dateOfBirth;
      if (data.experience) profileData.experience = data.experience;
      if (data.investmentExperience) profileData.investmentExperience = data.investmentExperience;
      if (data.investmentPreference) profileData.investmentPreference = data.investmentPreference;
      if (data.riskTolerance) profileData.riskTolerance = data.riskTolerance;

      const response = await fetch(`${API_BASE_URL}/accounts/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          accountType, 
          profileData 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create ${accountType} account`);
      }

      const result = await response.json();
      const newAccount = result.account;
      
      // Transform the response to match our interface
      const transformedAccount: AccountProfile = {
        id: newAccount.profile.id.toString(),
        type: accountType,
        userId: user.uid,
        isComplete: newAccount.isComplete,
        hasActiveProject: accountType === 'borrower' ? newAccount.hasActiveProject : undefined,
        data: {
          fullName: newAccount.profile.full_name,
          occupation: newAccount.profile.occupation,
          location: newAccount.profile.location,
          businessType: newAccount.profile.business_type,
          phoneNumber: newAccount.profile.phone_number,
          dateOfBirth: newAccount.profile.date_of_birth,
          experience: newAccount.profile.experience,
          investmentPreference: newAccount.profile.investment_preference,
          riskTolerance: newAccount.profile.risk_tolerance,
          portfolioValue: newAccount.portfolioValue,
        },
        createdAt: newAccount.profile.created_at,
        updatedAt: newAccount.profile.updated_at,
      };

      if (accountType === 'borrower') {
        setBorrowerProfile(transformedAccount);
        setCanCreateNewProject(!newAccount.hasActiveProject);
      } else {
        setInvestorProfile(transformedAccount);
      }

      return transformedAccount;
    } catch (error) {
      console.error(`Error creating ${accountType} account:`, error);
      throw error;
    }
  };

  const updateAccount = async (accountType: AccountType, data: any) => {
    if (!user || !token) {
      throw new Error('User must be authenticated to update account');
    }

    try {
      // Transform data to match the new API format
      const profileData: any = {};
      
      if (data.fullName !== undefined) profileData.full_name = data.fullName;
      if (data.occupation !== undefined) profileData.occupation = data.occupation;
      if (data.location !== undefined) profileData.location = data.location;
      if (data.businessType !== undefined) profileData.business_type = data.businessType;
      if (data.phoneNumber !== undefined) profileData.phone_number = data.phoneNumber;
      if (data.dateOfBirth !== undefined) profileData.date_of_birth = data.dateOfBirth;
      if (data.experience !== undefined) profileData.experience = data.experience;
      if (data.investmentExperience !== undefined) profileData.investment_experience = data.investmentExperience;
      if (data.investmentPreference !== undefined) profileData.investment_preference = data.investmentPreference;
      if (data.riskTolerance !== undefined) profileData.risk_tolerance = data.riskTolerance;
      if (data.portfolioValue !== undefined) profileData.portfolio_value = data.portfolioValue;

      const response = await fetch(`${API_BASE_URL}/accounts/${accountType}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update ${accountType} account`);
      }

      const result = await response.json();
      const updatedProfile = result.profile;
      
      // Transform the response to match our interface
      const transformedAccount: AccountProfile = {
        id: updatedProfile.id.toString(),
        type: accountType,
        userId: user.uid,
        isComplete: updatedProfile.is_complete,
        hasActiveProject: accountType === 'borrower' ? updatedProfile.has_active_project : undefined,
        data: {
          fullName: updatedProfile.full_name,
          occupation: updatedProfile.occupation,
          location: updatedProfile.location,
          businessType: updatedProfile.business_type,
          phoneNumber: updatedProfile.phone_number,
          dateOfBirth: updatedProfile.date_of_birth,
          experience: updatedProfile.experience,
          investmentPreference: updatedProfile.investment_preference,
          riskTolerance: updatedProfile.risk_tolerance,
          portfolioValue: parseFloat(updatedProfile.portfolio_value || 0),
        },
        createdAt: updatedProfile.created_at,
        updatedAt: updatedProfile.updated_at,
      };
      
      if (accountType === 'borrower') {
        setBorrowerProfile(transformedAccount);
        setCanCreateNewProject(!updatedProfile.has_active_project);
      } else {
        setInvestorProfile(transformedAccount);
      }

      return transformedAccount;
    } catch (error) {
      console.error(`Error updating ${accountType} account:`, error);
      throw error;
    }
  };

  const hasAccount = (accountType: AccountType): boolean => {
    return accountType === 'borrower' ? borrowerProfile !== null : investorProfile !== null;
  };

  const contextValue: AccountContextType = {
    currentAccountType,
    borrowerProfile,
    investorProfile,
    switchAccount,
    createAccount,
    updateAccount,
    hasAccount,
    canCreateNewProject,
    loading,
    refreshAccounts
  };

  return (
    <AccountContext.Provider value={contextValue}>
      {children}
    </AccountContext.Provider>
  );
};
