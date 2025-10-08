import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "../contexts/RegistrationContext";
import { authFetch } from "../lib/api";
import { API_BASE_URL } from '../config/environment';
import { useAccount } from "../contexts/AccountContext";
import { useAuth } from "../contexts/AuthContext";
import { Testimonials } from "../screens/LogIn/Testimonials";
import { Button } from "../components/ui/button";
import { ValidatedInput, ValidatedSelect } from "../components/ValidatedFormFields";
import {
  SelectItem,
} from "../components/ui/select";
import { ArrowLeftIcon } from "lucide-react";

export const InvestorRegBankDetails = (): JSX.Element => {
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [iban, setIban] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    let hasErrors = false;

    // Required fields validation
    const requiredFields = [
      { value: accountName, name: "accountName" },
      { value: bankName, name: "bankName" },
      { value: accountType, name: "accountType" },
      { value: accountNumber, name: "accountNumber" },
      { value: iban, name: "iban" },
      { value: swiftCode, name: "swiftCode" },
    ];

    requiredFields.forEach(({ value, name }) => {
      if (!value || value.trim() === "") {
        newErrors[name] = true;
        hasErrors = true;
      }
    });

    // Account number format validation
    if (accountNumber && accountNumber.length < 5) {
      newErrors["accountNumber"] = true;
      hasErrors = true;
    }

    setErrors(newErrors);
    return !hasErrors;
  };

  const { registration, setRegistration } = useRegistration();
  const { refreshAccounts, setAccountType: setUserAccountType } = useAccount();
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  const bankAccountTypes = [
    "Savings Account",
    "Current Account", 
    "Time Deposit",
    "Investment Account"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate the form
      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }

      // Save bank details to context first
      const updatedRegistration = {
        ...registration,
        bankDetails: {
          accountName,
          bankName,
          accountType,
          accountNumber,
          iban,
          swiftCode,
        },
      };
      
      setRegistration(updatedRegistration);

      // Helper function to convert File to base64
      const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
      };

      // Determine if this is an individual or non-individual account
      const isIndividual = updatedRegistration.accountType !== 'non-individual';
      console.log('📋 Account type from registration:', updatedRegistration.accountType);
      console.log('✅ Is individual account:', isIndividual);
      
      // Convert document files to base64 if they exist
      let nationalIdFileBase64 = null;
      let passportFileBase64 = null;
      let registrationCertFileBase64 = null;
      let tinCertFileBase64 = null;
      let authorizationFileBase64 = null;
      
      if (updatedRegistration.files?.nationalIdFile) {
        try {
          nationalIdFileBase64 = await fileToBase64(updatedRegistration.files.nationalIdFile);
          console.log('✅ National ID file converted to base64');
        } catch (error) {
          console.error('❌ Error converting National ID file:', error);
        }
      }
      
      if (updatedRegistration.files?.passportFile) {
        try {
          passportFileBase64 = await fileToBase64(updatedRegistration.files.passportFile);
          console.log('✅ Passport file converted to base64');
        } catch (error) {
          console.error('❌ Error converting Passport file:', error);
        }
      }
      
      // Convert non-individual entity files if this is a non-individual account
      if (!isIndividual) {
        if (updatedRegistration.files?.registrationCertFile) {
          try {
            registrationCertFileBase64 = await fileToBase64(updatedRegistration.files.registrationCertFile);
            console.log('✅ Registration cert file converted to base64');
          } catch (error) {
            console.error('❌ Error converting registration cert file:', error);
          }
        }
        
        if (updatedRegistration.files?.tinCertFile) {
          try {
            tinCertFileBase64 = await fileToBase64(updatedRegistration.files.tinCertFile);
            console.log('✅ TIN cert file converted to base64');
          } catch (error) {
            console.error('❌ Error converting TIN cert file:', error);
          }
        }
        
        if (updatedRegistration.files?.authorizationFile) {
          try {
            authorizationFileBase64 = await fileToBase64(updatedRegistration.files.authorizationFile);
            console.log('✅ Authorization file converted to base64');
          } catch (error) {
            console.error('❌ Error converting authorization file:', error);
          }
        }
      }
      
      // Prepare KYC data from the complete registration
      const kycData = {
        // Basic details
        isIndividualAccount: isIndividual,
        
        // Personal details (only for individual accounts)
        firstName: isIndividual ? (updatedRegistration.details?.firstName || '') : '',
        middleName: updatedRegistration.details?.middleName || '',
        lastName: updatedRegistration.details?.lastName || '',
        suffixName: updatedRegistration.details?.suffixName || '',
        placeOfBirth: updatedRegistration.details?.placeOfBirth || '',
        gender: updatedRegistration.details?.gender || '',
        civilStatus: updatedRegistration.details?.civilStatus || '',
        nationality: updatedRegistration.details?.nationality || '',
        contactEmail: updatedRegistration.details?.contactEmail || '',
        
        // Address information
        street: updatedRegistration.details?.street || '',
        barangay: updatedRegistration.details?.barangay || '',
        city: updatedRegistration.details?.cityName || '',
        state: updatedRegistration.details?.stateIso || '',
        country: updatedRegistration.details?.countryIso || '',
        postalCode: updatedRegistration.details?.postalCode || '',
        
        // Identity verification
        nationalId: updatedRegistration.details?.nationalId || '',
        passport: updatedRegistration.details?.passport || '',
        tin: updatedRegistration.details?.tin || '',
        secondaryIdType: updatedRegistration.details?.secondaryIdType || '',
        secondaryIdNumber: updatedRegistration.details?.secondaryIdNumber || '',
        
        // Document files (base64 encoded)
        nationalIdFile: nationalIdFileBase64,
        passportFile: passportFileBase64,
        
        // Emergency contact
        emergencyContactName: updatedRegistration.details?.emergencyContactName || '',
        emergencyContactRelationship: updatedRegistration.details?.emergencyContactRelationship || '',
        emergencyContactPhone: updatedRegistration.details?.emergencyContactPhone || '',
        emergencyContactEmail: updatedRegistration.details?.emergencyContactEmail || '',
        
        // Entity fields (for non-individual accounts)
        entityType: !isIndividual ? (updatedRegistration.details?.entityType || null) : null,
        entityName: !isIndividual ? (updatedRegistration.details?.entityName || null) : null,
        registrationNumber: !isIndividual ? (updatedRegistration.details?.registrationNumber || null) : null,
        contactPersonName: !isIndividual ? (updatedRegistration.details?.contactPersonName || null) : null,
        contactPersonPosition: !isIndividual ? (updatedRegistration.details?.contactPersonPosition || null) : null,
        contactPersonEmail: !isIndividual ? (updatedRegistration.details?.contactPersonEmail || null) : null,
        contactPersonPhone: !isIndividual ? (updatedRegistration.details?.contactPersonPhone || null) : null,
        
        // Business fields (set to null for individual investors)
        businessRegistrationType: null,
        businessRegistrationNumber: null,
        businessRegistrationDate: null,
        corporateTin: null,
        natureOfBusiness: null,
        principalOfficeStreet: null,
        principalOfficeBarangay: null,
        principalOfficeMunicipality: null,
        principalOfficeProvince: null,
        principalOfficeCountry: null,
        principalOfficePostalCode: null,
        gisTotalAssets: null,
        gisTotalLiabilities: null,
        gisPaidUpCapital: null,
        gisNumberOfStockholders: null,
        gisNumberOfEmployees: null,
        
        // File uploads for non-individual accounts
        registrationCertFile: !isIndividual ? registrationCertFileBase64 : null,
        tinCertFile: !isIndividual ? tinCertFileBase64 : null,
        authorizationFile: !isIndividual ? authorizationFileBase64 : null,
        
        // PEP status
        isPoliticallyExposedPerson: false,
        pepDetails: null,
        
        // Bank account details
        account_name: accountName,
        bank_name: bankName,
        account_type: accountType,
        account_number: accountNumber,
        iban: iban,
        swift_code: swiftCode,
        
        // Authorized signatory (null for individual)
        authorizedSignatoryName: null,
        authorizedSignatoryPosition: null,
        authorizedSignatoryIdType: null,
        authorizedSignatoryIdNumber: null,
      };

      console.log('📝 Sending investor KYC data:', kycData);

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

      console.log('✅ Investor KYC completed successfully');
      
      // IMPORTANT: Set current account type to investor immediately after successful registration
      // This prevents sidebar/navigation issues during the transition
      setAccountType('investor');
      
      // Refresh both account data and user profile
      await refreshAccounts();
      await refreshProfile(); // This will update the user role in AuthContext
      
      // Navigate to investor dashboard
      navigate("/investor/discover");
    } catch (error) {
      console.error('❌ Error completing investor registration:', error);
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
              <img className="w-10 h-10" src="/investor-1.png" alt="Investor" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Invest/Lender</h2>
          </div>

          {/* Bank Details */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Bank Details</h3>
            <div className="space-y-4">
              {/* Account Name */}
              <ValidatedInput
                label="Account Name"
                required
                hasError={errors.accountName}
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Enter here"
              />

              {/* Bank Name */}
              <ValidatedInput
                label="Bank Name"
                required
                hasError={errors.bankName}
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Enter bank name"
              />

              {/* Account Type */}
              <ValidatedSelect
                label="Account Type"
                required
                hasError={errors.accountType}
                value={accountType}
                onValueChange={setAccountType}
                placeholder="Select account type"
              >
                {bankAccountTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </ValidatedSelect>

              {/* Account Number */}
              <ValidatedInput
                label="Account Number"
                required
                hasError={errors.accountNumber}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter here"
                errorMessage={errors.accountNumber && accountNumber.length > 0 && accountNumber.length < 5 ? "Minimum 5 digits required" : undefined}
              />

              {/* IBAN */}
              <ValidatedInput
                label="IBAN"
                required
                hasError={errors.iban}
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="Enter here"
              />

              {/* SWIFT Code */}
              <ValidatedInput
                label="SWIFT Code"
                required
                hasError={errors.swiftCode}
                value={swiftCode}
                onChange={(e) => setSwiftCode(e.target.value)}
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
              {isSubmitting ? "Creating Account..." : "Complete"}
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
