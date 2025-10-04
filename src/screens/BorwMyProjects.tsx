import React, { Fragment, useState } from "react";
import { Navigate, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAccount } from "../contexts/AccountContext";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { Button } from "../components/ui/button";
import { Dialog, Transition } from "@headlessui/react";
import { ChevronLeft as ChevronLeftIcon, X as XIcon } from "lucide-react";
import { useProjects } from "../contexts/ProjectsContext";
import { toast } from "react-hot-toast";

// Tabs configuration
const projectTabs = [
  { value: "pending", label: "Pending" },
  { value: "ongoing", label: "On-Going" },
  { value: "completed", label: "Completed" },
  { value: "default", label: "Default" },
];

export const BorrowerMyProjects: React.FC = (): JSX.Element => {
  const { token, user, profile } = useAuth();
    const { projects, updateProject, deleteProject } = useProjects();
  const { canCreateNewProject, borrowerProfile } = useAccount();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<"equity" | "lending" | "donation" | "rewards" | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'ongoing' | 'completed' | 'default'>('pending');
  const [projectTypeFilter, setProjectTypeFilter] = useState<'all' | 'equity' | 'lending' | 'donation' | 'rewards'>('all');

  // Debug logging to see what's happening
  console.log("🔍 Debug - Current user:", user);
  console.log("🔍 Debug - Current profile:", profile);
  console.log("🔍 Debug - All projects:", projects);
  console.log("🔍 Debug - Projects with firebase_uid:", projects.map(p => ({ 
    id: p.id, 
    firebase_uid: (p as any).firebase_uid, 
    title: p.title,
    status: (p as any).status 
  })));
  console.log("🔍 Debug - User ID for comparison:", profile?.id);
  console.log("🔍 Debug - User UID for comparison:", user?.uid);
  console.log("🔍 Debug - Can create new project:", canCreateNewProject);
  console.log("🔍 Debug - Borrower profile:", borrowerProfile);
  
  // Show detailed comparison for each project
  projects.forEach((p, index) => {
    console.log(`🔍 Debug - Project ${index + 1}:`, {
      id: p.id,
      title: p.title,
      full_project: p,
      firebase_uid: (p as any).firebase_uid,
      firebase_uid_type: typeof (p as any).firebase_uid,
      matches_profile_id: (p as any).firebase_uid === profile?.id,
      matches_user_uid: (p as any).firebase_uid === user?.uid,
      status: (p as any).status,
      status_check: (p as any).status !== "closed",
      // 🔍 PROJECT TYPE DEBUG
      project_type_locations: {
        direct: (p as any).project_type,
        in_project_data: p.project_data?.project_type,
        in_details: p.project_data?.details?.project_type,
        in_data: (p as any).data?.project_type
      }
    });
  });
  
  // More robust filtering - try multiple user identification methods
  const currentUserId = profile?.id || user?.uid;
  console.log("🔍 Debug - Current User ID:", currentUserId);
  console.log("🔍 Debug - User object:", user);
  console.log("🔍 Debug - Profile object:", profile);
  console.log("🔍 Debug - Filtered projects:", projects.filter(p => (p.project_data?.status || (p as any).status) !== "closed" && (p as any).firebase_uid === currentUserId));

  if (!token) return <Navigate to="/login" />;

  // Filter projects based on active tab
  const getFilteredProjects = () => {
    const userProjects = projects.filter(p => {
      const projectUserId = (p as any).firebase_uid;
      const currentUserUid = user?.uid;
      const currentProfileId = profile?.id;
      const statusCheck = (p.project_data?.status || (p as any).status) !== "closed";
      
      return statusCheck && (projectUserId === currentUserUid || projectUserId === currentProfileId);
    });

    switch (activeTab) {
      case 'pending':
        // Projects that are pending, draft, or waiting for admin approval
        return userProjects.filter(p => {
          const status = p.project_data?.status || (p as any).status;
          const approvalStatus = p.project_data?.approvalStatus || (p as any).approvalStatus;
          return status === 'pending' || status === 'draft' || 
                 (status === 'published' && (!approvalStatus || approvalStatus === 'pending'));
        });
      
      case 'ongoing':
        // Projects that are approved and actively seeking funding
        return userProjects.filter(p => {
          const status = p.project_data?.status || (p as any).status;
          const approvalStatus = p.project_data?.approvalStatus || (p as any).approvalStatus;
          return approvalStatus === 'approved' && status === 'published';
        });
      
      case 'completed':
        // Projects that secured successful funding
        return userProjects.filter(p => {
          const status = p.project_data?.status || (p as any).status;
          return status === 'completed' || status === 'successful';
        });
      
      case 'default':
        // Projects that were rejected or unsuccessful
        return userProjects.filter(p => {
          const status = p.project_data?.status || (p as any).status;
          const approvalStatus = p.project_data?.approvalStatus || (p as any).approvalStatus;
          return approvalStatus === 'rejected' || status === 'rejected' || status === 'unsuccessful';
        });
      
      default:
        return userProjects;
    }
  };

  const filteredProjects = getFilteredProjects();

  // Apply project type filter
  const finalFilteredProjects = projectTypeFilter === 'all' 
    ? filteredProjects 
    : filteredProjects.filter(p => {
        // Try all possible locations for project type
        const projectType = 
          p.project_data?.project_type || 
          (p as any).project_type ||
          p.project_data?.details?.projectType ||
          (p as any).projectType ||
          p.project_data?.type ||
          (p as any).type;
        
        console.log(`🔍 FILTER DEBUG - Checking project ${p.id}:`, {
          projectTypeFilter,
          foundProjectType: projectType,
          matches: projectType === projectTypeFilter,
          all_possible_locations: {
            'p.project_data?.project_type': p.project_data?.project_type,
            '(p as any).project_type': (p as any).project_type,
            'p.project_data?.details?.projectType': p.project_data?.details?.projectType,
            '(p as any).projectType': (p as any).projectType,
            'p.project_data?.type': p.project_data?.type,
            '(p as any).type': (p as any).type,
          },
          full_project_data: p.project_data,
          full_project: p
        });
        return projectType === projectTypeFilter;
      });
  
  console.log(`🔍 FILTER RESULT - Active filter: ${projectTypeFilter}, Before: ${filteredProjects.length}, After: ${finalFilteredProjects.length}`);

const handleContinue = () => {
  setShowModal(false);
  if (selectedType === "equity") {
    navigate("/borwNewProjEq");
  } else if (selectedType === "lending") {
    navigate("/borwNewProj");
  } else if (selectedType === "donation") {
    navigate("/borwNewProjDonation");
  } else if (selectedType === "rewards") {
    navigate("/borwNewProjRewards");
  }
};

  const handleEdit = (projectId: string) => {
    console.log("Editing project with ID:", projectId);
    navigate(`/borwEditProject/${projectId}`);
  };

  const handleClose = async (projectId: string) => {
    try {
      console.log(`🗂️ Closing project ${projectId}`);
      await updateProject(projectId, { status: "closed" });
      toast.success("Project closed successfully!");
    } catch (error: any) {
      console.error("Error closing project:", error);
      toast.error("Failed to close project");
    }
  };

  const handleDelete = async (projectId: string) => {
    setProjectToDelete(projectId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    
    try {
      console.log(`🗑️ Deleting project ${projectToDelete}`);
      // Use the deleteProject function from context
      await deleteProject(projectToDelete);
      toast.success("Project deleted successfully!");
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } catch (error: any) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  // Add/update this function in your BorwMyProjects component
  const handleViewDetails = (projectId: string) => {
    navigate(`/borrower/project/${projectId}/details`);
  };

  return (
    <DashboardLayout activePage="issuer-borrower">
      <div className="p-4 md:p-8">
        <div className="w-full  mx-auto bg-white rounded-t-[30px] p-4 md:p-8 min-h-screen flex flex-col animate-fadeIn delay-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <div className="flex items-center">
                <ChevronLeftIcon
                  className="w-6 h-6 cursor-pointer"
                  onClick={() => navigate(-1)}
                />
                <h1 className="ml-4 text-2xl md:text-3xl font-semibold">
                  My Projects
                </h1>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  className={`px-4 py-2 rounded-lg ${
                    canCreateNewProject 
                      ? "bg-[#0C4B20] text-white" 
                      : "bg-gray-400 text-white cursor-not-allowed"
                  }`}
                  onClick={() => {
                    if (canCreateNewProject) {
                      setShowModal(true);
                    } else {
                      alert('You cannot create a new project while you have active projects. Please complete or close your existing projects first.');
                    }
                  }}
                  disabled={!canCreateNewProject}
                  title={canCreateNewProject ? 'Create a new project' : 'Cannot create new project - you have active projects'}
                >
                  Create New Project
                  {!canCreateNewProject && ' (Disabled)'}
                </Button>
                
                {!canCreateNewProject && (
                  <Button
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm"
                    onClick={() => {
                      if (confirm('This will temporarily allow you to create a new project by bypassing the active project restriction. Are you sure?')) {
                        setShowModal(true);
                      }
                    }}
                    title="Bypass the active project restriction (for development/testing)"
                  >
                    Force Create (Dev)
                  </Button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 w-full">
              {projectTabs.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value as 'pending' | 'ongoing' | 'completed' | 'default')}
                  className={`py-3 rounded-lg font-medium text-center transition-colors ${
                    tab.value === activeTab ? "bg-[#0C4B20] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Project Type Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Project Type:
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setProjectTypeFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    projectTypeFilter === 'all' 
                      ? "bg-[#0C4B20] text-white shadow-md" 
                      : "bg-white text-gray-700 border border-gray-300 hover:border-[#0C4B20] hover:text-[#0C4B20]"
                  }`}
                >
                  All Projects
                </button>
                <button
                  onClick={() => setProjectTypeFilter('equity')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    projectTypeFilter === 'equity' 
                      ? "bg-[#0C4B20] text-white shadow-md" 
                      : "bg-white text-gray-700 border border-gray-300 hover:border-[#0C4B20] hover:text-[#0C4B20]"
                  }`}
                >
                  Equity
                </button>
                <button
                  onClick={() => setProjectTypeFilter('lending')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    projectTypeFilter === 'lending' 
                      ? "bg-[#0C4B20] text-white shadow-md" 
                      : "bg-white text-gray-700 border border-gray-300 hover:border-[#0C4B20] hover:text-[#0C4B20]"
                  }`}
                >
                  Lending
                </button>
                <button
                  onClick={() => setProjectTypeFilter('donation')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    projectTypeFilter === 'donation' 
                      ? "bg-[#0C4B20] text-white shadow-md" 
                      : "bg-white text-gray-700 border border-gray-300 hover:border-[#0C4B20] hover:text-[#0C4B20]"
                  }`}
                >
                  Donation
                </button>
                <button
                  onClick={() => setProjectTypeFilter('rewards')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    projectTypeFilter === 'rewards' 
                      ? "bg-[#0C4B20] text-white shadow-md" 
                      : "bg-white text-gray-700 border border-gray-300 hover:border-[#0C4B20] hover:text-[#0C4B20]"
                  }`}
                >
                  Rewards
                </button>
              </div>
            </div>

            {/* Empty state */}
            {/* <div className="flex flex-col items-center justify-center mt-16">
              <img
                src="/2.png"
                alt="No projects"
                className="w-full max-w-xs md:max-w-md lg:max-w-lg"
              />
              <h2 className="mt-6 text-lg md:text-2xl font-semibold text-center">
                Looks like you don’t have any projects yet!
              </h2>
            </div> */}

            {/* Select Type Modal */}
            <Transition appear show={showModal} as={Fragment}>
  <Dialog
    as="div"
    className="fixed inset-0 z-50 overflow-y-auto"
    onClose={() => setShowModal(false)}
  >
    <div className="min-h-screen px-4 text-center">
      {/* backdrop */}
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />
      </Transition.Child>

      {/* centering shim */}
      <span className="inline-block h-screen align-middle" aria-hidden="true">
        &#8203;
      </span>

      {/* actual panel */}
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-2xl shadow-xl">
          {/* header */}
          <div className="flex justify-between items-center">
            <Dialog.Title as="h3" className="text-2xl font-bold">
              Please Select Option
            </Dialog.Title>
            <button onClick={() => setShowModal(false)}>
              <XIcon className="w-6 h-6 text-gray-500 hover:text-black" />
            </button>
          </div>

          {/* choice buttons */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedType("equity")}
              className={`flex-1 py-3 rounded-2xl border ${
                selectedType === "equity" ? "bg-[#0C4B20] text-white" : "bg-white"
              }`}
            >
              Equity
            </button>
            <button
              onClick={() => setSelectedType("lending")}
              className={`flex-1 py-3 rounded-2xl border ${
                selectedType === "lending" ? "bg-[#0C4B20] text-white" : "bg-white"
              }`}
            >
              Lending
            </button>
            <button
              onClick={() => setSelectedType("donation")}
              className={`flex-1 py-3 rounded-2xl border ${
                selectedType === "donation" ? "bg-[#0C4B20] text-white" : "bg-white"
              }`}
            >
              Donation
            </button>
            <button
              onClick={() => setSelectedType("rewards")}
              className={`flex-1 py-3 rounded-2xl border ${
                selectedType === "rewards" ? "bg-[#0C4B20] text-white" : "bg-white"
              }`}
            >
              Rewards
            </button>
          </div>

          {/* continue */}
          <div className="mt-6">
            <Button
              className="w-full bg-[#0C4B20] text-white py-2 rounded-lg"
              onClick={handleContinue}
              disabled={!selectedType}
            >
              Continue
            </Button>
          </div>
        </div>
      </Transition.Child>
    </div>
  </Dialog>
</Transition>

            {/* Project Status Summary */}
            {!canCreateNewProject && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Project Creation Restricted</h3>
                <p className="text-yellow-700 text-sm mb-2">
                  You currently have active projects that prevent creating new ones. To create a new project, you need to:
                </p>
                <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
                  <li>Complete your current projects</li>
                  <li>Close any draft projects you're not planning to continue</li>
                  <li>Or use the "Force Create" button for development/testing</li>
                </ul>
                <p className="text-yellow-600 text-xs mt-2">
                  Active Projects: {projects.filter((p: any) => p.firebase_uid === user?.uid && p.status !== 'closed' && p.status !== 'completed').length}
                </p>
              </div>
            )}

            {/* Project count */}
            <div className="mb-4 w-full">
              <p className="text-sm text-gray-600 text-center md:text-left">
                You have {finalFilteredProjects.length} project{finalFilteredProjects.length !== 1 ? 's' : ''} in {activeTab === 'ongoing' ? 'on-going' : activeTab}
                {projectTypeFilter !== 'all' && <span className="ml-1 font-medium text-[#0C4B20]">({projectTypeFilter})</span>}
              </p>
            </div>

            {/* Projects List */}
            {finalFilteredProjects.length > 0 ? (
  <div>
    {finalFilteredProjects.map(project => {
      // Debug logging to see project data structure
      console.log("🔍 Project data structure:", {
        id: project.id,
        project_data: project.project_data,
        details: project.project_data?.details,
        legacy_amount: (project as any).amount
      });
      
      const getStatusInfo = () => {
        if (activeTab === 'pending') {
          return {
            icon: '🟡',
            text: 'Status: Pending Verification',
            color: 'text-orange-600'
          };
        } else if (activeTab === 'ongoing') {
          return {
            icon: '🟡',
            text: 'Status: On-Going',
            color: 'text-orange-600'
          };
        } else if (activeTab === 'completed') {
          return {
            icon: '🟢',
            text: 'Status: Successful Funding',
            color: 'text-green-600'
          };
        } else if (activeTab === 'default') {
          return {
            icon: '🔴',
            text: 'Status: Unsuccessful Funding',
            color: 'text-red-600'
          };
        }
        return {
          icon: '🟡',
          text: 'Status: Pending Verification',
          color: 'text-orange-600'
        };
      };

      const statusInfo = getStatusInfo();

  // Debug: Log the full project object to inspect funding fields
  console.log('🪙 Project Card Debug:', project);
  return (
  <div key={project.id} className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 overflow-hidden w-full sm:max-w-md sm:mx-auto md:max-w-full md:w-auto">
          {/* Status Badge and Project Type */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">{statusInfo.icon}</span>
                <span className={`text-sm font-medium ${statusInfo.color}`}>
                  {statusInfo.text}
                </span>
              </div>
              {/* Project Type Badge */}
              {(() => {
                const projectType = project.project_data?.project_type || (project as any).project_type;
                const typeConfig = {
                  equity: { label: 'Equity', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                  lending: { label: 'Lending', color: 'bg-green-100 text-green-700 border-green-200' },
                  donation: { label: 'Donation', color: 'bg-purple-100 text-purple-700 border-purple-200' },
                  rewards: { label: 'Rewards', color: 'bg-amber-100 text-amber-700 border-amber-200' }
                };
                const config = typeConfig[projectType as keyof typeof typeConfig] || { label: projectType, color: 'bg-gray-100 text-gray-700 border-gray-200' };
                
                return projectType ? (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
                    {config.label}
                  </span>
                ) : null;
              })()}
            </div>
          </div>

          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Project Image */}
              <div className="w-full sm:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 mx-auto sm:mx-0 mb-4 sm:mb-0">
                {project.project_data?.details?.image ? (
                  <img 
                    src={project.project_data.details.image} 
                    alt="Project"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                    <span className="text-white text-2xl">🌱</span>
                  </div>
                )}
              </div>

              {/* Project Details */}
              <div className="flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Project ID:</span>
                    <div className="font-medium">PFLA{project.id}5N</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Funding Requirements:</span>
                    <div className="font-medium">
                      {(() => {
                        const details = project.project_data?.details;
                        const amount = details?.amount || 
                                     details?.loanAmount || 
                                     details?.investmentAmount || 
                                     details?.projectRequirements ||
                                     (project as any).amount;
                        
                        if (amount) {
                          const numAmount = Number(amount);
                          return isNaN(numAmount) ? amount : `PHP ${numAmount.toLocaleString()}`;
                        }
                        return 'Not specified';
                      })()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Project Location:</span>
                    <div className="font-medium">
                      {project.project_data?.details?.location || 
                       project.project_data?.details?.address || 
                       'Not specified'}
                    </div>
                  </div>
                  
                  {/* Funding Progress Bar */}
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-600">Funding Progress:</span>
                      <span className="text-sm font-medium">
                        {(() => {
                          // Use funding.totalFunded if available
                          const totalFunded = Number(project.project_data?.funding?.totalFunded) || 0;
                          const details = project.project_data?.details;
                          const amount = Number(details?.amount || details?.loanAmount || details?.investmentAmount || details?.projectRequirements || (project as any).amount || 0);
                          const percent = amount > 0 ? Math.round((totalFunded / amount) * 100) : 0;
                          return `${percent}%`;
                        })()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[#0C4B20] h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(() => {
                            const totalFunded = Number(project.project_data?.funding?.totalFunded) || 0;
                            const details = project.project_data?.details;
                            const amount = Number(details?.amount || details?.loanAmount || details?.investmentAmount || details?.projectRequirements || (project as any).amount || 0);
                            const percent = amount > 0 ? Math.round((totalFunded / amount) * 100) : 0;
                            return Math.min(Math.max(percent, 0), 100);
                          })()}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Centered and Full Width on Mobile */}
              <div className="flex flex-col gap-2  w-50 items-center mt-4">
                <Button 
                  onClick={() => handleViewDetails(String(project.id))} 
                  className="bg-[#0C4B20] text-white hover:bg-[#e6b123] text-sm py-2 w-full"
                >
                  View Project Details
                </Button>
                {activeTab === 'pending' && (
                  <>
                    <Button 
                      className="bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm py-2 w-full"
                    >
                      Visit Request
                    </Button>
                    <div className="flex gap-2 w-full">
                      <Button 
                        onClick={() => handleEdit(String(project.id))} 
                        className="bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs py-2 flex-1 w-full"
                      >
                        Edit
                      </Button>
                      <Button 
                        onClick={() => handleClose(String(project.id))}
                        className="bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs py-2 flex-1 w-full"
                      >
                        Close Project
                      </Button>
                    </div>
                  </>
                )}
                {activeTab === 'ongoing' && (
                  <>
                    <div className="flex gap-2 w-full">
                      <Button 
                        onClick={() => handleEdit(String(project.id))} 
                        className="bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs py-2 flex-1 w-full"
                      >
                        Edit
                      </Button>
                      <Button 
                        onClick={() => handleClose(String(project.id))}
                        className="bg-gray-200 text-gray-700 hover:bg-gray-300 text-xs py-2 flex-1 w-full"
                      >
                        Close Project
                      </Button>
                    </div>
                    <Button 
                      className="bg-red-500 text-white hover:bg-red-600 text-sm py-2 w-full"
                    >
                      Pay Back
                    </Button>
                  </>
                )}
                {activeTab === 'default' && (
                  <>
                    <Button 
                      className="bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm py-2 w-full"
                    >
                      Relaunch
                    </Button>
                    <Button 
                      onClick={() => handleDelete(String(project.id))}
                      className="bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm py-2 w-full"
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
            ) : (
              <div className="flex flex-col items-center justify-center mt-16">
                <img
                  src="/2.png"
                  alt="No projects"
                  className="w-full max-w-xs md:max-w-md lg:max-w-lg"
                />
                <h2 className="mt-6 text-lg md:text-2xl font-semibold text-center">
                  {activeTab === 'pending' && "No pending projects yet!"}
                  {activeTab === 'ongoing' && "No ongoing projects yet!"}
                  {activeTab === 'completed' && "No completed projects yet!"}
                  {activeTab === 'default' && "No defaulted projects!"}
                </h2>
                <p className="mt-2 text-gray-600 text-center">
                  {activeTab === 'pending' && "Create a new project to get started."}
                  {activeTab === 'ongoing' && "Once your projects are approved, they'll appear here."}
                  {activeTab === 'completed' && "Successfully funded projects will be shown here."}
                  {activeTab === 'default' && "Rejected or unsuccessful projects appear here."}
                </p>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            <Transition appear show={showDeleteModal} as={Fragment}>
              <Dialog
                as="div"
                className="fixed inset-0 z-50 overflow-y-auto"
                onClose={() => setShowDeleteModal(false)}
              >
                <div className="min-h-screen px-4 text-center">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />
                  </Transition.Child>

                  <span className="inline-block h-screen align-middle" aria-hidden="true">
                    &#8203;
                  </span>

                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-2xl shadow-xl">
                      <div className="flex justify-between items-center mb-4">
                        <Dialog.Title as="h3" className="text-lg font-bold text-red-600">
                          Delete Project
                        </Dialog.Title>
                        <button onClick={() => setShowDeleteModal(false)}>
                          <XIcon className="w-6 h-6 text-gray-500 hover:text-black" />
                        </button>
                      </div>

                      <div className="mb-6">
                        <p className="text-gray-700">
                          Are you sure you want to delete this project? This action cannot be undone.
                        </p>
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700 font-medium">⚠️ Warning:</p>
                          <ul className="text-sm text-red-600 mt-1 list-disc list-inside">
                            <li>All project data will be lost</li>
                            <li>Any investor investments will need to be handled separately</li>
                            <li>This will help free up your project creation ability</li>
                          </ul>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => setShowDeleteModal(false)}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={confirmDelete}
                          className="flex-1 bg-red-600 text-white hover:bg-red-700"
                        >
                          Delete Project
                        </Button>
                      </div>
                    </div>
                  </Transition.Child>
                </div>
              </Dialog>
            </Transition>

            <Outlet />
          </div>
        </div>
    </DashboardLayout>
  );
};

export default BorrowerMyProjects;
