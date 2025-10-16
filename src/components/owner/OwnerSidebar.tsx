// src/components/owner/OwnerSidebar.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authFetch } from '../../lib/api';
import { API_BASE_URL } from '../../config/environment';
import { 
  HomeIcon, 
  CalendarIcon, 
  UsersIcon, 
  FolderIcon,
  Users2Icon,
  SettingsIcon,
  WalletIcon,
  TrendingUpIcon,
  LogOutIcon,
  UserCogIcon,
  XIcon
} from 'lucide-react';

interface OwnerSidebarProps {
  activePage?: string;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

interface TeamPermissions {
  isAdmin: boolean;
  permissions: string[];
}

export const OwnerSidebar: React.FC<OwnerSidebarProps> = ({ 
  activePage = '', 
  isMobileMenuOpen = false, 
  setIsMobileMenuOpen 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, profile } = useAuth();
  const [teamPermissions, setTeamPermissions] = useState<TeamPermissions | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Fetch team permissions to determine what menu items to show
  const fetchPermissions = async () => {
    // If user profile indicates admin, use that directly
    if (profile?.isAdmin) {
      setTeamPermissions({ isAdmin: true, permissions: ['*'] });
      setLastFetchTime(Date.now());
      return;
    }

    try {
      const data = await authFetch(`${API_BASE_URL}/team/my-permissions`);
      setTeamPermissions(data);
      setLastFetchTime(Date.now());
      console.log('✅ Permissions refreshed:', data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      // If fetch fails, fall back to profile admin status
      setTeamPermissions({ 
        isAdmin: profile?.isAdmin || false, 
        permissions: [] 
      });
    }
  };

  // Initial fetch when profile loads
  useEffect(() => {
    if (profile) {
      fetchPermissions();
    }
  }, [profile]);

  // Auto-refresh permissions every 30 seconds while on owner pages
  useEffect(() => {
    if (!profile || !location.pathname.startsWith('/owner')) return;

    const interval = setInterval(() => {
      const timeSinceLastFetch = Date.now() - lastFetchTime;
      // Only refresh if it's been more than 25 seconds (to avoid race conditions)
      if (timeSinceLastFetch >= 25000) {
        console.log('🔄 Auto-refreshing permissions...');
        fetchPermissions();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [profile, location.pathname, lastFetchTime]);

  // Refresh permissions when navigating to owner pages
  useEffect(() => {
    if (!profile) return;

    // If navigating to an owner page and it's been more than 10 seconds since last fetch
    if (location.pathname.startsWith('/owner')) {
      const timeSinceLastFetch = Date.now() - lastFetchTime;
      if (timeSinceLastFetch >= 10000) {
        console.log('🔄 Refreshing permissions on navigation...');
        fetchPermissions();
      }
    }
  }, [location.pathname, profile]);

  // Listen for manual permission refresh events (triggered by notifications)
  useEffect(() => {
    const handleRefreshPermissions = () => {
      console.log('🔔 Permission refresh triggered by notification');
      fetchPermissions();
    };

    window.addEventListener('refreshPermissions', handleRefreshPermissions);
    return () => window.removeEventListener('refreshPermissions', handleRefreshPermissions);
  }, [profile]);

  // Define all possible nav items with their required permissions
  // Note: requiredPermissions can be an array - if user has ANY of them, they can access
  const allNavItems = [
    { icon: <HomeIcon className="w-5 h-5" />, label: "Dashboard", to: '/owner/dashboard', key: 'dashboard', adminOnly: false },
    { icon: <CalendarIcon className="w-5 h-5" />, label: "Calendar", to: '/calendar', key: 'calendar', adminOnly: false },
    { icon: <UsersIcon className="w-5 h-5" />, label: "Users", to: '/owner/users', key: 'users', requiredPermissions: ['users.view', 'users.edit'] },
    { icon: <FolderIcon className="w-5 h-5" />, label: "Projects", to: '/owner/projects', key: 'projects', requiredPermissions: ['projects.view', 'projects.edit'] },
    { icon: <Users2Icon className="w-5 h-5" />, label: "My Team", to: '/owner/team', key: 'team', adminOnly: true },
    
    // Existing Admin Tools
    { icon: <SettingsIcon className="w-5 h-5" />, label: "Admin Projects", to: '/admin/projects', key: 'admin-projects', adminOnly: true },
    { icon: <WalletIcon className="w-5 h-5" />, label: "Top-up Requests", to: '/admin/topup-requests', key: 'admin-topup', adminOnly: true },
    { icon: <TrendingUpIcon className="w-5 h-5" />, label: "Investment Requests", to: '/admin/investment-requests', key: 'admin-investments', requiredPermissions: ['investments.view', 'investments.edit'] },
    
    { icon: <UserCogIcon className="w-5 h-5" />, label: "Settings", to: '/owner/settings', key: 'settings', adminOnly: false },
  ];

  // Filter nav items based on permissions
  const ownerNavItems = allNavItems.filter((item) => {
    // Still loading permissions
    if (!teamPermissions) return false;

    // Admin can see everything
    if (teamPermissions.isAdmin) {
      console.log(`✅ Admin access - showing item: ${item.label}`);
      return true;
    }

    // Admin-only item
    if (item.adminOnly) {
      console.log(`❌ Hiding admin-only item: ${item.label}`);
      return false;
    }

    // Item requires specific permissions (array)
    if (item.requiredPermissions) {
      const hasPermission = item.requiredPermissions.some(perm => 
        teamPermissions.permissions.includes(perm)
      );
      console.log(`${hasPermission ? '✅' : '❌'} ${item.label}: Required [${item.requiredPermissions.join(', ')}], Has: [${teamPermissions.permissions.join(', ')}]`);
      return hasPermission;
    }

    // No specific requirement, show it
    console.log(`✅ Showing public item: ${item.label}`);
    return true;
  });

  const isActiveNavItem = (navItem: any): boolean => {
    const currentPath = location.pathname;
    return currentPath === navItem.to || 
           activePage === navItem.key || 
           (navItem.key === 'dashboard' && currentPath.includes('/owner'));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleNavClick = () => {
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        w-[280px] h-screen bg-white shadow-lg flex flex-col fixed left-0 top-0 z-50
        transition-transform duration-300 ease-in-out lg:transform-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-[#0C4B20] to-[#8FB200] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">I</span>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">Investie</h1>
                <p className="text-sm text-gray-500">Owner Portal</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {ownerNavItems.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              onClick={handleNavClick}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActiveNavItem(item)
                  ? 'bg-[#0C4B20] text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-[#0C4B20]'
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </Link>
          ))}
        </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {profile?.name?.charAt(0)?.toUpperCase() || 'O'}
            </span>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile?.name || 'Owner'}
            </p>
            <p className="text-xs text-gray-500">Owner</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200"
        >
          <LogOutIcon className="w-4 h-4 mr-2" />
          Log Out
        </button>
      </div>
      </div>
    </>
  );
};