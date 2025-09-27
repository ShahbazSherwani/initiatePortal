// src/screens/BorrowerPayoutSchedule.tsx
import React, { useContext, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { ArrowLeftIcon, ChevronLeftIcon, Menu as MenuIcon } from "lucide-react";
import { AuthContext } from "../contexts/AuthContext";
import { useProjectForm } from "../contexts/ProjectFormContext";
import { useProjects } from "../contexts/ProjectsContext";
import { v4 as uuidv4 } from "uuid";


export const BorrowerPayoutSchedule: React.FC = () => {

  const { token } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // form state
  const [totalPayoutReq, setTotalPayoutReq] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleAmount, setScheduleAmount] = useState("");
  const [payoutPercent, setPayoutPercent] = useState("");
  const [netIncome, setNetIncome] = useState("");
  const [penaltyAgree, setPenaltyAgree] = useState(false);
  const [legalAgree, setLegalAgree] = useState(false);

  const { form, setForm } = useProjectForm();
  const { addProject } = useProjects();

  if (!token) return <Navigate to="/login" />;

  const handleGeneratePayout = () => {
    // TODO: compute totalPayoutReq from backend or formula
  };

  const handleMatchMismatch = () => {
    // TODO: compute netIncome based on schedule vs total
  };

  const handleContinue = () => {
    setForm(f => ({
      ...f,
      payoutSchedule: {
        totalPayoutReq,
        scheduleDate,
        scheduleAmount,
        payoutPercent,
        netIncome,
        penaltyAgree,
        legalAgree,
      },
    }));
    // Navigate to next step or submit directly
    handleFinalSubmit();
  };

  const handleFinalSubmit = () => {
    console.log("Form details before addProject:", form.projectDetails);
    addProject({
      id: uuidv4(),
      type: (form.selectedType === "equity" || form.selectedType === "lending")
        ? form.selectedType
        : "lending",
      details: form.projectDetails, // includes image
      milestones: form.milestones,
      roi: form.roi,
      sales: form.sales,
      payoutSchedule: form.payoutSchedule,
      status: "pending", // <-- Add this for pending approval
    });
    setForm({
      selectedType: null,
      projectDetails: {},
      milestones: [],
      roi: {},
      sales: {},
      payoutSchedule: {},
      projectId: "",
    });
    navigate("/borwMyProj"); // Make sure this route matches your "My Projects" page
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      {/* Top navbar */}
      {/* <Navbar activePage="payout-schedule" showAuthButtons={false} /> */}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:block w-[325px] flex-shrink-0">
          <Sidebar activePage="My Issuer/Borrower" />
        </div>

        {/* Mobile toggle */}
        <div className="lg:hidden">
          <button
            className="fixed top-4 left-4 p-3 bg-white rounded-full shadow-lg z-50 hover:bg-gray-50 transition-colors"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
            ) : (
              <MenuIcon className="w-5 h-5 text-gray-700" />
            )}
          </button>
          <div
            className={`fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white shadow-xl transition-transform duration-300 ease-in-out z-40 ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="h-full overflow-y-auto">
              <Sidebar activePage="My Issuer/Borrower" />
            </div>
          </div>
          {/* Overlay */}
          {mobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-[#f0f0f0]">
          <div className="w-full max-w-7xl mx-auto bg-white min-h-screen">
            <div className="lg:rounded-tl-[30px] p-4 sm:p-6 lg:p-8 animate-fadeIn delay-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 pt-16 lg:pt-0">
              <div className="flex items-center">
                <ArrowLeftIcon
                  className="w-5 h-5 sm:w-6 sm:h-6 cursor-pointer text-gray-700 hover:text-gray-900 transition-colors"
                  onClick={() => navigate(-1)}
                />
                <h1 className="ml-3 text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900">
                  Payout Schedule
                </h1>
              </div>
              <Button className="bg-[#0C4B20] hover:bg-[#8FB200] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg transition-colors text-sm sm:text-base">
                Add Payout Schedule
              </Button>
            </div>

            {/* Generate Total Payout */}
            <div className="mb-8 bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-200">
              <label className="block mb-3 font-semibold text-gray-800 text-sm sm:text-base">
                Generate Total Payout Required
              </label>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Input
                  placeholder="Total Payout Required"
                  value={totalPayoutReq}
                  onChange={e => setTotalPayoutReq(e.target.value)}
                  className="flex-1 rounded-xl border-gray-300 focus:border-[#0C4B20] focus:ring-[#0C4B20] p-3 text-sm sm:text-base"
                />
                <Button 
                  onClick={handleGeneratePayout} 
                  className="whitespace-nowrap bg-[#0C4B20] hover:bg-[#8FB200] text-white px-4 py-3 rounded-xl transition-colors text-sm sm:text-base font-medium min-w-fit"
                >
                  Generate Total Payout Required
                </Button>
              </div>
            </div>

            {/* Enter Details for Payout Schedule */}
            <div className="mb-8 bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
              <h2 className="text-lg sm:text-xl font-semibold mb-6 text-gray-900">Enter Details for Payout Schedule</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block mb-2 font-medium text-gray-700 text-sm sm:text-base">
                      Payout Date(s)
                    </label>
                    <Input
                      type="date"
                      placeholder="Select Date"
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                      className="w-full rounded-xl border-gray-300 focus:border-[#0C4B20] focus:ring-[#0C4B20] p-3 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-gray-700 text-sm sm:text-base">
                      Amount
                    </label>
                    <Input
                      placeholder="Amount"
                      value={scheduleAmount}
                      onChange={e => setScheduleAmount(e.target.value)}
                      className="w-full rounded-xl border-gray-300 focus:border-[#0C4B20] focus:ring-[#0C4B20] p-3 text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm sm:text-base">
                    % of Total Payout (Capital + Interest)
                  </label>
                  <Input
                    placeholder="%"
                    value={payoutPercent}
                    onChange={e => setPayoutPercent(e.target.value)}
                    className="w-full rounded-xl border-gray-300 focus:border-[#0C4B20] focus:ring-[#0C4B20] p-3 text-sm sm:text-base max-w-md"
                  />
                </div>
              </div>
            </div>

            {/* Generate Net Income */}
            <div className="mb-8 bg-[#8FB200]/25 border border-[#0C4B20] rounded-xl p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-[#0C4B20]">Generate Net Income Calculation</h2>
              <label className="block mb-3 font-medium text-[#0C4B20] text-sm sm:text-base">
                Total Amount in Payout Schedule
              </label>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                <Input
                  placeholder="Enter Amount"
                  value={netIncome}
                  onChange={e => setNetIncome(e.target.value)}
                  className="flex-1 rounded-xl border-[#0C4B20] ring-[#8FB200] p-3 text-sm sm:text-base bg-white"
                />
                <Button 
                  onClick={handleMatchMismatch} 
                  className="whitespace-nowrap bg-[#0C4B20] hover:bg-[#8FB200] transition-colors text-sm sm:text-base font-medium"
                >
                  Match/Mismatch
                </Button>
              </div>
            </div>

            {/* Agreements */}
            <div className="mb-8 bg-[#8FB200]/25 border border-[#0C4B20] rounded-xl p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4 text-[#0C4B20]">Terms & Agreements</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={penaltyAgree}
                    onCheckedChange={val => setPenaltyAgree(!!val)}
                    className="mt-1 data-[state=checked]:bg-[#0C4B20] data-[state=checked]:border-[#0C4B20]"
                  />
                  <label className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    I confirm and agree that I will be charged with penalty for delay of payments.
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={legalAgree}
                    onCheckedChange={val => setLegalAgree(!!val)}
                    className="mt-1 data-[state=checked]:bg-[#0C4B20] data-[state=checked]:border-[#0C4B20]"
                  />
                  <label className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    I confirm and agree that I will be subject to legal obligations for non-payments.
                  </label>
                </div>
              </div>
            </div>

            {/* Continue */}
            <div className="sticky bottom-0 bg-white pt-4 pb-4 sm:pb-6 border-t border-gray-200">
              <Button
                className="bg-[#0C4B20] hover:bg-[#8FB200] text-white w-full py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handleContinue}
                disabled={!penaltyAgree || !legalAgree}
              >
                Add Payout Schedule
              </Button>
            </div>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BorrowerPayoutSchedule;



