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
  qualifiedInvestorStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  annualIncome?: number | string | null;
  location?: string;
  lastActivity?: string;
}

interface QualifiedInvestorRecord {
  firebase_uid: string;
  full_name: string;
  email: string;
  annual_income?: number | string | null;
  gross_annual_income?: number | string | null;
  is_qualified_investor: boolean;
  qi_request_status?: 'none' | 'pending' | 'approved' | 'rejected';
  qi_proof_url?: string;
  qi_request_notes?: string;
  qi_request_submitted_at?: string;
  qi_granted_by?: string;
  qi_granted_at?: string;
}

const USER_TABS = [
  { key: 'all', label: 'All Users', shortLabel: 'All', icon: <Users2Icon className="w-4 h-4" /> },
  { key: 'borrower', label: 'Issuers/Borrowers', shortLabel: 'Issuers', icon: <UserIcon className="w-4 h-4" /> },
  { key: 'investor', label: 'Investors', shortLabel: 'Investors', icon: <TrendingUpIcon className="w-4 h-4" /> },
  { key: 'qualified', label: 'Qualified Investors', shortLabel: 'Qualified', icon: <ShieldCheckIcon className="w-4 h-4" /> },
  { key: 'guarantor', label: 'Guarantors', shortLabel: 'Guarantors', icon: <ShieldCheckIcon className="w-4 h-4" /> },
];

export const OwnerUsers: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQualified, setLoadingQualified] = useState(false);
  const [qualifiedActionLoading, setQualifiedActionLoading] = useState<string | null>(null);
  const [qualifiedInvestors, setQualifiedInvestors] = useState<QualifiedInvestorRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');
  const [filters, setFilters] = useState({
    status: 'all',
    dateJoined: 'all'
  });

  useEffect(() => {
    // Fetch users if authenticated (admin or team member - route guard handles permission check)
    if (user && profile) {
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
      let qualifiedData: QualifiedInvestorRecord[] = [];
      try {
        setLoadingQualified(true);
        const qualifiedResponse = await authFetch(`${API_BASE_URL}/owner/qualified-investors`);
        qualifiedData = qualifiedResponse?.qualifiedInvestors || [];
      } catch (qualifiedError) {
        console.warn('Qualified investors list is unavailable:', qualifiedError);
      } finally {
        setLoadingQualified(false);
      }
      console.log('✅ Users fetched successfully:', data?.length || 0, 'users');
      console.log('📊 Raw user data:', data);
      
      setUsers(data || []);
      setQualifiedInvestors(qualifiedData);
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

    if (activeTab === 'qualified') {
      setFilteredUsers([]);
      return;
    }

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

  const getQualifiedStatusBadge = (status?: string, approved?: boolean) => {
    if (approved) return <Badge className="bg-green-100 text-green-800 border-0">Approved</Badge>;

    const normalized = status || 'none';
    if (normalized === 'pending') return <Badge className="bg-amber-100 text-amber-800 border-0">Pending Review</Badge>;
    if (normalized === 'rejected') return <Badge className="bg-red-100 text-red-800 border-0">Rejected</Badge>;
    return <Badge className="bg-gray-100 text-gray-700 border-0">Not Submitted</Badge>;
  };

  const handleQualifiedAction = async (userId: string, action: 'grant' | 'revoke') => {
    try {
      const notes = window.prompt(
        action === 'grant'
          ? 'Optional notes for granting qualified investor status:'
          : 'Optional notes for revoking qualified investor status:'
      ) || '';

      setQualifiedActionLoading(`${userId}:${action}`);
      await authFetch(`${API_BASE_URL}/owner/qualified-investors/${userId}/${action}`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });

      toast.success(action === 'grant' ? 'Qualified status granted' : 'Qualified status revoked');
      await fetchUsers();
    } catch (error: any) {
      toast.error(error?.message || `Failed to ${action} qualified status`);
    } finally {
      setQualifiedActionLoading(null);
    }
  };

  const filteredQualifiedInvestors = qualifiedInvestors.filter((row) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      (row.full_name || '').toLowerCase().includes(query) ||
      (row.email || '').toLowerCase().includes(query) ||
      (row.firebase_uid || '').toLowerCase().includes(query)
    );
  });

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
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Users</h1>
          <p className="text-gray-600">Manage all platform users and their accounts</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-4 md:space-x-8 min-w-max md:min-w-0">
            {USER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-[#0C4B20] text-[#0C4B20]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span className="ml-1.5 md:ml-2">
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden">{tab.shortLabel}</span>
                </span>
                {activeTab === tab.key && (
                  <Badge className="ml-1.5 md:ml-2 bg-[#0C4B20] text-white border-0 text-xs">
                    {activeTab === 'qualified' ? filteredQualifiedInvestors.length : filteredUsers.length}
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
        {activeTab === 'qualified' ? (
          filteredQualifiedInvestors.length === 0 ? (
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-12 text-center">
                <ShieldCheckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No qualified investor requests</h3>
                <p className="text-gray-500">
                  {loadingQualified ? 'Loading requests...' : 'No investors match the current filters'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredQualifiedInvestors.map((record) => {
                const annualIncome = Number(record.annual_income || record.gross_annual_income || 0);
                const isActionLoadingGrant = qualifiedActionLoading === `${record.firebase_uid}:grant`;
                const isActionLoadingRevoke = qualifiedActionLoading === `${record.firebase_uid}:revoke`;

                return (
                  <Card key={record.firebase_uid} className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{record.full_name || 'Unnamed Investor'}</h3>
                          <p className="text-sm text-gray-500">{record.email || 'No email'}</p>
                          <p className="text-xs text-gray-400 mt-1">ID: {record.firebase_uid}</p>
                        </div>
                        {getQualifiedStatusBadge(record.qi_request_status, record.is_qualified_investor)}
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Annual Income:</span>{' '}
                          {annualIncome > 0 ? `₱${annualIncome.toLocaleString()}` : 'Not provided'}
                        </p>
                        <p>
                          <span className="font-medium">Proof:</span>{' '}
                          {record.qi_proof_url ? (
                            <a href={record.qi_proof_url} target="_blank" rel="noreferrer" className="text-[#0C4B20] underline">
                              View Document
                            </a>
                          ) : (
                            'Not submitted'
                          )}
                        </p>
                        {record.qi_request_submitted_at && (
                          <p>
                            <span className="font-medium">Submitted:</span>{' '}
                            {new Date(record.qi_request_submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        )}
                        {record.qi_request_notes && (
                          <p className="text-xs text-gray-500 italic">“{record.qi_request_notes}”</p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="bg-[#0C4B20] text-white hover:bg-[#8FB200]"
                          onClick={() => handleQualifiedAction(record.firebase_uid, 'grant')}
                          disabled={isActionLoadingGrant || isActionLoadingRevoke}
                        >
                          {isActionLoadingGrant ? 'Granting...' : 'Grant Qualified Access'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => handleQualifiedAction(record.firebase_uid, 'revoke')}
                          disabled={isActionLoadingGrant || isActionLoadingRevoke}
                        >
                          {isActionLoadingRevoke ? 'Revoking...' : 'Revoke Access'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/owner/users/${record.firebase_uid}`)}
                          className="text-[#0C4B20] border-[#0C4B20] hover:bg-[#0C4B20] hover:text-white"
                        >
                          <EyeIcon className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        ) : filteredUsers.length === 0 ? (
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
        {(activeTab === 'qualified' ? filteredQualifiedInvestors.length > 0 : filteredUsers.length > 0) && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {activeTab === 'qualified'
                  ? `Showing ${filteredQualifiedInvestors.length} qualified investor records`
                  : `Showing ${filteredUsers.length} of ${users.length} users`}
              </span>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
};