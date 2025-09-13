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

export const BorrowerBankDetails = (): JSX.Element => {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [branchName, setBranchName] = useState("");

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  const { setRegistration } = useRegistration();
  const navigate = useNavigate();

  const accountTypes = [
    "Savings Account",
    "Current Account",
    "Business Account",
    "Others"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for mandatory fields
    const requiredFields = [
      { field: bankName, name: "bankName" },
      { field: accountNumber, name: "accountNumber" },
      { field: accountName, name: "accountName" },
      { field: accountType, name: "accountType" },
      { field: branchCode, name: "branchCode" },
      { field: branchName, name: "branchName" },
    ];

    // Check for empty required fields and create error object
    const errors: Record<string, boolean> = {};
    let hasErrors = false;

    requiredFields.forEach(item => {
      if (!item.field || item.field.trim() === "") {
        errors[item.name] = true;
        hasErrors = true;
      }
    });

    // Validate account number format (basic validation)
    if (accountNumber && accountNumber.length < 5) {
      errors["accountNumber"] = true;
      hasErrors = true;
    }

    // Update validation errors state
    setValidationErrors(errors);

    // If there are errors, don't submit
    if (hasErrors) {
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
            <h2 className="text-2xl md:text-3xl font-bold">Bank Account Details</h2>
          </div>

          {/* Bank Information */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Bank Information</h3>
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
                <Label>Account Name*</Label>
                <Input
                  required
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  placeholder="Enter account name (as registered with bank)"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Account Type */}
              <div className="space-y-2">
                <Label>Account Type*</Label>
                <Select
                  required
                  value={accountType}
                  onValueChange={setAccountType}
                >
                  <SelectTrigger className="h-14 rounded-2xl">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map(type => (
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
                  placeholder="Enter branch code (if available)"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Branch Name */}
              <div className="sm:col-span-2 space-y-2">
                <Label>Branch Name*</Label>
                <Input
                  required
                  value={branchName}
                  onChange={e => setBranchName(e.target.value)}
                  placeholder="Enter branch name/location"
                  className="h-14 rounded-2xl"
                />
              </div>
            </div>
          </section>

          {/* Information Note */}
          <section className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Important Information</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Ensure all bank details are accurate and match your official bank records</li>
                <li>• This account will be used for project funding disbursements</li>
                <li>• Bank account must be under the registered entity name</li>
                <li>• You may add additional bank accounts later from your dashboard</li>
              </ul>
            </div>
          </section>

          {/* Navigation */}
          <div className="flex gap-4 pt-4">
            <Button 
              type="button" 
              onClick={() => navigate(-1)}
              className="w-full md:w-1/3 h-14 bg-gray-300 text-gray-700 rounded-2xl font-medium hover:bg-gray-400"
            >
              Back
            </Button>
            <Button type="submit" className="w-full md:w-1/3 h-14 bg-[#0C4B20] rounded-2xl font-medium">
              Next
            </Button>
          </div>
        </form>

        {/* ─── TESTIMONIALS ─── */}
        <div className="hidden md:block md:w-1/3 flex-shrink-0">
          <Testimonials />
        </div>
      </div>
    </div>
  );
};

export default BorrowerBankDetails;
