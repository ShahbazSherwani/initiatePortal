import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "../contexts/RegistrationContext";
import { Country, State, City } from "country-state-city";
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

export const BorrowerReg = (): JSX.Element => {
  const [accountType, setAccountType] = useState("individual");

  // Identification
  const [nationalId, setNationalId] = useState("");
  const [passport, setPassport] = useState("");
  const [tin, setTin] = useState("");

  // File uploads
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const nationalIdFileRef = useRef<HTMLInputElement>(null);
  const passportFileRef = useRef<HTMLInputElement>(null);

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
  const [pepStatus, setPepStatus] = useState<boolean>(false);

  // Address
  const [street, setStreet] = useState("");
  const [barangay, setBarangay] = useState("");

  // Location selects
  const [countryIso, setCountryIso] = useState("");
  const [stateIso, setStateIso] = useState("");
  const [cityName, setCityName] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const countries = Country.getAllCountries();
  const states = countryIso ? State.getStatesOfCountry(countryIso) : [];
  const cities = stateIso ? City.getCitiesOfState(countryIso, stateIso) : [];

  const { setRegistration } = useRegistration();
  const navigate = useNavigate();

  const handleAccountTypeSelect = (type: string) => {
    console.log("Account type selected:", type);
    setAccountType(type);
    setRegistration(reg => ({ ...reg, accountType: type }));
    
    // Navigate to non-individual registration if selected
    if (type === "non-individual") {
      console.log("Navigating to non-individual registration...");
      // Use replace to avoid adding to history stack
      navigate("/borrower-reg-non-individual", { 
        state: { accountType: type },
        replace: true 
      });
    }
  };

  // File upload handlers
  const handleNationalIdUpload = () => {
    nationalIdFileRef.current?.click();
  };

  const handlePassportUpload = () => {
    passportFileRef.current?.click();
  };

  const handleNationalIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNationalIdFile(file);
    }
  };

  const handlePassportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPassportFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save registration data with all KYC fields
    setRegistration(reg => ({
      ...reg,
      accountType,
      details: {
        // Basic identification
        nationalId,
        passport,
        tin,
        // Address
        street,
        barangay,
        countryIso,
        stateIso,
        cityName,
        postalCode,
        // Personal information (Individual accounts)
        placeOfBirth,
        gender,
        civilStatus,
        nationality,
        motherMaidenName,
        // Employment information
        employerName,
        occupation,
        employerAddress,
        sourceOfIncome,
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
        // Emergency contact
        emergencyContactName,
        emergencyContactRelationship,
        emergencyContactPhone,
        emergencyContactAddress,
        // PEP status
        pepStatus,
      },
      files: {
        nationalIdFile,
        passportFile,
      },
    }));
    
    // Continue to next step
    navigate("/borrowocu");
  };

  return (
    <div className="bg-white min-h-screen w-full relative overflow-hidden z-10">
      {/* <Navbar activePage="register" showAuthButtons /> */}

      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] px-4 md:px-20 py-10">
        {/* ─── CONTENT ─── */}
        <div className="md:w-2/4 overflow-y-auto pr-4 space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#ffc00f] rounded-lg flex items-center justify-center">
              <img className="w-10 h-10" src="/debt-1.png" alt="Debt" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Issue/Borrow</h2>
          </div>

          {/* Option Selection - Outside Form */}
          <div>
            <p className="font-medium text-lg mb-2">Please select an option</p>
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
                      ? "bg-[url('/radio-btns.svg')] bg-cover"
                      : "bg-white"}
                  `}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Button clicked:", option.value);
                    handleAccountTypeSelect(option.value);
                  }}
                >
                  <div className={`w-4 h-4 rounded-full border-2 ${accountType === option.value ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                    {accountType === option.value && <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5"></div>}
                  </div>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Individual Registration Form - Only show if individual is selected */}
          {accountType === "individual" && (
            <form
              onSubmit={handleSubmit}
              className="space-y-8"
              noValidate
            >

          {/* Identification */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Personal Identification (Individual)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* National ID */}
              <div className="space-y-2">
                <Label>National/Government ID No.*</Label>
                <Input
                  required
                  value={nationalId}
                  onChange={e => setNationalId(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
              </div>
              {/* Upload ID Copy */}
              <div className="space-y-2">
                <Label>Upload ID Copy</Label>
                <input
                  type="file"
                  ref={nationalIdFileRef}
                  onChange={handleNationalIdFileChange}
                  accept="image/*,.pdf"
                  className="hidden"
                />
                <Button 
                  type="button"
                  onClick={handleNationalIdUpload}
                  className="w-full h-14 bg-[#ffc00f] rounded-2xl flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">+</span> 
                  {nationalIdFile ? `Selected: ${nationalIdFile.name}` : 'Upload'}
                </Button>
              </div>
              {/* Passport */}
              <div className="space-y-2">
                <Label>Passport Number*</Label>
                <Input
                  required
                  value={passport}
                  onChange={e => setPassport(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
                <p className="text-sm text-gray-600">
                  (required for funding of &gt;Php100,000)
                </p>
              </div>
              {/* Upload Passport */}
              <div className="space-y-2">
                <Label>Upload Passport Copy</Label>
                <input
                  type="file"
                  ref={passportFileRef}
                  onChange={handlePassportFileChange}
                  accept="image/*,.pdf"
                  className="hidden"
                />
                <Button 
                  type="button"
                  onClick={handlePassportUpload}
                  className="w-full h-14 bg-[#ffc00f] rounded-2xl flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">+</span> 
                  {passportFile ? `Selected: ${passportFile.name}` : 'Upload'}
                </Button>
              </div>
              {/* TIN */}
              <div className="sm:col-span-2 space-y-2">
                <Label>TIN*</Label>
                <Input
                  required
                  value={tin}
                  onChange={e => setTin(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
              </div>
            </div>
          </section>

          {/* Personal Information - Individual only */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Place of Birth */}
              <div className="space-y-2">
                <Label>Place of Birth*</Label>
                <Input
                  required
                  value={placeOfBirth}
                  onChange={e => setPlaceOfBirth(e.target.value)}
                  placeholder="Enter place of birth"
                  className="h-14 rounded-2xl"
                />
              </div>
              {/* Gender */}
              <div className="space-y-2">
                <Label>Gender*</Label>
                <Select
                  required
                  value={gender}
                  onValueChange={setGender}
                >
                  <SelectTrigger className="h-14 rounded-2xl">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Civil Status */}
              <div className="space-y-2">
                <Label>Civil Status*</Label>
                <Select
                  required
                  value={civilStatus}
                  onValueChange={setCivilStatus}
                >
                  <SelectTrigger className="h-14 rounded-2xl">
                    <SelectValue placeholder="Select civil status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                    <SelectItem value="separated">Separated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Nationality */}
              <div className="space-y-2">
                <Label>Nationality*</Label>
                <Input
                  required
                  value={nationality}
                  onChange={e => setNationality(e.target.value)}
                  placeholder="Enter nationality"
                  className="h-14 rounded-2xl"
                />
              </div>
              {/* Mother's Maiden Name */}
              <div className="sm:col-span-2 space-y-2">
                <Label>Mother's Maiden Name*</Label>
                <Input
                  required
                  value={motherMaidenName}
                  onChange={e => setMotherMaidenName(e.target.value)}
                  placeholder="Enter mother's maiden name"
                  className="h-14 rounded-2xl"
                />
              </div>
            </div>
          </section>

          {/* Employment Information - Individual only */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Employment Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Employer Name */}
              <div className="space-y-2">
                <Label>Employer/Company Name*</Label>
                <Input
                  required
                  value={employerName}
                  onChange={e => setEmployerName(e.target.value)}
                  placeholder="Enter employer name"
                  className="h-14 rounded-2xl"
                />
              </div>
              {/* Occupation */}
              <div className="space-y-2">
                <Label>Occupation/Position*</Label>
                <Input
                  required
                  value={occupation}
                  onChange={e => setOccupation(e.target.value)}
                  placeholder="Enter occupation"
                  className="h-14 rounded-2xl"
                />
              </div>
              {/* Employer Address */}
              <div className="sm:col-span-2 space-y-2">
                <Label>Employer Address*</Label>
                <Input
                  required
                  value={employerAddress}
                  onChange={e => setEmployerAddress(e.target.value)}
                  placeholder="Enter employer address"
                  className="h-14 rounded-2xl"
                />
              </div>
              {/* Source of Income */}
              <div className="space-y-2">
                <Label>Primary Source of Income*</Label>
                <Select
                  required
                  value={sourceOfIncome}
                  onValueChange={setSourceOfIncome}
                >
                  <SelectTrigger className="h-14 rounded-2xl">
                    <SelectValue placeholder="Select source of income" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employment">Employment/Salary</SelectItem>
                    <SelectItem value="business">Business Income</SelectItem>
                    <SelectItem value="investments">Investment Income</SelectItem>
                    <SelectItem value="pension">Pension/Retirement</SelectItem>
                    <SelectItem value="remittances">Remittances</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Monthly Income */}
              <div className="space-y-2">
                <Label>Monthly Income (PHP)*</Label>
                <Input
                  required
                  type="number"
                  value={monthlyIncome}
                  onChange={e => setMonthlyIncome(e.target.value)}
                  placeholder="Enter monthly income"
                  className="h-14 rounded-2xl"
                  min="0"
                />
              </div>
            </div>
          </section>

          {/* Emergency Contact - Individual only */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Emergency Contact Name */}
              <div className="space-y-2">
                <Label>Contact Person Name*</Label>
                <Input
                  required
                  value={emergencyContactName}
                  onChange={e => setEmergencyContactName(e.target.value)}
                  placeholder="Enter contact person name"
                  className="h-14 rounded-2xl"
                />
              </div>
              {/* Relationship */}
              <div className="space-y-2">
                <Label>Relationship*</Label>
                <Select
                  required
                  value={emergencyContactRelationship}
                  onValueChange={setEmergencyContactRelationship}
                >
                  <SelectTrigger className="h-14 rounded-2xl">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="relative">Relative</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="colleague">Colleague</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Emergency Contact Phone */}
              <div className="space-y-2">
                <Label>Contact Phone Number*</Label>
                <Input
                  required
                  value={emergencyContactPhone}
                  onChange={e => setEmergencyContactPhone(e.target.value)}
                  placeholder="Enter contact phone number"
                  className="h-14 rounded-2xl"
                />
              </div>
              {/* Emergency Contact Address */}
              <div className="space-y-2">
                <Label>Contact Address*</Label>
                <Input
                  required
                  value={emergencyContactAddress}
                  onChange={e => setEmergencyContactAddress(e.target.value)}
                  placeholder="Enter contact address"
                  className="h-14 rounded-2xl"
                />
              </div>
            </div>
          </section>

          {/* PEP Declaration - Individual only */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Politically Exposed Person (PEP) Declaration
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="pepStatus"
                  checked={pepStatus}
                  onChange={e => setPepStatus(e.target.checked)}
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
          </section>

          {/* Address */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Home Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Street */}
              <div className="space-y-2">
                <Label>Street*</Label>
                <Input
                  required
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
              </div>
              {/* Barangay */}
              <div className="space-y-2">
                <Label>Barangay*</Label>
                <Input
                  required
                  value={barangay}
                  onChange={e => setBarangay(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
              </div>
              {/* Country */}
              <div className="space-y-2">
                <Label>Country*</Label>
                <Select
                  required
                  value={countryIso}
                  onValueChange={iso => {
                    setCountryIso(iso);
                    setStateIso("");
                    setCityName("");
                  }}
                >
                  <SelectTrigger className="h-14 rounded-2xl">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(c => (
                      <SelectItem key={c.isoCode} value={c.isoCode}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* State/Province */}
              <div className="space-y-2">
                <Label>State / Province*</Label>
                <Select
                  required
                  value={stateIso}
                  onValueChange={iso => {
                    setStateIso(iso);
                    setCityName("");
                  }}
                  disabled={!countryIso}
                >
                  <SelectTrigger className="h-14 rounded-2xl">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(s => (
                      <SelectItem key={s.isoCode} value={s.isoCode}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* City */}
              <div className="space-y-2">
                <Label>City*</Label>
                <Select
                  value={cityName}
                  onValueChange={setCityName}
                  disabled={!stateIso}
                >
                  <SelectTrigger className="h-14 rounded-2xl">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(ci => (
                      <SelectItem key={ci.name} value={ci.name}>
                        {ci.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Postal Code */}
              <div className="space-y-2">
                <Label>Postal Code*</Label>
                <Input
                  required
                  value={postalCode}
                  onChange={e => setPostalCode(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
              </div>
            </div>
          </section>

          {/* Next */}
          <div className="pt-4">
            <Button type="submit" className="w-full md:w-1/3 h-14 bg-[#ffc00f] rounded-2xl font-medium">
              Next
            </Button>
          </div>
            </form>
          )}
        </div>

        {/* ─── TESTIMONIALS ─── */}
        <div className="hidden md:block md:w-1/3 flex-shrink-0">
          <Testimonials />
        </div>
      </div>
    </div>
  );
};

export default BorrowerReg;