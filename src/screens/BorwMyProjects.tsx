import React, { Fragment, useState } from "react";
import { Navigate, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { Button } from "../components/ui/button";
import { Dialog, Transition } from "@headlessui/react";
import { ChevronLeft as ChevronLeftIcon, X as XIcon } from "lucide-react";
import { useProjects } from "../contexts/ProjectsContext";

// Tabs configuration
const projectTabs = [
  { value: "pending", label: "Pending" },
  { value: "ongoing", label: "On-Going" },
  { value: "completed", label: "Completed" },
  { value: "default", label: "Default" },
];

export const BorrowerMyProjects: React.FC = (): JSX.Element => {
  const { token, user, profile } = useAuth();
  const { projects } = useProjects();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<"equity" | "lending" | "donation" | "rewards" | null>(null);

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
  console.log("🔍 Debug - Filtered projects:", projects.filter(p => (p as any).status !== "closed" && (p as any).firebase_uid === currentUserId));

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

  const handleClose = (projectId: string) => {
    // updateProject(projectId, { status: "closed" });
  };

  // Add/update this function in your BorwMyProjects component
  const handleViewDetails = (projectId: string) => {
    navigate(`/borrower/project/${projectId}/details`);
  };

  // Add this function to your BorrowerMyProjects component:
  const handlePublishProject = (projectId: string) => {
    try {
      // updateProject(projectId, { status: "published" });
      // toast.success("Project published successfully! Investors can now see it.");
    } catch (error: any) {
      console.error("Error publishing project:", error);
      // toast.error("Failed to publish project");
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
              <Button
                className="bg-[#ffc628] text-black px-4 py-2 rounded-lg"
                onClick={() => setShowModal(true)}
              >
                Create New Project
              </Button>
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

            {/* Projects List - to be mapped from actual data */}
            {projects.filter(p => (p as any).status !== "closed" && (p as any).firebase_uid === profile?.id).length > 0 ? (
  <div>
    {projects.filter(p => (p as any).status !== "closed" && (p as any).firebase_uid === profile?.id).map(project => (
      <div key={project.id} className="bg-white rounded-lg border border-gray-100 shadow-sm mb-4 p-4 flex">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">{project.title || "Untitled Project"}</h3>
            
            {/* Add approval status badge */}
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                (project as any).status === 'published' 
                  ? 'bg-green-100 text-green-800' 
                  : (project as any).status === 'draft'
                  ? 'bg-yellow-100 text-yellow-800'
                  : (project as any).status === 'pending'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {(project as any).status ? (project as any).status.charAt(0).toUpperCase() + (project as any).status.slice(1) : 'No Status'}
              </span>
              
              {(project as any).approvalStatus === 'approved' && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  Approved
                </span>
              )}
              
              {(project as any).approvalStatus === 'rejected' && (
                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                  Rejected
                </span>
              )}
              
              {(project as any).approvalStatus === 'pending' && (project as any).status === 'published' && (
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                  Awaiting Approval
                </span>
              )}
            </div>
          </div>
          
          {/* Project details */}
          <div className="text-sm text-gray-600 mb-2">Project ID: {project.id}</div>
          <div className="text-sm text-gray-600 mb-2">Location: {project.borrower_profile?.address || "Not specified"}</div>
          
          {/* Approval feedback if rejected */}
          {(project as any).approvalStatus === 'rejected' && (project as any).approvalFeedback && (
            <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded">
              <p className="text-sm font-medium text-red-800">Rejection reason:</p>
              <p className="text-sm text-red-700">{(project as any).approvalFeedback}</p>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <Button 
            onClick={() => handleViewDetails(project.id)} 
            className="bg-[#ffc628] text-black"
          >
            View Details
          </Button>
          
          <Button 
            onClick={() => handleEdit(project.id)} 
            variant="outline"
          >
            Edit
          </Button>
          
          {((project as any).status === "draft" || (project as any).status === "pending" || !(project as any).status) && (
            <Button 
              onClick={() => handlePublishProject(project.id)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Publish
            </Button>
          )}
          
          {(project as any).status !== "closed" && (
            <Button 
              onClick={() => handleClose(project.id)}
              variant="outline" 
              className="border-red-500 text-red-500"
            >
              Close
            </Button>
          )}
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

            <Outlet />
          </div>
        </div>
    </DashboardLayout>
  );
};

export default BorrowerMyProjects;
