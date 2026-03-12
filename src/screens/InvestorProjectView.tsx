// src/screens/InvestorProjectView.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "../contexts/ProjectsContext";
import { AuthContext } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import { Navbar } from "../components/Navigation/navbar";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from '../config/environment';
import { investInProject, authFetch } from '../lib/api';
import { createPaymentCheckout } from '../lib/paymongo';
import { InvestorEducationModal } from '../components/InvestorEducationModal';
// import { TopUpModal } from '../components/TopUpModal'; // Disabled for PayMongo integration

// Interface for insufficient funds error (kept for reference, not used with PayMongo)
interface InsufficientFundsError {
  show: boolean;
  currentBalance: number;
  requiredAmount: number;
  shortfall: number;
}

export const InvestorProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { profile } = React.useContext(AuthContext)!;
  const { fetchNotifications } = useNotifications();
  const navigate = useNavigate();
  
  console.log("🎯 InvestorProjectView loaded with projectId:", projectId);
  
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [eligibility, setEligibility] = useState<any>(null);
  const [educationCompleted, setEducationCompleted] = useState<boolean | null>(null);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [reconfirmLoading, setReconfirmLoading] = useState(false);
  const [cancelInvestmentLoading, setCancelInvestmentLoading] = useState(false);
  // const [showTopUpModal, setShowTopUpModal] = useState(false); // Disabled for PayMongo
  const [insufficientFundsError, setInsufficientFundsError] = useState<InsufficientFundsError>({
    show: false,
    currentBalance: 0,
    requiredAmount: 0,
    shortfall: 0
  });
  
  // Helper function to format duration
  const formatDuration = (duration: string) => {
    if (!duration) return "N/A";
    
    try {
      const date = new Date(duration);
      if (isNaN(date.getTime())) return duration; // Return original if not a valid date
      
      // Format as user-friendly date
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return duration; // Return original if formatting fails
    }
  };
  
  // Check if user is trying to invest in their own project
  const isOwnProject = project?.firebase_uid === profile?.id;
  
  // Check if user already has an investment in this project
  const investorRequests = project?.project_data?.investorRequests || [];
  const userInvestment = investorRequests.find(req => req.investorId === profile?.id);
  const hasExistingInvestment = !!userInvestment;
  
  console.log("🔍 InvestorProjectView - Project owner:", project?.firebase_uid);
  console.log("🔍 InvestorProjectView - Current user:", profile?.id);
  console.log("🔍 InvestorProjectView - Is own project:", isOwnProject);
  console.log("🔍 InvestorProjectView - Investor requests:", investorRequests);
  console.log("🔍 InvestorProjectView - User investment:", userInvestment);
  console.log("🔍 InvestorProjectView - Has existing investment:", hasExistingInvestment);
  
  // Fetch project data directly from API
  useEffect(() => {
    const fetchProject = async () => {
      try {
        console.log("InvestorProjectView - fetching project with ID:", projectId);
        const projectData = await authFetch(`${API_BASE_URL}/projects/${projectId}`);
        console.log("InvestorProjectView - fetched project data:", projectData);
        console.log("InvestorProjectView - project details:", projectData?.project_data?.details);
        setProject(projectData);
      } catch (error) {
        console.error("Error fetching project:", error);
        toast.error("Failed to load project details");
      } finally {
        setLoading(false);
      }
    };
    
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  // Fetch investor classification + remaining limit
  useEffect(() => {
    const fetchEligibility = async () => {
      try {
        const data = await authFetch(`${API_BASE_URL}/user/investment-eligibility`);
        setEligibility(data);
      } catch (e) {
        // non-blocking
      }
    };
    fetchEligibility();
  }, []);

  // Fetch investor education status
  useEffect(() => {
    const checkEducation = async () => {
      try {
        const data = await authFetch(`${API_BASE_URL}/user/education-status`);
        setEducationCompleted(data.completed === true);
      } catch {
        setEducationCompleted(false);
      }
    };
    checkEducation();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-500">Loading project...</div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-500">Project not found</div>
      </div>
    );
  }
  
  const projectData = project.project_data || {};
  const details = projectData.details || {};
  
  // PayMongo payment handler - redirects to PayMongo checkout
  const handleInvest = async () => {
    console.log("🎯 handleInvest called with amount:", investmentAmount);
    
    if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    const amount = parseFloat(investmentAmount);
    
    // Minimum investment check (PayMongo minimum is 100 PHP)
    if (amount < 100) {
      toast.error("Minimum investment amount is ₱100");
      return;
    }
    
    setProcessingPayment(true);
    
    try {
      console.log("💳 Creating PayMongo checkout for project:", projectId);
      
      const result = await createPaymentCheckout({
        amount: amount,
        projectId: projectId!,
        projectName: details.product || "Investment Project",
        description: `Investment in ${details.product || "project"}`
      });
      
      console.log("📥 PayMongo checkout result:", result);
      
      if (result.success && result.checkoutUrl) {
        toast.success("Redirecting to payment...");
        // Redirect to PayMongo checkout page
        window.location.href = result.checkoutUrl;
      } else {
        console.log("❌ Payment checkout failed:", result);
        toast.error(result.error || "Failed to create payment checkout");
      }
    } catch (error: any) {
      console.error('💥 Payment error:', error);
      toast.error(error?.message || "An error occurred while processing payment");
    } finally {
      setProcessingPayment(false);
    }
  };
  const handleReconfirmInvestment = async () => {
    setReconfirmLoading(true);
    try {
      await authFetch(`${API_BASE_URL}/investor/projects/${projectId}/reconfirm`, { method: 'POST' });
      toast.success('Investment reconfirmed! Your commitment is maintained.');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reconfirm investment');
    } finally {
      setReconfirmLoading(false);
    }
  };

  const handleCancelInvestment = async () => {
    if (!window.confirm('Are you sure you want to cancel your investment? This action cannot be undone.')) return;
    setCancelInvestmentLoading(true);
    try {
      await authFetch(`${API_BASE_URL}/investor/projects/${projectId}/cancel-investment`, { method: 'POST' });
      toast.success('Your investment has been cancelled and your funds will be returned.');
      setTimeout(() => navigate('/investor/projects'), 1200);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel investment');
    } finally {
      setCancelInvestmentLoading(false);
    }
  };
  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      {/* Investor Education Modal Gate */}
      {showEducationModal && (
        <InvestorEducationModal onComplete={() => { setEducationCompleted(true); setShowEducationModal(false); }} />
      )}
      {/* Insufficient Funds Modal */}
      {insufficientFundsError.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50" 
            onClick={() => setInsufficientFundsError(prev => ({ ...prev, show: false }))}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-300">
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
              Insufficient iFunds Balance
            </h2>
            
            {/* Description */}
            <p className="text-center text-gray-600 mb-6">
              You don't have enough funds in your iFunds wallet to make this investment.
            </p>
            
            {/* Balance Details */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Balance:</span>
                <span className="font-bold text-gray-800">₱{insufficientFundsError.currentBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Investment Amount:</span>
                <span className="font-bold text-gray-800">₱{insufficientFundsError.requiredAmount.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span className="text-red-600 font-medium">Amount Needed:</span>
                <span className="font-bold text-red-600">₱{insufficientFundsError.shortfall.toLocaleString()}</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => {
                  setInsufficientFundsError(prev => ({ ...prev, show: false }));
                  setShowTopUpModal(true);
                }}
                className="w-full bg-[#0C4B20] text-white hover:bg-[#8FB200] py-3"
              >
                Add Funds to Wallet
              </Button>
              <Button 
                variant="outline"
                onClick={() => setInsufficientFundsError(prev => ({ ...prev, show: false }))}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
            
            {/* Info Note */}
            <p className="text-xs text-center text-gray-500 mt-4">
              Add funds to your iFunds wallet first, then come back to invest in this project.
            </p>
          </div>
        </div>
      )}
      
      {/* <Navbar activePage="invest" showAuthButtons={false} /> */}
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-0 md:w-[280px] flex-shrink-0">
          <Sidebar activePage="Investment Opportunities" />
        </div>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <img 
                  src={details.image || "https://placehold.co/600x400/ffc628/ffffff?text=Project"} 
                  alt={details.product || "Project"}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              
              <div className="md:w-2/3">
                <h1 className="text-2xl font-bold mb-2">{details.product || "Unnamed Project"}</h1>
                <p className="text-gray-500 mb-6">{details.overview || "No description available"}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Required Funding</p>
                    <p className="font-bold text-lg">
                      {parseFloat(details.loanAmount || 
                                details.investmentAmount || "0").toLocaleString()} PHP
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Est. Return</p>
                    <p className="font-bold text-lg">{details.investorPercentage || projectData.estimatedReturn || "N/A"}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-bold text-lg">{formatDuration(details.timeDuration)}</p>
                  </div>
                </div>
                
                {isOwnProject ? (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2 text-blue-800">This is your project</h3>
                    <p className="text-blue-600">You cannot invest in your own project. Share this project with potential investors to get funding.</p>
                    <Button 
                      onClick={() => navigate("/borrower/calendar")}
                      className="mt-3 bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Go to My Projects
                    </Button>
                  </div>
                ) : hasExistingInvestment ? (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2 text-orange-800">You already have an investment in this project</h3>
                    <div className="text-orange-600 space-y-1">
                      <p><strong>Amount:</strong> ₱{userInvestment.amount.toLocaleString()}</p>
                      <p><strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                          userInvestment.status === 'approved' ? 'bg-green-100 text-green-800' :
                          userInvestment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {userInvestment.status}
                        </span>
                      </p>
                      <p><strong>Date:</strong> {new Date(userInvestment.date).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button 
                        onClick={() => navigate("/investor/investments")}
                        className="bg-orange-600 text-white hover:bg-orange-700"
                      >
                        View My Investments
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => navigate("/investor/calendar")}
                      >
                        Browse Other Projects
                      </Button>
                    </div>
                  </div>
                ) : !showConfirm ? (
                  <div>
                    {/* Material Change Reconfirmation Banner */}
                    {project?.project_data?.pendingReconfirmation === true &&
                      (project.project_data.investorRequests || []).some((r: any) => r.investorId === profile?.id) && (
                      <div className="mb-4 bg-orange-50 border border-orange-300 rounded-2xl px-4 py-3">
                        <div className="flex items-start gap-3 mb-3">
                          <span className="text-xl mt-0.5">⚠️</span>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-orange-800">Material Change — Action Required</p>
                            <p className="text-xs text-orange-700 mt-0.5">
                              This campaign has been updated with a material change. You must reconfirm or cancel your investment by{' '}
                              <strong>
                                {project.project_data.reconfirmationDeadline
                                  ? new Date(project.project_data.reconfirmationDeadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                  : 'the deadline'}
                              </strong>.
                            </p>
                            {project.project_data.materialChangeLog?.slice(-1)[0] && (
                              <p className="text-xs text-orange-600 mt-1 italic">
                                "{project.project_data.materialChangeLog.slice(-1)[0].description}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={handleReconfirmInvestment}
                            disabled={reconfirmLoading}
                            className="text-xs px-4 py-2 rounded-lg bg-[#0C4B20] text-white font-medium hover:bg-[#0a3d1a] disabled:opacity-50"
                          >
                            {reconfirmLoading ? 'Confirming…' : '✓ Reconfirm Investment'}
                          </button>
                          <button
                            onClick={handleCancelInvestment}
                            disabled={cancelInvestmentLoading}
                            className="text-xs px-4 py-2 rounded-lg border border-red-400 text-red-600 font-medium hover:bg-red-50 disabled:opacity-50"
                          >
                            {cancelInvestmentLoading ? 'Cancelling…' : '✕ Cancel Investment'}
                          </button>
                        </div>
                      </div>
                    )}
                    {/* Education module gate */}
                    {educationCompleted === false && (
                      <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
                        <span className="text-xl mt-0.5">🎓</span>
                        <div>
                          <p className="text-sm font-semibold text-amber-800">Complete the Investor Education Module first</p>
                          <p className="text-xs text-amber-600 mt-0.5 mb-2">Required by SEC Crowdfunding Rules before placing your first investment.</p>
                          <Button size="sm" className="bg-amber-500 text-white hover:bg-amber-600 h-8 text-xs px-3" onClick={() => setShowEducationModal(true)}>
                            Start Education Module →
                          </Button>
                        </div>
                      </div>
                    )}
                    {/* Investor Classification Badge */}
                    {eligibility && (
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                          eligibility.investorTier === 'qualified'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : eligibility.investorTier === 'standard'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          {eligibility.investorTier === 'qualified' && '★ '}
                          {eligibility.investorTier === 'qualified'
                            ? 'Qualified Investor — No Cap'
                            : eligibility.investorTier === 'standard'
                            ? 'Standard Investor — 10% limit'
                            : 'Retail Investor — 5% limit'}
                        </span>
                        {eligibility.investorTier !== 'qualified' && (
                          <span className="text-xs text-gray-500">
                            Remaining capacity: <span className="font-semibold text-[#0C4B20]">₱{Math.max(0, eligibility.remainingCapacity || 0).toLocaleString()}</span>
                          </span>
                        )}
                      </div>
                    )}
                    <h3 className="font-medium mb-2">How much would you like to invest?</h3>
                    <p className="text-sm text-gray-500 mb-1">Minimum investment: ₱100</p>
                    {eligibility && eligibility.investorTier !== 'qualified' && (
                      <p className="text-xs text-gray-400 mb-3">
                        Your {eligibility.investorTier} investor limit: ₱{(eligibility.maxInvestmentAmount || 0).toLocaleString()} · Used: ₱{((eligibility.maxInvestmentAmount || 0) - Math.max(0, eligibility.remainingCapacity || 0)).toLocaleString()}
                      </p>
                    )}
                    <div className="flex gap-4">
                      <Input 
                        type="number"
                        value={investmentAmount}
                        onChange={(e) => setInvestmentAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-64"
                        min="100"
                      />
                      <Button 
                        onClick={() => setShowConfirm(true)}
                        className="bg-[#0C4B20] text-white hover:bg-[#8FB200]"
                        disabled={!investmentAmount || parseFloat(investmentAmount) < 100 ||
                          educationCompleted === false ||
                          (eligibility && eligibility.investorTier !== 'qualified' && parseFloat(investmentAmount) > Math.max(0, eligibility.remainingCapacity || 0))}
                      >
                        Continue
                      </Button>
                    </div>
                    {eligibility && eligibility.investorTier !== 'qualified' && investmentAmount &&
                      parseFloat(investmentAmount) > Math.max(0, eligibility.remainingCapacity || 0) && (
                      <p className="mt-2 text-xs text-red-500 font-medium">
                        ⚠ Amount exceeds your remaining investment capacity of ₱{Math.max(0, eligibility.remainingCapacity || 0).toLocaleString()}.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-4">Confirm your investment</h3>
                    <p className="mb-2">Amount: <span className="font-bold">₱{parseFloat(investmentAmount).toLocaleString()}</span></p>
                    <p className="mb-4">Project: <span className="font-bold">{details.product || "Unnamed Project"}</span></p>
                    <p className="text-sm text-gray-500 mb-4">You will be redirected to PayMongo to complete your payment securely.</p>
                    <div className="flex gap-4">
                      <Button 
                        onClick={handleInvest}
                        className="bg-[#0C4B20] text-white hover:bg-[#8FB200]"
                        disabled={processingPayment}
                      >
                        {processingPayment ? "Processing..." : "Proceed to Payment"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowConfirm(false)}
                        disabled={processingPayment}
                      >
                        Back
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Top Up Modal - Disabled for PayMongo integration
      <TopUpModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        onSuccess={() => {
          setShowTopUpModal(false);
          toast.success("Top-up request submitted! Your balance will be updated once approved.");
        }}
      />
      */}
    </div>
  );
};