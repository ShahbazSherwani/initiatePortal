import React, { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRegistration } from "../contexts/RegistrationContext";
import { Country, State, City } from "country-state-city";
import { Testimonials } from "../screens/LogIn/Testimonials";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ValidatedInput } from "../components/ValidatedFormFields";
import { ArrowLeftIcon } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";

export const BorrowerRegNonIndividual = (): JSX.Element => {
  const location = useLocation();
  const initialAccountType = location.state?.accountType || "non-individual";
  const [accountType] = useState(initialAccountType);

  // Entity Information
  const [entityType, setEntityType] = useState("");
  const [entityName, setEntityName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [tin, setTin] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [contactPersonPosition, setContactPersonPosition] = useState("");
  const [contactPersonEmail, setContactPersonEmail] = useState("");
  const [contactPersonPhone, setContactPersonPhone] = useState("");

  // Additional KYC fields for Non-Individual accounts
  const [businessRegistrationType, setBusinessRegistrationType] = useState("");
  const [businessRegistrationDate, setBusinessRegistrationDate] = useState("");
  const [corporateTin, setCorporateTin] = useState("");
  const [authorizedSignatoryName, setAuthorizedSignatoryName] = useState("");
  const [authorizedSignatoryPosition, setAuthorizedSignatoryPosition] = useState("");
  const [authorizedSignatoryIdNumber, setAuthorizedSignatoryIdNumber] = useState("");
  const [natureOfBusiness, setNatureOfBusiness] = useState("");
  const [principalOfficeStreet, setPrincipalOfficeStreet] = useState("");
  const [principalOfficeBarangay, setPrincipalOfficeBarangay] = useState("");
  const [principalOfficeCountry, setPrincipalOfficeCountry] = useState("");
  const [principalOfficeState, setPrincipalOfficeState] = useState("");
  const [principalOfficeCity, setPrincipalOfficeCity] = useState("");
  const [principalOfficePostalCode, setPrincipalOfficePostalCode] = useState("");
  const [pepStatus, setPepStatus] = useState<boolean>(false);

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  // File uploads
  const [registrationCertFile, setRegistrationCertFile] = useState<File | null>(null);
  const [tinCertFile, setTinCertFile] = useState<File | null>(null);
  const [authorizationFile, setAuthorizationFile] = useState<File | null>(null);
  const registrationCertFileRef = useRef<HTMLInputElement>(null);
  const tinCertFileRef = useRef<HTMLInputElement>(null);
  const authorizationFileRef = useRef<HTMLInputElement>(null);

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

  // Entity type options
  const entityTypes = [
    "Sole Proprietor",
    "MSME",
    "NGO",
    "Foundation",
    "Educational Institution",
    "Others"
  ];

  // File upload handlers
  const handleRegistrationCertUpload = () => {
    registrationCertFileRef.current?.click();
  };

  const handleTinCertUpload = () => {
    tinCertFileRef.current?.click();
  };

  const handleAuthorizationUpload = () => {
    authorizationFileRef.current?.click();
  };

  const handleRegistrationCertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRegistrationCertFile(file);
    }
  };

  const handleTinCertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTinCertFile(file);
    }
  };

  const handleAuthorizationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAuthorizationFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for mandatory fields
    const requiredFields = [
      { field: entityType, name: "entityType" },
      { field: entityName, name: "entityName" },
      { field: registrationNumber, name: "registrationNumber" },
      { field: tin, name: "tin" },
      { field: contactPersonName, name: "contactPersonName" },
      { field: contactPersonPosition, name: "contactPersonPosition" },
      { field: contactPersonEmail, name: "contactPersonEmail" },
      { field: contactPersonPhone, name: "contactPersonPhone" },
      { field: street, name: "street" },
      { field: barangay, name: "barangay" },
      { field: countryIso, name: "countryIso" },
      { field: stateIso, name: "stateIso" },
      { field: cityName, name: "cityName" },
      { field: postalCode, name: "postalCode" },
      { field: businessDescription, name: "businessDescription" },
      { field: yearEstablished, name: "yearEstablished" },
      { field: numberOfEmployees, name: "numberOfEmployees" },
      { field: annualRevenue, name: "annualRevenue" },
      { field: sourceOfFunds, name: "sourceOfFunds" },
      { field: purposeOfAccount, name: "purposeOfAccount" },
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

    // Check file uploads
    if (!secFile) {
      errors["secFile"] = true;
      hasErrors = true;
    }

    if (!birFile) {
      errors["birFile"] = true;
      hasErrors = true;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (contactPersonEmail && !emailRegex.test(contactPersonEmail)) {
      errors["contactPersonEmail"] = true;
      hasErrors = true;
    }

    // Update validation errors state
    setValidationErrors(errors);

    // If there are errors, don't submit
    if (hasErrors) {
      return;
    }

    // Save registration data with all KYC fields
    setRegistration(reg => ({
      ...reg,
      accountType,
      details: {
        // Basic entity information
        entityType,
        entityName,
        registrationNumber,
        tin,
        contactPersonName,
        contactPersonPosition,
        contactPersonEmail,
        contactPersonPhone,
        // Address
        street,
        barangay,
        countryIso,
        stateIso,
        cityName,
        postalCode,
        // Additional KYC fields for Non-Individual accounts
        businessRegistrationType,
        businessRegistrationDate,
        corporateTin,
        authorizedSignatoryName,
        authorizedSignatoryPosition,
        authorizedSignatoryIdNumber,
        natureOfBusiness,
        principalOfficeStreet,
        principalOfficeBarangay,
        principalOfficeCountry,
        principalOfficeState,
        principalOfficeCity,
        principalOfficePostalCode,
        pepStatus,
      },
      files: {
        registrationCertFile,
        tinCertFile,
        authorizationFile,
      },
    }));
    
    // Continue to next step (bank details for non-individual entities)
    navigate("/borrower-bank-details-non-individual");
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
            <h2 className="text-2xl md:text-3xl font-bold">Issue/Borrow - Entity Registration</h2>
          </div>

          {/* Entity Type Selection */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Entity Type</h3>
            <div className="space-y-2">
              <Label className={validationErrors.entityType ? "text-red-500" : ""}>
                Select Entity Type*
              </Label>
              <Select
                required
                value={entityType}
                onValueChange={setEntityType}
              >
                <SelectTrigger className={`h-14 rounded-2xl ${validationErrors.entityType ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Select entity type" />
                </SelectTrigger>
                <SelectContent>
                  {entityTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Entity Information */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Entity Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Entity Name */}
              <div className="sm:col-span-2">
                <ValidatedInput
                  label="Entity Name"
                  required
                  hasError={validationErrors.entityName}
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  placeholder="Enter entity name"
                />
              </div>
              
              {/* Registration Number */}
              <div className="space-y-2">
                <Label>Registration Number*</Label>
                <Input
                  required
                  value={registrationNumber}
                  onChange={e => setRegistrationNumber(e.target.value)}
                  placeholder="Enter registration number"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Upload Registration Certificate */}
              <div className="space-y-2">
                <Label>Upload Registration Certificate</Label>
                <input
                  type="file"
                  ref={registrationCertFileRef}
                  onChange={handleRegistrationCertFileChange}
                  accept="image/*,.pdf"
                  className="hidden"
                />
                <Button 
                  type="button"
                  onClick={handleRegistrationCertUpload}
                  className="w-full h-14 bg-[#0C4B20] hover:bg-[#8FB200] rounded-2xl flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">+</span> 
                  {registrationCertFile ? `Selected: ${registrationCertFile.name}` : 'Upload'}
                </Button>
              </div>

              {/* TIN */}
              <div className="space-y-2">
                <Label>TIN*</Label>
                <Input
                  required
                  value={tin}
                  onChange={e => setTin(e.target.value)}
                  placeholder="Enter TIN"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Upload TIN Certificate */}
              <div className="space-y-2">
                <Label>Upload TIN Certificate</Label>
                <input
                  type="file"
                  ref={tinCertFileRef}
                  onChange={handleTinCertFileChange}
                  accept="image/*,.pdf"
                  className="hidden"
                />
                <Button 
                  type="button"
                  onClick={handleTinCertUpload}
                  className="w-full h-14 bg-[#0C4B20] hover:bg-[#8FB200] rounded-2xl flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">+</span> 
                  {tinCertFile ? `Selected: ${tinCertFile.name}` : 'Upload'}
                </Button>
              </div>
            </div>
          </section>

          {/* Contact Person Information */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Contact Person</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Contact Person Name */}
              <div className="space-y-2">
                <Label>Full Name*</Label>
                <Input
                  required
                  value={contactPersonName}
                  onChange={e => setContactPersonName(e.target.value)}
                  placeholder="Enter full name"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label>Position*</Label>
                <Input
                  required
                  value={contactPersonPosition}
                  onChange={e => setContactPersonPosition(e.target.value)}
                  placeholder="Enter position"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label>Email Address*</Label>
                <Input
                  required
                  type="email"
                  value={contactPersonEmail}
                  onChange={e => setContactPersonEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label>Phone Number*</Label>
                <Input
                  required
                  type="tel"
                  value={contactPersonPhone}
                  onChange={e => setContactPersonPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Upload Authorization Letter */}
              <div className="sm:col-span-2 space-y-2">
                <Label>Upload Authorization Letter (if applicable)</Label>
                <input
                  type="file"
                  ref={authorizationFileRef}
                  onChange={handleAuthorizationFileChange}
                  accept="image/*,.pdf"
                  className="hidden"
                />
                <Button 
                  type="button"
                  onClick={handleAuthorizationUpload}
                  className="w-full h-14 bg-[#0C4B20] hover:bg-[#8FB200] rounded-2xl flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">+</span> 
                  {authorizationFile ? `Selected: ${authorizationFile.name}` : 'Upload'}
                </Button>
              </div>
            </div>
          </section>

          {/* Business Registration Details */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Business Registration Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Business Registration Type */}
              <div className="space-y-2">
                <Label>Registration Type*</Label>
                <Select
                  required
                  value={businessRegistrationType}
                  onValueChange={setBusinessRegistrationType}
                >
                  <SelectTrigger className="h-14 rounded-2xl">
                    <SelectValue placeholder="Select registration type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEC">SEC (Securities and Exchange Commission)</SelectItem>
                    <SelectItem value="CDA">CDA (Cooperative Development Authority)</SelectItem>
                    <SelectItem value="DTI">DTI (Department of Trade and Industry)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Business Registration Date */}
              <div className="space-y-2">
                <Label>Registration Date*</Label>
                <Input
                  required
                  type="date"
                  value={businessRegistrationDate}
                  onChange={e => setBusinessRegistrationDate(e.target.value)}
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Corporate TIN */}
              <div className="space-y-2">
                <Label>Corporate TIN*</Label>
                <Input
                  required
                  value={corporateTin}
                  onChange={e => setCorporateTin(e.target.value)}
                  placeholder="Enter corporate TIN"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Nature of Business */}
              <div className="space-y-2">
                <Label>Nature of Business*</Label>
                <Input
                  required
                  value={natureOfBusiness}
                  onChange={e => setNatureOfBusiness(e.target.value)}
                  placeholder="Describe business activities"
                  className="h-14 rounded-2xl"
                />
              </div>
            </div>
          </section>

          {/* Authorized Signatory Information */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Authorized Signatory</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Authorized Signatory Name */}
              <div className="space-y-2">
                <Label>Signatory Name*</Label>
                <Input
                  required
                  value={authorizedSignatoryName}
                  onChange={e => setAuthorizedSignatoryName(e.target.value)}
                  placeholder="Enter signatory name"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Authorized Signatory Position */}
              <div className="space-y-2">
                <Label>Position/Title*</Label>
                <Input
                  required
                  value={authorizedSignatoryPosition}
                  onChange={e => setAuthorizedSignatoryPosition(e.target.value)}
                  placeholder="Enter position/title"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Authorized Signatory ID Number */}
              <div className="sm:col-span-2 space-y-2">
                <Label>ID Number*</Label>
                <Input
                  required
                  value={authorizedSignatoryIdNumber}
                  onChange={e => setAuthorizedSignatoryIdNumber(e.target.value)}
                  placeholder="Enter ID number"
                  className="h-14 rounded-2xl"
                />
              </div>
            </div>
          </section>

          {/* Principal Office Address */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Principal Office Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Principal Office Street */}
              <div className="space-y-2">
                <Label>Street Address*</Label>
                <Input
                  required
                  value={principalOfficeStreet}
                  onChange={e => setPrincipalOfficeStreet(e.target.value)}
                  placeholder="Enter street address"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Principal Office Barangay */}
              <div className="space-y-2">
                <Label>Barangay*</Label>
                <Input
                  required
                  value={principalOfficeBarangay}
                  onChange={e => setPrincipalOfficeBarangay(e.target.value)}
                  placeholder="Enter barangay"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Principal Office Country */}
              <div className="space-y-2">
                <Label>Country*</Label>
                <Select
                  required
                  value={principalOfficeCountry}
                  onValueChange={setPrincipalOfficeCountry}
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

              {/* Principal Office State/Province */}
              <div className="space-y-2">
                <Label>State / Province*</Label>
                <Select
                  required
                  value={principalOfficeState}
                  onValueChange={setPrincipalOfficeState}
                  disabled={!principalOfficeCountry}
                >
                  <SelectTrigger className="h-14 rounded-2xl">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {principalOfficeCountry && State.getStatesOfCountry(principalOfficeCountry).map(s => (
                      <SelectItem key={s.isoCode} value={s.isoCode}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Principal Office City */}
              <div className="space-y-2">
                <Label>City*</Label>
                <Select
                  value={principalOfficeCity}
                  onValueChange={setPrincipalOfficeCity}
                  disabled={!principalOfficeState}
                >
                  <SelectTrigger className="h-14 rounded-2xl">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {principalOfficeState && City.getCitiesOfState(principalOfficeCountry, principalOfficeState).map(ci => (
                      <SelectItem key={ci.name} value={ci.name}>
                        {ci.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Principal Office Postal Code */}
              <div className="space-y-2">
                <Label>Postal Code*</Label>
                <Input
                  required
                  value={principalOfficePostalCode}
                  onChange={e => setPrincipalOfficePostalCode(e.target.value)}
                  placeholder="Enter postal code"
                  className="h-14 rounded-2xl"
                />
              </div>
            </div>
          </section>

          {/* PEP Declaration - Non-Individual */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Politically Exposed Person (PEP) Declaration
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="pepStatusBusiness"
                  checked={pepStatus}
                  onChange={e => setPepStatus(e.target.checked)}
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
          </section>

          {/* Address */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Business Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Street */}
              <div className="space-y-2">
                <Label>Street*</Label>
                <Input
                  required
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  placeholder="Enter street address"
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
                  placeholder="Enter barangay"
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
                  placeholder="Enter postal code"
                  className="h-14 rounded-2xl"
                />
              </div>
            </div>
          </section>

          {/* Next */}
          <div className="pt-4">
            <Button type="submit" className="w-full md:w-1/3 h-14 bg-[#0C4B20] hover:bg-[#8FB200] rounded-2xl font-medium">
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

export default BorrowerRegNonIndividual;
