// src/screens/AdminInvestmentRequests.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';
import { toast } from 'react-hot-toast';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  TrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  SearchIcon,
  UserIcon,
  DollarSignIcon,
  CalendarIcon,
  FolderIcon,
  AlertCircleIcon,
  EyeIcon
} from 'lucide-react';

interface PendingInvestment {
  projectId: string;
  projectTitle: string;
  borrowerName: string;
  borrowerUid: string;
  investorId: string;
  investorName: string;
  amount: number;
  date: string;
  status: string;
  projectData: any;
}

export const AdminInvestmentRequests: React.FC = () => {
  const [pendingInvestments, setPendingInvestments] = useState<PendingInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingInvestments, setProcessingInvestments] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingInvestments();
  }, []);

  const fetchPendingInvestments = async () => {
    try {
      console.log("Fetching pending investment requests...");
      const result = await authFetch(`${API_BASE_URL}/admin/investment-requests`);
      console.log("Pending investments result:", result);
      
      setPendingInvestments(result || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching pending investments:", error);
      toast.error("Failed to fetch pending investment requests");
      setLoading(false);
    }
  };

  const handleInvestmentReview = async (projectId: string, investorId: string, action: 'approve' | 'reject', investmentKey: string) => {
    try {
      setProcessingInvestments(prev => new Set(prev).add(investmentKey));
      
      const response = await authFetch(
        `${API_BASE_URL}/admin/projects/${projectId}/investments/${investorId}/review`,
        {
          method: 'POST',
          body: JSON.stringify({
            action,
            comment: action === 'approve' ? 'Investment approved by admin' : 'Investment rejected by admin'
          })
        }
      );
      
      console.log("Investment review response:", response);
      
      if (response.success) {
        toast.success(`Investment request ${action}d successfully`);
        
        // Remove the processed investment from the list
        setPendingInvestments(prev => 
          prev.filter(inv => !(inv.projectId === projectId && inv.investorId === investorId))
        );
      } else {
        toast.error(`Failed to ${action} investment request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing investment:`, error);
      toast.error(`Failed to ${action} investment request`);
    } finally {
      setProcessingInvestments(prev => {
        const newSet = new Set(prev);
        newSet.delete(investmentKey);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  // Filter investments
  const filteredInvestments = pendingInvestments.filter(investment => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      investment.projectTitle?.toLowerCase().includes(query) ||
      investment.investorName?.toLowerCase().includes(query) ||
      investment.borrowerName?.toLowerCase().includes(query) ||
      investment.projectId?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-gray-600">Loading investment requests...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Investment Requests</h1>
          <p className="text-gray-600 mt-1">Review and manage investment requests</p>
        </div>
        <Button
          onClick={() => navigate('/admin/projects')}
          className="bg-[#0C4B20] hover:bg-[#0A3D1A] text-white"
        >
          <FolderIcon className="w-4 h-4 mr-2" />
          View All Projects
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{pendingInvestments.length}</p>
              </div>
              <TrendingUpIcon className="w-8 h-8 text-[#0C4B20]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {pendingInvestments.filter(i => i.status === 'pending').length}
                </p>
              </div>
              <ClockIcon className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-[#0C4B20]">
                  {formatCurrency(pendingInvestments.reduce((sum, inv) => sum + inv.amount, 0))}
                </p>
              </div>
              <DollarSignIcon className="w-8 h-8 text-[#0C4B20]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by project, investor, or borrower..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>
      </div>

      {/* Investment Requests List */}
      {filteredInvestments.length === 0 ? (
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-12 text-center">
            <AlertCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchQuery ? 'No matching investment requests found' : 'No pending investment requests'}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {searchQuery ? 'Try adjusting your search' : 'Requests will appear here when investors make investments'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredInvestments.map((investment, index) => {
            const investmentKey = `${investment.projectId}-${investment.investorId}-${index}-${investment.date}`;
            const isProcessing = processingInvestments.has(investmentKey);
            const isTerminal = investment.status === 'rejected' || investment.status === 'approved';
            
            const getStatusBadge = (status: string) => {
              if (status === 'approved') return <Badge className="bg-green-100 text-green-800 border-0">Approved</Badge>;
              if (status === 'rejected') return <Badge className="bg-red-100 text-red-800 border-0">Rejected</Badge>;
              return <Badge className="bg-yellow-100 text-yellow-800 border-0">Pending</Badge>;
            };

            return (
              <Card key={investmentKey} className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left Section - Investment Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-[#0C4B20] bg-opacity-10 rounded-full flex items-center justify-center">
                              <TrendingUpIcon className="w-5 h-5 text-[#0C4B20]" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{investment.projectTitle}</h3>
                              <p className="text-sm text-gray-500">ID: {String(investment.projectId).substring(0, 8)}...</p>
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(investment.status)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">Investor:</span>
                          <span className="font-medium text-gray-900">{investment.investorName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">Borrower:</span>
                          <span className="font-medium text-gray-900">{investment.borrowerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSignIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">Amount:</span>
                          <span className="font-semibold text-[#0C4B20]">{formatCurrency(investment.amount)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">Date:</span>
                          <span className="font-medium text-gray-900">{formatDate(investment.date)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex flex-col gap-2 lg:min-w-[200px]">
                      <Button
                        onClick={() => navigate(`/owner/projects/${investment.projectId}`)}
                        variant="outline"
                        className="w-full"
                      >
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View Project
                      </Button>
                      {!isTerminal && (
                        <>
                          <Button
                            onClick={() => handleInvestmentReview(investment.projectId, investment.investorId, 'approve', investmentKey)}
                            disabled={isProcessing}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                            {isProcessing ? 'Processing...' : 'Approve'}
                          </Button>
                          <Button
                            onClick={() => handleInvestmentReview(investment.projectId, investment.investorId, 'reject', investmentKey)}
                            disabled={isProcessing}
                            className="w-full bg-red-600 hover:bg-red-700 text-white"
                          >
                            <XCircleIcon className="w-4 h-4 mr-2" />
                            {isProcessing ? 'Processing...' : 'Reject'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminInvestmentRequests;
