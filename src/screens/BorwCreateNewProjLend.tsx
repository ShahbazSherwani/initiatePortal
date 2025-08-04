import React, { useContext, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { Navbar } from "../components/Navigation/navbar";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  MenuIcon,
  UploadIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useProjectForm } from "../contexts/ProjectFormContext";

export const BorrowerCreateNew: React.FC = (): JSX.Element => {
  const { token } = useContext(AuthContext)!;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { form, setForm } = useProjectForm();

  // Local state for form fields (or use controlled components directly)
  const [loanAmount, setLoanAmount] = useState("");
  const [projectRequirements, setProjectRequirements] = useState("");
  const [investorPercentage, setInvestorPercentage] = useState("");
  const [timeDuration, setTimeDuration] = useState("");
  const [product, setProduct] = useState("");
  const [location, setLocation] = useState("");
  const [overview, setOverview] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null); // State for image preview

  const onSubmit = (publishImmediately = false) => {
    // Create a complete project object
    const newProject = {
      type: "lending",
      status: publishImmediately ? "published" : "draft", // Allow immediate publishing
      details: {
        loanAmount,
        projectRequirements,
        investorPercentage,
        timeDuration,
        product,
        location,
        overview,
        videoLink,
        image: imagePreview,
      },
      milestones: [],
      createdAt: new Date().toISOString(), // Always include creation date
      fundingProgress: 0,
    };

    console.log("Submitting project:", newProject);

    // Use the addProject function from context
    addProject(newProject)
      .then((result) => {
        console.log("Project creation result:", result);
        if (result.success) {
          setForm((f) => ({
            ...f,
            projectId: result.projectId,
            selectedType: "lending",
            projectDetails: newProject.details,
          }));
          navigate("/borwMilestones");
        } else {
          console.error("Failed to create project");
        }
      })
      .catch((error) => {
        console.error("Error creating project:", error);
      });
  };

  // When user selects a file:
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setForm((f) => ({
          ...f,
          projectDetails: {
            ...f.projectDetails,
            image: reader.result, // <-- This is critical!
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      {/* Top navbar */}
      {/* <Navbar activePage="create-project" showAuthButtons={false} /> */}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-[325px]">
          <Sidebar activePage="My Issuer/Borrower" />
        </div>

        {/* Mobile sidebar toggle */}
        <div className="md:hidden">
          <button
            className="fixed top-4 left-4 z-50 p-2 rounded-full bg-white shadow"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <ChevronLeftIcon className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>
          <div
            className={`fixed inset-y-0 left-0 w-3/4 max-w-xs bg-white shadow transform transition-transform duration-200 ease-in-out ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <Sidebar activePage="My Issuer/Borrower" />
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Header with back button */}
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </Button>
            <h1 className="ml-4 text-2xl md:text-3xl font-semibold">
              Create New Project
            </h1>
          </div>

          {/* wrap in overflow-x-auto so on narrow screens you can side-scroll */}
          <div className="overflow-x-auto">
            <div className="min-w-[700px] grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left column */}
              <div className="space-y-6">
                {/* Loan Amount Toggle */}
                <div>
                  <label className="font-medium text-black text-base block mb-2">
                    Please Select
                  </label>
                  <ToggleGroup
                    type="single"
                    className="flex gap-3"
                    value={loanAmount}
                    onValueChange={setLoanAmount}
                  >
                    <ToggleGroupItem
                      value="100000"
                      className="flex-1 py-3 rounded-2xl bg-[#ffc628] text-center font-medium"
                    >
                      100,000
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="100000above"
                      className="flex-1 py-3 rounded-2xl bg-white border text-center font-medium"
                    >
                      100,000 above
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {/* Project Requirements */}
                <div>
                  <label className="font-medium text-black text-base block mb-2">
                    Project Requirements
                  </label>
                  <Input
                    placeholder="Enter amount"
                    className="w-full py-3 pl-3 rounded-2xl border"
                    value={projectRequirements}
                    onChange={(e) => setProjectRequirements(e.target.value)}
                  />
                </div>

                {/* Investor Percentage */}
                <div>
                  <label className="font-medium text-black text-base block mb-2">
                    Investor Percentage
                  </label>
                  <Input
                    placeholder="Enter here %"
                    className="w-full py-3 px-3 rounded-2xl border"
                    value={investorPercentage}
                    onChange={(e) => setInvestorPercentage(e.target.value)}
                  />
                </div>

                {/* Select Time Duration */}
                <div>
                  <label className="font-medium text-black text-base block mb-2">
                    Select Time Duration
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Enter here"
                      className="w-full py-3 px-3 rounded-2xl border"
                      value={timeDuration}
                      onChange={(e) => setTimeDuration(e.target.value)}
                    />
                    <ChevronRightIcon className="absolute right-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                {/* Product */}
                <div>
                  <label className="font-medium text-black text-base block mb-2">
                    Product
                  </label>
                  <Input
                    placeholder="Enter here"
                    className="w-full py-3 px-3 rounded-2xl border"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="font-medium text-black text-base block mb-2">
                    Location
                  </label>
                  <Input
                    placeholder="Enter here"
                    className="w-full py-3 px-3 rounded-2xl border"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                {/* Project Overview */}
                <div>
                  <label className="font-medium text-black text-base block mb-2">
                    Project Overview
                  </label>
                  <Textarea
                    placeholder="Enter details"
                    className="w-full py-3 px-3 rounded-2xl border resize-none h-36"
                    value={overview}
                    onChange={(e) => setOverview(e.target.value)}
                  />
                </div>

                <div className="flex gap-4 mt-8">
                  <Button
                    onClick={() => onSubmit(false)}
                    className="px-6 py-2 bg-gray-200 text-black"
                  >
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => onSubmit(true)}
                    className="px-6 py-2 bg-[#ffc628] text-black"
                  >
                    Save & Publish
                  </Button>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-6">
                {/* Upload Picture */}
                <div>
                  <label className="font-medium text-black text-base block mb-2">
                    Upload Picture*
                  </label>
                  <div className="w-full h-40 border-2 border-dashed rounded-2xl flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <UploadIcon className="w-8 h-8 mb-2" />
                      <span className="font-medium">Upload</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  {imagePreview && <img src={imagePreview} alt="Preview" />}
                </div>

                {/* Video Attestation */}
                <div>
                  <label className="font-medium text-black text-base block mb-2">
                    Video Attestation
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Video Link"
                      className="w-full py-3 px-3 rounded-2xl border"
                      value={videoLink}
                      onChange={(e) => setVideoLink(e.target.value)}
                    />
                    <ChevronRightIcon className="absolute right-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BorrowerCreateNew;
