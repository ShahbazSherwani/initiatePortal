import React, { ReactNode } from 'react';
import { Sidebar } from '../components/Sidebar/Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  activePage?: string;
  showSidebar?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  activePage = '', 
  showSidebar = true 
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - consistent across all pages */}
        {showSidebar && (
          <div className="w-0 md:w-[280px] flex-shrink-0">
            <Sidebar activePage={activePage} />
          </div>
        )}

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
