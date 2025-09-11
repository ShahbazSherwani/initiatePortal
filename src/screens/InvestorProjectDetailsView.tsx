import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../contexts/ProjectsContext';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navigation/navbar';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { ChevronLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';

const InvestorProjectDetailsView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, loadProjects } = useProjects();
  const { profile, profilePicture } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Details');
  const [creatorInfo, setCreatorInfo] = useState<any>(null);

  // Refresh projects when projectId changes to get latest funding data
  React.useEffect(() => {
    if (projectId) {
      console.log("🔄 Refreshing project data for ID:", projectId);
      loadProjects();
    }
  }, [projectId, loadProjects]);

  console.log("InvestorProjectDetailsView - projectId from URL:", projectId);
  console.log("InvestorProjectDetailsView - projects in context:", projects);

  const project = projects.find(p => p.id === projectId);
  console.log("InvestorProjectDetailsView - found project:", project);
  
  if (!project) return <div>Project not found</div>;

  // Fetch creator information
  React.useEffect(() => {
    const fetchCreatorInfo = async () => {
      if (project && (project as any).firebase_uid) {
        try {
          const creatorData = await authFetch(`${API_BASE_URL}/users/${(project as any).firebase_uid}`);
          setCreatorInfo(creatorData);
        } catch (error) {
          console.log("Could not fetch creator info:", error);
          setCreatorInfo({ name: 'Project Creator', email: 'Not available' });
        }
      }
    };

    fetchCreatorInfo();
  }, [project]);
  
  // Get project creator information
  const projectCreator = (project as any).firebase_uid;
  console.log("Project creator:", projectCreator, "Current user:", profile?.id);

  const handleInvestClick = () => {
    navigate(`/investor/project/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar activePage="projects" />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header with back button */}
            <div className="flex items-center mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="mr-4"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">Project Details</h1>
            </div>

            {/* Project Title and Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              {/* Project Image */}
              <div className="mb-6">
                <img 
                  src={project.details?.image || "https://placehold.co/600x400/ffc628/ffffff?text=Project"}
                  alt="Project" 
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    {project.details?.product || "Untitled Project"}
                  </h2>
                  <p className="text-gray-600 mb-2">
                    <strong>Created by:</strong> {creatorInfo?.name || creatorInfo?.email || `Project Creator (ID: ${projectCreator})`}
                  </p>
                  <p className="text-gray-600">
                    {(project as any).details?.description || (project as any).description || "No description available"}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge variant={project.status === 'published' ? 'default' : 'secondary'}>
                    {project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1) : 'No Status'}
                  </Badge>
                  {project.approvalStatus === 'approved' && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Approved
                    </Badge>
                  )}
                </div>
              </div>

              {/* Investment Button */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button 
                  onClick={handleInvestClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                >
                  Invest in This Project
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Click to proceed with your investment. Your request will be sent to the admin for approval.
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {['Details', 'Milestones', 'Documents'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'Details' && (
                  <div className="space-y-6">
                    {/* Project Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Project Information</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Product/Service</label>
                            <p className="text-gray-900">{project.details?.product || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Category</label>
                            <p className="text-gray-900">{(project as any).details?.category || (project as any).category || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Target Market</label>
                            <p className="text-gray-900">{(project as any).details?.targetMarket || (project as any).targetMarket || 'Not specified'}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-4">Financial Information</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Funding Amount</label>
                            <p className="text-gray-900">₱{(project.details?.loanAmount || project.details?.investmentAmount || (project as any).details?.fundingAmount || (project as any).fundingAmount)?.toLocaleString() || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Project Type</label>
                            <p className="text-gray-900">{project.type || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Expected Returns</label>
                            <p className="text-gray-900">{(project as any).details?.expectedReturns || (project as any).expectedReturns || project.details?.investorPercentage ? `${project.details.investorPercentage}%` : 'Not specified'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Project Description</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {(project as any).details?.description || (project as any).description || 'No description provided.'}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'Milestones' && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Project Milestones</h3>
                    <p className="text-gray-500">Milestone information will be displayed here.</p>
                  </div>
                )}

                {activeTab === 'Documents' && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Project Documents</h3>
                    <p className="text-gray-500">Document list will be displayed here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorProjectDetailsView;
