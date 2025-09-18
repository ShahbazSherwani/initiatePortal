import React from 'react';
import { useAccount } from '../contexts/AccountContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

export const SidebarDebug: React.FC = () => {
  const { currentAccountType, borrowerProfile, investorProfile, loading, canCreateNewProject } = useAccount();
  const { user, token } = useAuth();
  const location = useLocation();

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 text-xs max-w-sm rounded z-50 opacity-80">
      <h3 className="font-bold mb-2">Sidebar Debug</h3>
      <div>
        <p><strong>Current Path:</strong> {location.pathname}</p>
        <p><strong>User UID:</strong> {user?.uid || 'None'}</p>
        <p><strong>Token:</strong> {token ? 'Present' : 'None'}</p>
        <p><strong>Account Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        <p><strong>Current Account Type:</strong> {currentAccountType}</p>
        <p><strong>Borrower Profile:</strong> {borrowerProfile ? 'Yes' : 'No'}</p>
        <p><strong>Investor Profile:</strong> {investorProfile ? 'Yes' : 'No'}</p>
        <p><strong>Can Create Project:</strong> {canCreateNewProject ? 'Yes' : 'No'}</p>
        
        {borrowerProfile && (
          <div className="mt-2">
            <p><strong>Borrower Complete:</strong> {borrowerProfile.isComplete ? 'Yes' : 'No'}</p>
            <p><strong>Borrower Name:</strong> {borrowerProfile.data?.fullName || borrowerProfile.data?.full_name || 'None'}</p>
          </div>
        )}
        
        {investorProfile && (
          <div className="mt-2">
            <p><strong>Investor Complete:</strong> {investorProfile.isComplete ? 'Yes' : 'No'}</p>
            <p><strong>Investor Name:</strong> {investorProfile.data?.fullName || investorProfile.data?.full_name || 'None'}</p>
          </div>
        )}
      </div>
    </div>
  );
};