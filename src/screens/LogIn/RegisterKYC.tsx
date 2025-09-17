// src/screens/LogIn/RegisterKYC.tsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Navbar } from "../../components/Navigation/navbar";
import { KYCForm, KYCFormData } from "../../components/KYCForm";
import { API_BASE_URL } from '../../config/environment';

export const RegisterKYC = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const initialAccountType = (location?.state && (location.state as any).accountType) ? (location.state as any).accountType : 'borrower';
  const [accountType, setAccountType] = useState<'borrower' | 'investor'>(initialAccountType);
  const [error, setError] = useState<string | null>(null);
  
  const [kycData, setKycData] = useState<KYCFormData>({
    isIndividualAccount: undefined, // Force user to choose
    isPoliticallyExposedPerson: false,
    principalOfficeCountry: 'Philippines'
  });

  const totalSteps = 3;

  const validateCurrentStep = (): boolean => {
    setError(null);
    
    if (currentStep === 1) {
      // Step 1: Account type selection validation
      if (kycData.isIndividualAccount === undefined) {
        setError('Please select whether this is an Individual or Business/Corporate account.');
        return false;
      }
      return true;
    }
    
    if (currentStep === 2) {
      // Step 2: KYC form validation
      if (kycData.isIndividualAccount) {
        // Individual account validation
        const required = [
          'placeOfBirth', 'gender', 'civilStatus', 'nationality', 'contactEmail',
          'secondaryIdType', 'secondaryIdNumber', 'emergencyContactName',
          'emergencyContactRelationship', 'emergencyContactPhone'
        ];
        
        for (const field of required) {
          if (!kycData[field as keyof KYCFormData]) {
            setError(`Please fill in all required fields. Missing: ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
            return false;
          }
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(kycData.contactEmail || '')) {
          setError('Please enter a valid contact email address.');
          return false;
        }
        
        if (kycData.emergencyContactEmail && !emailRegex.test(kycData.emergencyContactEmail)) {
          setError('Please enter a valid emergency contact email address.');
          return false;
        }
      } else {
        // Business account validation
        const required = [
          'businessRegistrationType', 'businessRegistrationNumber', 'businessRegistrationDate',
          'corporateTin', 'natureOfBusiness', 'principalOfficeStreet', 'principalOfficeBarangay',
          'principalOfficeMunicipality', 'principalOfficeProvince', 'authorizedSignatoryName',
          'authorizedSignatoryPosition', 'authorizedSignatoryIdType', 'authorizedSignatoryIdNumber'
        ];
        
        for (const field of required) {
          if (!kycData[field as keyof KYCFormData]) {
            setError(`Please fill in all required fields. Missing: ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
            return false;
          }
        }
      }
      
      // PEP validation
      if (kycData.isPoliticallyExposedPerson && !kycData.pepDetails) {
        setError('Please provide PEP details if you are a politically exposed person.');
        return false;
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/register');
    }
  };

  const handleSubmit = async () => {
    setError(null);
    
    try {
      // Get the auth token
      const token = localStorage.getItem('fb_token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      // Sanitize kycData: convert empty strings to null and remove undefined
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

      // Submit KYC data to the backend
      const response = await fetch(`${API_BASE_URL}/profile/complete-kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          accountType,
          kycData: sanitizedKyc
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit KYC information');
      }

      // Navigate to the appropriate dashboard
      navigate(accountType === 'borrower' ? '/borrow' : '/invest');
    } catch (err: any) {
      setError(err.message || 'Failed to submit KYC information. Please try again.');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Type Selection</h2>
              <p className="text-gray-600 mb-6">Choose the type of account you want to create</p>
            </div>
            
            <div className="space-y-4">
              <div 
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                  accountType === 'borrower' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setAccountType('borrower')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Borrower Account</h3>
                    <p className="text-gray-600 mt-1">Create projects and seek funding for your business ventures</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 ${
                    accountType === 'borrower' 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  } flex items-center justify-center`}>
                    {accountType === 'borrower' && <CheckIcon className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </div>
              
              <div 
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                  accountType === 'investor' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setAccountType('investor')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Investor Account</h3>
                    <p className="text-gray-600 mt-1">Invest in promising projects and earn returns</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 ${
                    accountType === 'investor' 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  } flex items-center justify-center`}>
                    {accountType === 'investor' && <CheckIcon className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">KYC Information</h2>
              <p className="text-gray-600 mb-6">
                Please provide the required information for regulatory compliance
              </p>
            </div>
            
            <KYCForm 
              formData={kycData}
              onChange={setKycData}
            />
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Confirm</h2>
              <p className="text-gray-600 mb-6">Please review your information before submitting</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">Account Type</h3>
                <p className="text-gray-600 capitalize">{accountType} Account</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900">Account Classification</h3>
                <p className="text-gray-600">
                  {kycData.isIndividualAccount ? 'Individual Account' : 'Business/Corporate Account'}
                </p>
              </div>
              
              {kycData.isIndividualAccount ? (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Personal Information</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Place of Birth: {kycData.placeOfBirth}</p>
                    <p>Gender: {kycData.gender}</p>
                    <p>Civil Status: {kycData.civilStatus}</p>
                    <p>Nationality: {kycData.nationality}</p>
                    <p>Contact Email: {kycData.contactEmail}</p>
                    <p>Secondary ID: {kycData.secondaryIdType} - {kycData.secondaryIdNumber}</p>
                    <p>Emergency Contact: {kycData.emergencyContactName} ({kycData.emergencyContactRelationship})</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Business Information</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Registration: {kycData.businessRegistrationType} - {kycData.businessRegistrationNumber}</p>
                    <p>Corporate TIN: {kycData.corporateTin}</p>
                    <p>Nature of Business: {kycData.natureOfBusiness}</p>
                    <p>Authorized Signatory: {kycData.authorizedSignatoryName} ({kycData.authorizedSignatoryPosition})</p>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="font-semibold text-gray-900">PEP Status</h3>
                <p className="text-gray-600">
                  {kycData.isPoliticallyExposedPerson ? 'Yes - PEP Declared' : 'No PEP Status'}
                </p>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> By submitting this information, you confirm that all details provided are accurate and complete. 
                False or incomplete information may result in account suspension or legal action.
              </p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="bg-white min-h-screen w-full">
      <Navbar activePage="register" showAuthButtons />
      
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={handleBack}
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back
        </Button>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white">
          {renderStep()}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            className="px-6"
          >
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </Button>
          
          <Button
            onClick={handleNext}
            className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {currentStep === totalSteps ? 'Complete Registration' : 'Next'}
          </Button>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Already completed registration?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
