import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "../contexts/RegistrationContext";
import { createAccount } from "../lib/api";
import { Testimonials } from "../screens/LogIn/Testimonials";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";
import { ArrowLeftIcon } from "lucide-react";

export const InvestorRegBankDetails = (): JSX.Element => {
  const [accountName, setAccountName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [iban, setIban] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { registration, setRegistration } = useRegistration();
  const navigate = useNavigate();

  const bankAccountTypes = [
    "Savings Account",
    "Current Account", 
    "Time Deposit",
    "Investment Account"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Save bank details to context first
      const updatedRegistration = {
        ...registration,
        bankDetails: {
          accountName,
          bankAccount,
          accountNumber,
          iban,
          swiftCode,
        },
      };
      
      setRegistration(updatedRegistration);

      // Prepare the complete profile data for the API
      const profileData = {
        fullName: `${updatedRegistration.details?.firstName || ''} ${updatedRegistration.details?.middleName || ''} ${updatedRegistration.details?.lastName || ''}`.trim(),
        accountType: updatedRegistration.accountType,
        personalDetails: updatedRegistration.details,
        incomeDetails: updatedRegistration.incomeDetails,
        bankDetails: updatedRegistration.bankDetails,
        // Add any other data you want to save
      };

      // Create the investor account via API
      const response = await createAccount('investor', profileData);
      
      if (response.success) {
        console.log('✅ Investor account created successfully');
        // Navigate to investor dashboard or success page
        navigate("/investor/discover");
      } else {
        console.error('❌ Failed to create investor account:', response);
        // Handle error - maybe show a toast notification
        alert('Failed to create investor account. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error creating investor account:', error);
      alert('An error occurred while creating your account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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

          {/* Bank Details */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Bank Details</h3>
            <div className="space-y-4">
              {/* Account Name */}
              <div className="space-y-2">
                <Label>Account Name*</Label>
                <Input
                  required
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Bank Account Type */}
              <div className="space-y-2">
                <Label>Bank Account*</Label>
                <Select value={bankAccount} onValueChange={setBankAccount}>
                  <SelectTrigger className="h-14 rounded-2xl">
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccountTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Account Number */}
              <div className="space-y-2">
                <Label>Account Number*</Label>
                <Input
                  required
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* IBAN */}
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input
                  value={iban}
                  onChange={e => setIban(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* SWIFT Code */}
              <div className="space-y-2">
                <Label>SWIFT Code</Label>
                <Input
                  value={swiftCode}
                  onChange={e => setSwiftCode(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
              </div>
            </div>
          </section>

          {/* Complete Button */}
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-[#ffc00f] hover:bg-[#ffc00f]/90 text-black font-semibold px-8 py-3 rounded-2xl h-14 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating Account..." : "Complete"}
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
