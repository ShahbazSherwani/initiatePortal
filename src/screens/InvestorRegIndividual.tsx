import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRegistration } from "../contexts/RegistrationContext";
import { Country, State, City } from "country-state-city";
import { Testimonials } from "../screens/LogIn/Testimonials";
import { auth } from "../lib/firebase";
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
  
  // Track if we have existing account data
  const [hasExistingAccount, setHasExistingAccount] = useState(false);

  const countries = Country.getAllCountries();
  const states = countryIso ? State.getStatesOfCountry(countryIso) : [];
  const cities = stateIso ? City.getCitiesOfState(countryIso, stateIso) : [];

  const { setRegistration } = useRegistration();
  const navigate = useNavigate();

  // Fetch existing account data if user already has a borrower account
  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const token = await user.getIdToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const fullUrl = `${apiUrl}/api/profile/existing-account-data?targetAccountType=investor`;
        
        console.log('🔍 [INVESTOR] Fetching existing account data from:', fullUrl);
        console.log('👤 [INVESTOR] User authenticated:', !!user);
        console.log('🔑 [INVESTOR] Token exists:', !!token);
        
        const response = await fetch(fullUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('📡 [INVESTOR] Response status:', response.status);
        console.log('📡 [INVESTOR] Response content-type:', response.headers.get('content-type'));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [INVESTOR] Failed to fetch existing account data:', response.status, errorText);
          return;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const htmlText = await response.text();
          console.error('❌ [INVESTOR] Expected JSON but got HTML:', htmlText.substring(0, 200));
          return;
        }

        const data = await response.json();
        console.log('📦 [INVESTOR] Received existing account data:', data);
        
        if (data.hasExistingAccount && data.existingData) {
          const existingData = data.existingData;
          console.log('✅ [INVESTOR] Has existing account data, pre-populating fields...');
          setHasExistingAccount(true);
          
          // Pre-populate personal profile fields
          if (existingData.personalInfo) {
            console.log('👤 [INVESTOR] Personal info data:', existingData.personalInfo);
            // Note: Investor form doesn't have these fields, but borrower might
            // We'll pre-populate what we can
          }
          
          // Pre-populate address fields
          if (existingData.address) {
            console.log('📍 [INVESTOR] Address data:', existingData.address);
            setStreet(existingData.address.street || existingData.address.present_address || "");
            setBarangay(existingData.address.barangay || "");
            setCountryIso(existingData.address.countryIso || existingData.address.country_iso || "");
            setStateIso(existingData.address.stateIso || existingData.address.state_iso || "");
            setCityName(existingData.address.cityName || existingData.address.city || "");
            setPostalCode(existingData.address.postalCode || existingData.address.postal_code || "");
          }
          
          // Pre-populate identification fields
          if (existingData.identification) {
            console.log('🆔 [INVESTOR] Identification data:', existingData.identification);
            setNationalId(existingData.identification.nationalId || "");
            setPassport(existingData.identification.passport || "");
            setTin(existingData.identification.tin || "");
            
            // Convert base64 images to File objects
            if (existingData.identification.nationalIdFile) {
              fetch(existingData.identification.nationalIdFile)
                .then(res => res.blob())
                .then(blob => {
                  const file = new File([blob], 'national-id.jpg', { type: 'image/jpeg' });
                  setNationalIdFile(file);
                })
                .catch(err => console.error('Error converting national ID file:', err));
            }
            
            if (existingData.identification.passportFile) {
              fetch(existingData.identification.passportFile)
                .then(res => res.blob())
                .then(blob => {
                  const file = new File([blob], 'passport.jpg', { type: 'image/jpeg' });
                  setPassportFile(file);
                })
                .catch(err => console.error('Error converting passport file:', err));
            }
          }
        } else {
          console.log('ℹ️ [INVESTOR] No existing borrower account found');
        }
      } catch (error) {
        console.error('❌ [INVESTOR] Error fetching existing account data:', error);
      }
    };

    fetchExistingData();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    let hasErrors = false;

    // Determine if user is from Philippines
    const isPhilippines = countryIso === 'PH';

    // Required fields validation (excluding conditional nationalId and passport)
    const requiredFields = [
      { value: firstName, name: "firstName" },
      { value: lastName, name: "lastName" },
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

    // Conditional validation based on country
    if (isPhilippines) {
      // Philippines: National ID is required
      if (!nationalId || nationalId.trim() === "") {
        newErrors["nationalId"] = true;
        hasErrors = true;
      }
      if (!nationalIdFile) {
        newErrors["nationalIdFile"] = true;
        hasErrors = true;
      }
    } else {
      // Non-Philippines: Passport is required
      if (!passport || passport.trim() === "") {
        newErrors["passport"] = true;
        hasErrors = true;
      }
      if (!passportFile) {
        newErrors["passportFile"] = true;
        hasErrors = true;
      }
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
            <div className="w-12 h-12 bg-[#0C4B20] rounded-lg flex items-center justify-center">
              <img className="w-10 h-10" src="/investor-1.png" alt="Investor" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Invest/Lender</h2>
          </div>

          {/* Success Banner - Show when existing account data found */}
          {hasExistingAccount && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-green-800 font-semibold flex items-center gap-2">
                  <span>🎉</span>
                  <span>We found your existing information!</span>
                </h4>
                <p className="text-green-700 text-sm mt-1">
                  Your identification and address details from your borrower account have been automatically filled. You can review and update them if needed before continuing.
                </p>
              </div>
            </div>
          )}

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
            <div className="flex items-center gap-2">
              <h3 className="text-xl md:text-2xl font-semibold">
                Personal Identification (Individual)
              </h3>
              {hasExistingAccount && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  Auto-filled
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* National ID */}
              <ValidatedInput
                label={`National/Government ID No.${countryIso === 'PH' ? '*' : ''}`}
                required={countryIso === 'PH'}
                hasError={errors.nationalId}
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="Enter here"
              />

              {/* Upload ID Copy */}
              <ValidatedFileUpload
                label={`Upload ID Copy${countryIso === 'PH' ? '*' : ''}`}
                required={countryIso === 'PH'}
                hasError={errors.nationalIdFile}
                file={nationalIdFile}
                onFileChange={setNationalIdFile}
                accept="image/*,.pdf"
                buttonText="Upload"
              />

              {/* Philippines requirement notice - fixed height to prevent layout shift */}
              <div className="sm:col-span-2" style={{ minHeight: '24px' }}>
                {countryIso === 'PH' && (
                  <p className="text-sm text-amber-600">
                    📌 Required for Philippines residents
                  </p>
                )}
              </div>

              {/* Passport */}
              <ValidatedInput
                label={`Passport Number${countryIso && countryIso !== 'PH' ? '*' : ''}`}
                required={!!(countryIso && countryIso !== 'PH')}
                hasError={errors.passport}
                value={passport}
                onChange={(e) => setPassport(e.target.value)}
                placeholder="Enter here"
              />

              {/* Upload Passport Copy */}
              <ValidatedFileUpload
                label={`Upload Passport Copy${countryIso && countryIso !== 'PH' ? '*' : ''}`}
                required={!!(countryIso && countryIso !== 'PH')}
                hasError={errors.passportFile}
                file={passportFile}
                onFileChange={setPassportFile}
                accept="image/*,.pdf"
                buttonText="Upload"
              />

              {/* Non-Philippines requirement notice - fixed height to prevent layout shift */}
              <div className="sm:col-span-2" style={{ minHeight: '24px' }}>
                {countryIso && countryIso !== 'PH' ? (
                  <p className="text-sm text-amber-600">
                    📌 Required for non-Philippines residents
                  </p>
                ) : !countryIso ? null : (
                  <p className="text-sm text-gray-600">
                    (required for funding &gt; Php100,000)
                  </p>
                )}
              </div>

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
            <div className="flex items-center gap-2">
              <h3 className="text-xl md:text-2xl font-semibold">Home Address</h3>
              {hasExistingAccount && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  Auto-filled
                </span>
              )}
            </div>
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
              className="w-full sm:w-auto bg-[#0C4B20] hover:bg-[#8FB200] text-white font-semibold px-8 py-3 rounded-2xl h-14"
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
