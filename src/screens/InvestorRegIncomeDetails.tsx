import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "../contexts/RegistrationContext";
import { useAuth } from "../contexts/AuthContext";
import { useAccount } from "../contexts/AccountContext";
import { authFetch } from "../lib/api";
import { API_BASE_URL } from '../config/environment';
import { Testimonials } from "../screens/LogIn/Testimonials";
import { Button } from "../components/ui/button";
import { ValidatedSelect } from "../components/ValidatedFormFields";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import {
  SelectItem,
} from "../components/ui/select";
import { ArrowLeftIcon } from "lucide-react";

export const InvestorRegIncomeDetails = (): JSX.Element => {
  // Income Details
  const [grossAnnualIncome, setGrossAnnualIncome] = useState("");
  
  // Sources of Income
  const [businessChecked, setBusinessChecked] = useState(false);
  const [businessSpecify, setBusinessSpecify] = useState("");
  const [investmentsChecked, setInvestmentsChecked] = useState(false);
  const [investmentsSpecify, setInvestmentsSpecify] = useState("");
  const [employmentChecked, setEmploymentChecked] = useState(false);
  const [farmingChecked, setFarmingChecked] = useState(false);
  const [realEstateChecked, setRealEstateChecked] = useState(false);
  const [othersChecked, setOthersChecked] = useState(false);
  
  // Confirmation
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    let hasErrors = false;

    // Required fields validation
    if (!grossAnnualIncome || grossAnnualIncome.trim() === "") {
      newErrors["grossAnnualIncome"] = true;
      hasErrors = true;
    }
    
    if (!confirmationChecked) {
      newErrors["confirmationChecked"] = true;
      hasErrors = true;
    }

    setErrors(newErrors);
    return !hasErrors;
  };

  const { registration, setRegistration } = useRegistration();
  const { refreshAccounts, setAccountType } = useAccount();
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  const incomeRanges = [
    "Below Php 50,000",
    "Php 50,000 - Php 100,000", 
    "Php 100,001 - Php 250,000",
    "Php 250,001 - Php 500,000",
    "Php 500,001 - Php 1,000,000",
    "Above Php 1,000,000"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save income details to registration context
      const updatedRegistration = {
        ...registration,
        incomeDetails: {
          grossAnnualIncome,
          sourcesOfIncome: {
            business: businessChecked ? businessSpecify : null,
            investments: investmentsChecked ? investmentsSpecify : null,
            employment: employmentChecked,
            farming: farmingChecked,
            realEstate: realEstateChecked,
            others: othersChecked,
          },
          confirmationAccepted: confirmationChecked,
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
      
      // Convert document files to base64 if they exist
      let nationalIdFileBase64 = null;
      let passportFileBase64 = null;
      let registrationCertFileBase64 = null;
      let tinCertFileBase64 = null;
      let authorizationFileBase64 = null;
      
      if (updatedRegistration.files?.nationalIdFile) {
        try {
          nationalIdFileBase64 = await fileToBase64(updatedRegistration.files.nationalIdFile);
        } catch (error) {
          console.error('Error converting National ID file:', error);
        }
      }
      
      if (updatedRegistration.files?.passportFile) {
        try {
          passportFileBase64 = await fileToBase64(updatedRegistration.files.passportFile);
        } catch (error) {
          console.error('Error converting Passport file:', error);
        }
      }
      
      // Convert non-individual entity files if this is a non-individual account
      if (!isIndividual) {
        if (updatedRegistration.files?.registrationCertFile) {
          try {
            registrationCertFileBase64 = await fileToBase64(updatedRegistration.files.registrationCertFile);
          } catch (error) {
            console.error('Error converting registration cert file:', error);
          }
        }
        
        if (updatedRegistration.files?.tinCertFile) {
          try {
            tinCertFileBase64 = await fileToBase64(updatedRegistration.files.tinCertFile);
          } catch (error) {
            console.error('Error converting TIN cert file:', error);
          }
        }
        
        if (updatedRegistration.files?.authorizationFile) {
          try {
            authorizationFileBase64 = await fileToBase64(updatedRegistration.files.authorizationFile);
          } catch (error) {
            console.error('Error converting authorization file:', error);
          }
        }
      }
      
      // Prepare KYC data from the complete registration
      const kycData = {
        isIndividualAccount: isIndividual,
        
        // Personal details
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
        
        // File uploads for non-individual accounts
        registrationCertFile: !isIndividual ? registrationCertFileBase64 : null,
        tinCertFile: !isIndividual ? tinCertFileBase64 : null,
        authorizationFile: !isIndividual ? authorizationFileBase64 : null,
        
        // Income details
        grossAnnualIncome: grossAnnualIncome,
        sourceOfIncome: [
          businessChecked ? `Business: ${businessSpecify}` : null,
          investmentsChecked ? `Investments: ${investmentsSpecify}` : null,
          employmentChecked ? 'Employment' : null,
          farmingChecked ? 'Farming' : null,
          realEstateChecked ? 'Real Estate' : null,
          othersChecked ? 'Others' : null,
        ].filter(Boolean).join(', '),
        
        // PEP status
        isPoliticallyExposedPerson: false,
        pepDetails: null,
        
        // Bank details - not required in registration flow anymore
        account_name: null,
        bank_name: null,
        account_type: null,
        account_number: null,
        iban: null,
        swift_code: null,
      };

      console.log('📝 Completing investor registration without bank details');

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
      
      // Set current account type to investor
      setAccountType('investor');
      
      // Refresh both account data and user profile
      await refreshAccounts();
      await refreshProfile();
      
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

          {/* Income Details */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Income Details</h3>
            <div className="space-y-4">
              {/* Gross Annual Income */}
              <ValidatedSelect
                label="Gross Annual Income"
                required
                hasError={errors.grossAnnualIncome}
                value={grossAnnualIncome}
                onValueChange={setGrossAnnualIncome}
                placeholder="Select Range"
              >
                {incomeRanges.map((range) => (
                  <SelectItem key={range} value={range}>
                    {range}
                  </SelectItem>
                ))}
              </ValidatedSelect>
            </div>
          </section>

          {/* Sources of Income */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Sources of Income or Nature of Business
            </h3>
            <div className="space-y-4">
              {/* Business */}
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={businessChecked}
                  onCheckedChange={(checked) => setBusinessChecked(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <Label className="font-medium">Business</Label>
                  {businessChecked && (
                    <Input
                      value={businessSpecify}
                      onChange={e => setBusinessSpecify(e.target.value)}
                      placeholder="Specify"
                      className="h-12 rounded-2xl"
                    />
                  )}
                </div>
              </div>

              {/* Investments */}
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={investmentsChecked}
                  onCheckedChange={(checked) => setInvestmentsChecked(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <Label className="font-medium">Investments</Label>
                  {investmentsChecked && (
                    <Input
                      value={investmentsSpecify}
                      onChange={e => setInvestmentsSpecify(e.target.value)}
                      placeholder="Specify"
                      className="h-12 rounded-2xl"
                    />
                  )}
                </div>
              </div>

              {/* Employment */}
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={employmentChecked}
                  onCheckedChange={(checked) => setEmploymentChecked(checked as boolean)}
                />
                <Label className="font-medium">Employment</Label>
              </div>

              {/* Farming */}
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={farmingChecked}
                  onCheckedChange={(checked) => setFarmingChecked(checked as boolean)}
                />
                <Label className="font-medium">Farming</Label>
              </div>

              {/* Real Estate */}
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={realEstateChecked}
                  onCheckedChange={(checked) => setRealEstateChecked(checked as boolean)}
                />
                <Label className="font-medium">Real Estate</Label>
              </div>

              {/* Others */}
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={othersChecked}
                  onCheckedChange={(checked) => setOthersChecked(checked as boolean)}
                />
                <Label className="font-medium">Others</Label>
              </div>
            </div>
          </section>

          {/* Confirmation */}
          <section className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={confirmationChecked}
                onCheckedChange={(checked) => setConfirmationChecked(checked as boolean)}
                className={`mt-1 ${errors.confirmationChecked ? "border-red-500" : ""}`}
                required
              />
              <Label className={`text-sm leading-relaxed ${errors.confirmationChecked ? "text-red-500" : ""}`}>
                I confirm that the details above are true and Investie will not be held 
                liable for false information, either intentional or not.*
              </Label>
            </div>
            {errors.confirmationChecked && (
              <p className="text-sm text-red-500 ml-7">Confirmation is required</p>
            )}
          </section>

          {/* Complete Button */}
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={!confirmationChecked || isSubmitting}
              className="w-full sm:w-auto bg-[#0C4B20] hover:bg-[#8FB200] text-white font-semibold px-8 py-3 rounded-2xl h-14 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating Account..." : "Complete Registration"}
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
