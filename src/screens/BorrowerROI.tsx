import React, { useContext, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navigation/navbar";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeftIcon, ChevronLeftIcon, Menu as MenuIcon } from "lucide-react";
import { AuthContext } from "../contexts/AuthContext";

export const BorrowerROI: React.FC = (): JSX.Element => {
  const { token } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // form state
  const [expenseDetail, setExpenseDetail] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("");
  const [totalAmount, setTotalAmount] = useState("");

  if (!token) {
    return <Navigate to="/login" />;
  }

  const handleContinue = () => {
    // TODO: validate & submit ROI info to backend
    navigate("/borrowNextStep"); // replace with your next route
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      {/* Top navbar */}
      <Navbar activePage="roi" showAuthButtons={false} />

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
            className={`fixed inset-y-0 left-0 w-3/4 max-w-xs bg-white shadow transform transition-transform ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <Sidebar activePage="My Issuer/Borrower" />
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <ArrowLeftIcon
                className="w-6 h-6 cursor-pointer"
                onClick={() => navigate(-1)}
              />
              <h1 className="ml-4 text-2xl md:text-3xl font-semibold">
                ROI (Return On Investment)
              </h1>
            </div>
            <Button className="bg-[#ffc628] text-black">
              Add Expense
            </Button>
          </div>

          {/* Expense detail */}
          <div className="space-y-6">
            <div>
              <label className="block mb-1 font-medium">
                Expense (Specific)*{" "}
                <span className="text-gray-400" title="What exactly did you spend on?">
                  ⓘ
                </span>
              </label>
              <Textarea
                placeholder="Enter Details"
                value={expenseDetail}
                onChange={(e) => setExpenseDetail(e.target.value)}
                className="w-full rounded-2xl border"
              />
            </div>

            {/* inline: price per unit / unit of measure */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">
                  Price per unit{" "}
                  <span className="text-gray-400" title="Cost for one unit">
                    ⓘ
                  </span>
                </label>
                <Input
                  placeholder="Amount"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  className="rounded-2xl border"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  Unit of Measure{" "}
                  <span className="text-gray-400" title="kg, pc, liter, etc.">
                    ⓘ
                  </span>
                </label>
                <Input
                  placeholder="pc/kg/liter"
                  value={unitOfMeasure}
                  onChange={(e) => setUnitOfMeasure(e.target.value)}
                  className="rounded-2xl border"
                />
              </div>
            </div>

            {/* total amount */}
            <div>
              <h2 className="text-xl font-semibold mb-2">Total Amount</h2>
              <label className="block mb-1 font-medium">
                Expense (Specific)*{" "}
                <span className="text-gray-400" title="Total cost you spent">
                  ⓘ
                </span>
              </label>
              <Input
                placeholder="Enter Amount"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full rounded-2xl border"
              />
            </div>

            {/* continue */}
            <div className="pt-4">
              <Button
                className="w-full bg-[#ffc628] text-black py-3 rounded-lg"
                onClick={() => {navigate("/borrowROISales");}}
              >
                Continue
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BorrowerROI;
