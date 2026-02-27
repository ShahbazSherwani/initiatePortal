// src/screens/InvestorReg.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Combobox, type ComboboxOption } from "../components/ui/combobox";
import { useAccount } from "../contexts/AccountContext";
import { TrendingUpIcon, ArrowLeftIcon } from "lucide-react";

export const InvestorReg: React.FC = () => {
  const navigate = useNavigate();
  const { createAccount } = useAccount();
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState("individual"); // Default to individual
  
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    location: "",
    phoneNumber: "",
    experience: "",
    investmentPreference: "",
    riskTolerance: "",
    portfolioValue: "",
  });

  // Additional KYC fields for Individual accounts
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [civilStatus, setCivilStatus] = useState("");
  const [nationality, setNationality] = useState("");
  const [motherMaidenName, setMotherMaidenName] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [employerAddress, setEmployerAddress] = useState("");
  const [sourceOfIncome, setSourceOfIncome] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyContactAddress, setEmergencyContactAddress] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [passport, setPassport] = useState("");
  const [tin, setTin] = useState("");
  const [pepStatus, setPepStatus] = useState<boolean>(false);

  // Additional KYC fields for Non-Individual accounts
  const [businessRegistrationType, setBusinessRegistrationType] = useState("");
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState("");
  const [businessRegistrationDate, setBusinessRegistrationDate] = useState("");
  const [corporateTin, setCorporateTin] = useState("");
  const [authorizedSignatoryName, setAuthorizedSignatoryName] = useState("");
  const [authorizedSignatoryPosition, setAuthorizedSignatoryPosition] = useState("");
  const [authorizedSignatoryIdNumber, setAuthorizedSignatoryIdNumber] = useState("");
  const [natureOfBusiness, setNatureOfBusiness] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");

  // Combobox options
  const genderOptions: ComboboxOption[] = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "prefer-not-to-say", label: "Prefer not to say" }
  ];

  const civilStatusOptions: ComboboxOption[] = [
    { value: "single", label: "Single" },
    { value: "married", label: "Married" },
    { value: "divorced", label: "Divorced" },
    { value: "widowed", label: "Widowed" },
    { value: "separated", label: "Separated" }
  ];

  const sourceOfIncomeOptions: ComboboxOption[] = [
    { value: "employment", label: "Employment/Salary" },
    { value: "business", label: "Business Income" },
    { value: "investments", label: "Investment Income" },
    { value: "pension", label: "Pension/Retirement" },
    { value: "remittances", label: "Remittances" },
    { value: "other", label: "Other" }
  ];

  const emergencyContactRelationshipOptions: ComboboxOption[] = [
    { value: "spouse", label: "Spouse" },
    { value: "parent", label: "Parent" },
    { value: "child", label: "Child" },
    { value: "sibling", label: "Sibling" },
    { value: "relative", label: "Relative" },
    { value: "friend", label: "Friend" },
    { value: "colleague", label: "Colleague" },
    { value: "other", label: "Other" }
  ];

  const businessRegistrationTypeOptions: ComboboxOption[] = [
    { value: "SEC", label: "SEC (Securities and Exchange Commission)" },
    { value: "CDA", label: "CDA (Cooperative Development Authority)" },
    { value: "DTI", label: "DTI (Department of Trade and Industry)" }
  ];

  const experienceOptions: ComboboxOption[] = [
    { value: "beginner", label: "Beginner (0-2 years)" },
    { value: "intermediate", label: "Intermediate (3-5 years)" },
    { value: "advanced", label: "Advanced (5+ years)" }
  ];

  const investmentPreferenceOptions: ComboboxOption[] = [
    { value: "lending", label: "Debt Projects" },
    { value: "equity", label: "Equity Investments" },
    { value: "both", label: "Both Debt & Equity" }
  ];

  const riskToleranceOptions: ComboboxOption[] = [
    { value: "conservative", label: "Conservative" },
    { value: "moderate", label: "Moderate" },
    { value: "aggressive", label: "Aggressive" }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accountData = {
        ...formData,
        portfolioValue: formData.portfolioValue ? parseFloat(formData.portfolioValue) : 0,
        accountType,
        // KYC fields
        nationalId,
        passport,
        tin,
        placeOfBirth,
        gender,
        civilStatus,
        nationality,
        motherMaidenName,
        employerName,
        occupation,
        employerAddress,
        sourceOfIncome,
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
        emergencyContactName,
        emergencyContactRelationship,
        emergencyContactPhone,
        emergencyContactAddress,
        pepStatus,
        // Non-Individual specific fields
        businessRegistrationType,
        businessRegistrationNumber,
        businessRegistrationDate,
        corporateTin,
        authorizedSignatoryName,
        authorizedSignatoryPosition,
        authorizedSignatoryIdNumber,
        natureOfBusiness,
        businessAddress,
        isComplete: true
      };

      await createAccount('investor', accountData);

      // Navigate to investor dashboard
      navigate('/investor/discover');
    } catch (error) {
      console.error('Error creating investor account:', error);
      // Handle error - show toast or error message
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUpIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Create Investor Account</CardTitle>
            <p className="text-gray-600 mt-2">
              Set up your investor profile to start discovering investment opportunities
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Type Selection */}
              <div>
                <Label className="text-lg font-medium mb-4 block">Account Type</Label>
                <div className="flex flex-col sm:flex-row gap-4">
                  {[
                    { value: "individual", label: "Individual" },
                    { value: "non-individual", label: "Non-Individual (Entity)" }
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer
                        ${accountType === option.value
                          ? "bg-blue-50 border-blue-500"
                          : "bg-white border-gray-300"}
                      `}
                      onClick={() => setAccountType(option.value)}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        accountType === option.value ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                      }`}>
                        {accountType === option.value && <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5"></div>}
                      </div>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Individual Account Fields */}
              {accountType === "individual" && (
                <>
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        placeholder="City, Country"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>
                  </div>

                  {/* KYC Fields for Individual */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Personal Identification</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nationalId">National/Government ID No.*</Label>
                        <Input
                          id="nationalId"
                          value={nationalId}
                          onChange={(e) => setNationalId(e.target.value)}
                          placeholder="Enter National ID"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="passport">Passport Number</Label>
                        <Input
                          id="passport"
                          value={passport}
                          onChange={(e) => setPassport(e.target.value)}
                          placeholder="Enter Passport Number"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="tin">TIN*</Label>
                        <Input
                          id="tin"
                          value={tin}
                          onChange={(e) => setTin(e.target.value)}
                          placeholder="Enter TIN"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="placeOfBirth">Place of Birth*</Label>
                        <Input
                          id="placeOfBirth"
                          value={placeOfBirth}
                          onChange={(e) => setPlaceOfBirth(e.target.value)}
                          placeholder="Enter place of birth"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="gender">Gender*</Label>
                        <Combobox
                          options={genderOptions}
                          value={gender}
                          onValueChange={setGender}
                          placeholder="Select gender"
                          searchPlaceholder="Search..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="civilStatus">Civil Status*</Label>
                        <Combobox
                          options={civilStatusOptions}
                          value={civilStatus}
                          onValueChange={setCivilStatus}
                          placeholder="Select civil status"
                          searchPlaceholder="Search..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="nationality">Nationality*</Label>
                        <Input
                          id="nationality"
                          value={nationality}
                          onChange={(e) => setNationality(e.target.value)}
                          placeholder="Enter nationality"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="motherMaidenName">Mother's Maiden Name*</Label>
                        <Input
                          id="motherMaidenName"
                          value={motherMaidenName}
                          onChange={(e) => setMotherMaidenName(e.target.value)}
                          placeholder="Enter mother's maiden name"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Employment Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="employerName">Employer/Company Name*</Label>
                        <Input
                          id="employerName"
                          value={employerName}
                          onChange={(e) => setEmployerName(e.target.value)}
                          placeholder="Enter employer name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="occupation">Occupation/Position*</Label>
                        <Input
                          id="occupation"
                          value={occupation}
                          onChange={(e) => setOccupation(e.target.value)}
                          placeholder="Enter occupation"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="employerAddress">Employer Address*</Label>
                        <Input
                          id="employerAddress"
                          value={employerAddress}
                          onChange={(e) => setEmployerAddress(e.target.value)}
                          placeholder="Enter employer address"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="sourceOfIncome">Primary Source of Income*</Label>
                        <Combobox
                          options={sourceOfIncomeOptions}
                          value={sourceOfIncome}
                          onValueChange={setSourceOfIncome}
                          placeholder="Select source of income"
                          searchPlaceholder="Search income sources..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="monthlyIncome">Monthly Income (PHP)*</Label>
                        <Input
                          id="monthlyIncome"
                          type="number"
                          value={monthlyIncome}
                          onChange={(e) => setMonthlyIncome(e.target.value)}
                          placeholder="Enter monthly income"
                          min="0"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emergencyContactName">Contact Person Name*</Label>
                        <Input
                          id="emergencyContactName"
                          value={emergencyContactName}
                          onChange={(e) => setEmergencyContactName(e.target.value)}
                          placeholder="Enter contact person name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyContactRelationship">Relationship*</Label>
                        <Combobox
                          options={emergencyContactRelationshipOptions}
                          value={emergencyContactRelationship}
                          onValueChange={setEmergencyContactRelationship}
                          placeholder="Select relationship"
                          searchPlaceholder="Search relationships..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyContactPhone">Contact Phone Number*</Label>
                        <Input
                          id="emergencyContactPhone"
                          value={emergencyContactPhone}
                          onChange={(e) => setEmergencyContactPhone(e.target.value)}
                          placeholder="Enter contact phone number"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyContactAddress">Contact Address*</Label>
                        <Input
                          id="emergencyContactAddress"
                          value={emergencyContactAddress}
                          onChange={(e) => setEmergencyContactAddress(e.target.value)}
                          placeholder="Enter contact address"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Investment Preferences */}
                  <div>
                    <Label htmlFor="experience">Investment Experience</Label>
                    <Combobox
                      options={experienceOptions}
                      value={formData.experience}
                      onValueChange={(value) => handleInputChange("experience", value)}
                      placeholder="Select your investment experience"
                      searchPlaceholder="Search..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="investmentPreference">Investment Preference</Label>
                    <Combobox
                      options={investmentPreferenceOptions}
                      value={formData.investmentPreference}
                      onValueChange={(value) => handleInputChange("investmentPreference", value)}
                      placeholder="Select your investment preference"
                      searchPlaceholder="Search..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                    <Combobox
                      options={riskToleranceOptions}
                      value={formData.riskTolerance}
                      onValueChange={(value) => handleInputChange("riskTolerance", value)}
                      placeholder="Select your risk tolerance"
                      searchPlaceholder="Search..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="portfolioValue">Expected Investment Amount (PHP)</Label>
                    <Input
                      id="portfolioValue"
                      type="number"
                      value={formData.portfolioValue}
                      onChange={(e) => handleInputChange("portfolioValue", e.target.value)}
                      placeholder="Enter expected investment amount"
                      min="0"
                    />
                  </div>

                  {/* PEP Declaration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Politically Exposed Person (PEP) Declaration</h3>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="pepStatus"
                        checked={pepStatus}
                        onChange={(e) => setPepStatus(e.target.checked)}
                        className="mt-1"
                      />
                      <Label htmlFor="pepStatus" className="text-sm leading-relaxed">
                        I am a Politically Exposed Person (PEP) or have an immediate family member or close associate who is a PEP. 
                        This includes current or former senior political figures, their immediate family members, or close business associates.
                      </Label>
                    </div>
                    <p className="text-xs text-gray-600">
                      Note: PEP status does not disqualify you from using our services but requires additional compliance procedures.
                    </p>
                  </div>
                </>
              )}

              {/* Non-Individual Account Fields */}
              {accountType === "non-individual" && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Business Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="fullName">Business/Entity Name*</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange("fullName", e.target.value)}
                          placeholder="Enter business/entity name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="businessRegistrationType">Registration Type*</Label>
                        <Combobox
                          options={businessRegistrationTypeOptions}
                          value={businessRegistrationType}
                          onValueChange={setBusinessRegistrationType}
                          placeholder="Select registration type"
                          searchPlaceholder="Search registration types..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="businessRegistrationNumber">Registration Number*</Label>
                        <Input
                          id="businessRegistrationNumber"
                          value={businessRegistrationNumber}
                          onChange={(e) => setBusinessRegistrationNumber(e.target.value)}
                          placeholder="Enter registration number"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="businessRegistrationDate">Registration Date*</Label>
                        <Input
                          id="businessRegistrationDate"
                          type="date"
                          value={businessRegistrationDate}
                          onChange={(e) => setBusinessRegistrationDate(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="corporateTin">Corporate TIN*</Label>
                        <Input
                          id="corporateTin"
                          value={corporateTin}
                          onChange={(e) => setCorporateTin(e.target.value)}
                          placeholder="Enter corporate TIN"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="natureOfBusiness">Nature of Business*</Label>
                        <Input
                          id="natureOfBusiness"
                          value={natureOfBusiness}
                          onChange={(e) => setNatureOfBusiness(e.target.value)}
                          placeholder="Describe business activities"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="businessAddress">Business Address*</Label>
                        <Input
                          id="businessAddress"
                          value={businessAddress}
                          onChange={(e) => setBusinessAddress(e.target.value)}
                          placeholder="Enter business address"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Authorized Signatory</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="authorizedSignatoryName">Signatory Name*</Label>
                        <Input
                          id="authorizedSignatoryName"
                          value={authorizedSignatoryName}
                          onChange={(e) => setAuthorizedSignatoryName(e.target.value)}
                          placeholder="Enter signatory name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="authorizedSignatoryPosition">Position/Title*</Label>
                        <Input
                          id="authorizedSignatoryPosition"
                          value={authorizedSignatoryPosition}
                          onChange={(e) => setAuthorizedSignatoryPosition(e.target.value)}
                          placeholder="Enter position/title"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="authorizedSignatoryIdNumber">ID Number*</Label>
                        <Input
                          id="authorizedSignatoryIdNumber"
                          value={authorizedSignatoryIdNumber}
                          onChange={(e) => setAuthorizedSignatoryIdNumber(e.target.value)}
                          placeholder="Enter ID number"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Investment Preferences for Business */}
                  <div>
                    <Label htmlFor="experience">Investment Experience</Label>
                    <Combobox
                      options={experienceOptions}
                      value={formData.experience}
                      onValueChange={(value) => handleInputChange("experience", value)}
                      placeholder="Select your investment experience"
                      searchPlaceholder="Search..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="investmentPreference">Investment Preference</Label>
                    <Combobox
                      options={investmentPreferenceOptions}
                      value={formData.investmentPreference}
                      onValueChange={(value) => handleInputChange("investmentPreference", value)}
                      placeholder="Select your investment preference"
                      searchPlaceholder="Search..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                    <Combobox
                      options={riskToleranceOptions}
                      value={formData.riskTolerance}
                      onValueChange={(value) => handleInputChange("riskTolerance", value)}
                      placeholder="Select your risk tolerance"
                      searchPlaceholder="Search..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="portfolioValue">Expected Investment Amount (PHP)</Label>
                    <Input
                      id="portfolioValue"
                      type="number"
                      value={formData.portfolioValue}
                      onChange={(e) => handleInputChange("portfolioValue", e.target.value)}
                      placeholder="Enter expected investment amount"
                      min="0"
                    />
                  </div>

                  {/* PEP Declaration for Business */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Politically Exposed Person (PEP) Declaration</h3>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="pepStatusBusiness"
                        checked={pepStatus}
                        onChange={(e) => setPepStatus(e.target.checked)}
                        className="mt-1"
                      />
                      <Label htmlFor="pepStatusBusiness" className="text-sm leading-relaxed">
                        The entity or any of its beneficial owners, directors, or authorized signatories is a Politically Exposed Person (PEP) 
                        or has an immediate family member or close associate who is a PEP. This includes current or former senior political figures, 
                        their immediate family members, or close business associates.
                      </Label>
                    </div>
                    <p className="text-xs text-gray-600">
                      Note: PEP status does not disqualify your entity from using our services but requires additional compliance procedures.
                    </p>
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0C4B20] hover:bg-[#8FB200] text-black"
              >
                {loading ? "Creating Account..." : "Create Investor Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
