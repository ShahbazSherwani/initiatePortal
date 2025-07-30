// src/screens/BorrowerROI.tsx
import React, { useContext, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navigation/navbar";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  Menu as MenuIcon,
  PlusIcon,
  Info as InfoIcon,
} from "lucide-react";
import { AuthContext } from "../contexts/AuthContext";
import { useProjectForm } from "../contexts/ProjectFormContext";

export const BorrowerROISales: React.FC = () => {
  const { token } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [incomeDetail, setIncomeDetail] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [unitMeasure, setUnitMeasure] = useState("");
  const [totalSales, setTotalSales] = useState("");
  const [netIncomeCalc, setNetIncomeCalc] = useState("");
  const [unitsSold, setUnitsSold] = useState("");

  const { form, setForm } = useProjectForm();

  if (!token) return <Navigate to="/login" />;

  const handleGenerateNetIncome = () => {
    const price = parseFloat(pricePerUnit) || 0;
    const units = parseFloat(unitsSold) || 0;
    const expense = parseFloat(totalSales) || 0;
    const netIncome = (price * units) - expense;
    setNetIncomeCalc(netIncome.toFixed(2));
  };

  const handleContinue = () => {
    setForm(f => ({
      ...f,
      sales: {
        incomeDetail,
        pricePerUnit,
        unitMeasure,
        totalSales,
        unitsSold,
        netIncomeCalc,
      },
    }));
    navigate("/borrowPayout");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      <Navbar activePage="roi" showAuthButtons={false} />

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block w-[325px]">
          <Sidebar activePage="My Issuer/Borrower" />
        </div>

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

        <main className="flex-1 overflow-y-auto">
          <div className="w-[90%] mx-auto bg-white rounded-t-[30px] p-4 md:p-8 md:w-full md:mx-0 min-h-screen flex flex-col animate-fadeIn delay-300">
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
              <Button className="bg-[#ffc628] flex items-center gap-2">
                <PlusIcon className="w-5 h-5" /> Add Income
              </Button>
            </div>

            {/* Sales */}
            <div className="mb-8 space-y-4">
              <h2 className="text-lg font-semibold">Sales</h2>
              <div>
                <label className="block mb-1 font-medium">
                  Income/Sales (Specific)
                  <span title="What you expect to earn from this project.">
                    <InfoIcon
                      className="inline-block ml-1 align-middle"
                      size={16}
                    />
                  </span>
                </label>
                <Textarea
                  placeholder="Enter Details"
                  value={incomeDetail}
                  onChange={e => setIncomeDetail(e.target.value)}
                  className="w-full rounded-2xl border"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-medium">
                    Price per unit
                    <span title="Your expected selling price per unit.">
                      <InfoIcon
                        className="inline-block ml-1 align-middle"
                        size={16}
                      />
                    </span>
                  </label>
                  <Input
                    placeholder="Amount"
                    value={pricePerUnit}
                    onChange={e => setPricePerUnit(e.target.value)}
                    className="rounded-2xl border"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">
                    Unit of Measure
                    <span title="e.g. pc/kg/liter">
                      <InfoIcon
                        className="inline-block ml-1 align-middle"
                        size={16}
                      />
                    </span>
                  </label>
                  <Input
                    placeholder="pc/kg/liter"
                    value={unitMeasure}
                    onChange={e => setUnitMeasure(e.target.value)}
                    className="rounded-2xl border"
                  />
                </div>
              </div>
            </div>

            {/* Total Amount */}
            <div className="mb-8 space-y-2">
              <h2 className="text-lg font-semibold">Total Amount</h2>
              <label className="block mb-1 font-medium">Sales (Specific)</label>
              <Input
                placeholder="Enter Amount"
                value={totalSales}
                onChange={e => setTotalSales(e.target.value)}
                className="w-full rounded-2xl border"
              />
            </div>

            {/* Units Sold */}
            <div className="mb-8 space-y-2">
              <h2 className="text-lg font-semibold">Units Sold</h2>
              <Input
                placeholder="Enter number of units sold"
                value={unitsSold}
                onChange={e => setUnitsSold(e.target.value)}
                className="w-full rounded-2xl border"
                type="number"
                min={0}
              />
            </div>

            {/* Net Income */}
            <div className="mb-8 space-y-2">
              <h2 className="text-lg font-semibold">
                Generate Net Income Calculation
              </h2>
              <label className="block mb-1 font-medium">
                Net Income
              </label>
              <div className="flex gap-4 items-center">
                <Input
                  placeholder="Net Income"
                  value={netIncomeCalc}
                  readOnly
                  className="flex-1 rounded-2xl border"
                />
                <Button onClick={handleGenerateNetIncome} className="whitespace-nowrap">
                  Generate Net Income Calculation
                </Button>
              </div>
            </div>

            {/* Continue */}
            <Button
              className="w-full bg-[#ffc628] py-3 rounded-lg font-medium"
              onClick={handleContinue}
            >
              Continue
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BorrowerROISales;
