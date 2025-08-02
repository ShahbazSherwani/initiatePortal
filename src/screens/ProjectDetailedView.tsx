import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectForm } from '../contexts/ProjectFormContext';
import { useProjects } from '../contexts/ProjectsContext';
import { Navbar } from '../components/Navigation/navbar';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ProjectDetailsView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { form } = useProjectForm();
  const { projects } = useProjects();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const project = projects.find(p => p.id === projectId);
  if (!project) return <div>Project not found</div>;
  
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const currentMonth = monthNames[currentDate.getMonth()];
  
  // Calendar generation functions
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    // Previous month days
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, isCurrentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true });
    }
    
    return days;
  };

  // Handle navigation
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

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
    if (!project) return "100,000";
    
    return project.details.loanAmount || 
           project.details.investmentAmount || 
           "100,000"; // Default
  };

  const fundingRequirement = getTotalFundingRequirement();

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      {/* <Navbar activePage="my-projects" showAuthButtons={false} /> */}

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
              <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900">
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium ml-1">Back</span>
              </button>
            </div>

            {/* Calendar section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Payout Schedule</h2>
              
              {/* Payout details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Generate Total Payout Required:</p>
                  <p className="font-medium">50,000 PHP</p>
                </div>
                <div className="text-right">
                  <button className="px-4 py-1.5 bg-gray-200 rounded-md text-sm">
                    Edit
                  </button>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">% of Total Payout (Capital +Interest%):</p>
                  <p className="font-medium">10,000 PHP</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Payout Date:</p>
                  <p className="font-medium">15 Oct, 2023</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Amount:</p>
                  <p className="font-medium">10,000 PHP</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Generate Net Income Calculation:</p>
                  <p className="font-medium">3000 PHP</p>
                </div>
              </div>
              
              {/* Calendar header */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={goToPrevMonth} className="p-1">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="font-medium text-lg">{currentMonth}</h3>
                <button onClick={goToNextMonth} className="p-1">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {/* Days of week */}
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                  <div key={day} className="py-2 text-xs font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {generateCalendarDays().map((day, idx) => (
                  <div 
                    key={idx}
                    className={`
                      aspect-square flex items-center justify-center text-sm rounded-full
                      ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                      ${day.day === 3 ? 'bg-[#ffc628]' : ''} 
                    `}
                  >
                    {day.day}
                  </div>
                ))}
              </div>
            </div>

            {/* Funding slider */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">PHP 0</span>
                <span className="text-xs font-medium">
                  PHP {Math.round(parseFloat(fundingRequirement) * 0.5)}
                </span>
                <span className="text-xs font-medium">
                  PHP {Math.round(parseFloat(fundingRequirement) * 0.8)}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-blue-500 rounded-full" 
                  style={{ width: `${fundingPercentage}%` }}
                ></div>
              </div>
              <div className="mt-2">
                <p className="text-sm font-medium">PHP {fundingRequirement}</p>
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
                <p className="text-xs text-gray-500">Est. Return</p>
              </div>
            </div>

            {/* Project section */}
            <div>
              <h2 className="text-xl font-bold mb-4">View Project</h2>
              <div className="flex items-start gap-4">
                <img 
                  src={project.details.image || "/default-project.jpg"} 
                  alt={project.details.product || "Project"} 
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-bold text-lg mb-2">{project.details.product || "Project Title"}</h3>
                  <div>
                    <p className="text-xs text-gray-500">Project ID:</p>
                    <p className="font-medium">{project.id}</p>
                  </div>
                  <button 
                    className="mt-3 px-4 py-1.5 bg-gray-200 rounded-md text-sm font-medium"
                    onClick={() => navigate(`/project/${project.id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectDetailsView;