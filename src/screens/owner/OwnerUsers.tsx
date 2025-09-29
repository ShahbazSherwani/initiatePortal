import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OwnerLayout } from '../../layouts/OwnerLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { authFetch } from '../../lib/api';
import { API_BASE_URL } from '../../config/environment';
import { useAuth } from '../../contexts/AuthContext';
import { 
  SearchIcon, 
  EyeIcon, 
  UserIcon,
  CalendarIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  Users2Icon,
  TrendingUpIcon,
  RefreshCwIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  firebaseUid: string;
  fullName: string;
  email: string;
  username?: string;
  profilePicture?: string;
  accountTypes: ('borrower' | 'investor' | 'guarantor')[];
  status: 'active' | 'suspended' | 'deleted';
  memberSince: string;
  totalProjects?: number;
  isQualifiedInvestor?: boolean;
  location?: string;
  lastActivity?: string;
}

const USER_TABS = [
  { key: 'all', label: 'All Users', icon: <Users2Icon className="w-4 h-4" /> },
  { key: 'borrower', label: 'Issuers/Borrowers', icon: <UserIcon className="w-4 h-4" /> },
  { key: 'investor', label: 'Investors', icon: <TrendingUpIcon className="w-4 h-4" /> },
  { key: 'guarantor', label: 'Guarantors', icon: <ShieldCheckIcon className="w-4 h-4" /> },
];

export const OwnerUsers: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');
  const [filters, setFilters] = useState({
    status: 'all',
    dateJoined: 'all'
  });

  useEffect(() => {
    // Only fetch users if user is authenticated and is admin
    if (user && profile?.isAdmin) {
      fetchUsers();
    }
  }, [user, profile]);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, activeTab, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching users for admin:', profile?.isAdmin);
      console.log('🔗 API URL:', `${API_BASE_URL}/owner/users`);
      
      const data = await authFetch(`${API_BASE_URL}/owner/users`);
      console.log('✅ Users fetched successfully:', data?.length || 0, 'users');
      console.log('📊 Raw user data:', data);
      
      setUsers(data || []);
    } catch (error: any) {
      console.error('❌ Error fetching users:', error);
      setError(error.message || 'Failed to load users');
      toast.error('Failed to load users from database');
      setUsers([]); // Set empty array instead of mock data
    } finally {
      setLoading(false);
    }
  };

  const retryFetch = () => {
    fetchUsers();
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query) ||
        user.firebaseUid.includes(query)
      );
    }

    // Filter by tab/account type
    if (activeTab !== 'all') {
      filtered = filtered.filter(user =>
        user.accountTypes.includes(activeTab as any)
      );
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(user => user.status === filters.status);
    }

    // Filter by date joined
    if (filters.dateJoined !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateJoined) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(user => 
        new Date(user.memberSince) >= filterDate
      );
    }

    setFilteredUsers(filtered);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-yellow-100 text-yellow-800', 
      deleted: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={`${variants[status as keyof typeof variants]} border-0`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAccountTypesList = (accountTypes: string[]) => {
    return accountTypes.map(type => {
      const labels = {
        borrower: 'Issuer/Borrower',
        investor: 'Investor',
        guarantor: 'Guarantor'
      };
      return labels[type as keyof typeof labels] || type;
    }).join(', ');
  };

  if (loading) {
    return (
      <OwnerLayout activePage="users">
        <div className="p-8">
          <div className="flex items-center justify-center min-h-96">
            <LoadingSpinner 
              size="lg" 
              text="Loading users..." 
              showText={true}
              className=""
            />
          </div>
        </div>
      </OwnerLayout>
    );
  }

  // Show error state if there's an error and no users loaded
  if (error && users.length === 0) {
    return (
      <OwnerLayout activePage="users">
        <div className="p-8">
          <div className="flex items-center justify-center min-h-96">
            <Card className="bg-white shadow-sm border-0 max-w-md">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Users</h3>
                <p className="text-gray-600 mb-4">
                  {error}
                </p>
                <Button 
                  onClick={retryFetch}
                  className="bg-[#0C4B20] hover:bg-[#0C4B20]/90"
                >
                  <RefreshCwIcon className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout activePage="users">
      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Users</h1>
          <p className="text-gray-600">Manage all platform users and their accounts</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {USER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-[#0C4B20] text-[#0C4B20]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
                {activeTab === tab.key && (
                  <Badge className="ml-2 bg-[#0C4B20] text-white border-0">
                    {filteredUsers.length}
                  </Badge>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, username, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 rounded-2xl border-gray-300 focus:border-[#0C4B20] focus:ring-[#0C4B20]"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#0C4B20] focus:ring-[#0C4B20]"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="deleted">Deleted</option>
                </select>
                
                <select
                  value={filters.dateJoined}
                  onChange={(e) => setFilters({...filters, dateJoined: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#0C4B20] focus:ring-[#0C4B20]"
                >
                  <option value="all">All Time</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="3months">Last 3 Months</option>
                </select>
                
                <Button variant="outline" size="sm">
                  <SlidersHorizontalIcon className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-12 text-center">
              <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">
                {searchQuery ? 'Try adjusting your search terms or filters' : 'No users match your current filters'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarImage src={user.profilePicture || "/ellipse-1.png"} alt={user.fullName} />
                        <AvatarFallback className="bg-gradient-to-br from-[#0C4B20] to-[#8FB200] text-white">
                          {user.fullName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {user.fullName}
                          </h3>
                          {user.isQualifiedInvestor && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-0 text-xs">
                              Qualified Investor
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-1">
                          {user.username ? `@${user.username}` : user.email}
                        </p>
                        
                        <div className="flex items-center text-xs text-gray-400 mb-2">
                          <span>ID: {user.firebaseUid}</span>
                          <span className="mx-2">•</span>
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          <span>Member since {formatDate(user.memberSince)}</span>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-2">
                          {user.accountTypes.map((type) => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {getAccountTypesList([type])}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {user.totalProjects !== undefined && (
                            <span>{user.totalProjects} projects</span>
                          )}
                          {user.location && (
                            <div className="flex items-center">
                              <MapPinIcon className="w-3 h-3 mr-1" />
                              <span>{user.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-4">
                      {getStatusBadge(user.status)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/owner/users/${user.firebaseUid}`)}
                        className="text-[#0C4B20] border-[#0C4B20] hover:bg-[#0C4B20] hover:text-white"
                      >
                        <EyeIcon className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination would go here */}
        {filteredUsers.length > 0 && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Showing {filteredUsers.length} of {users.length} users
              </span>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
};