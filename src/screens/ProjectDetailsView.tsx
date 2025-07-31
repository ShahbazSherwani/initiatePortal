import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectForm } from '../contexts/ProjectFormContext';
import { useProjects } from '../contexts/ProjectsContext';
import { Navbar } from '../components/Navigation/navbar';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { ChevronLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { differenceInDays, parseISO, addMonths } from 'date-fns';

const ProjectDetailsView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects } = useProjects();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Details');
  const [selectedMilestoneTab, setSelectedMilestoneTab] = useState('ROI (Expense)');

  const project = projects.find(p => p.id === projectId);
  if (!project) return <div>Project not found</div>;
  
  // Mock investor requests (in a real app, this would come from an API)
  const investorRequests = [
    { name: 'John Doe', username: 'John_123', avatar: '/avatar1.png' },
    { name: 'Adam Knight', username: 'knight_342', avatar: '/avatar2.png' },
    { name: 'Chris Evan', username: 'Chris_522', avatar: '/avatar3.png' }
  ];

  // Calculate funding percentage from project data
  const calculateFundingPercentage = () => {
    if (!project) return 0;
    
    // Try to get funding details from various possible sources
    if (project.fundingProgress) {
      return project.fundingProgress;
    } else if (project.details) {
      const total = parseFloat(project.details.loanAmount || project.details.investmentAmount || "0");
      const funded = parseFloat(project.details.fundedAmount || "0");
      
      if (total > 0 && funded > 0) {
        return Math.round((funded / total) * 100);
      }
    }
    
    // Default to 50% if no data available (for demonstration)
    return 50;
  };

  // Calculate estimated return from project data
  const calculateEstimatedReturn = () => {
    if (!project) return 0;
    
    // Try to get ROI data from various sources
    if (project.estimatedReturn) {
      return project.estimatedReturn;
    }
    
    // If we have ROI data in the project
    if (project.roi && project.sales) {
      // Calculate from expense and sales data if available
      const expense = parseFloat(project.roi.totalAmount || "0");
      const sales = parseFloat(project.sales.totalSales || "0");
      
      if (expense > 0 && sales > 0) {
        const profit = sales - expense;
        return Math.round((profit / expense) * 100);
      }
    } else if (project.sales && project.sales.netIncomeCalc) {
      // Try to get from net income
      const netIncome = parseFloat(project.sales.netIncomeCalc);
      const investment = parseFloat(project.details.loanAmount || project.details.investmentAmount || "0");
      
      if (netIncome > 0 && investment > 0) {
        return Math.round((netIncome / investment) * 100);
      }
    } else if (project.details.investorPercentage) {
      // If investor percentage is directly specified
      return parseFloat(project.details.investorPercentage);
    }
    
    // Default to 52% if no data available (for demonstration)
    return 52;
  };

  // Get the calculated values
  const fundingPercentage = calculateFundingPercentage();
  const estimatedReturn = calculateEstimatedReturn();

  // Calculate total funding requirement (for slider and display)
  const getTotalFundingRequirement = () => {
    if (!project || !project.details) return 100000;
    
    // Parse numeric values from project details
    const amount = parseFloat(
      project.details.loanAmount || 
      project.details.investmentAmount || 
      "100000"
    );
    
    return amount;
  };

  const fundingRequirement = getTotalFundingRequirement();

  // Calculate days remaining
  const calculateDaysRemaining = () => {
    if (!project) return 0;
    
    // Try to get end date from various possible sources
    let endDate;
    
    if (project.timeDuration) {
      // If project has specific end date
      endDate = new Date(project.timeDuration);
    } else if (project.details && project.details.timeDuration) {
      // If timeDuration is in the details
      endDate = new Date(project.details.timeDuration);
    } else if (project.createdAt) {
      // If we only have creation date, assume 3 month duration
      const createdAt = new Date(project.createdAt);
      endDate = new Date(createdAt.getFullYear(), createdAt.getMonth() + 3, createdAt.getDate());
    } else {
      // Fallback to 3 months from now if no dates are available
      const today = new Date();
      endDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
    }
    
    const today = new Date();
    const daysLeft = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysLeft > 0 ? daysLeft : 0;
  };

  // Get the days remaining
  const daysRemaining = calculateDaysRemaining();

  // Add this function before the return statement in ProjectDetailsView.tsx
  const calculatePayoutSchedule = () => {
    // Default values
    const defaultSchedule = {
      totalRequired: 50000,
      paymentAmount: 10000,
      payoutDate: "15 Oct, 2023",
      netIncome: 3000
    };
    
    if (!project || !project.details) {
      return defaultSchedule;
    }
    
    try {
      // Get base investment amount
      const investmentAmount = parseFloat(project.details.investmentAmount || 
                                          project.details.loanAmount || 
                                          "0");
      
      // Calculate ROI expense (cost)
      let expense = 0;
      if (project.roi && project.roi.totalAmount) {
        expense = parseFloat(project.roi.totalAmount);
      } else {
        // Use hardcoded value from ROI Expense tab as fallback
        expense = 3000;
      }
      
      // Calculate ROI sales (revenue)
      let revenue = 0;
      if (project.sales && project.sales.totalSales) {
        revenue = parseFloat(project.sales.totalSales);
      } else {
        // Use hardcoded value from ROI Sales tab as fallback
        revenue = 10500;
      }
      
      // Calculate net income
      const netIncome = revenue - expense;
      
      // Calculate total payout required (investment + returns)
      const estimatedReturnAmount = investmentAmount * (estimatedReturn / 100);
      const totalRequired = Math.round(investmentAmount + estimatedReturnAmount);
      
      // Calculate payout date (assuming 3 months from now or from creation date)
      let payoutDate = new Date();
      if (project.createdAt) {
        payoutDate = new Date(project.createdAt);
      }
      payoutDate.setMonth(payoutDate.getMonth() + 3);
      
      const formattedDate = payoutDate.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      
      return {
        totalRequired,
        paymentAmount: Math.round(totalRequired * 0.2), // 20% of total as example
        payoutDate: formattedDate,
        netIncome: Math.round(netIncome)
      };
    } catch (error) {
      console.error("Error calculating payout schedule:", error);
      return defaultSchedule;
    }
  };

  // Get the calculated payout schedule
  const payoutSchedule = calculatePayoutSchedule();

  // Example of properly saving milestone image in your milestone creation form
  const handleMilestoneSubmit = () => {
    // Make sure image data is in the right format (URL or Data URL)
    const milestoneImageURL = milestoneImageFile 
      ? URL.createObjectURL(milestoneImageFile) 
      : null;
      
    // Create new milestone
    const newMilestone = {
      id: Date.now().toString(),
      name: milestoneName,
      amount: milestoneAmount,
      percentage: milestonePercentage,
      image: milestoneImageURL
    };
    
    // Log to verify data
    console.log("Adding new milestone:", newMilestone);
    
    // Update project with the new milestone
    updateProject({
      ...project,
      milestones: [...(project.milestones || []), newMilestone]
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      <Navbar activePage="my-projects" showAuthButtons={false} />

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
            
            {/* Tabs */}
            <div className="grid grid-cols-3 mb-6">
              {['Details', 'My Guarantor', 'Milestones'].map(tab => (
                <button
                  key={tab}
                  className={`py-3 px-6 text-center font-medium ${
                    activeTab === tab 
                      ? 'bg-[#ffc628] text-black rounded-t-lg' 
                      : 'bg-white text-gray-700'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Project Details */}
            {activeTab === 'Details' && (
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left side - About Project */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-4">About Project</h2>
                  
                  {/* Status */}
                  <div className="mb-4">
                    <div className="flex items-center">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ffc628] mr-2"></span>
                      <span className="text-sm font-medium">
                        Status: On-Going
                      </span>
                    </div>
                  </div>
                  
                  {/* Project image */}
                  <div className="mb-6">
                    <img 
                      src={project.details.image || "/default-farm.jpg"}
                      alt="Project" 
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                  
                  {/* Project title */}
                  <h3 className="text-lg font-bold mb-4">
                    {project.details.product || "Securing Farming Funding for Growth and Sustainability"}
                  </h3>
                  
                  {/* Project details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 mb-6">
                    <div>
                      <p className="text-xs text-gray-500">Project ID:</p>
                      <p className="font-medium">{project.id || "PFLA345N"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Issuer/Partner:</p>
                      <p className="font-medium">Alexa John</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Sec Registration No:</p>
                      <p className="font-medium">35147</p>
                    </div>
                  </div>
                  
                  {/* Funding slider */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">PHP 0</span>
                      <span className="text-xs font-medium">
                        PHP {(fundingRequirement / 2).toLocaleString()}
                      </span>
                      <span className="text-xs font-medium">
                        PHP {(fundingRequirement * 0.8).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-blue-500 rounded-full" 
                        style={{ width: `${fundingPercentage}%` }}
                      ></div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium">PHP {fundingRequirement.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Project Requirement</p>
                    </div>
                  </div>
                  
                  {/* Stats cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4 text-center">
                      <p className="text-xl font-bold">{fundingPercentage}%</p>
                      <p className="text-xs text-gray-500">Funded</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 text-center">
                      <p className="text-xl font-bold">{daysRemaining}</p>
                      <p className="text-xs text-gray-500">Days Left</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 text-center">
                      <p className="text-xl font-bold">{estimatedReturn}%</p>
                      <p className="text-xs text-gray-500">Est. Return(%A)</p>
                    </div>
                  </div>
                </div>
                
                {/* Right side - Investor Requests */}
                <div className="md:w-80">
                  <h2 className="text-xl font-bold mb-4">Investors Requests</h2>
                  <p className="text-sm mb-4">You have {investorRequests.length} offers:</p>
                  
                  {/* Investor list */}
                  <div className="space-y-4">
                    {investorRequests.map((investor, index) => (
                      <div key={index} className="mb-4">
                        <div className="flex items-center mb-3">
                          <img 
                            src={investor.avatar} 
                            alt={investor.name} 
                            className="w-10 h-10 rounded-full mr-3"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=${investor.name}&background=random`;
                            }}
                          />
                          <div>
                            <p className="font-medium">{investor.name}</p>
                            <p className="text-xs text-gray-500">{investor.username}</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button className="flex-1 bg-[#ffc628] hover:bg-[#e6b324] text-black">
                            Accept
                          </Button>
                          <Button variant="outline" className="flex-1 bg-gray-100 hover:bg-gray-200">
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Milestones Tab Content */}
            {activeTab === 'Milestones' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Project Milestones</h2>
                
                {/* Milestone header */}
                <h3 className="text-lg font-medium mb-4">Milestones 1</h3>
                
                {/* Milestone content */}
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                  {/* Milestone image with error handling */}
                  <div className="md:w-1/4">
                    <img 
                      src={
                        // ONLY use milestone image, never fall back to project image
                        project.milestones?.[0]?.image || 
                        // Use a milestone-specific placeholder
                        "https://placehold.co/400x300/ffc628/ffffff?text=Milestone"
                      } 
                      alt="Milestone" 
                      className="w-full h-48 object-cover rounded-lg"
                      style={{ border: "2px solid #ffc628" }}
                    />
                  </div>
                  
                  {/* Milestone details */}
                  <div className="md:w-3/4">
                    <div className="grid grid-cols-2 gap-y-4 mb-6">
                      <div>
                        <p className="text-xs text-gray-500">Amount:</p>
                        <p className="font-medium">PHP 50,000</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Percentage%:</p>
                        <p className="font-medium">10%</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Milestone tabs */}
                <div className="grid grid-cols-3 gap-2 mb-8">
                  {['ROI (Expense)', 'ROI (Sales)', 'Payout Schedule'].map(tab => (
                    <button
                      key={tab}
                      className={`py-3 rounded-lg font-medium text-center ${
                        selectedMilestoneTab === tab ? 'bg-[#ffc628] text-black' : 'bg-gray-100 text-gray-700'
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
                    <h3 className="text-lg font-medium mb-4">ROI (Expense)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mb-6">
                      <div>
                        <p className="text-xs text-gray-500">Description:</p>
                        <p className="text-sm mt-2">
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor ut labore et dolore magna aliqua.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-500">Price Per Unit:</p>
                          <p className="font-medium">200 PHP</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500">Unit of Measure:</p>
                          <p className="font-medium">3 Kg</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500">Total Amount:</p>
                      <p className="font-medium text-lg">3000 PHP</p>
                    </div>
                  </div>
                )}
                
                {/* ROI Sales Content */}
                {selectedMilestoneTab === 'ROI (Sales)' && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">ROI (Sales)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mb-6">
                      <div>
                        <p className="text-xs text-gray-500">Description:</p>
                        <p className="text-sm mt-2">
                          Sales projection for agricultural products from the farming project, 
                          including expected yield and market prices.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-500">Sales Price Per Unit:</p>
                          <p className="font-medium">350 PHP</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500">Expected Yield:</p>
                          <p className="font-medium">30 Kg</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-xs text-gray-500">Total Expected Revenue:</p>
                      <p className="font-medium text-lg">10,500 PHP</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500">Net Profit (after expenses):</p>
                      <p className="font-medium text-lg">7,500 PHP</p>
                    </div>
                  </div>
                )}
                
                {/* Payout Schedule Content */}
                {selectedMilestoneTab === 'Payout Schedule' && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Payout Schedule</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mb-6">
                      <div>
                        <p className="text-xs text-gray-500">Generate Total Payout Required:</p>
                        <p className="font-medium">{payoutSchedule.totalRequired.toLocaleString()} PHP</p>
                      </div>
                      <div className="text-right">
                        <button className="px-4 py-1.5 bg-gray-200 rounded-md text-sm">
                          Edit
                        </button>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">% of Total Payout (Capital +Interest%):</p>
                        <p className="font-medium">{payoutSchedule.paymentAmount.toLocaleString()} PHP</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">Payout Date:</p>
                        <p className="font-medium">{payoutSchedule.payoutDate}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">Amount:</p>
                        <p className="font-medium">{payoutSchedule.paymentAmount.toLocaleString()} PHP</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">Generate Net Income Calculation:</p>
                        <p className="font-medium">{payoutSchedule.netIncome.toLocaleString()} PHP</p>
                      </div>
                    </div>
                    
                    {/* Calendar preview (simplified) */}
                    <div className="mt-6">
                      <h4 className="font-medium mb-2">Payout Calendar</h4>
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="flex justify-between mb-4">
                          <span className="font-medium">October</span>
                          <div className="flex space-x-2">
                            <button className="w-6 h-6 flex items-center justify-center bg-white rounded-full">
                              &lt;
                            </button>
                            <button className="w-6 h-6 flex items-center justify-center bg-white rounded-full">
                              &gt;
                            </button>
                          </div>
                        </div>
                        
                        {/* Days of week */}
                        <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-1">
                          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                            <div key={day}>{day}</div>
                          ))}
                        </div>
                        
                        {/* Calendar days */}
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: 31 }, (_, i) => (
                            <div 
                              key={i + 1}
                              className={`aspect-square flex items-center justify-center text-sm
                                ${i + 1 === 15 ? 'bg-[#ffc628] rounded-full' : ''}
                              `}
                            >
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* My Guarantor Tab Content */}
            {activeTab === 'My Guarantor' && (
              <div>
                <h2 className="text-xl font-bold mb-4">My Guarantor</h2>
                {/* Guarantor content */}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectDetailsView;