// src/screens/InvestorProjectView.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "../contexts/ProjectsContext";
import { AuthContext } from "../contexts/AuthContext";
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
  const navigate = useNavigate();
  
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch project data directly from API
  useEffect(() => {
    const fetchProject = async () => {
      try {
        console.log("InvestorProjectView - fetching project with ID:", projectId);
        const projectData = await authFetch(`${API_BASE_URL}/projects/${projectId}`);
        console.log("InvestorProjectView - fetched project data:", projectData);
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
    if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    try {
      const amount = parseFloat(investmentAmount);
      const result = await investInProject(projectId, amount);
      
      if (result.success) {
        toast.success("Investment request sent!");
        navigate("/investor/calendar");
      } else {
        toast.error("Failed to submit investment request");
      }
    } catch (error) {
      console.error('Investment error:', error);
      toast.error("An error occurred");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      {/* <Navbar activePage="invest" showAuthButtons={false} /> */}
      
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block w-[325px]">
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
                    <p className="font-bold text-lg">{details.timeDuration || "N/A"}</p>
                  </div>
                </div>
                
                {!showConfirm ? (
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
                        className="bg-[#ffc628] text-black hover:bg-[#e6b324]"
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
                        className="bg-[#ffc628] text-black hover:bg-[#e6b324]"
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