import React from 'react';
import { OwnerLayout } from '../layouts/OwnerLayout';
import { UnifiedCalendar } from '../components/UnifiedCalendar';
import { useAuth } from '../contexts/AuthContext';
import { CalendarIcon } from 'lucide-react';

export const UnifiedCalendarView: React.FC = () => {
  const { profile } = useAuth();
  
  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#0C4B20] bg-opacity-10 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-[#0C4B20]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Calendar</h1>
              <p className="text-gray-600 mt-1">
                {profile?.isAdmin ? 'View all projects and investment schedules' : 
                 profile?.role === 'investor' ? 'Track your investments and payouts' : 'Manage your project timelines'}
              </p>
            </div>
          </div>
          
          {profile?.isAdmin && (
            <div className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-lg font-medium">
              Admin View
            </div>
          )}
        </div>
        
        {/* Calendar Component */}
        <UnifiedCalendar />
      </div>
    </OwnerLayout>
  );
};

export default UnifiedCalendarView;