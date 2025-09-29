// src/components/owner/OwnerSidebar.tsx
import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
  UserCogIcon
} from 'lucide-react';

interface OwnerSidebarProps {
  activePage?: string;
}

export const OwnerSidebar: React.FC<OwnerSidebarProps> = ({ activePage = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, profile } = useAuth();

  const ownerNavItems = [
    { icon: <HomeIcon className="w-5 h-5" />, label: "Dashboard", to: '/owner/dashboard', key: 'dashboard' },
    { icon: <CalendarIcon className="w-5 h-5" />, label: "Calendar", to: '/calendar', key: 'calendar' },
    { icon: <UsersIcon className="w-5 h-5" />, label: "Users", to: '/owner/users', key: 'users' },
    { icon: <FolderIcon className="w-5 h-5" />, label: "Projects", to: '/owner/projects', key: 'projects' },
    { icon: <Users2Icon className="w-5 h-5" />, label: "My Team", to: '/owner/team', key: 'team' },
    
    // Existing Admin Tools
    { icon: <SettingsIcon className="w-5 h-5" />, label: "Admin Projects", to: '/admin/projects', key: 'admin-projects' },
    { icon: <WalletIcon className="w-5 h-5" />, label: "Top-up Requests", to: '/admin/topup-requests', key: 'admin-topup' },
    { icon: <TrendingUpIcon className="w-5 h-5" />, label: "Investment Requests", to: '/admin/investment-requests', key: 'admin-investments' },
    
    { icon: <UserCogIcon className="w-5 h-5" />, label: "Settings", to: '/owner/settings', key: 'settings' },
  ];

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

  return (
    <div className="w-[280px] h-screen bg-white shadow-lg flex flex-col fixed left-0 top-0 z-10">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-[#0C4B20] to-[#8FB200] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">I</span>
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-gray-900">Investie</h1>
            <p className="text-sm text-gray-500">Owner Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {ownerNavItems.map((item) => (
          <Link
            key={item.key}
            to={item.to}
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
            <p className="text-xs text-gray-500">Super Admin</p>
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
  );
};