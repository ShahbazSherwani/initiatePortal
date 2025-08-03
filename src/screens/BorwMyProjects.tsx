import React, { Fragment, useContext, useState } from "react";
import { Navigate, useNavigate, Outlet } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
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
  const { token } = useContext(AuthContext)!;
  const { projects, updateProject } = useProjects();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<"equity" | "lending" | null>(null);


  if (!token) return <Navigate to="/login" />;

const handleContinue = () => {
  setShowModal(false);
  if (selectedType === "equity") {
    navigate("/borwNewProjEq");
  } else {
    navigate("/borwNewProj");
  }
};

  const handleEdit = (projectId: string) => {
    console.log("Editing project with ID:", projectId);
    navigate(`/borwEditProject/${projectId}`);
  };

  const handleClose = (projectId: string) => {
    updateProject(projectId, { status: "closed" });
  };

  // Add/update this function in your BorwMyProjects component
  const handleViewDetails = (projectId: string) => {
    navigate(`/borrower/project/${projectId}/details`);
  };

  // Add this function to your BorrowerMyProjects component:
  const handlePublishProject = (projectId: string) => {
    try {
      updateProject(projectId, { status: "published" });
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
          <div className="mt-6 flex gap-4">
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
            {projects.filter(p => p.status !== "closed").length > 0 ? (
  <div>
    {projects.filter(p => p.status !== "closed").map(project => (
      <div key={project.id} className="bg-white rounded-lg border border-gray-100 shadow-sm mb-4 p-4 flex">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">{project.details.product || "Untitled Project"}</h3>
            
            {/* Add approval status badge */}
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                project.status === 'published' 
                  ? 'bg-green-100 text-green-800' 
                  : project.status === 'draft'
                  ? 'bg-yellow-100 text-yellow-800'
                  : project.status === 'pending'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1) : 'No Status'}
              </span>
              
              {project.approvalStatus === 'approved' && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  Approved
                </span>
              )}
              
              {project.approvalStatus === 'rejected' && (
                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                  Rejected
                </span>
              )}
              
              {project.approvalStatus === 'pending' && project.status === 'published' && (
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                  Awaiting Approval
                </span>
              )}
            </div>
          </div>
          
          {/* Project details */}
          <div className="text-sm text-gray-600 mb-2">Project ID: {project.id}</div>
          <div className="text-sm text-gray-600 mb-2">Location: {(project.details as any)?.location || "Not specified"}</div>
          
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
          
          {(project.status === "draft" || project.status === "pending" || !project.status) && (
            <Button 
              onClick={() => handlePublishProject(project.id)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Publish
            </Button>
          )}
          
          {project.status !== "closed" && (
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
