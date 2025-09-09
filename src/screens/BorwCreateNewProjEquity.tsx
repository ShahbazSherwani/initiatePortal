import React, { useContext, useState, useRef } from "react";
import { Navigate, useNavigate, } from "react-router-dom";
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
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { format, addMonths } from "date-fns";
import { Clock } from "lucide-react";

export const BorrowerCreateNewEq: React.FC = (): JSX.Element => {
  const { token } = useContext(AuthContext)!;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { form, setForm } = useProjectForm();

  // Local state for form fields
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [projectRequirements, setProjectRequirements] = useState("");
  const [investorPercentage, setInvestorPercentage] = useState("");
  const [dividendFrequency, setDividendFrequency] = useState("");
  const [dividendOther, setDividendOther] = useState("");
  const [product, setProduct] = useState("");
  const [timeDuration, setTimeDuration] = useState("");
  const [location, setLocation] = useState("");
  const [overview, setOverview] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null); // State for image preview
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onSubmit = () => {
    setForm(f => ({
      ...f,
      selectedType: "equity", // or "lending"
      projectDetails: {
        ...f.projectDetails, // <-- This keeps the image and any other previous fields!
        investmentAmount,
        projectRequirements,
        investorPercentage,
        dividendFrequency,
        dividendOther,
        product,
        timeDuration,
        location,
        overview,
        videoLink,
      },
    }));
    navigate("/borwMilestones");
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // When user selects a file:
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setForm(f => ({
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

            {/* Form container with horizontal scroll on narrow */}
            <div className="overflow-x-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {/* Left column */}
                <div className="space-y-6">
                  {/* Please Select */}
                  <div>
                    <label className="font-medium text-black text-base block mb-2">
                      Please Select
                    </label>
                    <ToggleGroup
                      type="single"
                      className="flex gap-3"
                      value={investmentAmount}
                      onValueChange={setInvestmentAmount}
                    >
                      <ToggleGroupItem
                        value="Under 100000"
                        className="flex-1 py-3 rounded-2xl bg-[#ffc628] text-center font-medium"
                      >
                       Under 100000
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="100000 and Above"
                        className="flex-1 py-3 rounded-2xl bg-white border text-center font-medium"
                      >
                        100000 and Above
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
                      onChange={e => setProjectRequirements(e.target.value)}
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
                      onChange={e => setInvestorPercentage(e.target.value)}
                    />
                  </div>

                  {/* Dividend Frequency */}
                  <div>
                    <label className="font-medium text-black text-base block mb-2">
                      Dividend Frequency
                    </label>
                    <Select
                      value={dividendFrequency}
                      onValueChange={setDividendFrequency}
                    >
                      <SelectTrigger className="w-full py-3 px-3 rounded-2xl border">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* If Others, specify */}
                  {dividendFrequency === "other" && (
                    <div>
                      <label className="font-medium text-black text-base block mb-2">
                        If Others, specify
                      </label>
                      <Input
                        placeholder="Enter here"
                        className="w-full py-3 px-3 rounded-2xl border"
                        value={dividendOther}
                        onChange={e => setDividendOther(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Product */}
                  <div>
                    <label className="font-medium text-black text-base block mb-2">
                      Product
                    </label>
                    <Input
                      placeholder="Enter here"
                      className="w-full py-3 px-3 rounded-2xl border"
                      value={product}
                      onChange={e => setProduct(e.target.value)}
                    />
                  </div>

                  {/* Select Time Duration */}
                  <div>
                    <label className="font-medium text-black text-base block mb-2">
                      Select Time Duration
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full py-3 px-3 rounded-2xl border flex justify-between items-center"
                        >
                          {timeDuration ? format(new Date(timeDuration), "PPP p") : "Select date and time"}
                          <ChevronRightIcon className="w-4 h-4 ml-2" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-4">
                          <Calendar
                            mode="single"
                            selected={timeDuration ? new Date(timeDuration) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                // Default to end of project (3 months later)
                                const endDate = addMonths(date, 3);
                                setTimeDuration(endDate.toISOString());
                              }
                            }}
                            initialFocus
                          />
                          <div className="p-3 border-t border-gray-200">
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4" />
                              <select 
                                className="w-full p-2 border rounded"
                                onChange={(e) => {
                                  if (timeDuration) {
                                    const date = new Date(timeDuration);
                                    const [hours, minutes] = e.target.value.split(':');
                                    date.setHours(parseInt(hours), parseInt(minutes));
                                    setTimeDuration(date.toISOString());
                                  }
                                }}
                              >
                                <option value="09:00">9:00 AM</option>
                                <option value="12:00">12:00 PM</option>
                                <option value="15:00">3:00 PM</option>
                                <option value="18:00">6:00 PM</option>
                              </select>
                            </div>
                            <div className="mt-4">
                              <p className="text-sm text-gray-500">Project duration: 3 months</p>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
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
                      onChange={e => setLocation(e.target.value)}
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
                      onChange={e => setOverview(e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full bg-[#ffc628] text-black py-3 rounded-lg font-medium"
                    onClick={onSubmit}
                  >
                    Continue
                  </Button>
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
                        {imagePreview && <img src={imagePreview} alt="Preview" />}
                          <button
                              type="button"
                              onClick={handleUploadClick}
                              className="upload-btn font-medium text-black text-base block mb-2"
                            >
                              + Upload
                          </button>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    
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
                        onChange={e => setVideoLink(e.target.value)}
                      />
                      <ChevronRightIcon className="absolute right-3 top-1/2 transform -translate-y-1/2" />
                    </div>
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

export default BorrowerCreateNewEq;
