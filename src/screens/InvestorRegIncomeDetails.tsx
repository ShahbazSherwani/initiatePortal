import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "../contexts/RegistrationContext";
import { Testimonials } from "../screens/LogIn/Testimonials";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";
import { ArrowLeftIcon } from "lucide-react";

export const InvestorRegIncomeDetails = (): JSX.Element => {
  // Income Details
  const [grossAnnualIncome, setGrossAnnualIncome] = useState("");
  
  // Sources of Income
  const [businessChecked, setBusinessChecked] = useState(false);
  const [businessSpecify, setBusinessSpecify] = useState("");
  const [investmentsChecked, setInvestmentsChecked] = useState(false);
  const [investmentsSpecify, setInvestmentsSpecify] = useState("");
  const [employmentChecked, setEmploymentChecked] = useState(false);
  const [farmingChecked, setFarmingChecked] = useState(false);
  const [realEstateChecked, setRealEstateChecked] = useState(false);
  const [othersChecked, setOthersChecked] = useState(false);
  
  // Confirmation
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  const { setRegistration } = useRegistration();
  const navigate = useNavigate();

  const incomeRanges = [
    "Below Php 50,000",
    "Php 50,000 - Php 100,000", 
    "Php 100,001 - Php 250,000",
    "Php 250,001 - Php 500,000",
    "Php 500,001 - Php 1,000,000",
    "Above Php 1,000,000"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save income details
    setRegistration(reg => ({
      ...reg,
      incomeDetails: {
        grossAnnualIncome,
        sourcesOfIncome: {
          business: businessChecked ? businessSpecify : null,
          investments: investmentsChecked ? investmentsSpecify : null,
          employment: employmentChecked,
          farming: farmingChecked,
          realEstate: realEstateChecked,
          others: othersChecked,
        },
        confirmationAccepted: confirmationChecked,
      },
    }));
    
    // Continue to bank details
    navigate("/investor-reg-bank-details");
  };

  return (
    <div className="bg-white min-h-screen w-full relative overflow-hidden z-10">
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] px-4 md:px-20 py-10">
        {/* ─── FORM ─── */}
        <form
          onSubmit={handleSubmit}
          className="md:w-2/4 overflow-y-auto pr-4 space-y-8"
          noValidate
        >
          {/* Back Button */}
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="mr-2"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </Button>
          </div>

          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#ffc00f] rounded-lg flex items-center justify-center">
              <img className="w-10 h-10" src="/investor-1.png" alt="Investor" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Invest/Lender</h2>
          </div>

          {/* Income Details */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Income Details</h3>
            <div className="space-y-4">
              {/* Gross Annual Income */}
              <div className="space-y-2">
                <Label>Gross Annual Income*</Label>
                <Select value={grossAnnualIncome} onValueChange={setGrossAnnualIncome}>
                  <SelectTrigger className="h-14 rounded-2xl">
                    <SelectValue placeholder="Select Range" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeRanges.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Sources of Income */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Sources of Income or Nature of Business
            </h3>
            <div className="space-y-4">
              {/* Business */}
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={businessChecked}
                  onCheckedChange={(checked) => setBusinessChecked(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <Label className="font-medium">Business</Label>
                  {businessChecked && (
                    <Input
                      value={businessSpecify}
                      onChange={e => setBusinessSpecify(e.target.value)}
                      placeholder="Specify"
                      className="h-12 rounded-2xl"
                    />
                  )}
                </div>
              </div>

              {/* Investments */}
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={investmentsChecked}
                  onCheckedChange={(checked) => setInvestmentsChecked(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <Label className="font-medium">Investments</Label>
                  {investmentsChecked && (
                    <Input
                      value={investmentsSpecify}
                      onChange={e => setInvestmentsSpecify(e.target.value)}
                      placeholder="Specify"
                      className="h-12 rounded-2xl"
                    />
                  )}
                </div>
              </div>

              {/* Employment */}
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={employmentChecked}
                  onCheckedChange={(checked) => setEmploymentChecked(checked as boolean)}
                />
                <Label className="font-medium">Employment</Label>
              </div>

              {/* Farming */}
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={farmingChecked}
                  onCheckedChange={(checked) => setFarmingChecked(checked as boolean)}
                />
                <Label className="font-medium">Farming</Label>
              </div>

              {/* Real Estate */}
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={realEstateChecked}
                  onCheckedChange={(checked) => setRealEstateChecked(checked as boolean)}
                />
                <Label className="font-medium">Real Estate</Label>
              </div>

              {/* Others */}
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={othersChecked}
                  onCheckedChange={(checked) => setOthersChecked(checked as boolean)}
                />
                <Label className="font-medium">Others</Label>
              </div>
            </div>
          </section>

          {/* Confirmation */}
          <section className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={confirmationChecked}
                onCheckedChange={(checked) => setConfirmationChecked(checked as boolean)}
                className="mt-1"
                required
              />
              <Label className="text-sm leading-relaxed">
                I confirm that the details above are true and Investie will not be held 
                liable for false information, either intentional or not.
              </Label>
            </div>
          </section>

          {/* Next Button */}
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={!confirmationChecked}
              className="w-full sm:w-auto bg-[#ffc00f] hover:bg-[#ffc00f]/90 text-black font-semibold px-8 py-3 rounded-2xl h-14 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </Button>
          </div>
        </form>

        {/* ─── TESTIMONIALS ─── */}
        <div className="md:w-2/4 md:pl-8 mt-8 md:mt-0">
          <Testimonials />
        </div>
      </div>
    </div>
  );
};
