import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'react-hot-toast';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';
import {
  DollarSignIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  SearchIcon,
  UserIcon,
  CreditCardIcon,
  CalendarIcon,
  FileTextIcon,
  AlertCircleIcon,
  Building2Icon,
  HashIcon
} from 'lucide-react';

interface TopUpRequest {
  id: number;
  firebase_uid: string;
  full_name: string;
  amount: number;
  currency: string;
  transfer_date: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  reference: string;
  proof_of_transfer: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string;
  reviewed_by: string;
  reviewed_at: string;
  created_at: string;
}

export const AdminTopUpRequests: React.FC = () => {
  const [requests, setRequests] = useState<TopUpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<TopUpRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await authFetch(`${API_BASE_URL}/admin/topup-requests`);
      setRequests(data);
    } catch (error) {
      console.error('Error loading top-up requests:', error);
      toast.error('Failed to load top-up requests');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId: number, action: 'approved' | 'rejected') => {
    setReviewing(true);
    
    try {
      const response = await authFetch(`${API_BASE_URL}/admin/topup-requests/${requestId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          adminNotes: reviewNotes
        })
      });
      
      if (response.success) {
        toast.success(response.message);
        loadRequests(); // Reload the list
        setSelectedRequest(null);
        setReviewNotes('');
      } else {
        toast.error(response.error || 'Failed to review request');
      }
    } catch (error) {
      console.error('Error reviewing request:', error);
      toast.error('Failed to review request');
    } finally {
      setReviewing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-0">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-0">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-0">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-0">Unknown</Badge>;
    }
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

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  // Filter requests
  const filteredRequests = requests.filter(request => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesSearch = !searchQuery || 
      request.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.bank_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Get counts
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading top-up requests...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Top-Up Requests</h1>
          <p className="text-gray-600 mt-1">Review and manage wallet top-up requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
              </div>
              <DollarSignIcon className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <ClockIcon className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <XCircleIcon className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by name, reference, or bank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-[#0C4B20] hover:bg-[#0A3D1A]' : ''}
          >
            All <Badge className="ml-2 bg-white text-[#0C4B20]">{requests.length}</Badge>
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
            className={filter === 'pending' ? 'bg-[#0C4B20] hover:bg-[#0A3D1A]' : ''}
          >
            Pending <Badge className="ml-2 bg-white text-[#0C4B20]">{pendingCount}</Badge>
          </Button>
          <Button
            variant={filter === 'approved' ? 'default' : 'outline'}
            onClick={() => setFilter('approved')}
            className={filter === 'approved' ? 'bg-[#0C4B20] hover:bg-[#0A3D1A]' : ''}
          >
            Approved <Badge className="ml-2 bg-white text-[#0C4B20]">{approvedCount}</Badge>
          </Button>
          <Button
            variant={filter === 'rejected' ? 'default' : 'outline'}
            onClick={() => setFilter('rejected')}
            className={filter === 'rejected' ? 'bg-[#0C4B20] hover:bg-[#0A3D1A]' : ''}
          >
            Rejected <Badge className="ml-2 bg-white text-[#0C4B20]">{rejectedCount}</Badge>
          </Button>
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-12 text-center">
            <AlertCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No top-up requests found</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchQuery ? 'Try adjusting your search' : 'Requests will appear here once submitted'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Section - User & Amount Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#0C4B20] bg-opacity-10 rounded-full flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-[#0C4B20]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{request.full_name || 'Unknown User'}</h3>
                          <p className="text-sm text-gray-500">ID: {request.firebase_uid.substring(0, 12)}...</p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSignIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-semibold text-[#0C4B20]">{formatCurrency(request.amount, request.currency)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Transfer Date:</span>
                        <span className="font-medium text-gray-900">{new Date(request.transfer_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2Icon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Bank:</span>
                        <span className="font-medium text-gray-900">{request.bank_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HashIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Reference:</span>
                        <span className="font-medium text-gray-900">{request.reference}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCardIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Account:</span>
                        <span className="font-medium text-gray-900">{request.account_number}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Submitted:</span>
                        <span className="font-medium text-gray-900">{formatDate(request.created_at)}</span>
                      </div>
                    </div>

                    {request.admin_notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Admin Notes:</p>
                        <p className="text-sm text-gray-800">{request.admin_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex flex-col gap-2 lg:min-w-[140px]">
                    {request.proof_of_transfer && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Open review modal to see the proof instead of opening in new tab
                          // This avoids HTTP 431 error with large base64 data URLs
                          setSelectedRequest(request);
                        }}
                        className="w-full"
                      >
                        <FileTextIcon className="w-4 h-4 mr-2" />
                        View Proof
                      </Button>
                    )}
                    {request.status === 'pending' && (
                      <Button
                        onClick={() => setSelectedRequest(request)}
                        className="bg-[#0C4B20] hover:bg-[#0A3D1A] text-white w-full"
                      >
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardContent className="p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold mb-4">Review Top-Up Request</h2>
              
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">User</p>
                    <p className="font-semibold">{selectedRequest.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-semibold text-[#0C4B20]">{formatCurrency(selectedRequest.amount, selectedRequest.currency)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bank</p>
                    <p className="font-semibold">{selectedRequest.bank_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Number</p>
                    <p className="font-semibold">{selectedRequest.account_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Reference</p>
                    <p className="font-semibold">{selectedRequest.reference}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Transfer Date</p>
                    <p className="font-semibold">{new Date(selectedRequest.transfer_date).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedRequest.proof_of_transfer && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Proof of Transfer</p>
                    <div className="relative group bg-gray-100 rounded-lg p-2">
                      <img 
                        src={
                          // Handle base64 data URLs, http URLs, and relative paths
                          selectedRequest.proof_of_transfer.startsWith('data:') 
                            ? selectedRequest.proof_of_transfer
                            : selectedRequest.proof_of_transfer.startsWith('http') 
                              ? selectedRequest.proof_of_transfer 
                              : `${API_BASE_URL}${selectedRequest.proof_of_transfer}`
                        } 
                        alt="Proof of transfer" 
                        className="w-full max-h-96 object-contain rounded-lg border bg-white cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          // For base64 images, open in a new window with proper HTML
                          if (selectedRequest.proof_of_transfer.startsWith('data:')) {
                            const newWindow = window.open('', '_blank');
                            if (newWindow) {
                              newWindow.document.write(`
                                <!DOCTYPE html>
                                <html>
                                  <head>
                                    <title>Proof of Transfer</title>
                                    <style>
                                      body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; }
                                      img { max-width: 100%; max-height: 100vh; object-fit: contain; }
                                    </style>
                                  </head>
                                  <body>
                                    <img src="${selectedRequest.proof_of_transfer}" alt="Proof of Transfer" />
                                  </body>
                                </html>
                              `);
                              newWindow.document.close();
                            }
                          } else {
                            const url = selectedRequest.proof_of_transfer.startsWith('http') 
                              ? selectedRequest.proof_of_transfer 
                              : `${API_BASE_URL}${selectedRequest.proof_of_transfer}`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        onError={(e) => {
                          console.error('Failed to load image:', selectedRequest.proof_of_transfer?.substring(0, 100));
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage not available%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-30 rounded-lg">
                        <span className="text-white text-sm font-medium">Click to view full size</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Admin Notes (Optional)
                  </label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about this review..."
                    rows={4}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => handleReview(selectedRequest.id, 'approved')}
                  disabled={reviewing}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  {reviewing ? 'Processing...' : 'Approve'}
                </Button>
                <Button
                  onClick={() => handleReview(selectedRequest.id, 'rejected')}
                  disabled={reviewing}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <XCircleIcon className="w-4 h-4 mr-2" />
                  {reviewing ? 'Processing...' : 'Reject'}
                </Button>
                <Button
                  onClick={() => {
                    setSelectedRequest(null);
                    setReviewNotes('');
                  }}
                  disabled={reviewing}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
