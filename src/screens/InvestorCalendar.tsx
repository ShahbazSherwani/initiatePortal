import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { UnifiedCalendar } from '../components/UnifiedCalendar';

export const InvestorCalendar: React.FC = () => {
  const { profile, token } = useContext(AuthContext)!;

  if (!token) return <Navigate to="/login" />;

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar desktop */}
        <div className="hidden md:block w-[325px]">
          <Sidebar activePage="Calendar" />
        </div>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">
                Investor Calendar
              </h1>
              
              <div className="text-sm text-gray-600">
                {profile?.role === 'investor' ? 'View and invest in available projects' : 'Calendar View'}
              </div>
            </div>
            
            <UnifiedCalendar />
          </div>
        </main>
      </div>
    </div>
  );
};

export default InvestorCalendar;