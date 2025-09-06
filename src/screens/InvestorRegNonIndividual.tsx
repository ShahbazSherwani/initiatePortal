import React, { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { ArrowLeftIcon } from "lucide-react";

export const InvestorRegNonIndividual = (): JSX.Element => {
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

  // Entity type options for investors (matching borrower categories)
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
    
    // Save registration data
    setRegistration(reg => ({
      ...reg,
      accountType,
      details: {
        entityType,
        entityName,
        registrationNumber,
        tin,
        contactPersonName,
        contactPersonPosition,
        contactPersonEmail,
        contactPersonPhone,
        street,
        barangay,
        countryIso,
        stateIso,
        cityName,
        postalCode,
      },
      files: {
        registrationCertFile,
        tinCertFile,
        authorizationFile,
      },
    }));
    
    // Continue to income details
    navigate("/investor-reg-income-details");
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
            <h2 className="text-2xl md:text-3xl font-bold">Invest/Lender - Entity Registration</h2>
          </div>

          {/* Entity Type Selection */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Entity Information</h3>
            <div className="space-y-2">
              <Label>Entity Type*</Label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger className="h-14 rounded-2xl">
                  <SelectValue placeholder="Select entity type" />
                </SelectTrigger>
                <SelectContent>
                  {entityTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Entity Details */}
          <section className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Entity Name */}
              <div className="sm:col-span-2 space-y-2">
                <Label>Entity/Business Name*</Label>
                <Input
                  required
                  value={entityName}
                  onChange={e => setEntityName(e.target.value)}
                  placeholder="Enter entity name"
                  className="h-14 rounded-2xl"
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

              {/* TIN */}
              <div className="space-y-2">
                <Label>TIN (Tax Identification Number)*</Label>
                <Input
                  required
                  value={tin}
                  onChange={e => setTin(e.target.value)}
                  placeholder="Enter TIN"
                  className="h-14 rounded-2xl"
                />
              </div>
            </div>
          </section>

          {/* Contact Person */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold">Authorized Contact Person</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Contact Person Name */}
              <div className="space-y-2">
                <Label>Full Name*</Label>
                <Input
                  required
                  value={contactPersonName}
                  onChange={e => setContactPersonName(e.target.value)}
                  placeholder="Enter contact person's name"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label>Position/Title*</Label>
                <Input
                  required
                  value={contactPersonPosition}
                  onChange={e => setContactPersonPosition(e.target.value)}
                  placeholder="Enter position or title"
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
            </div>
          </section>

          {/* Document Uploads */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold">Required Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Registration Certificate */}
              <div className="space-y-2">
                <Label>Registration Certificate*</Label>
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
                  className="w-full h-14 bg-[#ffc00f] hover:bg-[#ffc00f]/90 rounded-2xl flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">+</span> 
                  {registrationCertFile ? `Selected: ${registrationCertFile.name}` : 'Upload Certificate'}
                </Button>
              </div>

              {/* TIN Certificate */}
              <div className="space-y-2">
                <Label>TIN Certificate*</Label>
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
                  className="w-full h-14 bg-[#ffc00f] hover:bg-[#ffc00f]/90 rounded-2xl flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">+</span> 
                  {tinCertFile ? `Selected: ${tinCertFile.name}` : 'Upload TIN Certificate'}
                </Button>
              </div>

              {/* Authorization Letter */}
              <div className="sm:col-span-2 space-y-2">
                <Label>Authorization Letter*</Label>
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
                  className="w-full h-14 bg-[#ffc00f] hover:bg-[#ffc00f]/90 rounded-2xl flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">+</span> 
                  {authorizationFile ? `Selected: ${authorizationFile.name}` : 'Upload Authorization Letter'}
                </Button>
              </div>
            </div>
          </section>

          {/* Address Information */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold">Business Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Street */}
              <div className="sm:col-span-2 space-y-2">
                <Label>Street Address*</Label>
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
                <Select value={countryIso} onValueChange={setCountryIso}>
                  <SelectTrigger className="h-14 rounded-2xl">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.isoCode} value={country.isoCode}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* State */}
              <div className="space-y-2">
                <Label>State/Province*</Label>
                <Select value={stateIso} onValueChange={setStateIso}>
                  <SelectTrigger className="h-14 rounded-2xl">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state.isoCode} value={state.isoCode}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label>City*</Label>
                <Select value={cityName} onValueChange={setCityName}>
                  <SelectTrigger className="h-14 rounded-2xl">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.name} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Postal Code */}
              <div className="space-y-2">
                <Label>Postal Code</Label>
                <Input
                  value={postalCode}
                  onChange={e => setPostalCode(e.target.value)}
                  placeholder="Enter postal code"
                  className="h-14 rounded-2xl"
                />
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              className="w-full sm:w-auto bg-[#ffc00f] hover:bg-[#ffc00f]/90 text-black font-semibold px-8 py-3 rounded-2xl h-14"
            >
              Continue to Income Details
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
