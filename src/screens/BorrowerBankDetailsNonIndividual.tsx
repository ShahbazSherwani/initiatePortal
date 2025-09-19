import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "../contexts/RegistrationContext";
import { Testimonials } from "../screens/LogIn/Testimonials";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ArrowLeftIcon } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";

export const BorrowerBankDetailsNonIndividual = (): JSX.Element => {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [branchName, setBranchName] = useState("");

  const { setRegistration } = useRegistration();
  const navigate = useNavigate();

  const accountTypes = [
    "Business Account",
    "Corporate Account", 
    "Institutional Account",
    "Organization Account",
    "Others"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for mandatory fields
    const requiredFields = [
      { field: bankName, name: "Bank Name" },
      { field: accountNumber, name: "Account Number" },
      { field: accountName, name: "Account Name" },
      { field: accountType, name: "Account Type" },
      { field: branchCode, name: "Branch Code" },
      { field: branchName, name: "Branch Name" },
    ];

    // Check for empty required fields
    const emptyFields = requiredFields.filter(item => !item.field || item.field.trim() === "");
    
    if (emptyFields.length > 0) {
      alert(`Please fill in the following required fields:\n${emptyFields.map(item => item.name).join('\n')}`);
      return;
    }

    // Validate account number format (basic validation)
    if (accountNumber.length < 5) {
      alert("Please enter a valid account number (minimum 5 digits).");
      return;
    }

    // Save bank details to registration data
    setRegistration(reg => ({
      ...reg,
      bankDetails: {
        bankName,
        accountNumber,
        accountName,
        accountType,
        branchCode,
        branchName,
      },
    }));
    
    // Continue to next step (occupation/business details)
    navigate("/borrowocu");
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
          <div className="mb-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#0C4B20] rounded-lg flex items-center justify-center">
              <img className="w-10 h-10" src="/debt-1.png" alt="Debt" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Entity Bank Account Details</h2>
          </div>

          {/* Bank Information */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Entity Bank Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Bank Name */}
              <div className="space-y-2">
                <Label>Bank Name*</Label>
                <Input
                  required
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  placeholder="Enter bank name"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Account Number */}
              <div className="space-y-2">
                <Label>Account Number*</Label>
                <Input
                  required
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  placeholder="Enter account number"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Account Name */}
              <div className="sm:col-span-2 space-y-2">
                <Label>Account Name* (Should match entity name)</Label>
                <Input
                  required
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  placeholder="Enter account name as registered with the bank"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Account Type */}
              <div className="space-y-2">
                <Label>Account Type*</Label>
                <Select value={accountType} onValueChange={setAccountType}>
                  <SelectTrigger className="h-14 rounded-2xl">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Branch Code */}
              <div className="space-y-2">
                <Label>Branch Code</Label>
                <Input
                  value={branchCode}
                  onChange={e => setBranchCode(e.target.value)}
                  placeholder="Enter branch code (if applicable)"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Branch Name */}
              <div className="sm:col-span-2 space-y-2">
                <Label>Branch Name/Location</Label>
                <Input
                  value={branchName}
                  onChange={e => setBranchName(e.target.value)}
                  placeholder="Enter branch name or location"
                  className="h-14 rounded-2xl"
                />
              </div>
            </div>
          </section>

          {/* Additional Information */}
          {/* <section className="space-y-4">
            <h3 className="text-xl font-semibold">Important Notes</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <ul className="text-sm space-y-2 text-gray-700">
                <li>• Bank account name must match the registered entity name</li>
                <li>• Ensure the account is authorized for business transactions</li>
                <li>• Account should be in good standing with the bank</li>
                <li>• Required documents may include bank certificate and signature cards</li>
              </ul>
            </div>
          </section> */}

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              className="w-full sm:w-auto bg-[#0C4B20] hover:bg-[#8FB200] text-black font-semibold px-8 py-3 rounded-2xl h-14"
            >
              Continue to Business Details
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
