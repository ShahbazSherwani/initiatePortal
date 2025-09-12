import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { EnhancedCalendar } from '../components/EnhancedCalendar';

export const BorrowerCalender: React.FC = () => {
  const { token } = useContext(AuthContext)!;

  if (!token) return <Navigate to="/login" />;

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-0 md:w-[280px] flex-shrink-0">
          <Sidebar activePage="Calendar" />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">Calendar</h1>
              <p className="text-gray-600">View approved project events and deadlines</p>
            </div>
            
            <EnhancedCalendar />
          </div>
        </main>
      </div>
    </div>
  );
};

export default BorrowerCalender;
