import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { ChevronLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';

const InvestorProjectDetailsView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Details');
  const [activeMilestoneTab, setActiveMilestoneTab] = useState('ROI (Expense)');
  const [creatorInfo, setCreatorInfo] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch project data directly from API instead of relying on ProjectsContext
  React.useEffect(() => {
    const fetchProject = async () => {
      if (projectId) {
        try {
          console.log("🔄 Fetching project data directly for ID:", projectId);
          const projectData = await authFetch(`${API_BASE_URL}/projects/${projectId}`);
          console.log("InvestorProjectDetailsView - fetched project data:", projectData);
          setProject(projectData);
        } catch (error) {
          console.error("Error fetching project:", error);
          setProject(null);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchProject();
  }, [projectId]);

  // Fetch creator information - MOVED BEFORE CONDITIONAL RETURNS
  React.useEffect(() => {
    const fetchCreatorInfo = async () => {
      if (project && (project as any).firebase_uid) {
        // For now, use the full_name from the project data itself
        setCreatorInfo({ 
          name: project.full_name || 'Project Creator', 
          email: 'Not available' 
        });
      }
    };

    fetchCreatorInfo();
  }, [project]);

  console.log("InvestorProjectDetailsView - projectId from URL:", projectId);
  console.log("InvestorProjectDetailsView - fetched project:", project);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-500">Loading project...</div>
      </div>
    );
  }
  
  if (!project) return <div>Project not found</div>;

  // Get project creator information
  const projectCreator = (project as any).firebase_uid;
  const projectData = project?.project_data || {};
  const projectDetails = projectData?.details || {};
  console.log("Project creator:", projectCreator, "Current user:", profile?.id);
  console.log("Project data structure:", { projectData, projectDetails });
  console.log("ROI data:", projectData?.roi);
  console.log("Sales data:", projectData?.sales);
  console.log("Payout data:", projectData?.payout);
  console.log("Milestones data:", projectData?.milestones);

  // Calculate actual funding progress
  const calculateFundingProgress = () => {
    // Try multiple possible data sources for funding information
    const totalFunded = parseFloat(projectData?.funding?.totalFunded || 
                                  projectDetails?.fundedAmount || 
                                  projectData?.totalFunded || 
                                  "0");
    
    const targetAmount = parseFloat(projectDetails?.loanAmount || 
                                   projectDetails?.investmentAmount || 
                                   projectDetails?.fundingAmount || 
                                   projectData?.targetAmount || 
                                   "100000");
    
    // Calculate percentage
    const percentage = targetAmount > 0 ? (totalFunded / targetAmount) * 100 : 0;
    
    // Cap at 100% and ensure minimum 0%
    return Math.min(Math.max(percentage, 0), 100);
  };

  // Get stored progress if available, otherwise calculate from funding data
  const getFundingProgress = () => {
    const storedProgress = projectData?.funding_progress || 
                          projectData?.details?.fundingProgress ||
                          (project as any).funding_progress;
    
    if (storedProgress !== undefined && storedProgress !== null) {
      return Math.min(Math.max(Number(storedProgress) || 0, 0), 100);
    }
    
    // Fallback to calculated progress
    return calculateFundingProgress();
  };

  const fundingProgress = getFundingProgress();

  // Calculate estimated return from project data
  const calculateEstimatedReturn = () => {
    if (!project) return 0;
    
    // Get investor percentage from project data
    const investorPercentage = Number(projectDetails?.investorPercentage || 
                                     projectData?.details?.investorPercentage || 
                                     project.estimatedReturn || 
                                     0);
    
    // Return the investor percentage directly (e.g., 25 for 25%)
    if (investorPercentage > 0) {
      return investorPercentage;
    }
    
    // If we have ROI data from the project, calculate percentage
    if (projectData?.roi || project.project_data?.roi) {
      const roiData = projectData?.roi || project.project_data?.roi;
      const expense = parseFloat(roiData?.totalAmount || "0");
      const sales = parseFloat(projectData?.sales?.totalSales || project.project_data?.sales?.totalSales || "0");
      
      if (expense > 0 && sales > 0) {
        const profit = sales - expense;
        return Math.round((profit / expense) * 100); // Return as percentage
      }
    }

    // Fallback to interest rate or default
    return Number(project.interest_rate || 0);
  };

  // Calculate days remaining for the project
  const getDaysRemaining = () => {
    if (!project) return 30; // Default fallback
    
    let endDate;
    
    // Check for explicit end date
    if (project.end_date) {
      endDate = new Date(project.end_date);
    }
    // Check for time duration in project details
    else if (projectDetails?.timeDuration) {
      endDate = new Date(projectDetails.timeDuration);
    }
    // Check for time duration in project data
    else if (projectData?.details?.timeDuration) {
      endDate = new Date(projectData.details.timeDuration);
    }
    // Calculate from creation date + typical project duration
    else if (project.created_at) {
      const createdAt = new Date(project.created_at);
      endDate = new Date(createdAt.getFullYear(), createdAt.getMonth() + 3, createdAt.getDate());
    } 
    // Default to 3 months from now
    else {
      const today = new Date();
      endDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
    }
    
    const today = new Date();
    const daysLeft = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? daysLeft : 0;
  };

  const estimatedReturn = calculateEstimatedReturn();
  const daysRemaining = getDaysRemaining();

  // Format time duration for display
  const formatTimeDuration = () => {
    const timeDuration = projectDetails?.timeDuration || projectData?.details?.timeDuration;
    
    if (!timeDuration) return "N/A";
    
    // If it's already a formatted string (not an ISO date), return as is
    if (!timeDuration.includes('T') && !timeDuration.includes('Z')) {
      return timeDuration;
    }
    
    // If it's an ISO date string, format it nicely
    try {
      const date = new Date(timeDuration);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return timeDuration; // Return original if parsing fails
    }
  };

  const handleInvestClick = () => {
    navigate(`/investor/project/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar - hidden on mobile, visible on desktop */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <div className="flex-1 md:ml-64 p-4 md:p-6">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-4 md:p-6">
            {/* Header with back button */}
            <div className="flex items-center mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="mr-4"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-bold">Project Details</h1>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-col sm:flex-row sm:space-x-1 space-y-2 sm:space-y-0 mb-6">
              {['Details', 'Milestones'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                    activeTab === tab 
                      ? 'bg-[#ffc628] text-black' 
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content based on active tab */}
            <div className="p-4 md:p-8">
              {activeTab === 'Details' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">About Project</h2>
                  
                  {/* Project Image */}
                  <div className="mb-6">
                    <img 
                      src={projectDetails?.image || "/group-13-1.png"}
                      alt={projectDetails?.product || "Project"} 
                      className="w-full h-64 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/group-13-1.png';
                      }}
                    />
                  </div>

                  {/* Project Title */}
                  <h3 className="text-lg font-semibold mb-4">
                    {projectDetails?.product || projectDetails?.title || "N/A"}
                  </h3>

                  {/* Project Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Project ID:</span>
                        <span className="font-medium">{project?.id || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Issuer/Partner:</span>
                        <span className="font-medium">{creatorInfo?.name || project?.full_name || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sec Registration No:</span>
                        <span className="font-medium">{projectDetails?.secRegistration || projectData?.secRegistration || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  
                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Funding Progress</span>
                      <span className="text-sm font-medium">{Math.round(fundingProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-[#ffc628] h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ 
                          width: `${fundingProgress}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Funding Progress Stats */}
                  <div className="grid grid-cols-3 gap-1 sm:gap-4 mb-6">
                    <div className="text-center px-1 sm:px-2">
                      <div className="text-xs sm:text-sm font-medium break-words">PHP {(() => {
                        const totalFunded = parseFloat(projectData?.funding?.totalFunded || 
                                                      projectDetails?.fundedAmount || 
                                                      projectData?.totalFunded || 
                                                      "0");
                        return Math.round(totalFunded).toLocaleString();
                      })()}</div>
                      <div className="text-xs text-gray-500">Funded</div>
                    </div>
                    <div className="text-center px-1 sm:px-2">
                      <div className="text-xs sm:text-sm font-medium break-words">PHP {parseInt(projectDetails?.loanAmount || projectDetails?.investmentAmount || "40000").toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Target</div>
                    </div>
                    <div className="text-center px-1 sm:px-2">
                      <div className="text-xs sm:text-sm font-medium break-words">PHP {parseInt(projectDetails?.loanAmount || projectDetails?.investmentAmount || "60000").toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Project Requirement</div>
                    </div>
                  </div>
                  

                  {/* Total funding amount */}
                  <div className="text-center mb-6">
                    <div className="text-lg font-semibold">PHP {parseInt(projectDetails?.loanAmount || projectDetails?.investmentAmount || "100000").toLocaleString()}</div>
                  </div>


                  {/* Progress Indicators */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-lg font-semibold">{Math.round(fundingProgress)}%</div>
                      <div className="text-sm text-gray-600">Funded</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-lg font-semibold">{daysRemaining}</div>
                      <div className="text-sm text-gray-600">Days Left</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-lg font-semibold">{estimatedReturn}%</div>
                      <div className="text-sm text-gray-600">Est. Return (P.A)</div>
                    </div>
                  </div>

                  {/* Investment Button */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <Button 
                      onClick={handleInvestClick}
                      className="bg-[#ffc628] hover:bg-[#e6b324] text-black px-6 py-2 font-medium"
                    >
                      Invest in This Project
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      Click to proceed with your investment. Your request will be sent to the admin for approval.
                    </p>
                  </div>

                  {/* Additional Project Information */}
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Project Information</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Product/Service</label>
                          <p className="text-gray-900">{projectDetails?.product || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Category</label>
                          <p className="text-gray-900">{projectDetails?.category || projectData?.category || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Location</label>
                          <p className="text-gray-900">{projectDetails?.location || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Target Market</label>
                          <p className="text-gray-900">{projectDetails?.targetMarket || projectData?.targetMarket || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Financial Information</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Funding Amount</label>
                          <p className="text-gray-900">₱{parseInt(projectDetails?.loanAmount || projectDetails?.investmentAmount || "0").toLocaleString() || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Project Type</label>
                          <p className="text-gray-900">{projectData?.type || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Expected Returns</label>
                          <p className="text-gray-900">{projectDetails?.investorPercentage ? `${projectDetails.investorPercentage}%` : "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Time Duration</label>
                          <p className="text-gray-900">{formatTimeDuration()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project Description */}
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Project Description</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {projectDetails?.overview || projectDetails?.description || projectData?.description || "N/A"}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'Milestones' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Project Milestones</h2>
                  
                  {/* Sample Milestone (since we might not have real milestone data) */}
                  <div className="space-y-6">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4">Milestone 1</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <img 
                            src={projectDetails?.image || "/group-13-1.png"}
                            alt="Milestone 1"
                            className="w-full h-32 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/group-13-1.png';
                            }}
                          />
                        </div>
                        <div>
                          <div className="mb-2">
                            <span className="text-sm text-gray-600">Amount: </span>
                            <span className="font-medium">PHP {(() => {
                              // Try to get milestone amount from project data
                              const milestoneAmount = projectData?.milestones?.[0]?.amount || 
                                                     projectDetails?.loanAmount || 
                                                     projectDetails?.investmentAmount || 
                                                     "0";
                              return parseInt(milestoneAmount).toLocaleString();
                            })()}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Percentage: </span>
                            <span className="font-medium">{projectData?.milestones?.[0]?.percentage || projectDetails?.investorPercentage || "N/A"}%</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* ROI, Sales, and Payout tabs for each milestone */}
                      <div className="flex space-x-2 mb-4">
                        {['ROI (Expense)', 'ROI (Sales)', 'Payout Schedule'].map((tab) => (
                          <button 
                            key={tab}
                            onClick={() => setActiveMilestoneTab(tab)}
                            className={`px-4 py-2 rounded font-medium ${
                              activeMilestoneTab === tab 
                                ? 'bg-[#ffc628] text-black' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                      
                      {/* ROI Information */}
                      {activeMilestoneTab === 'ROI (Expense)' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold mb-2">ROI (Expense)</h4>
                            <p className="text-sm text-gray-600 mb-2">Description:</p>
                            <p className="text-sm mb-4">{projectData?.roi?.description || projectDetails?.description || "No description available"}</p>
                            <p className="font-semibold">Total Amount: <span className="text-lg">{projectData?.roi?.totalAmount ? `PHP ${parseInt(projectData.roi.totalAmount).toLocaleString()}` : "N/A"}</span></p>
                          </div>
                          <div>
                            <div className="mb-2">
                              <span className="text-sm text-gray-600">Price Per Unit: </span>
                              <span>{projectData?.roi?.pricePerUnit ? `PHP ${parseInt(projectData.roi.pricePerUnit).toLocaleString()}` : "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Unit of Measure: </span>
                              <span>{projectData?.roi?.unitOfMeasure || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeMilestoneTab === 'ROI (Sales)' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold mb-2">ROI (Sales)</h4>
                            <p className="text-sm text-gray-600 mb-2">Description:</p>
                            <p className="text-sm mb-4">{projectData?.sales?.description || projectDetails?.description || "No description available"}</p>
                            <p className="font-semibold">Total Sales: <span className="text-lg">{projectData?.sales?.totalSales ? `PHP ${parseInt(projectData.sales.totalSales).toLocaleString()}` : "N/A"}</span></p>
                            <p className="font-semibold mt-2">Net Income Calculation: <span className="text-lg">{projectData?.sales?.netIncomeCalc ? `PHP ${parseInt(projectData.sales.netIncomeCalc).toLocaleString()}` : "N/A"}</span></p>
                          </div>
                          <div>
                            <div className="mb-2">
                              <span className="text-sm text-gray-600">Price Per Unit: </span>
                              <span>{projectData?.sales?.pricePerUnit ? `PHP ${parseInt(projectData.sales.pricePerUnit).toLocaleString()}` : "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Unit of Measure: </span>
                              <span>{projectData?.sales?.unitOfMeasure || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeMilestoneTab === 'Payout Schedule' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold mb-2">Payout Schedule</h4>
                            <p className="text-sm text-gray-600 mb-2">Generate Total Payout Required:</p>
                            <p className="text-lg font-semibold mb-4">{projectData?.payout?.totalPayoutRequired ? `PHP ${parseInt(projectData.payout.totalPayoutRequired).toLocaleString()}` : "N/A"}</p>
                            
                            <p className="text-sm text-gray-600 mb-2">% of Total Payout (Capital + Interest):</p>
                            <p className="text-lg font-semibold mb-4">{projectData?.payout?.capitalPlusInterest ? `PHP ${parseInt(projectData.payout.capitalPlusInterest).toLocaleString()}` : "N/A"}</p>
                            
                            <p className="text-sm text-gray-600 mb-2">Generate Net Income Calculation:</p>
                            <p className="text-lg font-semibold">{projectData?.payout?.netIncomeCalc ? `PHP ${parseInt(projectData.payout.netIncomeCalc).toLocaleString()}` : "N/A"}</p>
                          </div>
                          <div>
                            <div className="mb-4">
                              <span className="text-sm text-gray-600">Payout Date: </span>
                              <span className="font-medium">{projectData?.payout?.payoutDate ? new Date(projectData.payout.payoutDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Amount: </span>
                              <span className="font-medium">{projectData?.payout?.amount ? `PHP ${parseInt(projectData.payout.amount).toLocaleString()}` : "N/A"}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorProjectDetailsView;