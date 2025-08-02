// src/screens/InvestorDiscovery.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllProjects } from '../lib/api';
import { Navbar } from "../components/Navigation/navbar";
import { Sidebar } from "../components/Sidebar/Sidebar";

export const InvestorDiscovery: React.FC = () => {
  const [availableProjects, setAvailableProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        const projects = await getAllProjects('published');
        setAvailableProjects(projects);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadProjects();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      {/* <Navbar activePage="invest" showAuthButtons={false} /> */}
      
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block w-[325px]">
          <Sidebar activePage="Investment Opportunities" />
        </div>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <h1 className="text-2xl font-bold mb-6">Investment Opportunities</h1>
          
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableProjects.map(project => (
                <div 
                  key={project.id} 
                  className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/investor/project/${project.id}`)}
                >
                  <img 
                    src={project.details.image || "https://placehold.co/600x400/ffc628/ffffff?text=Project"}
                    alt={project.details.product} 
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2">{project.details.product}</h3>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-gray-500">Funding</span>
                      <span className="font-medium">{project.fundingProgress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#ffc628] h-2 rounded-full" 
                        style={{width: `${project.fundingProgress || 0}%`}}
                      ></div>
                    </div>
                    <div className="mt-4 flex justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Required</p>
                        <p className="font-medium">
                          {parseFloat(project.details.loanAmount || 
                                      project.details.investmentAmount || "0").toLocaleString()} PHP
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Est. Return</p>
                        <p className="font-medium">{project.estimatedReturn || 52}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};