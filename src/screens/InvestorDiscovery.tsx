// src/screens/InvestorDiscovery.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from '../lib/api'; // Adjust the import based on your project structure
import { DashboardLayout } from "../layouts/DashboardLayout";
import { API_BASE_URL } from '../config/environment';

export const InvestorDiscovery: React.FC = () => {
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log("Fetching projects for investor discovery...");
        console.log("Making request to:", `${API_BASE_URL}/projects?status=published`);
        const result = await authFetch(`${API_BASE_URL}/projects?status=published`);
        console.log("Projects result:", result);
        console.log("Number of projects returned:", result?.length || 0);
        
        // API returns array directly, not wrapped in projects property
        setAvailableProjects(result || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);

  return (
    <DashboardLayout activePage="investment-opportunities">
      <div className="p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Investment Opportunities</h1>
            <div className="text-sm text-gray-500">
              Showing {availableProjects.length} published projects
            </div>
          </div>
          
          {/* Debug info */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
            <strong>Debug Info:</strong> Looking for projects with status="published". 
            If you don't see projects here, make sure to "Publish" them from the "My Issuer/Borrower" page first.
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-gray-500">Loading investment opportunities...</div>
            </div>
          ) : availableProjects.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 text-center">
              <div className="text-lg text-gray-500 mb-2">No investment opportunities available</div>
              <div className="text-sm text-gray-400">Check back later for new projects</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableProjects.map((project: any) => {
                const projectData = project.project_data || {};
                const details = projectData.details || {};
                
                return (
                  <div 
                    key={project.id} 
                    className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/investor/project/${project.id}`)}
                  >
                    <img 
                      src={details.image || "https://placehold.co/600x400/ffc628/ffffff?text=Project"}
                      alt={details.product || "Project"} 
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2">{details.product || "Unnamed Project"}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{details.overview || "No description available"}</p>
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-500">Funding</span>
                        <span className="font-medium">{projectData.fundingProgress || 0}%</span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div 
                          className="bg-[#ffc628] h-2 rounded-full" 
                          style={{width: `${projectData.fundingProgress || 0}%`}}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Required</p>
                          <p className="font-medium">
                            {parseFloat(details.loanAmount || 
                                        details.investmentAmount || "0").toLocaleString()} PHP
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Est. Return</p>
                          <p className="font-medium">{projectData.estimatedReturn || details.investorPercentage || "N/A"}%</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <button className="w-full bg-[#ffc628] text-black py-2 px-4 rounded-lg font-medium hover:bg-[#e6b324] transition-colors">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </DashboardLayout>
  );
};