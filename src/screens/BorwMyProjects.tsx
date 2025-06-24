import React, { Fragment, useContext, useState } from "react";
import { Navigate, useNavigate, Outlet } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { Navbar } from "../components/Navigation/navbar";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Button } from "../components/ui/button";
import { Dialog, Transition } from "@headlessui/react";
import { Menu as MenuIcon, ChevronLeft as ChevronLeftIcon, X as XIcon } from "lucide-react";



import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";

// Tabs configuration
const projectTabs = [
  { value: "pending", label: "Pending" },
  { value: "ongoing", label: "On-Going" },
  { value: "completed", label: "Completed" },
  { value: "default", label: "Default" },
];

export const BorrowerMyProjects: React.FC = (): JSX.Element => {
  const { token } = useContext(AuthContext)!;
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

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      <Navbar activePage="my-projects" showAuthButtons={false} />

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
            <Sidebar activePage="My Issuer/Borrower" />
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
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
          <Tabs defaultValue="pending" className="mb-8">
            <TabsList className="flex flex-wrap gap-4">
              {projectTabs.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 py-2 rounded-lg bg-transparent border border-gray-500 data-[state=active]:bg-[#ffc628] data-[state=active]:border-none"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Empty state */}
          <div className="flex flex-col items-center justify-center mt-16">
            <img
              src="/2.png"
              alt="No projects"
              className="w-full max-w-xs md:max-w-md lg:max-w-lg"
            />
            <h2 className="mt-6 text-lg md:text-2xl font-semibold text-center">
              Looks like you don’t have any projects yet!
            </h2>
          </div>

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

        <Outlet />
        </main>
      </div>
    </div>
  );
};

export default BorrowerMyProjects;
