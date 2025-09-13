import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../contexts/ProjectsContext';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { ChevronLeft } from 'lucide-react';
import { Badge } from '../components/ui/badge';

const ProjectDetailsView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, loadProjects } = useProjects();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Details');
  const [selectedMilestoneTab, setSelectedMilestoneTab] = useState('ROI (Expense)');

  // Refresh projects when projectId changes to get latest funding data
  React.useEffect(() => {
    if (projectId) {
      console.log("🔄 Refreshing project data for ID:", projectId);
      loadProjects();
    }
  }, [projectId, loadProjects]);

  console.log("ProjectDetailsView - projectId from URL:", projectId);
  console.log("ProjectDetailsView - projects in context:", projects);

  // Convert projectId to number for comparison since DB IDs are numbers
  const project = projects.find(p => p.id === parseInt(projectId as string, 10));
  console.log("ProjectDetailsView - found project:", project);
  
  // Debug: Log the actual project data structure
  if (project) {
    console.log("🔍 Project Data Debug:", {
      id: project.id,
      project_data: project.project_data,
      details: project.project_data?.details,
      amount_fields: {
        loanAmount: project.project_data?.details?.loanAmount,
        investmentAmount: project.project_data?.details?.investmentAmount,
        projectRequirements: project.project_data?.details?.projectRequirements,
        amount: project.project_data?.details?.amount
      },
      funding_fields: {
        fundedAmount: project.project_data?.details?.fundedAmount,
        funding: (project as any).funding,
        fundingProgress: (project as any).fundingProgress
      },
      investor_fields: {
        investorPercentage: project.project_data?.details?.investorPercentage,
        investorPercentageType: typeof project.project_data?.details?.investorPercentage,
        rawInvestorPercentage: project.project_data?.details?.investorPercentage
      }
    });
  }

  if (!project) return <div>Project not found</div>;
  
  // Calculate total funding requirement
  const getTotalFundingRequirement = () => {
    if (!project || !project.project_data?.details) return 0;
    
    // Use loanAmount first, then projectRequirements as fallback
    const loanAmount = project.project_data.details.loanAmount;
    const projectRequirements = project.project_data.details.projectRequirements;
    
    console.log('📊 Total funding requirement calculation:', {
      loanAmount,
      projectRequirements,
      loanAmountType: typeof loanAmount,
      projectRequirementsType: typeof projectRequirements
    });
    
    if (loanAmount && typeof loanAmount === 'number') {
      return loanAmount;
    }
    
    if (projectRequirements) {
      const parsed = parseFloat(projectRequirements);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    
    return 0; // No funding requirement found
  };

  // Calculate funding percentage from project data (robust)
  const calculateFundingPercentage = () => {
    if (!project) return 0;
    // Use funding.totalFunded if available
    const totalFunded = Number(project.project_data?.funding?.totalFunded) || 0;
    const totalRequired = getTotalFundingRequirement();
    if (totalRequired > 0 && totalFunded > 0) {
      const percentage = Math.round((totalFunded / totalRequired) * 100);
      return Math.min(percentage, 100);
    }
    return 0;
  };

  // Calculate estimated return from project data
  const calculateEstimatedReturn = () => {
    if (!project) return 0;
    
    // Get investor percentage from project data (should be 25% for this project)
    const investorPercentage = Number(project.project_data?.details?.investorPercentage || 0);
    const totalAmount = getTotalFundingRequirement();
    
    console.log('📊 Estimated return calculation:', {
      investorPercentage,
      totalAmount,
      shouldReturn: 'percentage, not amount',
      correctReturn: investorPercentage
    });
    
    // Return the investor percentage directly (e.g., 25 for 25%)
    if (investorPercentage > 0) {
      return investorPercentage;
    }
    
    // If we have ROI data from the project, calculate percentage
    if (project.project_data?.roi) {
      const expense = parseFloat(project.project_data.roi.totalAmount || "0");
      const sales = parseFloat(project.project_data?.sales?.totalSales || "0");
      
      if (expense > 0 && sales > 0) {
        const profit = sales - expense;
        return Math.round((profit / expense) * 100); // Return as percentage
      }
    }
    
    return 0; // No return data available
  };

  // Get the calculated values
  const fundingPercentage = calculateFundingPercentage();
  const totalFundingRequired = getTotalFundingRequirement();
  
  // Calculate days remaining for the project
  const getDaysRemaining = () => {
    if (!project) return 30; // Default fallback
    
    let endDate;
    if (project.project_data?.details?.timeDuration) {
      endDate = new Date(project.project_data.details.timeDuration);
    } else if (project.created_at) {
      const createdAt = new Date(project.created_at);
      endDate = new Date(createdAt.getFullYear(), createdAt.getMonth() + 3, createdAt.getDate());
    } else {
      const today = new Date();
      endDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
    }
    
    const today = new Date();
    const daysLeft = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? daysLeft : 0;
  };
  
  const daysRemaining = getDaysRemaining();
  
  const estimatedReturn = calculateEstimatedReturn();

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <div className="hidden md:block w-[325px]">
        <Sidebar activePage="My Issuer/Borrower" />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="w-[90%] mx-auto bg-white rounded-t-[30px] p-4 md:p-8 md:w-full md:mx-0 min-h-screen flex flex-col animate-fadeIn delay-300">
          {/* Back button */}
          <div className="flex items-center mb-6">
            <ChevronLeft 
              className="w-5 h-5 cursor-pointer" 
              onClick={() => navigate('/borwMyProj')}
            />
            <span className="font-medium ml-2">Project Details</span>
          </div>
          
          {/* Header section - Title and Status badge */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{project.project_data?.details?.product || project.title || "Project Details"}</h1>
            
            <Badge className="bg-green-100 text-green-800 px-3 py-1">
              Published
            </Badge>
          </div>

          {/* Tabs - Only Details and Milestones */}
          <div className="grid grid-cols-2 mb-6">
            {['Details', 'Milestones'].map(tab => (
              <button
                key={tab}
                className={`py-3 px-6 text-center font-medium ${
                  activeTab === tab 
                    ? 'bg-[#0C4B20] text-black rounded-lg' 
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Project Details */}
          {activeTab === 'Details' && (
            <div>
              <h2 className="text-xl font-bold mb-4">About Project</h2>
              
              {/* More options button */}
              <div className="flex justify-end mb-4">
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              </div>
              
              {/* Project image */}
              <div className="mb-6">
                <img 
                  src={project.project_data?.details?.image || "/default-farm.jpg"}
                  alt="Project" 
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              
              {/* Project title */}
              <h3 className="text-xl font-bold mb-6">
                {project.project_data?.details?.product || "UBE Field"}
              </h3>
              
              {/* Project details grid */}
              <div className="grid grid-cols-2 gap-y-6 gap-x-8 mb-8">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Project ID:</p>
                  <p className="font-medium">PFLA{project.id}5N</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Issuer/Partner:</p>
                  <p className="font-medium">{project.project_data?.details?.issuer || 'Alexa John'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Sec Registration No:</p>
                  <p className="font-medium">{project.project_data?.details?.secRegistration || '35147'}</p>
                </div>
              </div>
              
              {/* Funding progress section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2 text-sm text-gray-500">
                  <span>PHP 0</span>
                  <span>PHP {Math.round(totalFundingRequired * 0.4).toLocaleString()}</span>
                  <span>PHP {Math.round(totalFundingRequired * 0.8).toLocaleString()}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full mb-4">
                  <div 
                    className="h-2 bg-blue-500 rounded-full" 
                    style={{ width: `${fundingPercentage}%` }}
                  ></div>
                </div>
                <div>
                  <p className="font-medium text-lg">PHP {totalFundingRequired.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Project Requirement</p>
                </div>
              </div>
              
              {/* Stats cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">{fundingPercentage}%</p>
                  <p className="text-sm text-gray-500">Funded</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">{daysRemaining}</p>
                  <p className="text-sm text-gray-500">Days Left</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">{estimatedReturn}%</p>
                  <p className="text-sm text-gray-500">Est. Return(P.A)</p>
                </div>
              </div>
            </div>
          )}

          {/* Milestones Tab Content */}
          {activeTab === 'Milestones' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Project Milestones</h2>
              {Array.isArray(project.project_data?.milestones) && project.project_data.milestones.length > 0 ? (
                project.project_data.milestones.map((milestone, idx) => (
                  <div key={idx} className="mb-8 border-b border-gray-100 pb-8">
                    <h3 className="text-lg font-medium mb-6">Milestone {idx + 1}</h3>
                    <div className="flex gap-6 mb-8">
                      <div className="w-32 h-24">
                        <img 
                          src={milestone.image || "/default-farm.jpg"}
                          alt="Milestone" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                          <div>
                            <p className="text-sm text-gray-500">Amount:</p>
                            <p className="font-medium">PHP {milestone.amount?.toLocaleString() || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Percentage%:</p>
                            <p className="font-medium">{milestone.percentage || '-'}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Milestone sub-tabs */}
                    <div className="grid grid-cols-3 gap-2 mb-8">
                      {['ROI (Expense)', 'ROI (Sales)', 'Payout Schedule'].map(tab => (
                        <button
                          key={tab}
                          className={`py-3 rounded-lg font-medium text-center text-sm ${
                            selectedMilestoneTab === tab ? 'bg-[#0C4B20] text-black' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          onClick={() => setSelectedMilestoneTab(tab)}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    {/* ROI Expense Content */}
                    {selectedMilestoneTab === 'ROI (Expense)' && (
                      <div>
                        <h3 className="text-xl font-bold mb-6">ROI (Expense)</h3>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-8">
                          <div>
                            <p className="text-sm text-gray-500 mb-2">Description:</p>
                            <p className="text-sm leading-relaxed">{milestone.expenseDescription || '-'}</p>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Price Per Unit:</p>
                              <p className="font-medium">{milestone.expensePricePerUnit ? `${milestone.expensePricePerUnit} PHP` : '-'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Unit of Measure:</p>
                              <p className="font-medium">{milestone.expenseUnitOfMeasure || '-'}</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Total Amount:</p>
                          <p className="font-medium text-xl">{milestone.expenseTotalAmount ? `${milestone.expenseTotalAmount} PHP` : '-'}</p>
                        </div>
                      </div>
                    )}
                    {/* ROI Sales Content */}
                    {selectedMilestoneTab === 'ROI (Sales)' && (
                      <div>
                        <h3 className="text-xl font-bold mb-6">ROI (Sales)</h3>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-8">
                          <div>
                            <p className="text-sm text-gray-500 mb-2">Description:</p>
                            <p className="text-sm leading-relaxed">{milestone.salesDescription || '-'}</p>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Price Per Unit:</p>
                              <p className="font-medium">{milestone.salesPricePerUnit ? `${milestone.salesPricePerUnit} PHP` : '-'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Unit of Measure:</p>
                              <p className="font-medium">{milestone.salesUnitOfMeasure || '-'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Total Amount:</p>
                            <p className="font-medium text-xl">{milestone.salesTotalAmount ? `${milestone.salesTotalAmount} PHP` : '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Net Income Calculation:</p>
                            <p className="font-medium text-xl">{milestone.netIncomeCalculation ? `${milestone.netIncomeCalculation} PHP` : '-'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Payout Schedule Content */}
                    {selectedMilestoneTab === 'Payout Schedule' && (
                      <div>
                        <h3 className="text-xl font-bold mb-6">Payout Schedule</h3>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-8">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Generate Total Payout Required:</p>
                            <p className="font-medium">{milestone.payoutRequired ? `${milestone.payoutRequired} PHP` : '-'}</p>
                          </div>
                          <div></div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">% of Total Payout (Capital +Interest):</p>
                            <p className="font-medium">{milestone.payoutCapitalInterest ? `${milestone.payoutCapitalInterest} PHP` : '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Payout Date:</p>
                            <p className="font-medium">{milestone.payoutDate || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Amount:</p>
                            <p className="font-medium">{milestone.payoutAmount ? `${milestone.payoutAmount} PHP` : '-'}</p>
                          </div>
                          <div></div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Generate Net Income Calculation:</p>
                            <p className="font-medium">{milestone.netIncomeCalculation ? `${milestone.netIncomeCalculation} PHP` : '-'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-gray-500">No milestones available for this project.</div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProjectDetailsView;