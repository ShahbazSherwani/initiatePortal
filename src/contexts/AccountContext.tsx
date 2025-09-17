// src/contexts/AccountContext.tsx
// src/contexts/AccountContext.tsx
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config/environment';

export type AccountType = 'borrower' | 'investor';

export interface AccountProfile {
  id: string;
  type: AccountType;
  userId: string;
  isComplete: boolean;
  hasActiveProject?: boolean;
  data: Record<string, any>;
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
  canCreateNewProject: boolean;
  loading: boolean;
  refreshAccounts: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const useAccount = (): AccountContextType => {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used within AccountProvider');
  return ctx;
};

export const AccountProvider = ({ children }: { children: ReactNode }) => {
  const { user, token } = useAuth();
  const [currentAccountType, setCurrentAccountType] = useState<AccountType>('borrower');
  const [borrowerProfile, setBorrowerProfile] = useState<AccountProfile | null>(null);
  const [investorProfile, setInvestorProfile] = useState<AccountProfile | null>(null);
  const [canCreateNewProject, setCanCreateNewProject] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      if (!user || !token) {
        setBorrowerProfile(null);
        setInvestorProfile(null);
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const stored = localStorage.getItem('currentAccountType') as AccountType | null;
        if (data?.user?.currentAccountType) {
          setCurrentAccountType(data.user.currentAccountType);
          localStorage.setItem('currentAccountType', data.user.currentAccountType);
        } else if (stored) setCurrentAccountType(stored);

        if (data.accounts?.borrower) {
          const b = data.accounts.borrower;
          setBorrowerProfile({
            id: String(b.profile.id),
            type: 'borrower',
            userId: user.uid,
            isComplete: b.isComplete,
            hasActiveProject: b.hasActiveProject,
            data: b.profile,
            createdAt: b.profile.created_at,
            updatedAt: b.profile.updated_at,
          });
          setCanCreateNewProject(!b.hasActiveProject);
        } else setBorrowerProfile(null);

        if (data.accounts?.investor) {
          const iv = data.accounts.investor;
          setInvestorProfile({
            id: String(iv.profile.id),
            type: 'investor',
            userId: user.uid,
            isComplete: iv.isComplete,
            data: iv.profile,
            createdAt: iv.profile.created_at,
            updatedAt: iv.profile.updated_at,
          });
        } else setInvestorProfile(null);
      } else if (res.status === 404) {
        setBorrowerProfile(null);
        setInvestorProfile(null);
      } else {
        console.error('Error fetching accounts:', res.statusText);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAccounts = async () => fetchAccounts();

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const switchAccount = async (accountType: AccountType) => {
    if (accountType === 'borrower' && !borrowerProfile) throw new Error('Borrower account does not exist');
    if (accountType === 'investor' && !investorProfile) throw new Error('Investor account does not exist');

    const res = await fetch(`${API_BASE_URL}/accounts/switch`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountType })
    });

    if (!res.ok) throw new Error('Failed to switch account');
    setCurrentAccountType(accountType);
    localStorage.setItem('currentAccountType', accountType);
  };

  const createAccount = async (accountType: AccountType, data: any): Promise<AccountProfile> => {
    if (!user || !token) throw new Error('User must be authenticated to create account');

    const prev = { currentAccountType, borrowerProfile, investorProfile };

    // optimistic
    setCurrentAccountType(accountType);
    localStorage.setItem('currentAccountType', accountType);
    const mock: AccountProfile = {
      id: user.uid,
      type: accountType,
      userId: user.uid,
      isComplete: false,
      data: { full_name: (user as any)?.displayName || 'You' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (accountType === 'borrower') setBorrowerProfile(mock); else setInvestorProfile(mock);

    try {
      const payload: any = {};
      Object.keys(data || {}).forEach((k) => {
        const v = data[k];
        if (v !== undefined && v !== '') payload[k] = v;
      });

      const res = await fetch(`${API_BASE_URL}/accounts/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountType, profileData: payload })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create account');
      }

      const result = await res.json();
      const a = result.account;
      const transformed: AccountProfile = {
        id: String(a.profile.id),
        type: accountType,
        userId: user.uid,
        isComplete: a.isComplete,
        hasActiveProject: accountType === 'borrower' ? a.hasActiveProject : undefined,
        data: a.profile,
        createdAt: a.profile.created_at,
        updatedAt: a.profile.updated_at,
      };

      if (accountType === 'borrower') {
        setBorrowerProfile(transformed);
        setCanCreateNewProject(!a.hasActiveProject);
      } else setInvestorProfile(transformed);

      // reconcile in background
      fetchAccounts().catch((e) => console.warn('refresh after create failed', e));
      return transformed;
    } catch (err) {
      // rollback
      setCurrentAccountType(prev.currentAccountType);
      setBorrowerProfile(prev.borrowerProfile);
      setInvestorProfile(prev.investorProfile);
      localStorage.setItem('currentAccountType', prev.currentAccountType);
      throw err;
    }
  };

  const updateAccount = async (accountType: AccountType, data: any): Promise<AccountProfile> => {
    if (!user || !token) throw new Error('User must be authenticated to update account');

    const payload: any = {};
    if (data.fullName !== undefined) payload.full_name = data.fullName;
    if (data.occupation !== undefined) payload.occupation = data.occupation;
    if (data.location !== undefined) payload.location = data.location;
    if (data.businessType !== undefined) payload.business_type = data.businessType;
    if (data.phoneNumber !== undefined) payload.phone_number = data.phoneNumber;
    if (data.dateOfBirth !== undefined) payload.date_of_birth = data.dateOfBirth;
    if (data.experience !== undefined) payload.experience = data.experience;
    if (data.investmentExperience !== undefined) payload.investment_experience = data.investmentExperience;
    if (data.investmentPreference !== undefined) payload.investment_preference = data.investmentPreference;
    if (data.riskTolerance !== undefined) payload.risk_tolerance = data.riskTolerance;
    if (data.portfolioValue !== undefined) payload.portfolio_value = data.portfolioValue;

    const res = await fetch(`${API_BASE_URL}/accounts/${accountType}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update account');
    }

    const result = await res.json();
    const updated = result.profile;
    const transformed: AccountProfile = {
      id: String(updated.id),
      type: accountType,
      userId: user.uid,
      isComplete: updated.is_complete,
      hasActiveProject: accountType === 'borrower' ? updated.has_active_project : undefined,
      data: updated,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };

    if (accountType === 'borrower') {
      setBorrowerProfile(transformed);
      setCanCreateNewProject(!updated.has_active_project);
    } else setInvestorProfile(transformed);

    return transformed;
  };

  const hasAccount = (accountType: AccountType) => (accountType === 'borrower' ? borrowerProfile !== null : investorProfile !== null);

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
    refreshAccounts,
  };

  return <AccountContext.Provider value={contextValue}>{children}</AccountContext.Provider>;
};

export default AccountContext;

