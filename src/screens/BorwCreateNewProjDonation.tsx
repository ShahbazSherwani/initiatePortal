import React, { useContext, useState, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { UploadIcon, ArrowLeftIcon } from "lucide-react";
import { useProjectForm } from "../contexts/ProjectFormContext";

const BorwCreateNewProjDonation: React.FC = () => {
  const { token } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const { setForm } = useProjectForm();

  // Local state for form fields
  const [product, setProduct] = useState("");
  const [projectRequirements, setProjectRequirements] = useState("");
  const [location, setLocation] = useState("");
  const [overview, setOverview] = useState("");
  const [category, setCategory] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle upload click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle image upload
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
            image: reader.result,
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!token) {
    return <Navigate to="/login" />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a complete project object similar to other components
    const newProject = {
      type: "donation",
      status: "draft",
      details: {
        product,
        projectRequirements,
        location,
        overview,
        category,
      },
      milestones: [],
      createdAt: new Date().toISOString(),
      fundingProgress: 0,
    };

    console.log("Submitting donation project:", newProject);

    // Update form state and navigate to milestones
    setForm((f) => ({
      ...f,
      selectedType: "donation",
      projectDetails: newProject.details,
    }));
    
    navigate("/borwMilestones");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      {/* Top navbar */}
      {/* <Navbar activePage="create-project" showAuthButtons={false} /> */}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-[325px]">
          <Sidebar activePage="My Issuer/Borrower" />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-[90%] mx-auto bg-white rounded-t-[30px] p-4 md:p-8 md:w-full md:mx-0 min-h-screen flex flex-col animate-fadeIn delay-300">
            {/* Header with back button */}
            <div className="flex items-center mb-6">
              <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                <ArrowLeftIcon className="w-6 h-6" />
              </Button>
              <h1 className="ml-4 text-2xl md:text-3xl font-semibold">
                Create New Project
              </h1>
            </div>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Project Details */}
            <div className="p-8 bg-white rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-6">Project Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-2">
                    Project Title
                  </label>
                  <Input
                    id="product"
                    name="product"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    placeholder="e.g. Community Garden Project"
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <Input
                    id="location"
                    name="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Manila, Philippines"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="overview" className="block text-sm font-medium text-gray-700 mb-2">
                    Project Description
                  </label>
                  <Textarea
                    id="overview"
                    name="overview"
                    value={overview}
                    onChange={(e) => setOverview(e.target.value)}
                    placeholder="Describe your donation project in detail..."
                    rows={6}
                  />
                </div>
                <div>
                  <label htmlFor="projectRequirements" className="block text-sm font-medium text-gray-700 mb-2">
                    Funding Requirements
                  </label>
                  <Input
                    id="projectRequirements"
                    name="projectRequirements"
                    value={projectRequirements}
                    onChange={(e) => setProjectRequirements(e.target.value)}
                    placeholder="e.g. ₱50,000 for materials and setup"
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <Select onValueChange={(value) => setCategory(value)} value={category}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="community">Community</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="environment">Environment</SelectItem>
                      <SelectItem value="disaster-relief">Disaster Relief</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Picture*
                  </label>
                  <div 
                    className={`w-full border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors ${
                      imagePreview ? 'min-h-40 p-4' : 'h-40'
                    }`}
                    onClick={handleUploadClick}
                  >
                    {imagePreview ? (
                      <div className="w-full">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-auto rounded-lg object-contain max-h-96"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <UploadIcon className="w-8 h-8 mb-2 text-gray-400" />
                        <span className="font-medium text-gray-700">
                          + Upload
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => navigate("/borwMyProj")}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 text-white">
                Save & Continue
              </Button>
            </div>
          </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BorwCreateNewProjDonation;
