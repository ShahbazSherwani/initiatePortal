// src/components/KYCForm.tsx
import React from 'react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { UserIcon, PhoneIcon, MailIcon, CreditCardIcon } from 'lucide-react';

export interface KYCFormData {
  // Account type
  isIndividualAccount: boolean | undefined;
  
  // Group type (for filtering and categorization)
  groupType?: string;
  
  // Individual fields
  placeOfBirth?: string;
  gender?: string;
  civilStatus?: string;
  nationality?: string;
  contactEmail?: string;
  secondaryIdType?: string;
  secondaryIdNumber?: string;
  
  // Emergency contact
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  emergencyContactEmail?: string;
  
  // Business/Non-Individual fields
  businessRegistrationType?: string;
  businessRegistrationNumber?: string;
  businessRegistrationDate?: string;
  corporateTin?: string;
  natureOfBusiness?: string;
  
  // Principal office address
  principalOfficeStreet?: string;
  principalOfficeBarangay?: string;
  principalOfficeMunicipality?: string;
  principalOfficeProvince?: string;
  principalOfficeCountry?: string;
  principalOfficePostalCode?: string;
  
  // GIS (General Information Sheet) fields
  gisTotalAssets?: number;
  gisTotalLiabilities?: number;
  gisPaidUpCapital?: number;
  gisNumberOfStockholders?: number;
  gisNumberOfEmployees?: number;
  
  // PEP (Politically Exposed Person)
  isPoliticallyExposedPerson: boolean;
  pepDetails?: string;
  
  // Authorized signatory
  authorizedSignatoryName?: string;
  authorizedSignatoryPosition?: string;
  authorizedSignatoryIdType?: string;
  authorizedSignatoryIdNumber?: string;
}

interface KYCFormProps {
  formData: KYCFormData;
  onChange: (data: KYCFormData) => void;
}

const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
const civilStatusOptions = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'];
const secondaryIdOptions = [
  'Drivers License', 'Postal ID', 'Voters ID', 'PhilHealth ID', 
  'SSS ID', 'GSIS ID', 'PRC ID', 'OFW ID', 'Senior Citizen ID', 'PWD ID'
];
const businessRegistrationOptions = ['SEC', 'CDA', 'DTI'];
const relationshipOptions = [
  'Spouse', 'Parent', 'Child', 'Sibling', 'Relative', 'Friend', 'Colleague', 'Other'
];
const groupTypeOptions = [
  'Farmer/Fisherfolk/Grower',
  'LGU Officer (Gov\'t Official)',
  'Teacher',
  'Other Government Employee',
  'Others'
];

export const KYCForm: React.FC<KYCFormProps> = ({ formData, onChange }) => {
  const updateField = (field: keyof KYCFormData, value: any) => {
    onChange({
      ...formData,
      [field]: value
    });
  };

  return (
    <div className="space-y-8">
      {/* Account Type Selection */}
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
        <h3 className="text-lg font-semibold font-poppins text-blue-900 mb-4">
          Account Type <span className="text-red-500">*</span>
        </h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={formData.isIndividualAccount === true}
              onCheckedChange={(checked) => {
                if (checked) {
                  updateField('isIndividualAccount', true);
                }
              }}
            />
            <label className="text-sm font-medium">Individual Account</label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={formData.isIndividualAccount === false}
              onCheckedChange={(checked) => {
                if (checked) {
                  updateField('isIndividualAccount', false);
                }
              }}
            />
            <label className="text-sm font-medium">Business/Corporate Account</label>
          </div>
        </div>
        {formData.isIndividualAccount !== undefined ? (
          <p className="text-sm text-blue-700 mt-3">
            {formData.isIndividualAccount 
              ? 'Selected: Individual account - for personal use'
              : 'Selected: Business account - for companies, organizations, or partnerships'
            }
          </p>
        ) : (
          <p className="text-sm text-red-600 mt-3">
            ⚠️ Please select an account type to continue
          </p>
        )}
      </div>

      {/* Group Type Selection */}
      <div className="bg-green-50 p-6 rounded-xl border border-green-200">
        <h3 className="text-lg font-semibold font-poppins text-green-900 mb-4">
          Group Type <span className="text-red-500">*</span>
        </h3>
        <p className="text-sm text-green-700 mb-4">
          Select your group category for better project matching and networking opportunities
        </p>
        <Select value={formData.groupType || ''} onValueChange={(value) => updateField('groupType', value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select your group type" />
          </SelectTrigger>
          <SelectContent>
            {groupTypeOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formData.groupType && (
          <p className="text-sm text-green-700 mt-3">
            ✅ Selected: {formData.groupType}
          </p>
        )}
        {!formData.groupType && (
          <p className="text-sm text-red-600 mt-3">
            ⚠️ Please select your group type
          </p>
        )}
      </div>

      {/* Individual Account Fields */}
      {formData.isIndividualAccount === true && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold font-poppins text-gray-900 border-b pb-2">Personal Information</h3>
          
          {/* Basic Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Place of Birth *</label>
              <Input
                value={formData.placeOfBirth || ''}
                onChange={(e) => updateField('placeOfBirth', e.target.value)}
                placeholder="Enter place of birth"
                className="h-12"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Gender *</label>
              <Select value={formData.gender || ''} onValueChange={(value) => updateField('gender', value)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Civil Status *</label>
              <Select value={formData.civilStatus || ''} onValueChange={(value) => updateField('civilStatus', value)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select civil status" />
                </SelectTrigger>
                <SelectContent>
                  {civilStatusOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Nationality *</label>
              <Input
                value={formData.nationality || ''}
                onChange={(e) => updateField('nationality', e.target.value)}
                placeholder="Enter nationality"
                className="h-12"
              />
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Contact Email *</label>
              <div className="relative">
                <Input
                  type="email"
                  value={formData.contactEmail || ''}
                  onChange={(e) => updateField('contactEmail', e.target.value)}
                  placeholder="Enter contact email"
                  className="h-12 pl-10"
                />
                <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
          
          {/* Secondary ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Secondary Government ID Type *</label>
              <Select value={formData.secondaryIdType || ''} onValueChange={(value) => updateField('secondaryIdType', value)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  {secondaryIdOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Secondary ID Number *</label>
              <div className="relative">
                <Input
                  value={formData.secondaryIdNumber || ''}
                  onChange={(e) => updateField('secondaryIdNumber', e.target.value)}
                  placeholder="Enter ID number"
                  className="h-12 pl-10"
                />
                <CreditCardIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
          
          {/* Emergency Contact */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Emergency Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Emergency Contact Name *</label>
                <div className="relative">
                  <Input
                    value={formData.emergencyContactName || ''}
                    onChange={(e) => updateField('emergencyContactName', e.target.value)}
                    placeholder="Enter contact name"
                    className="h-12 pl-10"
                  />
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Relationship *</label>
                <Select value={formData.emergencyContactRelationship || ''} onValueChange={(value) => updateField('emergencyContactRelationship', value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Emergency Contact Phone *</label>
                <div className="relative">
                  <Input
                    type="tel"
                    value={formData.emergencyContactPhone || ''}
                    onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                    placeholder="Enter phone number"
                    className="h-12 pl-10"
                  />
                  <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Emergency Contact Email</label>
                <div className="relative">
                  <Input
                    type="email"
                    value={formData.emergencyContactEmail || ''}
                    onChange={(e) => updateField('emergencyContactEmail', e.target.value)}
                    placeholder="Enter contact email (optional)"
                    className="h-12 pl-10"
                  />
                  <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Business Account Fields */}
      {formData.isIndividualAccount === false && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold font-poppins text-gray-900 border-b pb-2">Business Information</h3>
          
          {/* Business Registration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Registration Type *</label>
              <Select value={formData.businessRegistrationType || ''} onValueChange={(value) => updateField('businessRegistrationType', value)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {businessRegistrationOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Registration Number *</label>
              <Input
                value={formData.businessRegistrationNumber || ''}
                onChange={(e) => updateField('businessRegistrationNumber', e.target.value)}
                placeholder="Enter registration number"
                className="h-12"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Registration Date *</label>
              <Input
                type="date"
                value={formData.businessRegistrationDate || ''}
                onChange={(e) => updateField('businessRegistrationDate', e.target.value)}
                className="h-12"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Corporate TIN *</label>
              <Input
                value={formData.corporateTin || ''}
                onChange={(e) => updateField('corporateTin', e.target.value)}
                placeholder="Enter corporate TIN"
                className="h-12"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Nature of Business *</label>
              <Input
                value={formData.natureOfBusiness || ''}
                onChange={(e) => updateField('natureOfBusiness', e.target.value)}
                placeholder="Enter nature of business"
                className="h-12"
              />
            </div>
          </div>
          
          {/* Principal Office Address */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Principal Office Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Street Address *</label>
                <Input
                  value={formData.principalOfficeStreet || ''}
                  onChange={(e) => updateField('principalOfficeStreet', e.target.value)}
                  placeholder="Enter street address"
                  className="h-12"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Barangay *</label>
                <Input
                  value={formData.principalOfficeBarangay || ''}
                  onChange={(e) => updateField('principalOfficeBarangay', e.target.value)}
                  placeholder="Enter barangay"
                  className="h-12"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Municipality/City *</label>
                <Input
                  value={formData.principalOfficeMunicipality || ''}
                  onChange={(e) => updateField('principalOfficeMunicipality', e.target.value)}
                  placeholder="Enter municipality/city"
                  className="h-12"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Province *</label>
                <Input
                  value={formData.principalOfficeProvince || ''}
                  onChange={(e) => updateField('principalOfficeProvince', e.target.value)}
                  placeholder="Enter province"
                  className="h-12"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Country</label>
                <Input
                  value={formData.principalOfficeCountry || 'Philippines'}
                  onChange={(e) => updateField('principalOfficeCountry', e.target.value)}
                  placeholder="Enter country"
                  className="h-12"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Postal Code</label>
                <Input
                  value={formData.principalOfficePostalCode || ''}
                  onChange={(e) => updateField('principalOfficePostalCode', e.target.value)}
                  placeholder="Enter postal code"
                  className="h-12"
                />
              </div>
            </div>
          </div>
          
          {/* General Information Sheet */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-md font-semibold text-gray-900 mb-4">General Information Sheet (GIS)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Total Assets (PHP)</label>
                <Input
                  type="number"
                  value={formData.gisTotalAssets || ''}
                  onChange={(e) => updateField('gisTotalAssets', parseFloat(e.target.value) || undefined)}
                  placeholder="Enter total assets"
                  className="h-12"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Total Liabilities (PHP)</label>
                <Input
                  type="number"
                  value={formData.gisTotalLiabilities || ''}
                  onChange={(e) => updateField('gisTotalLiabilities', parseFloat(e.target.value) || undefined)}
                  placeholder="Enter total liabilities"
                  className="h-12"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Paid-up Capital (PHP)</label>
                <Input
                  type="number"
                  value={formData.gisPaidUpCapital || ''}
                  onChange={(e) => updateField('gisPaidUpCapital', parseFloat(e.target.value) || undefined)}
                  placeholder="Enter paid-up capital"
                  className="h-12"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Number of Stockholders</label>
                <Input
                  type="number"
                  value={formData.gisNumberOfStockholders || ''}
                  onChange={(e) => updateField('gisNumberOfStockholders', parseInt(e.target.value) || undefined)}
                  placeholder="Enter number of stockholders"
                  className="h-12"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Number of Employees</label>
                <Input
                  type="number"
                  value={formData.gisNumberOfEmployees || ''}
                  onChange={(e) => updateField('gisNumberOfEmployees', parseInt(e.target.value) || undefined)}
                  placeholder="Enter number of employees"
                  className="h-12"
                />
              </div>
            </div>
          </div>
          
          {/* Authorized Signatory */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Authorized Signatory</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Signatory Name *</label>
                <Input
                  value={formData.authorizedSignatoryName || ''}
                  onChange={(e) => updateField('authorizedSignatoryName', e.target.value)}
                  placeholder="Enter signatory name"
                  className="h-12"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Position *</label>
                <Input
                  value={formData.authorizedSignatoryPosition || ''}
                  onChange={(e) => updateField('authorizedSignatoryPosition', e.target.value)}
                  placeholder="Enter position"
                  className="h-12"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">ID Type *</label>
                <Select value={formData.authorizedSignatoryIdType || ''} onValueChange={(value) => updateField('authorizedSignatoryIdType', value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    {secondaryIdOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">ID Number *</label>
                <Input
                  value={formData.authorizedSignatoryIdNumber || ''}
                  onChange={(e) => updateField('authorizedSignatoryIdNumber', e.target.value)}
                  placeholder="Enter ID number"
                  className="h-12"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PEP Section (for both individual and business) */}
      <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
        <h4 className="text-md font-semibold text-yellow-900 mb-4">Politically Exposed Person (PEP) Declaration</h4>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              checked={formData.isPoliticallyExposedPerson}
              onCheckedChange={(checked) => updateField('isPoliticallyExposedPerson', checked === true)}
            />
            <div>
              <label className="text-sm font-medium">
                I am or have been a politically exposed person (PEP) or have close association with a PEP
              </label>
              <p className="text-xs text-yellow-700 mt-1">
                This includes government officials, senior executives of government corporations, or immediate family members of such persons.
              </p>
            </div>
          </div>
          
          {formData.isPoliticallyExposedPerson && (
            <div>
              <label className="block text-sm font-medium mb-2">PEP Details *</label>
              <Textarea
                value={formData.pepDetails || ''}
                onChange={(e) => updateField('pepDetails', e.target.value)}
                placeholder="Please provide details about your PEP status, including position held and duration"
                rows={3}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
