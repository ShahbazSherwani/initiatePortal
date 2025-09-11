import React, { Fragment, useState } from "react";
import { Navigate, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAccount } from "../contexts/AccountContext";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { Button } from "../components/ui/button";
import { Dialog, Transition } from "@headlessui/react";
import { ChevronLeft as ChevronLeftIcon, X as XIcon, Trash2, Archive } from "lucide-react";
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
    const { projects, loadProjects, updateProject, deleteProject } = useProjects();
  const { canCreateNewProject, borrowerProfile } = useAccount();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<"equity" | "lending" | "donation" | "rewards" | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

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
      status_check: (p as any).status !== "closed"
    });
  });
  
  // More robust filtering - try multiple user identification methods
  const currentUserId = profile?.id || user?.uid;
  console.log("🔍 Debug - Current User ID:", currentUserId);
  console.log("🔍 Debug - User object:", user);
  console.log("🔍 Debug - Profile object:", profile);
  console.log("🔍 Debug - Filtered projects:", projects.filter(p => (p.project_data?.status || (p as any).status) !== "closed" && (p as any).firebase_uid === currentUserId));

  if (!token) return <Navigate to="/login" />;

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

  // Add this function to your BorrowerMyProjects component:
  const handlePublishProject = async (projectId: string) => {
    try {
      console.log(`📢 Publishing project ${projectId}`);
      await updateProject(projectId, { status: "published" });
      toast.success("Project published successfully! Investors can now see it.");
    } catch (error: any) {
      console.error("Error publishing project:", error);
      toast.error("Failed to publish project");
    }
  };

  const handleCompleteProject = async (projectId: string) => {
    try {
      console.log(`✅ Completing project ${projectId}`);
      await updateProject(projectId, { status: "completed" });
      toast.success("Project marked as completed!");
    } catch (error: any) {
      console.error("Error completing project:", error);
      toast.error("Failed to complete project");
    }
  };

  return (
    <DashboardLayout activePage="issuer-borrower">
      <div className="p-4 md:p-8">
        <div className="w-[90%] mx-auto bg-white rounded-t-[30px] p-4 md:p-8 md:w-full md:mx-0 min-h-screen flex flex-col animate-fadeIn delay-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div className="flex items-center mb-4 md:mb-0">
                <ChevronLeftIcon
                  className="w-6 h-6 cursor-pointer"
                  onClick={() => navigate(-1)}
                />
                <h1 className="ml-4 text-2xl md:text-3xl font-semibold">
                  My Projects
                </h1>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  className={`px-4 py-2 rounded-lg ${
                    canCreateNewProject 
                      ? "bg-[#ffc628] text-black" 
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
            <div className="grid grid-cols-4 gap-2 mb-8">
              {projectTabs.map(tab => (
                <button
                  key={tab.value}
                  className={`py-3 rounded-lg font-medium text-center ${
                    tab.value === "pending" ? "bg-[#ffc628] text-black" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
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
                selectedType === "equity" ? "bg-[#ffc628] text-black" : "bg-white"
              }`}
            >
              Equity
            </button>
            <button
              onClick={() => setSelectedType("lending")}
              className={`flex-1 py-3 rounded-2xl border ${
                selectedType === "lending" ? "bg-[#ffc628] text-black" : "bg-white"
              }`}
            >
              Lending
            </button>
            <button
              onClick={() => setSelectedType("donation")}
              className={`flex-1 py-3 rounded-2xl border ${
                selectedType === "donation" ? "bg-[#ffc628] text-black" : "bg-white"
              }`}
            >
              Donation
            </button>
            <button
              onClick={() => setSelectedType("rewards")}
              className={`flex-1 py-3 rounded-2xl border ${
                selectedType === "rewards" ? "bg-[#ffc628] text-black" : "bg-white"
              }`}
            >
              Rewards
            </button>
          </div>

          {/* continue */}
          <div className="mt-6">
            <Button
              className="w-full bg-[#ffc628] text-black py-2 rounded-lg"
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

            {/* Projects List - to be mapped from actual data */}
            {projects.filter(p => {
              const projectUserId = (p as any).firebase_uid;
              const currentUserUid = user?.uid;
              const currentProfileId = profile?.id;
              const statusCheck = (p.project_data?.status || (p as any).status) !== "closed";
              
              console.log("🔍 Filtering project:", {
                projectId: p.id,
                projectUserId,
                currentUserUid,
                currentProfileId,
                statusCheck,
                matchesUid: projectUserId === currentUserUid,
                matchesProfileId: projectUserId === currentProfileId
              });
              
              return statusCheck && (projectUserId === currentUserUid || projectUserId === currentProfileId);
            }).length > 0 ? (
  <div>
    {projects.filter(p => {
              const projectUserId = (p as any).firebase_uid;
              const currentUserUid = user?.uid;
              const currentProfileId = profile?.id;
              const statusCheck = (p.project_data?.status || (p as any).status) !== "closed";
              
              return statusCheck && (projectUserId === currentUserUid || projectUserId === currentProfileId);
            }).map(project => (
      <div key={project.id} className="bg-white rounded-lg border border-gray-100 shadow-sm mb-4 p-4 flex">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">{project.project_data?.details?.product || project.title || "Untitled Project"}</h3>
            
            {/* Add approval status badge */}
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                (project.project_data?.status || (project as any).status) === 'published' 
                  ? 'bg-green-100 text-green-800' 
                  : (project.project_data?.status || (project as any).status) === 'draft'
                  ? 'bg-yellow-100 text-yellow-800'
                  : (project.project_data?.status || (project as any).status) === 'pending'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {(project.project_data?.status || (project as any).status) ? ((project.project_data?.status || (project as any).status) as string).charAt(0).toUpperCase() + ((project.project_data?.status || (project as any).status) as string).slice(1) : 'No Status'}
              </span>
              
              {(project.project_data?.approvalStatus || (project as any).approvalStatus) === 'approved' && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  Approved
                </span>
              )}
              
              {(project.project_data?.approvalStatus || (project as any).approvalStatus) === 'rejected' && (
                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                  Rejected
                </span>
              )}
              
              {(project.project_data?.approvalStatus || (project as any).approvalStatus) === 'pending' && (project.project_data?.status || (project as any).status) === 'published' && (
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                  Awaiting Approval
                </span>
              )}
            </div>
          </div>
          
          {/* Project details */}
          <div className="text-sm text-gray-600 mb-2">Project ID: {project.id}</div>
          <div className="text-sm text-gray-600 mb-2">Location: {project.project_data?.details?.location || project.borrower_profile?.address || "Not specified"}</div>
          
          {/* Approval feedback if rejected */}
          {(project.project_data?.approvalStatus || (project as any).approvalStatus) === 'rejected' && (project.project_data?.approvalFeedback || (project as any).approvalFeedback) && (
            <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded">
              <p className="text-sm font-medium text-red-800">Rejection reason:</p>
              <p className="text-sm text-red-700">{project.project_data?.approvalFeedback || (project as any).approvalFeedback}</p>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <Button 
            onClick={() => handleViewDetails(String(project.id))} 
            className="bg-[#ffc628] text-black"
          >
            View Details
          </Button>
          
          <Button 
            onClick={() => handleEdit(String(project.id))} 
            variant="outline"
          >
            Edit
          </Button>
          
          {((project as any).status === "draft" || (project as any).status === "pending" || !(project as any).status) && (
            <Button 
              onClick={() => handlePublishProject(String(project.id))}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Publish
            </Button>
          )}
          
          {((project as any).status === "published" || (project as any).status === "ongoing") && (
            <Button 
              onClick={() => handleCompleteProject(String(project.id))}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Complete
            </Button>
          )}
          
          {(project as any).status !== "closed" && (project as any).status !== "completed" && (
            <Button 
              onClick={() => handleClose(String(project.id))}
              variant="outline" 
              className="border-orange-500 text-orange-500 hover:bg-orange-50"
            >
              Close
            </Button>
          )}
          
          <Button 
            onClick={() => handleDelete(String(project.id))}
            variant="outline" 
            className="border-red-500 text-red-500 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    ))}
  </div>
) : (
  <div className="flex flex-col items-center justify-center mt-16">
    <img
      src="/2.png"
      alt="No projects"
      className="w-full max-w-xs md:max-w-md lg:max-w-lg"
    />
    <h2 className="mt-6 text-lg md:text-2xl font-semibold text-center">
      Looks like you don't have any projects yet!
    </h2>
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
