// src/layouts/OwnerLayout.tsx
import React, { ReactNode } from 'react';
import { OwnerSidebar } from '../components/owner/OwnerSidebar';
import { OwnerHeader } from '../components/owner/OwnerHeader';

interface OwnerLayoutProps {
  children: ReactNode;
  activePage?: string;
  showHeader?: boolean;
}

export const OwnerLayout: React.FC<OwnerLayoutProps> = ({ 
  children, 
  activePage = '', 
  showHeader = true 
}) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <OwnerSidebar activePage={activePage} />

      {/* Main content */}
      <div className="flex-1 ml-[280px]">
        {/* Header */}
        {showHeader && <OwnerHeader />}
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};