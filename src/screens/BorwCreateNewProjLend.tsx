import React, { useContext, useState, useRef } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { format, addMonths } from "date-fns";
import { Clock } from "lucide-react";

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
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Handle upload click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = () => {
    setForm(f => ({
      ...f,
      selectedType: "lending",
      projectDetails: {
        ...f.projectDetails, // <-- This keeps the image and any other previous fields!
        loanAmount,
        projectRequirements,
        investorPercentage,
        timeDuration,
        product,
        location,
        overview,
        videoLink,
      },
    }));
    navigate("/borwMilestones");
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
        <main className="flex-1 overflow-y-auto">
          <div className="w-[90%] mx-auto bg-white rounded-t-[30px] p-4 md:p-8 md:w-full md:mx-0 min-h-screen flex flex-col animate-fadeIn delay-300">
            {/* Header with back button */}
            <div className="flex items-center mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </Button>
              <h1 className="ml-4 text-2xl md:text-3xl font-semibold font-poppins">
                Create New Project
              </h1>
            </div>

            {/* Form container with horizontal scroll on narrow */}
            <div className="overflow-x-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
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
                      value="Under 100000"
                      className="flex-1 py-3 rounded-2xl bg-[#0C4B20] text-center font-medium font-poppins"
                    >
                      Under 100000
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="100000 and Above"
                      className="flex-1 py-3 rounded-2xl bg-white border text-center font-medium font-poppins"
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full py-3 px-4 rounded-2xl border border-gray-200 flex justify-between items-center bg-white hover:bg-gray-50 focus:ring-2 focus:ring-[#0C4B20] focus:border-transparent transition-all text-left font-normal text-gray-700"
                      >
                        <span>
                          {timeDuration ? format(new Date(timeDuration), "PPP 'at' p") : "Select project end date and time"}
                        </span>
                        <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white shadow-lg rounded-2xl border-0" align="start">
                      <div className="p-8">
                        {/* Custom Calendar Grid */}
                        <div className="calendar-container">
                          {/* Navigation Header */}
                          <div className="flex justify-center items-center text-gray-800 font-medium mb-4 relative">
                            <button 
                              className="h-10 w-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors shadow-sm absolute left-0"
                              onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                            >
                              <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                            <h3 className="text-lg font-semibold px-4">
                              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h3>
                            <button 
                              className="h-10 w-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors shadow-sm absolute right-0"
                              onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                            >
                              <ChevronRightIcon className="w-5 h-5" />
                            </button>
                          </div>
                          
                          {/* Calendar Grid */}
                          <div className="w-full">
                            {/* Days Header */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                                <div key={day} className="h-10 flex items-center justify-center text-gray-500 font-medium text-sm">
                                  {day}
                                </div>
                              ))}
                            </div>
                            
                            {/* Calendar Days */}
                            <div className="grid grid-cols-7 gap-1">
                              {(() => {
                                const year = currentDate.getFullYear();
                                const month = currentDate.getMonth();
                                const firstDay = new Date(year, month, 1);
                                const startDate = new Date(firstDay);
                                startDate.setDate(startDate.getDate() - firstDay.getDay());
                                
                                const days = [];
                                for (let i = 0; i < 42; i++) {
                                  const day = new Date(startDate);
                                  day.setDate(startDate.getDate() + i);
                                  
                                  const isCurrentMonth = day.getMonth() === month;
                                  const isToday = day.toDateString() === new Date().toDateString();
                                  const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                                  
                                  days.push(
                                    <div 
                                      key={i}
                                      className={`h-10 flex items-center justify-center font-normal cursor-pointer rounded-lg transition-colors ${
                                        !isCurrentMonth 
                                          ? 'text-gray-400 opacity-50 hover:bg-gray-100' 
                                          : isSelected
                                          ? 'bg-[#0C4B20] text-white font-medium shadow-sm'
                                          : isToday 
                                          ? 'bg-blue-100 text-blue-700 font-medium' 
                                          : 'text-gray-700 hover:bg-gray-100'
                                      }`}
                                      onClick={() => {
                                        setSelectedDate(day);
                                        const endDate = addMonths(day, 3);
                                        setTimeDuration(endDate.toISOString());
                                      }}
                                    >
                                      {day.getDate()}
                                    </div>
                                  );
                                }
                                
                                return days.slice(0, 35); // Show 5 weeks
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-3 mb-3">
                            <Clock className="h-5 w-5 text-gray-500" />
                            <span className="text-base font-medium text-gray-700">Select Time</span>
                          </div>
                          <select 
                            className="flex h-[58px] w-full rounded-2xl border border-black bg-transparent px-4 py-3 font-poppins text-base transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#0C4B20] focus:border-[#0C4B20]"
                            onChange={(e) => {
                              if (timeDuration) {
                                const date = new Date(timeDuration);
                                const [hours, minutes] = e.target.value.split(':');
                                date.setHours(parseInt(hours), parseInt(minutes));
                                setTimeDuration(date.toISOString());
                              }
                            }}
                            defaultValue="09:00"
                          >
                            <option value="09:00">9:00 AM</option>
                            <option value="12:00">12:00 PM</option>
                            <option value="15:00">3:00 PM</option>
                            <option value="18:00">6:00 PM</option>
                            <option value="21:00">9:00 PM</option>
                          </select>
                          <div className="mt-4 text-center">
                            <p className="text-sm text-gray-500 bg-gray-50 py-2 px-4 rounded-lg">Project duration: 3 months</p>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
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

                <Button
                  className="w-full bg-[#0C4B20] hover:bg-[#8FB200] text-white py-3 rounded-lg font-medium"
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
                        <span className="font-medium text-black text-base">
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default BorrowerCreateNew;
