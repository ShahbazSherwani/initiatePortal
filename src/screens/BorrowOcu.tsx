// BorrowerOccupation.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAccount } from "../contexts/AccountContext";
import { useRegistration } from "../contexts/RegistrationContext";
import { authFetch } from "../lib/api";
import { API_BASE_URL } from '../config/environment';
import { generateBorrowerCode } from "../lib/profileUtils";
import { Testimonials } from "../screens/LogIn/Testimonials";
import { ArrowLeftIcon, HandCoins} from "lucide-react";
import { toast } from "react-hot-toast";

export const BorrowerOccupation: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, setProfile, refreshProfile } = useAuth();
  const { createAccount, refreshAccounts, setAccountType } = useAccount();
  const { registration } = useRegistration();

  // State variables
  const [selectedGroup, setSelectedGroup] = useState<string>("agriculture");
  const [borrowerCode, setBorrowerCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // Generate borrower code automatically when component mounts
  useEffect(() => {
    if (user?.uid) {
      // Determine account type based on current user role or default to borrower
      const accountType = 'borrower'; // This should come from user context/role
      const code = generateBorrowerCode(user.uid, accountType);
      setBorrowerCode(code);
    }
  }, [user]);

  // Group type mapping for API (simplified - just for display)
  const groupTypeMapping: Record<string, string> = {
    "agriculture": "Agriculture",
    "hospitality": "Hospitality",
    "food": "Food & Beverages",
    "retail": "Retail",
    "medical": "Medical & Pharmaceutical",
    "construction": "Construction",
    "others": "Others"
  };

  // Handle form submission - now completes registration directly
  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please log in to continue");
      return;
    }

    if (!borrowerCode) {
      toast.error("Borrower code not available. Please try refreshing the page.");
      return;
    }

    setIsSubmitting(true);

    try {
      // First save borrower info
      const response = await authFetch('/api/profile/update-borrower-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          industryType: groupTypeMapping[selectedGroup],
          borrowerCode: borrowerCode,
          industryKey: selectedGroup
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save borrower information');
      }

      // Create the borrower account with registration data
      console.log('📝 Creating borrower account with registration data:', registration);
      await createAccount('borrower', {
        fullName: profile?.name || 'User',
        occupation: registration.details?.occupation || groupTypeMapping[selectedGroup],
        businessType: registration.accountType || 'individual',
        location: registration.details?.cityName || registration.details?.location,
        phoneNumber: registration.details?.phoneNumber,
        dateOfBirth: registration.details?.dateOfBirth,
        experience: registration.details?.experience
      });
      
      console.log('✅ Borrower account created successfully');
      
      // Mark registration as complete in profile
      setProfile((prev: any) => ({
        ...prev,
        hasCompletedRegistration: true
      }));
      
      // Helper function to convert File to base64
      const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
      };

      // Convert document files to base64 if they exist
      let nationalIdFileBase64 = null;
      let passportFileBase64 = null;
      let registrationCertFileBase64 = null;
      let tinCertFileBase64 = null;
      let authorizationFileBase64 = null;
      
      if (registration.files?.nationalIdFile) {
        try {
          nationalIdFileBase64 = await fileToBase64(registration.files.nationalIdFile);
        } catch (error) {
          console.error('Error converting National ID file:', error);
        }
      }
      
      if (registration.files?.passportFile) {
        try {
          passportFileBase64 = await fileToBase64(registration.files.passportFile);
        } catch (error) {
          console.error('Error converting Passport file:', error);
        }
      }
      
      // Convert non-individual entity files if applicable
      const isIndividual = registration.accountType !== 'non-individual';
      
      if (!isIndividual) {
        if (registration.files?.registrationCertFile) {
          try {
            registrationCertFileBase64 = await fileToBase64(registration.files.registrationCertFile);
          } catch (error) {
            console.error('Error converting registration cert file:', error);
          }
        }
        
        if (registration.files?.tinCertFile) {
          try {
            tinCertFileBase64 = await fileToBase64(registration.files.tinCertFile);
          } catch (error) {
            console.error('Error converting TIN cert file:', error);
          }
        }
        
        if (registration.files?.authorizationFile) {
          try {
            authorizationFileBase64 = await fileToBase64(registration.files.authorizationFile);
          } catch (error) {
            console.error('Error converting authorization file:', error);
          }
        }
      }
      
      // Prepare registration data for complete-kyc endpoint
      const kycData = {
        isIndividualAccount: isIndividual,
        
        // Personal information
        firstName: registration.details?.firstName || profile?.name?.split(' ')[0] || null,
        lastName: registration.details?.lastName || profile?.name?.split(' ').slice(1).join(' ') || null,
        middleName: registration.details?.middleName || null,
        dateOfBirth: registration.details?.dateOfBirth || null,
        phoneNumber: registration.details?.phoneNumber || null,
        mobileNumber: registration.details?.mobileNumber || registration.details?.phoneNumber || null,
        emailAddress: profile?.email || registration.details?.email || null,
        
        // Address information
        street: registration.details?.street || null,
        barangay: registration.details?.barangay || null,
        city: registration.details?.city || registration.details?.cityName || null,
        state: registration.details?.state || registration.details?.stateIso || null,
        country: registration.details?.country || registration.details?.countryIso || null,
        postalCode: registration.details?.postalCode || null,
        
        // Identification documents
        nationalId: registration.details?.nationalId || null,
        passport: registration.details?.passport || null,
        tin: registration.details?.tin || null,
        
        // Document files
        nationalIdFile: nationalIdFileBase64,
        passportFile: passportFileBase64,
        
        // Employment information
        occupation: registration.details?.occupation || groupTypeMapping[selectedGroup] || null,
        natureOfBusiness: groupTypeMapping[selectedGroup] || null,
        
        // Individual account fields
        placeOfBirth: isIndividual ? registration.details?.placeOfBirth || null : null,
        gender: isIndividual ? registration.details?.gender || null : null,
        civilStatus: isIndividual ? registration.details?.civilStatus || null : null,
        nationality: isIndividual ? registration.details?.nationality || null : null,
        
        // Entity info for non-individual
        entityType: !isIndividual ? registration.details?.entityType : null,
        entityName: !isIndividual ? registration.details?.entityName : null,
        registrationNumber: !isIndividual ? registration.details?.registrationNumber : null,
        contactPersonName: !isIndividual ? registration.details?.contactPersonName : null,
        contactPersonPosition: !isIndividual ? registration.details?.contactPersonPosition : null,
        contactPersonEmail: !isIndividual ? registration.details?.contactPersonEmail : null,
        contactPersonPhone: !isIndividual ? registration.details?.contactPersonPhone : null,
        
        // Entity document files
        registrationCertFile: !isIndividual ? registrationCertFileBase64 : null,
        tinCertFile: !isIndividual ? tinCertFileBase64 : null,
        authorizationFile: !isIndividual ? authorizationFileBase64 : null,
        
        // Bank account details - not required in registration flow anymore
        account_name: null,
        bank_name: null,
        account_type: null,
        account_number: null,
        iban: null,
        swift_code: null
      };
      
      // Sanitize KYC payload
      const sanitizedKyc: any = {};
      Object.entries(kycData).forEach(([key, value]) => {
        if (value === undefined) return;
        if (typeof value === 'string') {
          const trimmed = value.trim();
          sanitizedKyc[key] = trimmed === '' ? null : trimmed;
        } else {
          sanitizedKyc[key] = value;
        }
      });

      console.log('📝 Completing borrower registration without bank details');

      // Send registration data to complete-kyc endpoint
      await authFetch(`${API_BASE_URL}/profile/complete-kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountType: 'borrower',
          kycData: sanitizedKyc
        })
      });
      
      console.log('✅ Registration completed');
      
      // Set current account type to borrower
      setAccountType('borrower');
      
      // Refresh both account data and user profile
      await refreshAccounts();
      await refreshProfile();
      
      toast.success("Registration completed successfully!");
      
      // Show thank you message
      setShowThankYou(true);
      
      // Redirect after delay
      setTimeout(() => {
        navigate("/borrow");
      }, 2000);
    } catch (error) {
      console.error("Error completing registration:", error);
      toast.error("Failed to complete registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupOptions = [
    { key: "agriculture", label: "Agriculture" },
    { key: "hospitality", label: "Hospitality" },
    { key: "food", label: "Food & Beverages" },
    { key: "retail", label: "Retail" },
    { key: "medical", label: "Medical & Pharmaceutical" },
    { key: "construction", label: "Construction" },
    { key: "others", label: "Others" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Thank You Modal */}
      {showThankYou && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl p-10 flex flex-col items-center shadow-xl">
            <div className="bg-[#0C4B20] rounded-full p-4 mb-4">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-2">Thank You!</h2>
            <p className="text-center text-lg text-gray-700">
              Your registration has been completed successfully!
            </p>
          </div>
        </div>
      )}
      
      <div className="px-4 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      
      <div className="px-4 py-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
          
          <div className="max-w-md">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#0C4B20] p-2 rounded-lg">
                  <HandCoins className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-black">
                  Issue/Borrow
                </h1>
              </div>
            </div>

            <div className="space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Industry</h3>
                <div className="space-y-3">
                  {groupOptions.map((group) => (
                    <label
                      key={group.key}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        name="group"
                        value={group.key}
                        checked={selectedGroup === group.key}
                        onChange={() => setSelectedGroup(group.key)}
                        className="w-4 h-4 text-yellow-400 border-gray-300 rounded focus:ring-yellow-400"
                      />
                      <span className="text-gray-900">{group.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">Borrower/Issuer Code</p>
                
                <div className="p-3 border border-gray-300 rounded-lg bg-white">
                  <p className="text-base font-mono text-gray-900">
                    {borrowerCode || "Generating..."}
                  </p>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !borrowerCode}
                className="w-full bg-[#0C4B20] hover:bg-[#90B200] text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Completing Registration..." : "Complete Registration"}
              </button>
            </div>
          </div>

          <div className="hidden md:block">
            <Testimonials />
          </div>
        </div>
      </div>
    </div>
  );
};