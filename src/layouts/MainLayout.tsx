import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navigation/navbar';
import { useAuth } from '../contexts/AuthContext';

export const MainLayout = () => {
  const { profile } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* ONLY render the navbar once here */}
      <Navbar activePage="home" showAuthButtons={false} />
      
      {/* Everything else is rendered via Outlet */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
