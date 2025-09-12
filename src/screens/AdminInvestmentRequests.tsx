// src/screens/AdminInvestmentRequests.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';
import { toast } from 'react-hot-toast';

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg text-gray-600">Loading pending investment requests...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold">Pending Investment Requests</h1>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-700 mb-1">Total Pending Requests</div>
          <div className="text-2xl font-bold text-blue-900">{pendingInvestments.length}</div>
        </div>
      </div>

      {/* Content */}
      {pendingInvestments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            No pending investment requests at the moment
          </div>
          <button
            onClick={() => navigate('/admin/projects')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Projects
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingInvestments.map((investment, index) => {
            const investmentKey = `${investment.projectId}-${investment.investorId}-${index}-${investment.date}`;
            const isProcessing = processingInvestments.has(investmentKey);
            const isTerminal = investment.status === 'rejected' || investment.status === 'approved';
            return (
              <div 
                key={investmentKey} 
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 mt-2 ${investment.status === 'rejected' ? 'bg-red-500' : investment.status === 'approved' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {investment.projectTitle}
                      </h3>
                      <p className="text-sm text-gray-500">Project ID: {investment.projectId}</p>
                      <p className={`text-xs mt-1 font-semibold ${investment.status === 'rejected' ? 'text-red-600' : investment.status === 'approved' ? 'text-green-600' : 'text-orange-600'}`}>Status: {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleInvestmentReview(investment.projectId, investment.investorId, 'approve', investmentKey)}
                      disabled={isProcessing || isTerminal}
                      className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                        isProcessing || isTerminal
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isTerminal ? 'Approve' : isProcessing ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleInvestmentReview(investment.projectId, investment.investorId, 'reject', investmentKey)}
                      disabled={isProcessing || isTerminal}
                      className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                        isProcessing || isTerminal
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {isTerminal ? 'Reject' : isProcessing ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => navigate(`/admin/projects/${investment.projectId}`)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors"
                    >
                      View Project
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Investor</div>
                    <div className="font-medium">{investment.investorName}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Borrower</div>
                    <div className="font-medium">{investment.borrowerName}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">Investment Amount</div>
                    <div className="font-medium text-green-600">{formatCurrency(investment.amount)}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">Request Date</div>
                    <div className="font-medium">{formatDate(investment.date)}</div>
                  </div>
                </div>

                {/* Project Overview */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500 mb-2">Project Overview</div>
                  <div className="text-sm text-gray-700">
                    {investment.projectData?.details?.overview || 'No overview available'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminInvestmentRequests;
