// src/screens/owner/OwnerTopUpRequests.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnerLayout } from '../../layouts/OwnerLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { authFetch } from '../../lib/api';
import { API_BASE_URL } from '../../config/environment';
import { 
  SearchIcon,
  UserIcon,
  CalendarIcon,
  DollarSignIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FilterIcon,
  ArrowUpCircleIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TopUpRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod?: string;
  referenceNumber?: string;
  proofOfPayment?: string;
  requestedAt: string;
  processedAt?: string;
}

const STATUS_TABS = [
  { key: 'all', label: 'All Requests', shortLabel: 'All', icon: <ArrowUpCircleIcon className="w-4 h-4" /> },
  { key: 'pending', label: 'Pending', shortLabel: 'Pending', icon: <ClockIcon className="w-4 h-4" /> },
  { key: 'approved', label: 'Approved', shortLabel: 'Approved', icon: <CheckCircleIcon className="w-4 h-4" /> },
  { key: 'rejected', label: 'Rejected', shortLabel: 'Rejected', icon: <XCircleIcon className="w-4 h-4" /> },
];

export const OwnerTopUpRequests: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<TopUpRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<TopUpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchTopUpRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchQuery, activeTab]);

  const fetchTopUpRequests = async () => {
    try {
      setLoading(true);
      const data = await authFetch(`${API_BASE_URL}/owner/topup-requests`);
      setRequests(data);
    } catch (error) {
      console.error('Error fetching topup requests:', error);
      toast.error('Failed to load topup requests');
      // Mock data for development
      setRequests([
        {
          id: 'TU001',
          userId: '28745',
          userName: 'Shahbaz Sherwani',
          userEmail: 'shahbaz@example.com',
          amount: 50000,
          status: 'pending',
          paymentMethod: 'Bank Transfer',
          referenceNumber: 'REF123456',
          requestedAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    // Filter by status
    if (activeTab !== 'all') {
      filtered = filtered.filter(req => req.status === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req =>
        req.userName.toLowerCase().includes(query) ||
        req.userEmail.toLowerCase().includes(query) ||
        req.referenceNumber?.toLowerCase().includes(query) ||
        req.id.toLowerCase().includes(query)
      );
    }

    setFilteredRequests(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: JSX.Element }> = {
      pending: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: <ClockIcon className="w-3 h-3" /> },
      approved: { color: 'bg-green-100 text-green-700 border-green-300', icon: <CheckCircleIcon className="w-3 h-3" /> },
      rejected: { color: 'bg-red-100 text-red-700 border-red-300', icon: <XCircleIcon className="w-3 h-3" /> },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.color} border flex items-center gap-1`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTabCount = (tabKey: string) => {
    if (tabKey === 'all') return requests.length;
    return requests.filter(req => req.status === tabKey).length;
  };

  if (loading) {
    return (
      <OwnerLayout activePage="admin-topup">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout activePage="admin-topup">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Top-up Requests</h1>
            <p className="text-gray-600 mt-1">Manage user wallet top-up requests</p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {STATUS_TABS.map(tab => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 md:gap-2 text-xs md:text-sm whitespace-nowrap ${
                activeTab === tab.key 
                  ? 'bg-[#0C4B20] hover:bg-[#0C4B20]/90' 
                  : 'hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span className="hidden md:inline">{tab.label}</span>
              <span className="md:hidden">{tab.shortLabel}</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {getTabCount(tab.key)}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Search and Filters */}
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, email, reference number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <FilterIcon className="w-4 h-4" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="py-12">
                <div className="text-center">
                  <ArrowUpCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No requests found</h3>
                  <p className="text-gray-500">
                    {searchQuery
                      ? 'Try adjusting your search criteria'
                      : 'No top-up requests available'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map(request => (
              <Card key={request.id} className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{request.userName}</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <UserIcon className="w-4 h-4" />
                          <span>{request.userEmail}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSignIcon className="w-4 h-4" />
                          <span className="font-semibold text-[#0C4B20]">
                            {formatCurrency(request.amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{formatDate(request.requestedAt)}</span>
                        </div>
                        {request.referenceNumber && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              {request.referenceNumber}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/owner/users/${request.userId}`)}
                      >
                        View User
                      </Button>
                      {request.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-[#0C4B20] hover:bg-[#0C4B20]/90"
                          >
                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                          >
                            <XCircleIcon className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </OwnerLayout>
  );
};
