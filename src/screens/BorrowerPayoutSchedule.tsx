// src/screens/BorrowerPayoutSchedule.tsx
import React, { useContext, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navigation/navbar";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { BorrowerPayoutScheduleModal } from "../components/BorrowerPayoutScheduleModal";
import { ArrowLeftIcon, ChevronLeftIcon, Menu as MenuIcon } from "lucide-react";
import { AuthContext } from "../contexts/AuthContext";


export const BorrowerPayoutSchedule: React.FC = () => {


    const [showGuarantorModal, setShowGuarantorModal] = useState(false);

      const handleModalContinue = (data) => {
    // send `data` up to your backend…
    setShowGuarantorModal(false);
    // then navigate or close, etc.
  };

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

  if (!token) return <Navigate to="/login" />;

  const handleGeneratePayout = () => {
    // TODO: compute totalPayoutReq from backend or formula
  };

  const handleMatchMismatch = () => {
    // TODO: compute netIncome based on schedule vs total
  };

  const handleContinue = () => {
    // TODO: save schedule data…
    navigate("/borrowROI"); // replace with your ROI route
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      {/* Top navbar */}
      <Navbar activePage="payout-schedule" showAuthButtons={false} />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-[325px]">
          <Sidebar activePage="My Issuer/Borrower" />
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden">
          <button
            className="fixed top-4 left-4 p-2 bg-white rounded-full shadow z-50"
            onClick={() => setMobileMenuOpen(o => !o)}
          >
            {mobileMenuOpen ? (
              <ChevronLeftIcon className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>
          <div
            className={`fixed inset-y-0 left-0 w-3/4 bg-white shadow transition-transform ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <Sidebar activePage="My Issuer/Borrower" />
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <ArrowLeftIcon
                className="w-6 h-6 cursor-pointer"
                onClick={() => navigate(-1)}
              />
              <h1 className="ml-4 text-2xl md:text-3xl font-semibold">
                Payout Schedule
              </h1>
            </div>
            <Button className="bg-[#ffc628]">Add Payout Schedule</Button>
          </div>

          {/* Generate Total Payout */}
          <div className="mb-6">
            <label className="block mb-1 font-medium">
              Generate Total Payout Required
            </label>
            <div className="flex gap-4">
              <Input
                placeholder="Total Payout Required"
                value={totalPayoutReq}
                onChange={e => setTotalPayoutReq(e.target.value)}
                className="flex-1 rounded-2xl border"
              />
              <Button onClick={handleGeneratePayout} className="whitespace-nowrap">
                Generate Total Payout Required
              </Button>
            </div>
          </div>

          {/* Enter Details for Payout Schedule */}
          <div className="mb-6 space-y-4">
            <h2 className="text-lg font-semibold">Enter Details for Payout Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Payout Date(s)</label>
                <Input
                  type="date"
                  placeholder="Select Date"
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  className="rounded-2xl border"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Amount</label>
                <Input
                  placeholder="Amount"
                  value={scheduleAmount}
                  onChange={e => setScheduleAmount(e.target.value)}
                  className="rounded-2xl border"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 font-medium">% of Total Payout (Capital + Interest)</label>
              <Input
                placeholder="%"
                value={payoutPercent}
                onChange={e => setPayoutPercent(e.target.value)}
                className="w-full rounded-2xl border"
              />
            </div>
          </div>

          {/* Generate Net Income */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Generate Net Income Calculation</h2>
            <label className="block mb-1 font-medium">
              Total Amount in Payout Schedule
            </label>
            <div className="flex gap-4 items-center">
              <Input
                placeholder="Enter Amount"
                value={netIncome}
                onChange={e => setNetIncome(e.target.value)}
                className="flex-1 rounded-2xl border"
              />
              <Button onClick={handleMatchMismatch} className="whitespace-nowrap">
                Match/Mismatch
              </Button>
            </div>
          </div>

          {/* Agreements */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center">
              <Checkbox
                checked={penaltyAgree}
                onCheckedChange={val => setPenaltyAgree(!!val)}
              />
              <label className="ml-2 text-sm">
                I confirm and agree that I will be charged with penalty for delay of payments.
              </label>
            </div>
            <div className="flex items-center">
              <Checkbox
                checked={legalAgree}
                onCheckedChange={val => setLegalAgree(!!val)}
              />
              <label className="ml-2 text-sm">
                I confirm and agree that I will be subject to legal obligations for non-payments.
              </label>
            </div>
          </div>

          {/* Continue */}
          <div>
      <Button
                          className="bg-[#ffc628] text-black w-full" onClick={() => setShowGuarantorModal(true)}>Add Payout Schedule</Button>

      <BorrowerPayoutScheduleModal
        open={showGuarantorModal}
        onOpenChange={setShowGuarantorModal}
        onContinue={handleModalContinue}
      />
          </div>
        </main>
      </div>
    </div>
  );
};

export default BorrowerPayoutSchedule;
