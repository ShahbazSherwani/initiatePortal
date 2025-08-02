import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navigation/navbar';
import { useAuth } from '../contexts/AuthContext';

export const MainLayout = () => {
  const { profile } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Role indicator banner */}

      {/* ONLY navbar */}
      <Navbar activePage="" showAuthButtons={!profile} />
      
      {/* Content */}
      <div className="flex-1 w-full overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
