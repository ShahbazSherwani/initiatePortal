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

export const Milestones: React.FC = (): JSX.Element => {
  const { token } = useContext(AuthContext)!;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();


  const onSubmit = () => {
  // ... save project …
  navigate("/borwMilestones");
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
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
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

                {/* Project Requirements */}
                <div>
                  <label className="font-medium text-black text-base block mb-2">
                    Project Requirements
                  </label>
                  <Input
                    placeholder="Enter amount"
                    className="w-full py-3 pl-3 rounded-2xl border"
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
                  />
                </div>

                  <Button
                    className="w-full bg-[#ffc628] text-black py-3 rounded-lg font-medium"
                    onClick={() => {
                      // TODO: actually submit/save the project data…
                      // then:
                      navigate("/borwMilestones");
                    }}
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
                      <span className="font-medium">Upload</span>
                    </div>
                  </div>
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

export default Milestones;
