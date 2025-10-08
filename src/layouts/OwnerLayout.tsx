// src/layouts/OwnerLayout.tsx
import React, { ReactNode, useState } from 'react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <OwnerSidebar 
        activePage={activePage} 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main content */}
      
      <div className="flex-1 lg:ml-[280px]">
        {/* Header */}
        {showHeader && <OwnerHeader onMenuClick={() => setIsMobileMenuOpen(true)} />}
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};