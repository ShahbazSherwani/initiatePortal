import React, { Fragment, useContext, useState } from "react";
import { Navigate, useNavigate, Outlet } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { Navbar } from "../components/Navigation/navbar";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Button } from "../components/ui/button";
import { Dialog, Transition } from "@headlessui/react";
import { Menu as MenuIcon, ChevronLeft as ChevronLeftIcon, X as XIcon } from "lucide-react";
import { useProjects } from "../contexts/ProjectsContext";
import { useProjectForm } from "../contexts/ProjectFormContext";

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
  const { setForm } = useProjectForm();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setForm({
        projectId: project.id, // Add this line
        selectedType: project.type,
        projectDetails: project.details,
        milestones: project.milestones,
        roi: project.roi,
        sales: project.sales,
        payoutSchedule: project.payoutSchedule,
      });
      navigate("/borwCreateNewProjLend");
    }
  };

  const handleClose = (projectId: string) => {
    updateProject(projectId, { status: "closed" });
  };

  // Add/update this function in your BorwMyProjects component
  const handleViewDetails = (projectId: string) => {
    navigate(`/borrower/project/${projectId}/details`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      {/* <Navbar activePage="my-projects" showAuthButtons={false} /> */}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar desktop */}
        <div className="hidden md:block w-[325px]">
          <Sidebar activePage="My Issuer/Borrower" />
        </div>

        {/* Mobile sidebar toggle */}
        <div className="md:hidden">
          <button
            className="fixed top-4 left-4 z-50 p-2 rounded-full bg-white shadow"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <ChevronLeftIcon className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>
          <div
            className={`fixed inset-y-0 left-0 w-3/4 max-w-xs bg-white shadow transform transition-transform ease-in-out duration-200 ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <Sidebar activePage="issuer-borrower" />
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
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
      <div key={project.id} className="bg-white rounded-lg border border-gray-100 shadow-sm mb-4 p-0 flex">
        {/* Project Image */}
        <div className="flex-shrink-0">
          <img
            src={project.details.image || "/default-project.jpg"}
            alt="Project"
            className="w-[150px] h-[110px] object-cover rounded-l-lg"
          />
        </div>
        
        {/* Project Content */}
        <div className="flex-1 p-4 flex flex-col">
          {/* Status */}
          <div className="mb-2">
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-[#ffc628] mr-2"></span>
              <span className="text-sm font-medium">
                Status: {project.status === "pending" ? "Pending Verification" : "Approved"}
              </span>
            </div>
          </div>
          
          {/* Project Details */}
          <div className="grid grid-cols-2 gap-y-2 gap-x-8">
            <div>
              <p className="text-xs text-gray-500">Project ID:</p>
              <p className="font-medium text-sm">{project.id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Funding Requirements:</p>
              <p className="font-medium text-sm">PHP {project.details.loanAmount || project.details.investmentAmount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Project Location:</p>
              <p className="font-medium text-sm">{project.details.location || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Guarantor:</p>
              <p className="font-medium text-sm">John Doe</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">45% Funding Progress:</p>
              <p className="font-medium text-sm">{project.id}</p>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="flex gap-3 mt-4 justify-end">
            <button 
              onClick={() => handleViewDetails(project.id)}
              className="px-4 py-1.5 bg-[#ffc628] hover:bg-[#e9b725] text-black rounded-md text-sm font-medium"
            >
              View Project Details
            </button>
            <button 
              onClick={() => handleEdit(project.id)} 
              className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium"
            >
              Edit
            </button>
            <button 
              onClick={() => handleClose(project.id)} 
              className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium"
            >
              Close Project
            </button>
          </div>
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
        </main>
      </div>
    </div>
  );
};

export default BorrowerMyProjects;
