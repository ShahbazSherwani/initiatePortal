import React from 'react';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { UnifiedCalendar } from '../components/UnifiedCalendar';
import { useAuth } from '../contexts/AuthContext';

export const UnifiedCalendarView: React.FC = () => {
  const { profile } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block w-[280px] flex-shrink-0">
          <Sidebar activePage="Calendar" />
        </div>
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">
                {profile?.isAdmin ? 'Admin Calendar' : 
                 profile?.role === 'investor' ? 'Investor Calendar' : 'Project Calendar'}
              </h1>
              
              {profile?.isAdmin && (
                <div className="text-sm text-blue-600">
                  Admin View: You can see all projects
                </div>
              )}
            </div>
            
            <UnifiedCalendar />
          </div>
        </main>
      </div>
    </div>
  );
};

export default UnifiedCalendarView;