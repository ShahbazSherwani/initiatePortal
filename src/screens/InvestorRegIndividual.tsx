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

export const InvestorRegIndividual = (): JSX.Element => {
  const location = useLocation();
  const initialAccountType = location.state?.accountType || "individual";
  const [accountType] = useState(initialAccountType);

  // Personal Information
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffixName, setSuffixName] = useState("");
  
  // Identification
  const [nationalId, setNationalId] = useState("");
  const [passport, setPassport] = useState("");
  const [tin, setTin] = useState("");

  // File uploads
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const nationalIdFileRef = useRef<HTMLInputElement>(null);
  const passportFileRef = useRef<HTMLInputElement>(null);

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
    
    // Save registration data
    setRegistration(reg => ({
      ...reg,
      accountType,
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
      files: {
        nationalIdFile,
        passportFile,
      },
    }));
    
    // Continue to next step
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
            <h2 className="text-2xl md:text-3xl font-bold">Invest/Lender</h2>
          </div>

          {/* Personal Profile */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Personal Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-2">
                <Label>First Name*</Label>
                <Input
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Middle Name */}
              <div className="space-y-2">
                <Label>Middle Name</Label>
                <Input
                  value={middleName}
                  onChange={e => setMiddleName(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label>Last Name*</Label>
                <Input
                  required
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
              </div>

              {/* Suffix Name */}
              <div className="space-y-2">
                <Label>Suffix Name</Label>
                <Input
                  value={suffixName}
                  onChange={e => setSuffixName(e.target.value)}
                  placeholder="Jr, Sr, III"
                  className="h-14 rounded-2xl"
                />
              </div>
            </div>
          </section>

          {/* Personal Identification */}
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
                  className="w-full h-14 bg-[#ffc00f] hover:bg-[#ffc00f]/90 rounded-2xl flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">⚠️</span> 
                  {nationalIdFile ? `Selected: ${nationalIdFile.name}` : 'Upload'}
                </Button>
              </div>

              {/* Passport */}
              <div className="space-y-2">
                <Label>Passport No.*</Label>
                <Input
                  required
                  value={passport}
                  onChange={e => setPassport(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
                <p className="text-sm text-gray-600">(required for funding of &gt;Php100,000)</p>
              </div>

              {/* Upload Passport Copy */}
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
                  className="w-full h-14 bg-[#ffc00f] hover:bg-[#ffc00f]/90 rounded-2xl flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">⚠️</span> 
                  {passportFile ? `Selected: ${passportFile.name}` : 'Upload'}
                </Button>
              </div>

              {/* TIN */}
              <div className="sm:col-span-2 space-y-2">
                <Label>TIN</Label>
                <Input
                  value={tin}
                  onChange={e => setTin(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
                <p className="text-sm text-gray-600">(required for funding of &gt;Php100,000)</p>
              </div>
            </div>
          </section>

          {/* Home Address */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Home Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Street */}
              <div className="sm:col-span-2 space-y-2">
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
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
              </div>
            </div>
          </section>

          {/* Next Button */}
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              className="w-full sm:w-auto bg-[#ffc00f] hover:bg-[#ffc00f]/90 text-black font-semibold px-8 py-3 rounded-2xl h-14"
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
