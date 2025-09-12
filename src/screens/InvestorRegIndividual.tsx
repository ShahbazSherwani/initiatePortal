import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRegistration } from "../contexts/RegistrationContext";
import { Country, State, City } from "country-state-city";
import { Testimonials } from "../screens/LogIn/Testimonials";
import { Button } from "../components/ui/button";
import { ValidatedInput, ValidatedSelect, ValidatedFileUpload } from "../components/ValidatedFormFields";
import {
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

  const countries = Country.getAllCountries();
  const states = countryIso ? State.getStatesOfCountry(countryIso) : [];
  const cities = stateIso ? City.getCitiesOfState(countryIso, stateIso) : [];

  const { setRegistration } = useRegistration();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    let hasErrors = false;

    // Required fields validation
    const requiredFields = [
      { value: firstName, name: "firstName" },
      { value: lastName, name: "lastName" },
      { value: nationalId, name: "nationalId" },
      { value: tin, name: "tin" },
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

    // Check file uploads
    if (!nationalIdFile) {
      newErrors["nationalIdFile"] = true;
      hasErrors = true;
    }

    setErrors(newErrors);
    return !hasErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the form
    if (!validateForm()) {
      return;
    }

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
                accept="image/*,.pdf"
                buttonText="Upload"
              />

              {/* Passport */}
              <ValidatedInput
                label="Passport No."
                hasError={false}
                value={passport}
                onChange={(e) => setPassport(e.target.value)}
                placeholder="Enter here"
              />

              {/* Upload Passport Copy */}
              <ValidatedFileUpload
                label="Upload Passport Copy"
                hasError={false}
                file={passportFile}
                onFileChange={setPassportFile}
                accept="image/*,.pdf"
                buttonText="Upload"
              />

              {/* TIN */}
              <div className="sm:col-span-2">
                <ValidatedInput
                  label="TIN"
                  required
                  hasError={errors.tin}
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  placeholder="Enter here"
                />
                <p className="text-sm text-gray-600 mt-1">(required for funding &gt; Php100,000)</p>
              </div>
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
                onValueChange={setCountryIso}
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
                onValueChange={setStateIso}
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
