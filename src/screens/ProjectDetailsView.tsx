import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../contexts/ProjectsContext';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { ChevronLeft } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { toast } from 'react-hot-toast';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';

const ProjectDetailsView: React.FC = () => {
  const sectionTitleClass = 'text-xl font-semibold text-gray-900';
  const cardTitleClass = 'text-lg font-semibold text-gray-900';
  const labelClass = 'text-sm font-medium text-gray-600';
  const valueClass = 'text-sm font-semibold text-gray-900';

  const { projectId } = useParams<{ projectId: string }>();
  const { projects, loadProjects } = useProjects();
  const navigate = useNavigate();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('Details');
  const [selectedMilestoneTab, setSelectedMilestoneTab] = useState('ROI (Expense)');
  const [reportForm, setReportForm] = useState({ quarter: 'Q1', year: new Date().getFullYear().toString(), fundsUtilized: '', description: '' });
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [latestProject, setLatestProject] = useState<any | null>(null);
  const [liveEscrowStatus, setLiveEscrowStatus] = useState<string>('');

  const handleSubmitReport = async () => {
    if (!project) return;
    if (!reportForm.fundsUtilized || !reportForm.description.trim()) {
      toast.error('Please fill in all report fields');
      return;
    }
    setReportSubmitting(true);
    try {
      await authFetch(`${API_BASE_URL}/borrower/projects/${projectId}/post-offering-report`, {
        method: 'POST',
        body: JSON.stringify(reportForm),
      });
      toast.success('Report submitted successfully!');
      setReportForm(prev => ({ ...prev, fundsUtilized: '', description: '' }));
      loadProjects();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit report');
    } finally {
      setReportSubmitting(false);
    }
  };

  // Refresh projects when projectId changes to get latest funding data
  React.useEffect(() => {
    if (projectId) {
      console.log("🔄 Refreshing project data for ID:", projectId);
      loadProjects();
      authFetch(`${API_BASE_URL}/projects/${projectId}?_=${Date.now()}`)
        .then((freshProject) => {
          setLatestProject(freshProject);
        })
        .catch((error) => {
          console.warn('Failed to fetch latest project details, using context data:', error);
        });
      authFetch(`${API_BASE_URL}/projects/${projectId}/escrow-status?_=${Date.now()}`)
        .then((escrowData) => {
          if (escrowData?.escrowStatus) {
            setLiveEscrowStatus(escrowData.escrowStatus);
          }
        })
        .catch((error) => {
          console.warn('Failed to fetch live escrow status, using project data fallback:', error);
        });
      window.scrollTo({ top: 0, behavior: 'auto' });
      contentRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [projectId, loadProjects]);

  console.log("ProjectDetailsView - projectId from URL:", projectId);
  console.log("ProjectDetailsView - projects in context:", projects);

  // Convert projectId to number for comparison since DB IDs are numbers
  const fallbackProject = projects.find(p => p.id === parseInt(projectId as string, 10));
  const project = latestProject || fallbackProject;
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
  const projectData = project.project_data || {};
  const escrowStatus =
    liveEscrowStatus ||
    projectData.escrowStatus ||
    projectData.escrow_status ||
    projectData?.details?.escrowStatus ||
    projectData?.details?.escrow_status ||
    'pending';
  const escrowSteps = [
    { key: 'pending', label: 'Pending' },
    { key: 'funds_received', label: 'Funds Received' },
    { key: 'escrow_secured', label: 'Escrow Secured' },
    { key: 'released_to_issuer', label: 'Released to Issuer' }
  ];
  const escrowCurrentIndex = Math.max(0, escrowSteps.findIndex((step) => step.key === escrowStatus));

  return (
    <div className="flex flex-1">
      {/* Sidebar */}
      <div className="hidden md:block w-[325px]">
        <Sidebar activePage="My Issuer/Borrower" />
      </div>

      {/* Main content */}
      <main className="flex-1">
        <div ref={contentRef} className="w-[90%] mx-auto bg-white rounded-t-[30px] p-4 md:p-8 md:w-full md:mx-0 min-h-screen flex flex-col animate-fadeIn delay-300">
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

          {/* Tabs */}
          <div className="grid grid-cols-3 mb-6 rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
            {['Details', 'Milestones', 'Reports'].map(tab => (
              <button
                key={tab}
                className={`py-3 px-6 text-center font-medium ${
                  activeTab === tab 
                    ? 'bg-[#0C4B20] text-white' 
                    : 'bg-transparent text-gray-700 border-r border-gray-200 last:border-r-0'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Project Details */}
          {activeTab === 'Details' && (
            <div className="space-y-6">
              <h2 className={sectionTitleClass}>About Project</h2>

              <div className="border border-gray-200 rounded-xl p-4 md:p-5 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm md:text-base font-semibold text-gray-800">Escrow Status</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#0C4B20]/10 text-[#0C4B20]">
                    {escrowSteps[escrowCurrentIndex]?.label || 'Pending'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {escrowSteps.map((step, index) => {
                    const completed = index <= escrowCurrentIndex;
                    return (
                      <div
                        key={step.key}
                        className={`text-xs rounded-md border px-2 py-2 text-center font-medium transition-colors ${
                          completed
                            ? 'bg-[#0C4B20] text-white border-[#0C4B20]'
                            : 'bg-white text-gray-500 border-gray-200'
                        }`}
                      >
                        {step.label}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Project image */}
              <div className="rounded-xl overflow-hidden border border-gray-100">
                <img 
                  src={project.project_data?.details?.image || "/default-farm.jpg"}
                  alt="Project" 
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              
              {/* Project title */}
              <h3 className={cardTitleClass}>
                {project.project_data?.details?.product || "UBE Field"}
              </h3>
              
              {/* Project details grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 p-5 rounded-xl border border-gray-200 bg-white shadow-sm">
                <div>
                  <p className={`${labelClass} mb-1`}>Project ID:</p>
                  <p className={valueClass}>PFLA{project.id}5N</p>
                </div>
                <div>
                  <p className={`${labelClass} mb-1`}>Issuer/Partner:</p>
                  <p className={valueClass}>{project.project_data?.details?.issuer || 'Alexa John'}</p>
                </div>
                <div>
                  <p className={`${labelClass} mb-1`}>Sec Registration No:</p>
                  <p className={valueClass}>{project.project_data?.details?.secRegistration || '35147'}</p>
                </div>
              </div>
              
              {/* Funding progress section */}
              <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm">
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
                  <p className="text-lg font-semibold text-gray-900">PHP {totalFundingRequired.toLocaleString()}</p>
                  <p className={labelClass}>Project Requirement</p>
                </div>
              </div>
              
              {/* Stats cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-semibold text-gray-900">{fundingPercentage}%</p>
                  <p className={labelClass}>Funded</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-semibold text-gray-900">{daysRemaining}</p>
                  <p className={labelClass}>Days Left</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-semibold text-gray-900">{estimatedReturn}%</p>
                  <p className={labelClass}>Est. Return(P.A)</p>
                </div>
              </div>
            </div>
          )}

          {/* Milestones Tab Content */}
          {activeTab === 'Milestones' && (
            <div className="space-y-6">
              <h2 className={sectionTitleClass}>Project Milestones</h2>
              {Array.isArray(project.project_data?.milestones) && project.project_data.milestones.length > 0 ? (
                project.project_data.milestones.map((milestone, idx) => (
                  <div key={idx} className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-5">
                    <h3 className={cardTitleClass}>Milestone {idx + 1}</h3>
                    <div className="flex gap-6">
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
                            <p className={labelClass}>Amount:</p>
                            <p className={valueClass}>PHP {milestone.amount?.toLocaleString() || '-'}</p>
                          </div>
                          <div>
                            <p className={labelClass}>Percentage%:</p>
                            <p className={valueClass}>{milestone.percentage || '-'}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Milestone sub-tabs */}
                    <div className="grid grid-cols-3 rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                      {['ROI (Expense)', 'ROI (Sales)', 'Payout Schedule'].map(tab => (
                        <button
                          key={tab}
                          className={`py-3 font-medium text-center text-sm ${
                            selectedMilestoneTab === tab
                              ? 'bg-[#0C4B20] text-white'
                              : 'bg-transparent text-gray-700 border-r border-gray-200 last:border-r-0 hover:bg-gray-100'
                          }`}
                          onClick={() => setSelectedMilestoneTab(tab)}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    {/* ROI Expense Content */}
                    {selectedMilestoneTab === 'ROI (Expense)' && (
                      <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <h3 className={`${cardTitleClass} mb-5`}>ROI (Expense)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-6">
                          <div>
                            <p className={`${labelClass} mb-2`}>Description:</p>
                            <p className="text-sm leading-relaxed">{milestone.expenseDescription || '-'}</p>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <p className={`${labelClass} mb-1`}>Price Per Unit:</p>
                              <p className={valueClass}>{milestone.expensePricePerUnit ? `${milestone.expensePricePerUnit} PHP` : '-'}</p>
                            </div>
                            <div>
                              <p className={`${labelClass} mb-1`}>Unit of Measure:</p>
                              <p className={valueClass}>{milestone.expenseUnitOfMeasure || '-'}</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className={`${labelClass} mb-1`}>Total Amount:</p>
                          <p className="text-xl font-semibold text-gray-900">{milestone.expenseTotalAmount ? `${milestone.expenseTotalAmount} PHP` : '-'}</p>
                        </div>
                      </div>
                    )}
                    {/* ROI Sales Content */}
                    {selectedMilestoneTab === 'ROI (Sales)' && (
                      <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <h3 className={`${cardTitleClass} mb-5`}>ROI (Sales)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-6">
                          <div>
                            <p className={`${labelClass} mb-2`}>Description:</p>
                            <p className="text-sm leading-relaxed">{milestone.salesDescription || '-'}</p>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <p className={`${labelClass} mb-1`}>Price Per Unit:</p>
                              <p className={valueClass}>{milestone.salesPricePerUnit ? `${milestone.salesPricePerUnit} PHP` : '-'}</p>
                            </div>
                            <div>
                              <p className={`${labelClass} mb-1`}>Unit of Measure:</p>
                              <p className={valueClass}>{milestone.salesUnitOfMeasure || '-'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className={`${labelClass} mb-1`}>Total Amount:</p>
                            <p className="text-xl font-semibold text-gray-900">{milestone.salesTotalAmount ? `${milestone.salesTotalAmount} PHP` : '-'}</p>
                          </div>
                          <div>
                            <p className={`${labelClass} mb-1`}>Net Income Calculation:</p>
                            <p className="text-xl font-semibold text-gray-900">{milestone.netIncomeCalculation ? `${milestone.netIncomeCalculation} PHP` : '-'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Payout Schedule Content */}
                    {selectedMilestoneTab === 'Payout Schedule' && (
                      <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <h3 className={`${cardTitleClass} mb-5`}>Payout Schedule</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                          <div>
                            <p className={`${labelClass} mb-1`}>Generate Total Payout Required:</p>
                            <p className={valueClass}>{milestone.payoutRequired ? `${milestone.payoutRequired} PHP` : '-'}</p>
                          </div>
                          <div></div>
                          <div>
                            <p className={`${labelClass} mb-1`}>% of Total Payout (Capital +Interest):</p>
                            <p className={valueClass}>{milestone.payoutCapitalInterest ? `${milestone.payoutCapitalInterest} PHP` : '-'}</p>
                          </div>
                          <div>
                            <p className={`${labelClass} mb-1`}>Payout Date:</p>
                            <p className={valueClass}>{milestone.payoutDate || '-'}</p>
                          </div>
                          <div>
                            <p className={`${labelClass} mb-1`}>Amount:</p>
                            <p className={valueClass}>{milestone.payoutAmount ? `${milestone.payoutAmount} PHP` : '-'}</p>
                          </div>
                          <div></div>
                          <div>
                            <p className={`${labelClass} mb-1`}>Generate Net Income Calculation:</p>
                            <p className={valueClass}>{milestone.netIncomeCalculation ? `${milestone.netIncomeCalculation} PHP` : '-'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 text-gray-500">No milestones available for this project.</div>
              )}
            </div>
          )}

          {/* Post-Offering Reports Tab */}
          {activeTab === 'Reports' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                <h2 className={`${sectionTitleClass} mb-1`}>Post-Offering Reports</h2>
                <p className={labelClass}>Quarterly fund utilization reports required by SEC Rules on Crowdfunding. Submit within 30 days after each quarter ends.</p>
              </div>

              {/* Existing reports */}
              {Array.isArray(project.project_data?.postOfferingReports) && project.project_data.postOfferingReports.length > 0 ? (
                <div className="space-y-3">
                  {(project.project_data.postOfferingReports as any[]).slice().reverse().map((r: any) => (
                    <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-[#0C4B20]">{r.quarter} {r.year}</span>
                        <span className="text-xs text-gray-400">{new Date(r.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{r.description}</p>
                      <p className={labelClass}>Funds Utilized: <strong className="text-gray-900">₱{parseFloat(r.fundsUtilized).toLocaleString()}</strong></p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
                  No reports submitted yet. Submit your first quarterly report below.
                </div>
              )}

              {/* Submit new report */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h3 className={cardTitleClass}>Submit New Report</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`${labelClass} block mb-1`}>Quarter</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C4B20]"
                      value={reportForm.quarter}
                      onChange={e => setReportForm(prev => ({ ...prev, quarter: e.target.value }))}
                    >
                      <option>Q1</option>
                      <option>Q2</option>
                      <option>Q3</option>
                      <option>Q4</option>
                    </select>
                  </div>
                  <div>
                    <label className={`${labelClass} block mb-1`}>Year</label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C4B20]"
                      value={reportForm.year}
                      onChange={e => setReportForm(prev => ({ ...prev, year: e.target.value }))}
                      min={2020}
                      max={2099}
                    />
                  </div>
                </div>
                <div>
                  <label className={`${labelClass} block mb-1`}>Funds Utilized (₱)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C4B20]"
                    placeholder="0.00"
                    value={reportForm.fundsUtilized}
                    onChange={e => setReportForm(prev => ({ ...prev, fundsUtilized: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={`${labelClass} block mb-1`}>How Funds Were Utilized</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C4B20] resize-none"
                    rows={3}
                    placeholder="Describe how the funds raised were used this quarter…"
                    value={reportForm.description}
                    onChange={e => setReportForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <button
                  onClick={handleSubmitReport}
                  disabled={reportSubmitting}
                  className="w-full py-2.5 px-4 bg-[#0C4B20] text-white text-sm font-medium rounded-lg hover:bg-[#0a3d1a] disabled:opacity-50"
                >
                  {reportSubmitting ? 'Submitting…' : 'Submit Report'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProjectDetailsView;
