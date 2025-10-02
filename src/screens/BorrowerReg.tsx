import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "../contexts/RegistrationContext";
import { Country, State, City } from "country-state-city";
import { Testimonials } from "../screens/LogIn/Testimonials";
import { auth } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ValidatedInput, ValidatedSelect, ValidatedFileUpload } from "../components/ValidatedFormFields";
import { ArrowLeftIcon } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";

export const BorrowerReg = (): JSX.Element => {
  const [accountType, setAccountType] = useState("individual");

  // Personal Profile
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

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  
  // Track if we have existing account data
  const [hasExistingAccount, setHasExistingAccount] = useState(false);

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

  // Fetch existing account data if user already has an investor account
  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const token = await user.getIdToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const fullUrl = `${apiUrl}/api/profile/existing-account-data?targetAccountType=borrower`;
        
        console.log('🔍 Fetching existing account data from:', fullUrl);
        console.log('👤 User authenticated:', !!user);
        console.log('🔑 Token exists:', !!token);
        
        const response = await fetch(fullUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response content-type:', response.headers.get('content-type'));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Failed to fetch existing account data:', response.status, errorText);
          return;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const htmlText = await response.text();
          console.error('❌ Expected JSON but got HTML:', htmlText.substring(0, 200));
          return;
        }

        const data = await response.json();
        console.log('📦 Received existing account data:', data);
        
        if (data.hasExistingAccount && data.existingData) {
          const existingData = data.existingData;
          console.log('✅ Has existing account data, pre-populating fields...');
          setHasExistingAccount(true);
          
          // Pre-populate personal profile fields
          if (existingData.personalInfo) {
            console.log('👤 Personal profile data:', existingData.personalInfo);
            setFirstName(existingData.personalInfo.firstName || "");
            setMiddleName(existingData.personalInfo.middleName || "");
            setLastName(existingData.personalInfo.lastName || "");
            setSuffixName(existingData.personalInfo.suffixName || "");
          }
            
            // Pre-populate address fields
            if (existingData.address) {
              console.log('📍 Address data:', existingData.address);
              setStreet(existingData.address.street || existingData.address.present_address || "");
              setBarangay(existingData.address.barangay || "");
              // Handle both new (countryIso) and old (country) field names
              setCountryIso(existingData.address.countryIso || existingData.address.country_iso || "");
              setStateIso(existingData.address.stateIso || existingData.address.state_iso || "");
              setCityName(existingData.address.cityName || existingData.address.city || "");
              setPostalCode(existingData.address.postalCode || existingData.address.postal_code || "");
            }
            
            // Pre-populate identification fields
            if (existingData.identification) {
              console.log('🆔 Identification data:', existingData.identification);
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
            
            // Pre-populate personal info
            if (existingData.personalInfo) {
              console.log('👤 Personal info data:', existingData.personalInfo);
              setPlaceOfBirth(existingData.personalInfo.placeOfBirth || "");
              setGender(existingData.personalInfo.gender || "");
              setCivilStatus(existingData.personalInfo.civilStatus || "");
              setNationality(existingData.personalInfo.nationality || "");
              setMotherMaidenName(existingData.personalInfo.motherMaidenName || "");
            } else {
              console.log('⚠️ No personalInfo in existing data');
            }
            
            // Pre-populate employment info
            if (existingData.employmentInfo) {
              setEmployerName(existingData.employmentInfo.employerName || "");
              setOccupation(existingData.employmentInfo.occupation || "");
              setEmployerAddress(existingData.employmentInfo.employerAddress || "");
              setSourceOfIncome(existingData.employmentInfo.sourceOfIncome || "");
              setMonthlyIncome(existingData.employmentInfo.monthlyIncome?.toString() || "");
            }
            
            // Pre-populate emergency contact
            if (existingData.emergencyContact) {
              setEmergencyContactName(existingData.emergencyContact.name || "");
              setEmergencyContactRelationship(existingData.emergencyContact.relationship || "");
              setEmergencyContactPhone(existingData.emergencyContact.phone || "");
              setEmergencyContactAddress(existingData.emergencyContact.address || "");
            }
            
          // Pre-populate PEP status
          if (typeof existingData.pepStatus === 'boolean') {
            setPepStatus(existingData.pepStatus);
          }
        }
      } catch (error) {
        console.error('Error fetching existing account data:', error);
      }
    };

    fetchExistingData();
  }, []);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine if user is from Philippines
    const isPhilippines = countryIso === 'PH';
    
    // Validation for mandatory fields (excluding nationalId which is conditional)
    const requiredFields = [
      { field: firstName, name: "firstName" },
      { field: lastName, name: "lastName" },
      { field: tin, name: "tin" },
      { field: street, name: "street" },
      { field: barangay, name: "barangay" },
      { field: countryIso, name: "countryIso" },
      { field: stateIso, name: "stateIso" },
      { field: cityName, name: "cityName" },
      { field: postalCode, name: "postalCode" },
      { field: placeOfBirth, name: "placeOfBirth" },
      { field: gender, name: "gender" },
      { field: civilStatus, name: "civilStatus" },
      { field: nationality, name: "nationality" },
      { field: motherMaidenName, name: "motherMaidenName" },
      { field: employerName, name: "employerName" },
      { field: occupation, name: "occupation" },
      { field: employerAddress, name: "employerAddress" },
      { field: sourceOfIncome, name: "sourceOfIncome" },
      { field: monthlyIncome, name: "monthlyIncome" },
      { field: emergencyContactName, name: "emergencyContactName" },
      { field: emergencyContactRelationship, name: "emergencyContactRelationship" },
      { field: emergencyContactPhone, name: "emergencyContactPhone" },
      { field: emergencyContactAddress, name: "emergencyContactAddress" },
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

    // Conditional validation based on country
    if (isPhilippines) {
      // Philippines: National ID is required
      if (!nationalId || nationalId.trim() === "") {
        errors["nationalId"] = true;
        hasErrors = true;
      }
      if (!nationalIdFile) {
        errors["nationalIdFile"] = true;
        hasErrors = true;
      }
    } else {
      // Non-Philippines: Passport is required
      if (!passport || passport.trim() === "") {
        errors["passport"] = true;
        hasErrors = true;
      }
      if (!passportFile) {
        errors["passportFile"] = true;
        hasErrors = true;
      }
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
        // Personal profile
        firstName,
        middleName,
        lastName,
        suffixName,
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
                  Your personal details, identification, and address from your investor account have been automatically filled. You can review and update them if needed. Just add your borrower-specific details to complete registration.
                </p>
              </div>
            </div>
          )}

          {/* Personal Profile */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xl md:text-2xl font-semibold">Personal Profile</h3>
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
              {/* First Name */}
              <ValidatedInput
                label="First Name"
                required
                hasError={validationErrors.firstName}
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
                hasError={validationErrors.lastName}
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

          {/* Identification */}
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
                hasError={validationErrors.nationalId}
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="Enter here"
              />
              {/* Upload ID Copy */}
              <ValidatedFileUpload
                label={`Upload ID Copy${countryIso === 'PH' ? '*' : ''}`}
                required={countryIso === 'PH'}
                hasError={validationErrors.nationalIdFile}
                file={nationalIdFile}
                onFileChange={setNationalIdFile}
                buttonText="Upload"
              />
              {countryIso === 'PH' && (
                <p className="text-sm text-amber-600 -mt-2">
                  📌 Required for Philippines residents
                </p>
              )}
              {/* Passport */}
              <div className="space-y-2">
                <Label>Passport Number{countryIso && countryIso !== 'PH' ? '*' : ''}</Label>
                <Input
                  required={!!(countryIso && countryIso !== 'PH')}
                  value={passport}
                  onChange={e => setPassport(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
                {countryIso && countryIso !== 'PH' ? (
                  <p className="text-sm text-amber-600">
                    📌 Required for non-Philippines residents
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    (required for funding of &gt;Php100,000)
                  </p>
                )}
              </div>
              {/* Upload Passport */}
              <ValidatedFileUpload
                label={`Upload Passport Copy${countryIso && countryIso !== 'PH' ? '*' : ''}`}
                required={!!(countryIso && countryIso !== 'PH')}
                hasError={validationErrors.passportFile}
                file={passportFile}
                onFileChange={setPassportFile}
                buttonText="Upload"
              />
              {/* TIN */}
              <div className="sm:col-span-2">
                <ValidatedInput
                  label="TIN"
                  required
                  hasError={validationErrors.tin}
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  placeholder="Enter here"
                />
              </div>
            </div>
          </section>

          {/* Personal Information - Individual only */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xl md:text-2xl font-semibold">
                Personal Information
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
              {/* Place of Birth */}
              <ValidatedInput
                label="Place of Birth"
                required
                hasError={validationErrors.placeOfBirth}
                value={placeOfBirth}
                onChange={(e) => setPlaceOfBirth(e.target.value)}
                placeholder="Enter place of birth"
              />
              {/* Gender */}
              <ValidatedSelect
                label="Gender"
                required
                hasError={validationErrors.gender}
                value={gender}
                onValueChange={setGender}
                placeholder="Select gender"
              >
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </ValidatedSelect>
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
              <ValidatedInput
                label="Employer/Company Name"
                required
                hasError={validationErrors.employerName}
                value={employerName}
                onChange={(e) => setEmployerName(e.target.value)}
                placeholder="Enter employer name"
              />
              {/* Occupation */}
              <ValidatedInput
                label="Occupation/Position"
                required
                hasError={validationErrors.occupation}
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="Enter occupation"
              />
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
            <Button type="submit" className="w-full md:w-1/3 h-14 bg-[#0C4B20] hover:bg-[#8FB200] rounded-2xl font-medium">
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