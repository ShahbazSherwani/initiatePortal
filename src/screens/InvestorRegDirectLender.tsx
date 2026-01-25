import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRegistration } from "../contexts/RegistrationContext";
import { useAuth } from "../contexts/AuthContext";
import { useAccount } from "../contexts/AccountContext";
import { authFetch } from "../lib/api";
import { API_BASE_URL } from '../config/environment';
import { Country, State, City } from "country-state-city";
import { Testimonials } from "../screens/LogIn/Testimonials";
import { Button } from "../components/ui/button";
import { ValidatedInput, ValidatedSelect, ValidatedFileUpload } from "../components/ValidatedFormFields";
import {
  SelectItem,
} from "../components/ui/select";
import { ArrowLeftIcon } from "lucide-react";

export const InvestorRegDirectLender = (): JSX.Element => {
  const location = useLocation();
  const initialAccountType = location.state?.accountType || "direct-lender";
  const [accountType] = useState(initialAccountType);

  // Lender Type Selection
  const [lenderType, setLenderType] = useState("direct-lender");

  // Personal Information (for individual direct lenders)
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffixName, setSuffixName] = useState("");

  // Identification
  const [nationalId, setNationalId] = useState("");
  const [passport, setPassport] = useState("");
  const [tin, setTin] = useState("");

  // File uploads for ID
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);

  // Direct Lender Specific Fields
  const [requirementsCriteria, setRequirementsCriteria] = useState("");
  const [requirementsCriteriaFile, setRequirementsCriteriaFile] = useState<File | null>(null);

  const [docReq, setDocReq] = useState("");
  const [docReqFile, setDocReqFile] = useState<File | null>(null);

  const [maxFacility, setMaxFacility] = useState("");
  const [interestRate, setInterestRate] = useState("");

  // Address
  const [street, setStreet] = useState("");
  const [barangay, setBarangay] = useState("");

  // Location selects
  const [countryIso, setCountryIso] = useState("");
  const [stateIso, setStateIso] = useState("");
  const [cityName, setCityName] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Validation state
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    let hasErrors = false;

    // Required fields validation
    const requiredFields = [
      { value: firstName, name: "firstName" },
      { value: lastName, name: "lastName" },
      { value: nationalId, name: "nationalId" },
      { value: tin, name: "tin" },
      { value: requirementsCriteria, name: "requirementsCriteria" },
      { value: docReq, name: "docReq" },
      { value: maxFacility, name: "maxFacility" },
      { value: interestRate, name: "interestRate" },
      { value: street, name: "street" },
      { value: barangay, name: "barangay" },
      { value: countryIso, name: "countryIso" },
      { value: stateIso, name: "stateIso" },
      { value: cityName, name: "cityName" },
      { value: postalCode, name: "postalCode" },
    ];

    requiredFields.forEach(({ value, name }) => {
      if (!value || value.trim() === "") {
        newErrors[name] = true;
        hasErrors = true;
      }
    });

    // File uploads validation
    if (!nationalIdFile) {
      newErrors["nationalIdFile"] = true;
      hasErrors = true;
    }
    if (!requirementsCriteriaFile) {
      newErrors["requirementsCriteriaFile"] = true;
      hasErrors = true;
    }
    if (!docReqFile) {
      newErrors["docReqFile"] = true;
      hasErrors = true;
    }

    setErrors(newErrors);
    return !hasErrors;
  };

  const countries = Country.getAllCountries();
  const states = countryIso ? State.getStatesOfCountry(countryIso) : [];
  const cities = stateIso ? City.getCitiesOfState(countryIso, stateIso) : [];

  const { registration, setRegistration } = useRegistration();
  const { refreshAccounts, setAccountType: setUserAccountType } = useAccount();
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLenderTypeSelect = (type: string) => {
    setLenderType(type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Helper function to convert File to base64
      const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
      };
      
      // Convert document files to base64
      let nationalIdFileBase64 = null;
      let passportFileBase64 = null;
      let requirementsCriteriaFileBase64 = null;
      let docReqFileBase64 = null;
      
      if (nationalIdFile) {
        try {
          nationalIdFileBase64 = await fileToBase64(nationalIdFile);
        } catch (error) {
          console.error('Error converting National ID file:', error);
        }
      }
      
      if (passportFile) {
        try {
          passportFileBase64 = await fileToBase64(passportFile);
        } catch (error) {
          console.error('Error converting Passport file:', error);
        }
      }
      
      if (requirementsCriteriaFile) {
        try {
          requirementsCriteriaFileBase64 = await fileToBase64(requirementsCriteriaFile);
        } catch (error) {
          console.error('Error converting requirements file:', error);
        }
      }
      
      if (docReqFile) {
        try {
          docReqFileBase64 = await fileToBase64(docReqFile);
        } catch (error) {
          console.error('Error converting doc req file:', error);
        }
      }
      
      // Save registration data to context
      const updatedRegistration = {
        ...registration,
        accountType,
        lenderType,
        details: {
          firstName,
          middleName,
          lastName,
          suffixName,
          nationalId,
          passport,
          tin,
          street,
          barangay,
          countryIso,
          stateIso,
          cityName,
          postalCode,
        },
        lendingCriteria: {
          requirementsCriteria,
          docReq,
          maxFacility,
          interestRate,
        },
        files: {
          nationalIdFile,
          passportFile,
          requirementsCriteriaFile,
          docReqFile,
        },
      };
      
      setRegistration(updatedRegistration);
      
      // Prepare KYC data for direct lender
      const kycData = {
        isIndividualAccount: true, // Direct lenders are individual accounts
        isDirectLender: true,
        
        // Personal details
        firstName,
        middleName,
        lastName,
        suffixName,
        
        // Address information
        street,
        barangay,
        city: cityName,
        state: stateIso,
        country: countryIso,
        postalCode,
        
        // Identity verification
        nationalId,
        passport,
        tin,
        
        // Document files (base64 encoded)
        nationalIdFile: nationalIdFileBase64,
        passportFile: passportFileBase64,
        
        // Lending criteria
        requirementsCriteria,
        docReq,
        maxFacility,
        interestRate,
        requirementsCriteriaFile: requirementsCriteriaFileBase64,
        docReqFile: docReqFileBase64,
        
        // Bank details - not required in registration flow anymore
        account_name: null,
        bank_name: null,
        account_type: null,
        account_number: null,
        iban: null,
        swift_code: null,
      };

      console.log('📝 Completing direct lender registration without bank details');

      // Complete the KYC process
      await authFetch(`${API_BASE_URL}/profile/complete-kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountType: 'investor',
          kycData: kycData
        })
      });

      console.log('✅ Direct lender KYC completed successfully');
      
      // Set current account type to investor
      setUserAccountType('investor');
      
      // Refresh both account data and user profile
      await refreshAccounts();
      await refreshProfile();
      
      // Navigate to investor dashboard
      navigate("/investor/discover");
    } catch (error) {
      console.error('❌ Error completing direct lender registration:', error);
      alert('An error occurred while completing your registration. Please try again.');
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
            <div className="w-12 h-12 bg-[#0C4B20] rounded-lg flex items-center justify-center">
              <img className="w-10 h-10" src="/leader-1.png" alt="Direct Lender" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Direct Lender</h2>
          </div>

          {/* Option Selection */}
          <div>
            <p className="font-medium text-lg mb-4">Please select an option</p>
            <div className="flex flex-col sm:flex-row gap-4">
              {[
                { value: "investor-lender", label: "Investor/Lender" },
                { value: "direct-lender", label: "Direct Lender" }
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-all
                    ${lenderType === option.value
                      ? "bg-[#0C4B20] border-[#0C4B20] text-black font-semibold"
                      : "bg-white border-gray-300 hover:border-[#0C4B20]"}
                  `}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLenderTypeSelect(option.value);
                  }}
                >
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    lenderType === option.value 
                      ? 'bg-black border-black' 
                      : 'border-gray-300'
                  }`}>
                    {lenderType === option.value && (
                      <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5"></div>
                    )}
                  </div>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Personal Profile */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Personal Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              <ValidatedInput
                label="First Name"
                required
                hasError={errors.firstName}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter here"
              />

              {/* Middle Name */}
              <ValidatedInput
                label="Middle Name"
                hasError={false}
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="Enter here"
              />

              {/* Last Name */}
              <ValidatedInput
                label="Last Name"
                required
                hasError={errors.lastName}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter here"
              />

              {/* Suffix Name */}
              <ValidatedInput
                label="Suffix Name"
                hasError={false}
                value={suffixName}
                onChange={(e) => setSuffixName(e.target.value)}
                placeholder="Jr, Sr, III"
              />
            </div>
          </section>

          {/* Personal Identification */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Personal Identification (Individual)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* National ID */}
              <ValidatedInput
                label="National/Government ID No."
                required
                hasError={errors.nationalId}
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="Enter here"
              />

              {/* Upload ID Copy */}
              <ValidatedFileUpload
                label="Upload ID Copy"
                required
                hasError={errors.nationalIdFile}
                file={nationalIdFile}
                onFileChange={setNationalIdFile}
                buttonText="Upload ID"
              />

              {/* Passport */}
              <div className="space-y-2">
                <ValidatedInput
                  label="Passport No."
                  hasError={false}
                  value={passport}
                  onChange={(e) => setPassport(e.target.value)}
                  placeholder="Enter here"
                />
                <p className="text-sm text-gray-600">(required for funding of &gt;Php100,000)</p>
              </div>

              {/* Upload Passport Copy */}
              <ValidatedFileUpload
                label="Upload Passport Copy"
                hasError={false}
                file={passportFile}
                onFileChange={setPassportFile}
                buttonText="Upload Passport"
              />

              {/* TIN */}
              <div className="sm:col-span-2">
                <ValidatedInput
                  label="TIN (Tax Identification Number)"
                  required
                  hasError={errors.tin}
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  placeholder="Enter here"
                />
                <p className="text-sm text-gray-600">(required for funding of &gt;Php100,000)</p>
              </div>
            </div>
          </section>

          {/* Direct Lender Criteria */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Direct Lender Criteria</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Requirements Criteria */}
              <ValidatedInput
                label="Requirements (Criteria)"
                required
                hasError={errors.requirementsCriteria}
                value={requirementsCriteria}
                onChange={(e) => setRequirementsCriteria(e.target.value)}
                placeholder="Enter here"
              />

              {/* Add Criteria Upload */}
              <ValidatedFileUpload
                label="Add Criteria"
                required
                hasError={errors.requirementsCriteriaFile}
                file={requirementsCriteriaFile}
                onFileChange={setRequirementsCriteriaFile}
                buttonText="Upload Criteria"
                accept="image/*,.pdf,.doc,.docx"
              />

              {/* Requirements Doc Req */}
              <ValidatedInput
                label="Document Requirements"
                required
                hasError={errors.docReq}
                value={docReq}
                onChange={(e) => setDocReq(e.target.value)}
                placeholder="Enter here"
              />

              {/* Upload Doc Req */}
              <ValidatedFileUpload
                label="Upload Doc Requirements"
                required
                hasError={errors.docReqFile}
                file={docReqFile}
                onFileChange={setDocReqFile}
                buttonText="Upload Documents"
                accept="image/*,.pdf,.doc,.docx"
              />

              {/* Maximum Facility per Lending */}
              <ValidatedInput
                label="Maximum Facility per Lending"
                required
                hasError={errors.maxFacility}
                value={maxFacility}
                onChange={(e) => setMaxFacility(e.target.value)}
                placeholder="Enter here"
              />

              {/* Interest % per month */}
              <ValidatedInput
                label="Interest % per month"
                required
                hasError={errors.interestRate}
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="Enter here"
              />
            </div>
          </section>

          {/* Home Address */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Home Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Street */}
              <div className="sm:col-span-2">
                <ValidatedInput
                  label="Street"
                  required
                  hasError={errors.street}
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Enter here"
                />
              </div>

              {/* Barangay */}
              <ValidatedInput
                label="Barangay"
                required
                hasError={errors.barangay}
                value={barangay}
                onChange={(e) => setBarangay(e.target.value)}
                placeholder="Enter here"
              />

              {/* Country */}
              <ValidatedSelect
                label="Country"
                required
                hasError={errors.countryIso}
                value={countryIso}
                onValueChange={(value) => {
                  setCountryIso(value);
                  setStateIso("");
                  setCityName("");
                }}
                placeholder="Select country"
              >
                {countries.map((country) => (
                  <SelectItem key={country.isoCode} value={country.isoCode}>
                    {country.name}
                  </SelectItem>
                ))}
              </ValidatedSelect>

              {/* State */}
              <ValidatedSelect
                label="State/Province"
                required
                hasError={errors.stateIso}
                value={stateIso}
                onValueChange={(value) => {
                  setStateIso(value);
                  setCityName("");
                }}
                placeholder="Select state"
              >
                {states.map((state) => (
                  <SelectItem key={state.isoCode} value={state.isoCode}>
                    {state.name}
                  </SelectItem>
                ))}
              </ValidatedSelect>

              {/* City */}
              <ValidatedSelect
                label="City"
                required
                hasError={errors.cityName}
                value={cityName}
                onValueChange={setCityName}
                placeholder="Select city"
              >
                {cities.map((city) => (
                  <SelectItem key={city.name} value={city.name}>
                    {city.name}
                  </SelectItem>
                ))}
              </ValidatedSelect>

              {/* Postal Code */}
              <ValidatedInput
                label="Postal Code"
                required
                hasError={errors.postalCode}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Enter here"
              />
            </div>
          </section>

          {/* Complete Button */}
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-[#0C4B20] hover:bg-[#8FB200] text-white font-semibold px-8 py-3 rounded-2xl h-14 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating Account..." : "Complete Registration"}
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
