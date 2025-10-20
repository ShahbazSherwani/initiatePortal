import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navigation/navbar';
import { useAuth } from '../contexts/AuthContext';
import { DebugAccountState } from '../components/DebugAccountState';

export const MainLayout = () => {
  const { profile } = useAuth();

  const location = useLocation();
  const hideNavbarPaths = ['/owner/dashboard', '/owner/projects', '/owner/users', '/owner/team', '/owner/settings', '/calendar','/admin/projects', '/admin/topup-requests', '/admin/investment-requests'];
  
  // Check if navbar should be hidden (exact match or starts with /owner/users/ or /owner/projects/ or /projects/)
  const shouldHideNavbar = hideNavbarPaths.includes(location.pathname) || 
                          location.pathname.startsWith('/owner/users/') ||
                          location.pathname.startsWith('/owner/projects/') ||
                          location.pathname.startsWith('/projects/');
  
  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Role indicator banner */}

      
      {/* ONLY navbar */}
      {!shouldHideNavbar && (
        <Navbar activePage="" showAuthButtons={!profile} />
      )}
      
      {/* Content */}
      <div className="flex-1 w-full overflow-hidden">
        <Outlet />
      </div>
      
      {/* Debug component for development */}
      <DebugAccountState />
    </div>
  );
};

export default MainLayout;
