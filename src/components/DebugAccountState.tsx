import React from 'react';
import { useAccount } from '../contexts/AccountContext';

export const DebugAccountState: React.FC = () => {
  const { 
    currentAccountType, 
    borrowerProfile, 
    investorProfile, 
    hasAccount, 
    loading 
  } = useAccount();

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: '#000',
        color: '#fff',
        padding: '10px',
        fontSize: '12px',
        borderRadius: '5px',
        zIndex: 10000,
        maxWidth: '300px',
        fontFamily: 'monospace'
      }}
    >
      <div><strong>🔍 Account Debug Info</strong></div>
      <div>Current Type: {currentAccountType}</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>Has Borrower: {hasAccount('borrower') ? 'Yes' : 'No'}</div>
      <div>Has Investor: {hasAccount('investor') ? 'Yes' : 'No'}</div>
      <div>Borrower Profile: {borrowerProfile ? 'Yes' : 'No'}</div>
      <div>Investor Profile: {investorProfile ? 'Yes' : 'No'}</div>
      <div>localStorage: {localStorage.getItem('currentAccountType')}</div>
      <div>URL: {window.location.pathname}</div>
    </div>
  );
};
