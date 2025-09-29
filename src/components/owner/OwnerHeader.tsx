// src/components/owner/OwnerHeader.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  SearchIcon, 
  BellIcon, 
  ChevronDownIcon,
  SettingsIcon,
  LogOutIcon,
  SwitchCameraIcon
} from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export const OwnerHeader: React.FC = () => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement global search functionality
      console.log('Search:', searchQuery);
      // navigate(`/owner/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSwitchRole = () => {
    // Navigate back to normal user interface
    navigate('/borrow'); // or appropriate default route for normal users
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearch} className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search users, projects, or team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-2xl border-gray-300 focus:border-[#0C4B20] focus:ring-[#0C4B20]"
            />
          </form>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="p-2">
            <BellIcon className="w-5 h-5 text-gray-600" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 hover:bg-gray-50 p-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.profilePicture || "/ellipse-1.png"} alt="avatar" />
                  <AvatarFallback className="bg-gradient-to-br from-[#0C4B20] to-[#8FB200] text-white text-sm">
                    {profile?.name?.charAt(0)?.toUpperCase() || 'O'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.name || 'Owner'}
                  </p>
                  <p className="text-xs text-gray-500">Super Admin</p>
                </div>
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleSwitchRole}>
                <SwitchCameraIcon className="w-4 h-4 mr-2" />
                Switch Role
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/owner/settings')}>
                <SettingsIcon className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOutIcon className="w-4 h-4 mr-2" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};