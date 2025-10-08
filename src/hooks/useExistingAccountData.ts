import { useState, useEffect } from 'react';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';

export interface ExistingAccountData {
  personalInfo?: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    dateOfBirth?: string;
    placeOfBirth?: string;
    nationality?: string;
    gender?: string;
    civilStatus?: string;
    motherMaidenName?: string;
  };
  identification?: {
    nationalId?: string;
    passport?: string;
    tin?: string;
    nationalIdFile?: string;
    passportFile?: string;
    secondaryIdType?: string;
    secondaryIdNumber?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  contact?: {
    mobileNumber?: string;
    countryCode?: string;
    emailAddress?: string;
    contactEmail?: string;
  };
}

export interface UseExistingAccountDataResult {
  existingData: ExistingAccountData | null;
  hasExistingAccount: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch existing account data for dual account creation
 * Automatically pre-populates form fields with data from the user's other account type
 * 
 * @param targetAccountType - 'borrower' or 'investor' (the new account type being created)
 * @returns Object containing existingData, hasExistingAccount flag, loading state, and error
 * 
 * @example
 * ```tsx
 * const { existingData, hasExistingAccount, isLoading } = useExistingAccountData('investor');
 * 
 * useEffect(() => {
 *   if (hasExistingAccount && existingData) {
 *     setFirstName(existingData.personalInfo?.firstName || '');
 *     setNationalId(existingData.identification?.nationalId || '');
 *   }
 * }, [existingData, hasExistingAccount]);
 * ```
 */
export const useExistingAccountData = (
  targetAccountType: 'borrower' | 'investor'
): UseExistingAccountDataResult => {
  const [existingData, setExistingData] = useState<ExistingAccountData | null>(null);
  const [hasExistingAccount, setHasExistingAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await authFetch(
          `${API_BASE_URL}/profile/existing-account-data?targetAccountType=${targetAccountType}`
        );

        if (response.hasExistingAccount && response.existingData) {
          setExistingData(response.existingData);
          setHasExistingAccount(true);
          console.log('✅ Found existing account data for pre-population:', response.existingData);
        } else {
          setExistingData(null);
          setHasExistingAccount(false);
          console.log('ℹ️ No existing account data found - user is creating their first account');
        }
      } catch (err) {
        console.error('❌ Error fetching existing account data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch existing account data');
        setExistingData(null);
        setHasExistingAccount(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingData();
  }, [targetAccountType]);

  return {
    existingData,
    hasExistingAccount,
    isLoading,
    error,
  };
};
