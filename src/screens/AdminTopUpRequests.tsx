import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Button } from '../components/ui/button';
import { toast } from 'react-hot-toast';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';

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
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
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

  if (loading) {
    return (
      <DashboardLayout activePage="admin-topup">
        <div className="flex-1 flex items-center justify-center">
          <div>Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="admin-topup">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Top-Up Requests</h1>
            
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500">No top-up requests found</div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transfer Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reference
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {requests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.full_name || 'Unknown User'}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {request.firebase_uid.substring(0, 8)}...
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {request.currency} {request.amount.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(request.transfer_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {request.reference}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={getStatusBadge(request.status)}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(request.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button
                              onClick={() => setSelectedRequest(request)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                            >
                              Review
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Review Top-Up Request</h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <div className="text-sm text-gray-900">{selectedRequest?.full_name || 'Unknown User'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <div className="text-sm text-gray-900">{selectedRequest?.currency} {selectedRequest?.amount.toLocaleString()}</div>
                </div>
              </div>

              {/* Transfer Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transfer Date</label>
                  <div className="text-sm text-gray-900">{new Date(selectedRequest.transfer_date).toLocaleDateString()}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reference</label>
                  <div className="text-sm text-gray-900">{selectedRequest.reference}</div>
                </div>
              </div>

              {/* Account Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Details</label>
                <div className="text-sm text-gray-900">
                  <div>{selectedRequest.account_name}</div>
                  <div>{selectedRequest.bank_name}</div>
                  <div>Account: {selectedRequest.account_number}</div>
                </div>
              </div>

              {/* Proof of Transfer */}
              {selectedRequest.proof_of_transfer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Proof of Transfer</label>
                  <img 
                    src={selectedRequest.proof_of_transfer} 
                    alt="Proof of transfer" 
                    className="max-w-full h-auto rounded-lg border"
                  />
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this review..."
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              {selectedRequest.status === 'pending' && (
                <div className="flex space-x-4">
                  <Button
                    onClick={() => handleReview(selectedRequest.id, 'approved')}
                    disabled={reviewing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {reviewing ? 'Processing...' : 'Approve & Add to Wallet'}
                  </Button>
                  <Button
                    onClick={() => handleReview(selectedRequest.id, 'rejected')}
                    disabled={reviewing}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {reviewing ? 'Processing...' : 'Reject'}
                  </Button>
                </div>
              )}

              {selectedRequest.status !== 'pending' && (
                <div className="text-center p-4 bg-gray-100 rounded-lg">
                  <div className="text-sm text-gray-600">
                    This request has been {selectedRequest.status} by {selectedRequest.reviewed_by} 
                    on {formatDate(selectedRequest.reviewed_at)}
                  </div>
                  {selectedRequest.admin_notes && (
                    <div className="mt-2 text-sm text-gray-700">
                      <strong>Notes:</strong> {selectedRequest.admin_notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
};
