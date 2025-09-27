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
  
  const handleInvest = async () => {
    console.log("🎯 handleInvest called with amount:", investmentAmount);
    
    if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    try {
      console.log("📤 Making investment request to project:", projectId);
      const amount = parseFloat(investmentAmount);
      const result = await investInProject(projectId!, amount);
      console.log("📥 Investment result:", result);
      
      if (result.success) {
        toast.success("Investment request sent!");
        // Refresh notifications to show new investment submission notification
        await fetchNotifications();
        navigate("/investor/calendar");
      } else {
        console.log("❌ Investment failed:", result);
        toast.error("Failed to submit investment request");
        // Refresh notifications to show any error notifications
        await fetchNotifications();
      }
    } catch (error) {
      console.error('💥 Investment error:', error);
      toast.error("An error occurred");
      // Refresh notifications to show any error notifications
      await fetchNotifications();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
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
                    <h3 className="font-medium mb-2">How much would you like to invest?</h3>
                    <div className="flex gap-4">
                      <Input 
                        type="number"
                        value={investmentAmount}
                        onChange={(e) => setInvestmentAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-64"
                      />
                      <Button 
                        onClick={() => setShowConfirm(true)}
                        className="bg-[#0C4B20] text-white hover:bg-[#8FB200]"
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-4">Confirm your investment</h3>
                    <p className="mb-2">Amount: <span className="font-bold">{parseFloat(investmentAmount).toLocaleString()} PHP</span></p>
                    <p className="mb-4">Project: <span className="font-bold">{details.product || "Unnamed Project"}</span></p>
                    <div className="flex gap-4">
                      <Button 
                        onClick={handleInvest}
                        className="bg-[#0C4B20] text-white hover:bg-[#8FB200]"
                      >
                        Confirm Investment
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowConfirm(false)}
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
    </div>
  );
};