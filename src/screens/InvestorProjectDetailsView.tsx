import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Details');
  const [creatorInfo, setCreatorInfo] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch project data directly from API instead of relying on ProjectsContext
  React.useEffect(() => {
    const fetchProject = async () => {
      if (projectId) {
        try {
          console.log("🔄 Fetching project data directly for ID:", projectId);
          const projectData = await authFetch(`${API_BASE_URL}/projects/${projectId}`);
          console.log("InvestorProjectDetailsView - fetched project data:", projectData);
          setProject(projectData);
        } catch (error) {
          console.error("Error fetching project:", error);
          setProject(null);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchProject();
  }, [projectId]);

  // Fetch creator information - MOVED BEFORE CONDITIONAL RETURNS
  React.useEffect(() => {
    const fetchCreatorInfo = async () => {
      if (project && (project as any).firebase_uid) {
        try {
          // Try to fetch from accounts API instead of users API
          const creatorData = await authFetch(`${API_BASE_URL}/accounts`);
          // This will return the user's own account data, so we'll use the full_name from project instead
          console.log("Creator accounts data:", creatorData);
        } catch (error) {
          console.log("Could not fetch creator info:", error);
        }
        // For now, use the full_name from the project data itself
        setCreatorInfo({ 
          name: project.full_name || 'Project Creator', 
          email: 'Not available' 
        });
      }
    };

    fetchCreatorInfo();
  }, [project]);

  console.log("InvestorProjectDetailsView - projectId from URL:", projectId);
  console.log("InvestorProjectDetailsView - fetched project:", project);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-500">Loading project...</div>
      </div>
    );
  }
  
  if (!project) return <div>Project not found</div>;
  
  // Get project creator information
  const projectCreator = (project as any).firebase_uid;
  const projectData = project?.project_data || {};
  const projectDetails = projectData?.details || {};
  console.log("Project creator:", projectCreator, "Current user:", profile?.id);
  console.log("Project data structure:", { projectData, projectDetails });

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
                  src={projectDetails?.image || "https://placehold.co/600x400/ffc628/ffffff?text=Project"}
                  alt="Project" 
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    {projectDetails?.product || "Untitled Project"}
                  </h2>
                  <p className="text-gray-600 mb-2">
                    <strong>Created by:</strong> {creatorInfo?.name || creatorInfo?.email || project?.full_name || `Project Creator`}
                  </p>
                  <p className="text-gray-600">
                    {projectDetails?.overview || projectDetails?.description || "No description available"}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge variant={projectData.status === 'published' ? 'default' : 'secondary'}>
                    {projectData.status ? projectData.status.charAt(0).toUpperCase() + projectData.status.slice(1) : 'No Status'}
                  </Badge>
                  {projectData.approvalStatus === 'approved' && (
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
                            <p className="text-gray-900">{projectDetails?.product || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Category</label>
                            <p className="text-gray-900">{projectDetails?.category || projectData?.category || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Target Market</label>
                            <p className="text-gray-900">{projectDetails?.targetMarket || projectData?.targetMarket || 'Not specified'}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-4">Financial Information</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Funding Amount</label>
                            <p className="text-gray-900">₱{(projectDetails?.loanAmount || projectDetails?.investmentAmount || projectDetails?.fundingAmount || projectData?.fundingAmount)?.toLocaleString() || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Project Type</label>
                            <p className="text-gray-900">{projectData?.type || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Expected Returns</label>
                            <p className="text-gray-900">{projectDetails?.expectedReturns || projectData?.expectedReturns || (projectDetails?.investorPercentage ? `${projectDetails.investorPercentage}%` : 'Not specified')}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Project Description</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {projectDetails?.overview || projectDetails?.description || projectData?.description || 'No description provided.'}
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
