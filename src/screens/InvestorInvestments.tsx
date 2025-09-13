// src/screens/InvestorInvestments.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';
import { DashboardLayout } from '../layouts/DashboardLayout';

interface Investment {
  projectId: string;
  borrowerUid: string;
  borrowerName: string;
  projectTitle: string;
  projectImage: string | null;
  fundingRequirement: number;
  location: string;
  investmentAmount: number;
  investmentDate: string | null;
  status: 'pending' | 'approved' | 'rejected';
  projectStatus: string;
  approvalStatus: string;
  fundingProgress: string;
  projectData: any;
}

type FilterStatus = 'default' | 'pending' | 'ongoing' | 'completed' | 'unsuccessful';

const getInvestmentStatus = (investment: Investment): FilterStatus => {
  // If investment is rejected, it's unsuccessful
  if (investment.status === 'rejected') {
    return 'unsuccessful';
  }
  
  // If investment is pending approval from admin
  if (investment.status === 'pending') {
    return 'pending';
  }
  
  // If investment is approved
  if (investment.status === 'approved') {
    // Check project completion status
    if (investment.projectStatus === 'completed') {
      // Check if funding was successful
      const fundingProgress = parseFloat(investment.fundingProgress.replace('%', ''));
      return fundingProgress >= 100 ? 'completed' : 'unsuccessful';
    }
    return 'ongoing';
  }
  
  return 'pending';
};

const getStatusColor = (status: FilterStatus) => {
  switch (status) {
    case 'pending':
      return 'text-orange-600 bg-orange-50';
    case 'ongoing':
      return 'text-blue-600 bg-blue-50';
    case 'completed':
      return 'text-green-600 bg-green-50';
    case 'unsuccessful':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const getStatusText = (status: FilterStatus) => {
  switch (status) {
    case 'pending':
      return 'Pending Approval';
    case 'ongoing':
      return 'On-Going';
    case 'completed':
      return 'Completed';
    case 'unsuccessful':
      return 'Unsuccessful Funding';
    default:
      return 'Unknown';
  }
};

export const InvestorInvestments: React.FC = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('default');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        console.log("Fetching user investments...");
        const result = await authFetch(`${API_BASE_URL}/user/investments`);
        console.log("Investments result:", result);
        
        setInvestments(result || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching investments:", error);
        setLoading(false);
      }
    };

    fetchInvestments();
  }, []);

  const filteredInvestments = investments.filter(investment => {
    if (activeFilter === 'default') return true;
    return getInvestmentStatus(investment) === activeFilter;
  });

  const getFilterCount = (filterType: FilterStatus) => {
    if (filterType === 'default') return investments.length;
    return investments.filter(inv => getInvestmentStatus(inv) === filterType).length;
  };

  const handleViewProject = (projectId: string) => {
    navigate(`/investor/project/${projectId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg text-gray-600">Loading your investments...</div>
      </div>
    );
  }

  return (
    <DashboardLayout activePage="my-investments">
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
        <h1 className="text-2xl font-bold">My Investments</h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { key: 'pending' as const, label: 'Pending' },
          { key: 'ongoing' as const, label: 'On-Going' },
          { key: 'completed' as const, label: 'Completed' },
          { key: 'unsuccessful' as const, label: 'Unsuccessful Funding' },
          { key: 'default' as const, label: 'Default' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === key
                ? 'bg-[#0C4B20] text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {label} ({getFilterCount(key)})
          </button>
        ))}
      </div>

      {/* Content */}
      {investments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            You haven't invested in any projects yet
          </div>
          <button
            onClick={() => navigate('/investor/discover')}
            className="bg-yellow-400 text-black px-6 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
          >
            Discover Investment Opportunities
          </button>
        </div>
      ) : filteredInvestments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            No investments found for the selected filter
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 text-gray-600">
            You have {filteredInvestments.length} project{filteredInvestments.length !== 1 ? 's' : ''}:
          </div>

          <div className="space-y-4">
            {filteredInvestments.map((investment, index) => {
              const status = getInvestmentStatus(investment);
              const statusColor = getStatusColor(status);
              const statusText = getStatusText(status);
              
              return (
                <div key={`${investment.projectId}-${index}`} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* Status Badge */}
                  <div className="flex items-center mb-3">
                    <div className="flex items-center">
                      {status === 'pending' && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                      )}
                      {status === 'ongoing' && (
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      )}
                      {status === 'completed' && (
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      )}
                      {status === 'unsuccessful' && (
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                        Status: {statusText}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Project Image */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden">
                        {investment.projectImage ? (
                          <img 
                            src={investment.projectImage} 
                            alt={investment.projectTitle}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Project Details */}
                    <div className="flex-grow">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Project ID:</div>
                          <div className="font-medium">{investment.projectId}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Issuer/Borrower's Name:</div>
                          <div className="font-medium">{investment.borrowerName}</div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-500 mb-1">Funding Requirements:</div>
                          <div className="font-medium">PHP {investment.fundingRequirement.toLocaleString()}</div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-500 mb-1">Project Location:</div>
                          <div className="font-medium">{investment.location}</div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-500 mb-1">Your Invested:</div>
                          <div className="font-medium">PHP {investment.investmentAmount.toLocaleString()}</div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-500 mb-1">Your Receivable:</div>
                          <div className="font-medium">
                            PHP {(investment.investmentAmount * 1.05).toLocaleString()} {/* Assuming 5% return */}
                          </div>
                        </div>
{/* 
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Guarantor:</div>
                          <div className="font-medium">{investment.borrowerName}</div>
                        </div> */}

                        <div>
                          <div className="text-sm text-gray-500 mb-1">{investment.fundingProgress} Funding Progress:</div>
                          <div className="font-medium">{investment.projectId}</div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleViewProject(investment.projectId)}
                        className="bg-[#0C4B20] text-white px-4 py-2 rounded text-sm hover:bg-yellow-500 transition-colors"
                      >
                        View Project Details
                      </button>
                      
                      {status === 'ongoing' && (
                        <>
                          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300 transition-colors">
                            Request Payment
                          </button>
                          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300 transition-colors">
                            Read/Post
                          </button>
                          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300 transition-colors">
                            Collection Details
                          </button>
                        </>
                      )}
                      
                      {status === 'unsuccessful' && (
                        <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300 transition-colors">
                          Relaunch
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      </div>
    </DashboardLayout>
  );
};

export default InvestorInvestments;
