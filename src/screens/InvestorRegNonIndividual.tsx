import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRegistration } from "../contexts/RegistrationContext";
import { Country, State, City } from "country-state-city";
import { getPsgcCitiesMunicipalities, getPsgcProvinces } from "../lib/psgc";
import { Testimonials } from "../screens/LogIn/Testimonials";
import { auth } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { ValidatedInput, ValidatedSelect, ValidatedFileUpload } from "../components/ValidatedFormFields";
import {
  SelectItem,
} from "../components/ui/select";
import { ArrowLeftIcon } from "lucide-react";

export const InvestorRegNonIndividual = (): JSX.Element => {
  const location = useLocation();
  const initialAccountType = location.state?.accountType || "non-individual";
  const [accountType] = useState(initialAccountType);

  // Entity Information
  const [entityType, setEntityType] = useState("");
  const [otherEntityType, setOtherEntityType] = useState("");
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

  // Address
  const [street, setStreet] = useState("");
  const [barangay, setBarangay] = useState("");

  // Location selects
  const [countryIso, setCountryIso] = useState("");
  const [stateIso, setStateIso] = useState("");
  const [cityName, setCityName] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [phProvinces, setPhProvinces] = useState<Array<{ code: string; name: string }>>([]);
  const [phCities, setPhCities] = useState<Array<{ code: string; name: string }>>([]);

  // Track if we have existing account data
  const [hasExistingAccount, setHasExistingAccount] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    let hasErrors = false;

    // Required fields validation
    // If "Others" is selected, require the custom entity type field
    if (entityType === "Others" && (!otherEntityType || otherEntityType.trim() === "")) {
      newErrors["otherEntityType"] = true;
      hasErrors = true;
    }

    const requiredFields = [
      { value: entityType, name: "entityType" },
      { value: entityName, name: "entityName" },
      { value: registrationNumber, name: "registrationNumber" },
      { value: tin, name: "tin" },
      { value: contactPersonName, name: "contactPersonName" },
      { value: contactPersonPosition, name: "contactPersonPosition" },
      { value: contactPersonEmail, name: "contactPersonEmail" },
      { value: contactPersonPhone, name: "contactPersonPhone" },
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
    if (!registrationCertFile) {
      newErrors["registrationCertFile"] = true;
      hasErrors = true;
    }
    if (!tinCertFile) {
      newErrors["tinCertFile"] = true;
      hasErrors = true;
    }
    if (!authorizationFile) {
      newErrors["authorizationFile"] = true;
      hasErrors = true;
    }

    setErrors(newErrors);
    return !hasErrors;
  };

  const countries = Country.getAllCountries();
  const states: Array<{ isoCode: string; name: string }> = countryIso
    ? countryIso === "PH"
      ? phProvinces.map((province) => ({ isoCode: province.code, name: province.name }))
      : State.getStatesOfCountry(countryIso).map((state) => ({ isoCode: state.isoCode, name: state.name }))
    : [];
  const cities: Array<{ name: string }> = stateIso
    ? countryIso === "PH"
      ? phCities.map((city) => ({ name: city.name }))
      : City.getCitiesOfState(countryIso, stateIso).map((city) => ({ name: city.name }))
    : [];

  const { setRegistration } = useRegistration();
  const navigate = useNavigate();

  useEffect(() => {
    if (countryIso !== "PH") {
      setPhProvinces([]);
      return;
    }

    let cancelled = false;
    getPsgcProvinces()
      .then((provinces) => {
        if (!cancelled) {
          setPhProvinces(provinces);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPhProvinces([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [countryIso]);

  useEffect(() => {
    if (countryIso !== "PH" || !stateIso) {
      setPhCities([]);
      return;
    }

    let cancelled = false;
    getPsgcCitiesMunicipalities(stateIso)
      .then((citiesMunicipalities) => {
        if (!cancelled) {
          setPhCities(citiesMunicipalities);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPhCities([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [countryIso, stateIso]);

  // Fetch existing account data if user already has a borrower account
  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const token = await user.getIdToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const fullUrl = `${apiUrl}/api/profile/existing-account-data?targetAccountType=investor`;
        
        console.log('🔍 [INVESTOR-NON-IND] Fetching existing account data from:', fullUrl);
        console.log('👤 [INVESTOR-NON-IND] User authenticated:', !!user);
        console.log('🔑 [INVESTOR-NON-IND] Token exists:', !!token);
        
        const response = await fetch(fullUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('📡 [INVESTOR-NON-IND] Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [INVESTOR-NON-IND] Failed to fetch existing account data:', response.status, errorText);
          return;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const htmlText = await response.text();
          console.error('❌ [INVESTOR-NON-IND] Expected JSON but got HTML:', htmlText.substring(0, 200));
          return;
        }

        const data = await response.json();
        console.log('📦 [INVESTOR-NON-IND] Received existing account data:', data);
        
        if (data.hasExistingAccount && data.existingData) {
          const existingData = data.existingData;
          console.log('✅ [INVESTOR-NON-IND] Has existing account data, pre-populating fields...');
          setHasExistingAccount(true);
          
          // Pre-populate entity information (non-individual specific)
          if (existingData.entityInfo) {
            console.log('🏢 [INVESTOR-NON-IND] Entity info data:', existingData.entityInfo);
            setEntityType(existingData.entityInfo.entityType || "");
            setEntityName(existingData.entityInfo.entityName || "");
            setRegistrationNumber(existingData.entityInfo.registrationNumber || "");
            setTin(existingData.entityInfo.tin || "");
            setContactPersonName(existingData.entityInfo.contactPersonName || "");
            setContactPersonPosition(existingData.entityInfo.contactPersonPosition || "");
            setContactPersonEmail(existingData.entityInfo.contactPersonEmail || "");
            setContactPersonPhone(existingData.entityInfo.contactPersonPhone || "");
          }
          
          // Pre-populate address fields
          if (existingData.address) {
            console.log('📍 [INVESTOR-NON-IND] Address data:', existingData.address);
            setStreet(existingData.address.street || existingData.address.present_address || "");
            setBarangay(existingData.address.barangay || "");
            setCountryIso(existingData.address.countryIso || existingData.address.country_iso || "");
            setStateIso(existingData.address.stateIso || existingData.address.state_iso || "");
            setCityName(existingData.address.cityName || existingData.address.city || "");
            setPostalCode(existingData.address.postalCode || existingData.address.postal_code || "");
          }
          
          // Convert base64 images to File objects for file uploads
          if (existingData.files) {
            if (existingData.files.registrationCertFile) {
              fetch(existingData.files.registrationCertFile)
                .then(res => res.blob())
                .then(blob => {
                  const file = new File([blob], 'registration-cert.pdf', { type: 'application/pdf' });
                  setRegistrationCertFile(file);
                })
                .catch(err => console.error('❌ [INVESTOR-NON-IND] Error converting registration cert:', err));
            }
            
            if (existingData.files.tinCertFile) {
              fetch(existingData.files.tinCertFile)
                .then(res => res.blob())
                .then(blob => {
                  const file = new File([blob], 'tin-cert.pdf', { type: 'application/pdf' });
                  setTinCertFile(file);
                })
                .catch(err => console.error('❌ [INVESTOR-NON-IND] Error converting tin cert:', err));
            }
            
            if (existingData.files.authorizationFile) {
              fetch(existingData.files.authorizationFile)
                .then(res => res.blob())
                .then(blob => {
                  const file = new File([blob], 'authorization.pdf', { type: 'application/pdf' });
                  setAuthorizationFile(file);
                })
                .catch(err => console.error('❌ [INVESTOR-NON-IND] Error converting authorization:', err));
            }
          }
        }
      } catch (error) {
        console.error('❌ [INVESTOR-NON-IND] Error fetching existing account data:', error);
      }
    };

    fetchExistingData();
  }, []);

  // Entity type options for investors (matching borrower categories)
  const entityTypes = [
    "Sole Proprietor",
    "Corporation",
    "NGO",
    "Foundation",
    "Educational Institution",
    "Others"
  ];

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
        entityType: entityType === "Others" ? otherEntityType : entityType,
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
            <div className="w-12 h-12 bg-[#0C4B20] rounded-lg flex items-center justify-center">
              <img className="w-10 h-10" src="/investor-1.png" alt="Investor" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Invest/Lender - Entity Registration</h2>
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
                  Your entity details and address from your borrower account have been automatically filled. You can review and update them if needed.
                </p>
              </div>
            </div>
          )}

          {/* Entity Type Selection */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xl md:text-2xl font-semibold">Entity Information</h3>
              {hasExistingAccount && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  Auto-filled
                </span>
              )}
            </div>
            <ValidatedSelect
              label="Entity Type"
              required
              hasError={errors.entityType}
              value={entityType}
              onValueChange={setEntityType}
              placeholder="Select entity type"
            >
              {entityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </ValidatedSelect>
            {entityType === "Others" && (
              <div className="mt-3">
                <ValidatedInput
                  label="Please specify entity type"
                  required
                  hasError={errors.otherEntityType}
                  value={otherEntityType}
                  onChange={(e) => setOtherEntityType(e.target.value)}
                  placeholder="Enter your entity type"
                />
              </div>
            )}
          </section>

          {/* Entity Details */}
          <section className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Entity Name */}
              <div className="sm:col-span-2">
                <ValidatedInput
                  label="Entity/Business Name"
                  required
                  hasError={errors.entityName}
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  placeholder="Enter entity name"
                />
              </div>

              {/* Registration Number */}
              <ValidatedInput
                label="Registration Number"
                required
                hasError={errors.registrationNumber}
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="Enter registration number"
              />

              {/* TIN */}
              <ValidatedInput
                label="TIN (Tax Identification Number)"
                required
                hasError={errors.tin}
                value={tin}
                onChange={(e) => setTin(e.target.value)}
                placeholder="Enter TIN"
              />
            </div>
          </section>

          {/* Contact Person */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold">Authorized Contact Person</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Contact Person Name */}
              <ValidatedInput
                label="Full Name"
                required
                hasError={errors.contactPersonName}
                value={contactPersonName}
                onChange={(e) => setContactPersonName(e.target.value)}
                placeholder="Enter contact person's name"
              />

              {/* Position */}
              <ValidatedInput
                label="Position/Title"
                required
                hasError={errors.contactPersonPosition}
                value={contactPersonPosition}
                onChange={(e) => setContactPersonPosition(e.target.value)}
                placeholder="Enter position or title"
              />

              {/* Email */}
              <ValidatedInput
                label="Email Address"
                required
                hasError={errors.contactPersonEmail}
                type="email"
                value={contactPersonEmail}
                onChange={(e) => setContactPersonEmail(e.target.value)}
                placeholder="Enter email address"
              />

              {/* Phone */}
              <ValidatedInput
                label="Phone Number"
                required
                hasError={errors.contactPersonPhone}
                type="tel"
                value={contactPersonPhone}
                onChange={(e) => setContactPersonPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
          </section>

          {/* Document Uploads */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold">Required Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Registration Certificate */}
              <ValidatedFileUpload
                label="Registration Certificate"
                required
                hasError={errors.registrationCertFile}
                file={registrationCertFile}
                onFileChange={setRegistrationCertFile}
                buttonText="Upload Certificate"
              />

              {/* TIN Certificate */}
              <ValidatedFileUpload
                label="TIN Certificate"
                required
                hasError={errors.tinCertFile}
                file={tinCertFile}
                onFileChange={setTinCertFile}
                buttonText="Upload TIN Certificate"
              />

              {/* Authorization Letter */}
              <div className="sm:col-span-2">
                <ValidatedFileUpload
                  label="Authorization Letter"
                  required
                  hasError={errors.authorizationFile}
                  file={authorizationFile}
                  onFileChange={setAuthorizationFile}
                  buttonText="Upload Authorization Letter"
                />
              </div>
            </div>
          </section>

          {/* Address Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">Business Address</h3>
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
                  label="Street Address"
                  required
                  hasError={errors.street}
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Enter street address"
                />
              </div>

              {/* Barangay */}
              <ValidatedInput
                label="Barangay"
                required
                hasError={errors.barangay}
                value={barangay}
                onChange={(e) => setBarangay(e.target.value)}
                placeholder="Enter barangay"
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
                placeholder="Enter postal code"
              />
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              className="w-full sm:w-auto bg-[#0C4B20] hover:bg-[#8FB200] text-white font-semibold px-8 py-3 rounded-2xl h-14"
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
