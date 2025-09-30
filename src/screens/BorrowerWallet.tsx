// src/screens/LogLogIn/RegisterStep.tsx

import React, { useState } from "react";
import { Navbar } from "../components/Navigation/navbar";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { useNavigate } from "react-router-dom";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Testimonials } from "../screens/LogIn/Testimonials";
import { useRegistration } from "../contexts/RegistrationContext";
import { useAuth } from '../contexts/AuthContext';
import { useAccount } from '../contexts/AccountContext';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';

export const BorrowerWallet = (): JSX.Element => {
  const { profile, setProfile, refreshProfile } = useAuth();
  const { registration, setRegistration } = useRegistration();
  const { createAccount, refreshAccounts, setAccountType } = useAccount();
  const navigate = useNavigate();
  const [showThankYou, setShowThankYou] = useState(false);

  // --- 1) Define all dynamic form data arrays ---
  const bankFields = [
    { id: "accountName", label: "Account Name",   type: "input",  placeholder: "Enter here" },
    { id: "bankName", label: "Bank Name",   type: "input", placeholder: "Enter bank name" },
    { id: "accountType", label: "Account Type", type: "select", placeholder: "Select account type" },
    { id: "accountNumber", label: "Account Number", type: "input",  placeholder: "Enter here" },
    { id: "iban",        label: "IBAN",           type: "input",  placeholder: "Enter here" },
    { id: "swiftCode",   label: "SWIFT Code",     type: "input",  placeholder: "Enter here" },
  ];

  const cryptoFields = [
    { id: "selectWallet",  label: "Select iFunds",  type: "select", placeholder: "Please select" },
    { id: "walletAddress", label: "iFunds Address", type: "input",  placeholder: "Enter here" },
  ];

  const paymentOptions = [
    { id: "gcash",   name: "Gcash",   image: "/image-3.png" },
    { id: "paymaya", name: "Pay Maya", image: "/image-4.png" },
    { id: "paypal",  name: "Paypal",  image: "/image-5.png" },
  ];

  const confirmations = [
    {
      id: "liability",
      label:
        "I confirm that Investie will not be held liable for any loss due to erroneous account details.",
    },
    { id: "terms", label: "I read and agree to Terms & Conditions." },
    {
      id: "risk",
      label: "I read and agree to Risk Disclosure and Limitations.",
    },
  ];

  // Add state for bank details
  const [bankDetails, setBankDetails] = useState<{ [key: string]: string }>({
    accountName: "",
    bankName: "",
    accountType: "",
    accountNumber: "",
    iban: "",
    swiftCode: "",
  });

  // Update state on input change
  // Example for Account Name:
  // <Input
  //   id="accountName"
  //   value={bankDetails.accountName}
  //   onChange={e => setBankDetails({ ...bankDetails, accountName: e.target.value })}
  //   ...
  // />

  const handleNext = async () => {
    // Validate bank details
    if (!bankDetails.accountName || !bankDetails.bankName || !bankDetails.accountType || !bankDetails.accountNumber) {
      alert("Please fill in all required bank details: Account Name, Bank Name, Account Type, and Account Number");
      return;
    }
    
    try {
      console.log('🏗️ Starting borrower account creation process...');
      
      // Save bank account data
      setRegistration(reg => ({
        ...reg,
        bankAccounts: [
          ...(reg.bankAccounts || []),
          {
            accountName: bankDetails.accountName,
            bankAccount: bankDetails.bankName, // bankAccount field holds bank name for compatibility
            accountType: bankDetails.accountType,
            accountNumber: bankDetails.accountNumber,
            iban: bankDetails.iban,
            swiftCode: bankDetails.swiftCode,
            preferred: true,
          }
        ]
      }));
      
      // Create the borrower account with registration data
      console.log('📝 Creating borrower account with registration data:', registration);
      await createAccount('borrower', {
        fullName: profile?.name || 'User',
        occupation: registration.details?.occupation || 'Other',
        businessType: registration.accountType || 'individual',
        location: registration.details?.cityName || registration.details?.location,
        phoneNumber: registration.details?.phoneNumber,
        dateOfBirth: registration.details?.dateOfBirth,
        experience: registration.details?.experience
      });
      
      console.log('✅ Borrower account created successfully');
      
      // Mark registration as complete in profile
      setProfile((prev: any) => ({
        ...prev,
        hasCompletedRegistration: true
      }));
      
      // Prepare registration data for complete-kyc endpoint
      const isIndividual = registration.accountType === 'individual';
      const kycData = {
        isIndividualAccount: isIndividual,
        
        // ✅ PERSONAL INFORMATION - Critical missing fields added!
        firstName: registration.details?.firstName || profile?.name?.split(' ')[0] || null,
        lastName: registration.details?.lastName || profile?.name?.split(' ').slice(1).join(' ') || null,
        middleName: registration.details?.middleName || null,
        dateOfBirth: registration.details?.dateOfBirth || null,
        phoneNumber: registration.details?.phoneNumber || null,
        mobileNumber: registration.details?.mobileNumber || registration.details?.phoneNumber || null,
        countryCode: registration.details?.countryCode || null,
        emailAddress: profile?.email || registration.details?.email || null,
        
        // ✅ ADDRESS INFORMATION - Critical missing fields added!
        street: registration.details?.street || registration.details?.streetAddress || null,
        barangay: registration.details?.barangay || null,
        city: registration.details?.city || registration.details?.cityName || null,
        state: registration.details?.state || registration.details?.stateIso || null,
        country: registration.details?.country || registration.details?.countryIso || null,
        postalCode: registration.details?.postalCode || null,
        presentAddress: registration.details?.presentAddress || [
          registration.details?.street, 
          registration.details?.barangay, 
          registration.details?.cityName, 
          registration.details?.stateIso
        ].filter(Boolean).join(', ') || null,
        permanentAddress: registration.details?.permanentAddress || null,
        
        // ✅ IDENTIFICATION DOCUMENTS - Critical missing fields added!
        nationalId: registration.details?.nationalId || null,
        passport: registration.details?.passport || registration.details?.passportNumber || null,
        tin: registration.details?.tin || registration.details?.tinNumber || null,
        
        // ✅ EMPLOYMENT INFORMATION - Critical missing fields added!
        occupation: registration.details?.occupation || null,
        employerName: registration.details?.employerName || registration.details?.companyName || null,
        employerAddress: registration.details?.employerAddress || null,
        employmentStatus: registration.details?.employmentStatus || null,
        monthlyIncome: registration.details?.monthlyIncome || registration.details?.income || null,
        grossAnnualIncome: registration.details?.grossAnnualIncome || registration.details?.annualIncome || null,
        sourceOfIncome: registration.details?.sourceOfIncome || registration.details?.incomeSource || null,
        
        // Individual account fields
        placeOfBirth: isIndividual ? registration.details?.placeOfBirth || null : null,
        gender: isIndividual ? registration.details?.gender || null : null,
        civilStatus: isIndividual ? registration.details?.civilStatus || null : null,
        nationality: isIndividual ? registration.details?.nationality || null : null,
        motherMaidenName: isIndividual ? registration.details?.motherMaidenName || null : null,
        contactEmail: profile?.email || registration.details?.contactPersonEmail || registration.details?.contactEmail || null,
        secondaryIdType: registration.details?.passport ? 'passport' : (registration.details?.tin ? 'tin' : null),
        secondaryIdNumber: registration.details?.passport || registration.details?.tin || null,
        emergencyContactName: registration.details?.emergencyContactName || null,
        emergencyContactRelationship: registration.details?.emergencyContactRelationship || null,
        emergencyContactPhone: registration.details?.emergencyContactPhone || null,
        emergencyContactEmail: registration.details?.emergencyContactEmail || null,
        emergencyContactAddress: registration.details?.emergencyContactAddress || null,
        // Business/Corporate account fields
        businessRegistrationType: !isIndividual ? registration.details?.businessRegistrationType || registration.details?.entityType : null,
        businessRegistrationNumber: !isIndividual ? registration.details?.registrationNumber : null,
        businessRegistrationDate: !isIndividual ? registration.details?.businessRegistrationDate : null,
        corporateTin: registration.details?.tin || registration.details?.corporateTin || null,
        natureOfBusiness: registration.details?.occupation || registration.details?.natureOfBusiness || null,
        principalOfficeStreet: registration.details?.principalOfficeStreet || registration.details?.street || null,
        principalOfficeBarangay: registration.details?.principalOfficeBarangay || registration.details?.barangay || null,
        principalOfficeMunicipality: registration.details?.principalOfficeCity || registration.details?.cityName || null,
        principalOfficeProvince: registration.details?.principalOfficeState || registration.details?.stateIso || null,
        principalOfficeCountry: registration.details?.principalOfficeCountry || registration.details?.countryIso || null,
        principalOfficePostalCode: registration.details?.principalOfficePostalCode || registration.details?.postalCode || null,
        // GIS fields (for larger corporations)
        gisTotalAssets: registration.details?.gisTotalAssets || null,
        gisTotalLiabilities: registration.details?.gisTotalLiabilities || null,
        gisPaidUpCapital: registration.details?.gisPaidUpCapital || null,
        gisNumberOfStockholders: registration.details?.gisNumberOfStockholders || null,
        gisNumberOfEmployees: registration.details?.gisNumberOfEmployees || null,
        // PEP status
        isPoliticallyExposedPerson: registration.details?.pepStatus === 'yes',
        pepDetails: registration.details?.pepStatus === 'yes' ? 'PEP status confirmed during registration' : null,
        // Authorized signatory (for corporate accounts)
        authorizedSignatoryName: !isIndividual ? registration.details?.authorizedSignatoryName || registration.details?.contactPersonName : null,
        authorizedSignatoryPosition: !isIndividual ? registration.details?.authorizedSignatoryPosition || registration.details?.contactPersonPosition : null,
        authorizedSignatoryIdType: !isIndividual ? 'corporate_id' : null,
        authorizedSignatoryIdNumber: !isIndividual ? registration.details?.authorizedSignatoryIdNumber : null,
        
        // Bank account details
        account_name: bankDetails.accountName,
        bank_name: bankDetails.bankName,
        account_type: bankDetails.accountType,
        account_number: bankDetails.accountNumber,
        iban: bankDetails.iban,
        swift_code: bankDetails.swiftCode
      };
      
      // Sanitize KYC payload: convert empty strings to null and remove undefined properties
      const sanitizedKyc: any = {};
      Object.entries(kycData).forEach(([key, value]) => {
        if (value === undefined) return; // skip undefined
        if (typeof value === 'string') {
          const trimmed = value.trim();
          sanitizedKyc[key] = trimmed === '' ? null : trimmed;
        } else {
          sanitizedKyc[key] = value;
        }
      });

      console.log('📝 Sending sanitized complete registration data to database:', sanitizedKyc);

      // Send registration data to complete-kyc endpoint
      await authFetch(`${API_BASE_URL}/profile/complete-kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountType: 'borrower',
          kycData: sanitizedKyc
        })
      });
      
      console.log('✅ Registration data saved to database');
      
      // IMPORTANT: Set current account type to borrower immediately after successful registration
      // This prevents sidebar/navigation issues during the transition
      setAccountType('borrower');
      
      // Refresh both account data and user profile
      await refreshAccounts();
      await refreshProfile(); // This will update the user role in AuthContext
      
      console.log('✅ Accounts refreshed');
      
      // Show thank you message
      setShowThankYou(true);
      
      // Redirect after delay
      setTimeout(() => {
        const role = profile?.role || 'borrower';
        if (role === 'investor') {
          navigate("/investor/discover");
        } else if (role === 'borrower') {
          navigate("/borrow");
        } 
        // else if (role === 'guarantor') {
        //   navigate("/guarantee");
        // } 
        else {
          navigate("/borrow");
        }
      }, 2000);
    } catch (error) {
      console.error("❌ Error during borrower registration:", error);
      alert("There was an error creating your account. Please try again.");
    }
  };

  return (
    <div className="bg-white min-h-screen w-full relative overflow-hidden z-10">
      {/* Thank You Modal */}
      {showThankYou && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl p-10 flex flex-col items-center shadow-xl">
            <div className="bg-[#0C4B20] rounded-full p-4 mb-4">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-2">Thank You!</h2>
            <p className="text-center text-lg text-gray-700">
              Your request has been submitted! We will review and get back to you.
            </p>
          </div>
        </div>
      )}

      {/* ─── Site‐wide Navbar ─── */}
      {/* <Navbar activePage="register" showAuthButtons={true} /> */}

      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] px-4 md:px-20 py-10">
        {/* ─── LEFT COLUMN: scrollable form ─── */}
        <div className="w-full md:w-2/4 overflow-y-auto p-4 md:p-8 md:pr-40 h-full">
          {/* Back-button */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              className="p-2 rounded-full hover:bg-gray-100"
              onClick={() => navigate(-1)}
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </Button>
          </div>

          {/* “Issue/Borrow” Title with Icon */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-[#0C4B20] rounded-lg flex items-center justify-center">
              <img className="w-6 h-6" src="/debt-1.png" alt="Debt" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Issue/Borrow</h1>
          </div>

          {/* ── Bank Details Section ── */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-6">Bank Details</h2>
            {bankFields.map((field) => (
              <div key={field.id} className="mb-6">
                <label htmlFor={field.id} className="block text-base font-medium mb-2">
                  {field.label}
                </label>
                {field.type === "input" ? (
                  <Input
                    id={field.id}
                    className="w-full h-14 rounded-2xl border border-gray-300 px-4"
                    placeholder={field.placeholder}
                    value={bankDetails[field.id] || ""}
                    onChange={e => setBankDetails({ ...bankDetails, [field.id]: e.target.value })}
                  />
                ) : (
                  <Select 
                    value={bankDetails[field.id] || ""}
                    onValueChange={(value) => setBankDetails({ ...bankDetails, [field.id]: value })}
                  >
                    <SelectTrigger
                      id={field.id}
                      className="w-full h-14 rounded-2xl border border-gray-300 px-4"
                    >
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.id === "accountType" ? (
                        <>
                          <SelectItem value="Savings Account">Savings Account</SelectItem>
                          <SelectItem value="Current Account">Current Account</SelectItem>
                          <SelectItem value="Time Deposit">Time Deposit</SelectItem>
                          <SelectItem value="Investment Account">Investment Account</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="option1">Option 1</SelectItem>
                          <SelectItem value="option2">Option 2</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </section>

          {/* ── Crypto-Wallet Section ── */}
          {/* <section className="mb-12">
            <h2 className="text-xl font-semibold mb-6">Crypto-iFunds Address</h2>
            {cryptoFields.map((field) => (
              <div key={field.id} className="mb-6">
                <label htmlFor={field.id} className="block text-base font-medium mb-2">
                  {field.label}
                </label>
                {field.type === "input" ? (
                  <Input
                    id={field.id}
                    className="w-full h-14 rounded-2xl border border-gray-300 px-4"
                    placeholder={field.placeholder}
                  />
                ) : (
                  <Select>
                    <SelectTrigger
                      id={field.id}
                      className="w-full h-14 rounded-2xl border border-gray-300 px-4"
                    >
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="opt1">Option 1</SelectItem>
                      <SelectItem value="opt2">Option 2</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </section> */}

          {/* ── Other Payment Options ── */}
          {/* <section className="mb-12">
            <h2 className="text-xl font-semibold mb-6">Other Payment Options</h2>
            <div className="flex flex-wrap gap-4">
              {paymentOptions.map((option) => (
                <div key={option.id} className="w-[120px] text-center">
                  <div className="w-full h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                    <img
                      className="h-8 object-contain"
                      src={option.image}
                      alt={option.name}
                    />
                  </div>
                  <p className="text-base font-medium">{option.name}</p>
                </div>
              ))}
            </div>
          </section> */}

          {/* ── Confirmations ── */}
          <section className="mb-12">
            {confirmations.map((confirmation) => (
              <div key={confirmation.id} className="flex items-start mb-4">
                <Checkbox id={confirmation.id} className="mt-1" />
                <label htmlFor={confirmation.id} className="ml-2 text-base">
                  {confirmation.label}
                </label>
              </div>
            ))}
          </section>

          {/* ── Next Button ── */}
          <div className="mb-12">
            <Button
              className="w-full md:w-1/2 h-14 bg-[#0C4B20] hover:bg-[#8FB200] rounded-2xl font-medium text-base"
              onClick={handleNext}
            >
              Next
            </Button>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: fixed <Testimonials /> ─── */}
        <div className="hidden md:block md:w-1/3 flex-shrink-0">
          <Testimonials />
        </div>
      </div>
    </div>
  );
};

export default BorrowerWallet;
