import React, { useState, Fragment, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OwnerLayout } from '../../layouts/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Textarea } from '../../components/ui/textarea';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { authFetch } from '../../lib/api';
import { API_BASE_URL } from '../../config/environment';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeftIcon, 
  UserIcon, 
  MailIcon, 
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  BriefcaseIcon,
  ShieldIcon,
  AlertTriangleIcon,
  TrashIcon,
  UserXIcon,
  EyeIcon,
  EditIcon,
  CameraIcon,
  IdCardIcon,
  CreditCardIcon,
  ClockIcon,
  ChartBarIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';

interface UserDetail {
  id: string;
  firebaseUid: string;
  fullName: string;
  email: string;
  username?: string;
  phoneNumber?: string;
  profilePicture?: string;
  accountTypes: ('borrower' | 'investor' | 'guarantor')[];
  status: 'active' | 'suspended' | 'deleted';
  memberSince: string;
  lastActivity?: string;
  location?: string;
  occupation?: string;
  isQualifiedInvestor?: boolean;
  issuerCode?: string;
  
  // Suspension details
  suspensionReason?: string;
  suspendedAt?: string;
  suspendedBy?: string;
  suspensionScope?: 'full_account' | 'borrower' | 'investor' | null;
  
  // Account type indicator
  accountType?: 'individual' | 'non-individual';
  isIndividualAccount?: boolean;
  
  // Enhanced profile data (for individual accounts)
  personalProfile?: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    dateOfBirth?: string;
    placeOfBirth?: string;
    nationality?: string;
    gender?: string;
    maritalStatus?: string;
    emailAddress?: string;
    mobileNumber?: string;
  };
  
  // Entity information (for non-individual accounts)
  entityInfo?: {
    entityType?: string;
    entityName?: string;
    registrationNumber?: string;
    tin?: string;
    contactPersonName?: string;
    contactPersonPosition?: string;
    contactPersonEmail?: string;
    contactPersonPhone?: string;
  };
  
  // Business registration details (for non-individual borrowers)
  businessRegistration?: {
    type?: string; // SEC, CDA, DTI
    date?: string;
    corporateTin?: string;
    authorizedSignatoryName?: string;
    authorizedSignatoryPosition?: string;
    authorizedSignatoryIdNumber?: string;
    natureOfBusiness?: string;
  };
  
  // Principal office address (for non-individual borrowers)
  principalOffice?: {
    street?: string;
    barangay?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  
  // Entity documents (for non-individual accounts)
  entityDocuments?: {
    registrationCertFile?: string;
    tinCertFile?: string;
    authorizationFile?: string;
  };
  
  // Address information
  addresses?: {
    present?: string;
    permanent?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    barangay?: string;
  };
  
  // KYC and identification documents
  identifications?: {
    nationalId?: string;
    passport?: string;
    tin?: string;
    secondaryIdType?: string;
    secondaryIdNumber?: string;
  };
  
  // Bank account information
  bankAccounts?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    accountType?: string;
    iban?: string;
    swiftCode?: string;
    isDefault?: boolean;
    verificationStatus?: 'pending' | 'verified' | 'rejected';
  }[];
  
  // Roles and settings
  rolesSettings?: {
    accountType?: string;
    hasBorrowerAccount?: boolean;
    hasInvestorAccount?: boolean;
    isAdmin?: boolean;
    isComplete?: boolean;
  };
  
  // Role-specific data
  borrowerData?: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    businessType?: string;
    companyName?: string;
    industryType?: string;
    fundingLimits?: number;
    kycLevel?: string;
    employmentInfo?: {
      occupation?: string;
      employerName?: string;
      employerAddress?: string;
      employmentStatus?: string;
      grossAnnualIncome?: number;
      sourceOfIncome?: string;
    };
  };
  
  investorData?: {
    totalInvestments: number;
    activeInvestments: number;
    portfolioValue: number;
    investorType?: 'individual' | 'non-individual';
    qualifiedInvestor?: boolean;
    riskTolerance?: string;
    investmentLimits?: number;
  };
}

interface UserProject {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed' | 'default';
  fundingAmount: number;
  fundingProgress: string;
  createdAt: string;
}

const USER_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'personal', label: 'Personal Profile' },
  { key: 'identifications', label: 'Identifications' },
  { key: 'addresses', label: 'Addresses' },
  { key: 'bank', label: 'Bank Accounts' },
  { key: 'roles', label: 'Roles & Settings' },
  { key: 'projects', label: 'Projects' },
  { key: 'investments', label: 'Investments' },
  { key: 'activity', label: 'Activity Log' },
];

export const OwnerUserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [canEditUsers, setCanEditUsers] = useState(false);
  const [canSuspendUsers, setCanSuspendUsers] = useState(false);
  const [canDeleteUsers, setCanDeleteUsers] = useState(false);

  // Fetch user permissions to check what actions they can perform
  useEffect(() => {
    const fetchPermissions = async () => {
      // Admins can do everything
      if (profile?.isAdmin) {
        setCanEditUsers(true);
        setCanSuspendUsers(true);
        setCanDeleteUsers(true);
        return;
      }

      try {
        const data = await authFetch(`${API_BASE_URL}/team/my-permissions`);
        const permissions = data.permissions || [];
        
        setCanEditUsers(permissions.includes('users.edit'));
        setCanSuspendUsers(permissions.includes('users.suspend'));
        // Note: There's no 'users.delete' permission in the list, so we'll treat it like suspend
        // Or we can make delete require BOTH edit AND suspend permissions
        setCanDeleteUsers(permissions.includes('users.suspend')); // Assuming delete requires suspend permission
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setCanEditUsers(false);
        setCanSuspendUsers(false);
        setCanDeleteUsers(false);
      }
    };

    if (profile) {
      fetchPermissions();
    }
  }, [profile]);

  // Fetch user data based on userId
  const fetchUserData = async () => {
    if (!userId) {
      navigate('/owner/users');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Fetching user details for ID:', userId);
      
      // Fetch actual user data from the backend
      const userData = await authFetch(`${API_BASE_URL}/owner/users/${userId}`);
      console.log('✅ User data fetched:', userData);
      console.log('📄 Account type:', userData?.accountType, '| isIndividual:', userData?.isIndividualAccount);
      console.log('📑 Entity documents:', userData?.entityDocuments);
      
      if (userData) {
        setUser(userData);
      } else {
        console.warn('⚠️ No user data returned from API');
        setUser(null);
      }
    } catch (error: any) {
      console.error('❌ Error fetching user data:', error);
      
      // Show user-friendly error message
      if (error.message?.includes('404')) {
        toast.error('User not found');
      } else if (error.message?.includes('403')) {
        toast.error('Access denied - Admin privileges required');
      } else {
        toast.error('Failed to load user details');
      }
      
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user data on component mount or userId change
  useEffect(() => {
    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner showText text="Loading user details..." />
        </div>
      </OwnerLayout>
    );
  }

  if (!user) {
    return (
      <OwnerLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h2>
          <p className="text-gray-600 mb-6">The user you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/owner/users')}>Back to Users</Button>
        </div>
      </OwnerLayout>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', className: 'bg-green-100 text-green-800 border-0' },
      suspended: { label: 'Suspended', className: 'bg-yellow-100 text-yellow-800 border-0' },
      deleted: { label: 'Deleted', className: 'bg-red-100 text-red-800 border-0' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config?.className}>{config?.label}</Badge>;
  };

  const handleSuspendUser = async () => {
    if (!suspendReason.trim()) {
      toast.error('Please provide a reason for suspension');
      return;
    }
    if (!user) return;

    try {
      const response = await authFetch(`${API_BASE_URL}/owner/users/${user.id}/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: suspendReason })
      });
      
      toast.success('User suspended successfully');
      
      // Update user state with suspension details
      setUser({ 
        ...user, 
        status: 'suspended',
        suspensionReason: suspendReason,
        suspendedAt: new Date().toISOString(),
        suspensionScope: 'full_account'
      });
      
      setShowSuspendDialog(false);
      setSuspendReason('');
      
      // Refresh user data to get complete suspension info
      fetchUserData();
    } catch (error: any) {
      console.error('Error suspending user:', error);
      toast.error(error.message || 'Failed to suspend user');
    }
  };

  const handleDeleteUser = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    if (!user) return;

    try {
      await authFetch(`${API_BASE_URL}/owner/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Account deletion requested by admin' })
      });
      
      toast.success('User deleted successfully');
      navigate('/owner/users');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleReactivateUser = async () => {
    if (!user) return;
    
    try {
      await authFetch(`${API_BASE_URL}/owner/users/${user.id}/reactivate`, {
        method: 'POST'
      });
      
      toast.success('User reactivated successfully');
      setUser({ ...user, status: 'active' });
    } catch (error: any) {
      console.error('Error reactivating user:', error);
      toast.error(error.message || 'Failed to reactivate user');
    }
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/owner/users')}
              className="p-2"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
              <p className="text-gray-600">Comprehensive view of user registration data</p>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="flex items-center gap-2">
            {canSuspendUsers && (
              <>
                {user.status === 'suspended' ? (
                  <Button 
                    onClick={handleReactivateUser}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <ShieldIcon className="w-4 h-4 mr-2" />
                    Reactivate
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setShowSuspendDialog(true)}
                    variant="outline" 
                    className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                  >
                    <UserXIcon className="w-4 h-4 mr-2" />
                    Suspend
                  </Button>
                )}
              </>
            )}

            {canDeleteUsers && (
              <Button 
                onClick={() => setShowDeleteDialog(true)}
                variant="outline" 
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* User Profile Card */}
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user.profilePicture || "/ellipse-1.png"} alt={user.fullName} />
                    <AvatarFallback className="bg-gradient-to-br from-[#0C4B20] to-[#8FB200] text-white text-2xl">
                      {user.fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0"
                  >
                    <CameraIcon className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="ml-6">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{user.fullName}</h2>
                    {getStatusBadge(user.status)}
                    {user.isQualifiedInvestor && (
                      <Badge className="bg-yellow-100 text-yellow-800 border-0">
                        Qualified Investor
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Profile Type: {user.accountType === 'non-individual' || user.isIndividualAccount === false ? 'Non-Individual (Entity/Business)' : 'Individual'}</p>
                    <p>Account Types: {user.accountTypes.join(', ')}</p>
                    {user.issuerCode && <p>Issuer Code: {user.issuerCode}</p>}
                  </div>
                </div>
              </div>

              {canEditUsers && (
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => setIsEditing(!isEditing)}
                  className={isEditing ? "bg-[#0C4B20] text-white" : ""}
                >
                  <EditIcon className="w-4 h-4 mr-2" />
                  {isEditing ? 'Save Changes' : 'Edit Profile'}
                </Button>
              )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8 overflow-x-auto">
                {USER_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.key
                        ? 'border-[#0C4B20] text-[#0C4B20]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Suspension Info Alert */}
                {user.status === 'suspended' && user.suspensionReason && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                          Account Suspended
                        </h3>
                        <p className="text-sm text-yellow-700 mb-2">
                          <span className="font-medium">Reason:</span> {user.suspensionReason}
                        </p>
                        {user.suspendedAt && (
                          <p className="text-xs text-yellow-600">
                            Suspended on {formatDate(user.suspendedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <MailIcon className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{user.email}</span>
                    </div>
                  </div>

                  {user.phoneNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span>{user.phoneNumber}</span>
                      </div>
                    </div>
                  )}

                  {user.location && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <MapPinIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span>{user.location}</span>
                      </div>
                    </div>
                  )}

                  {user.occupation && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <BriefcaseIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span>{user.occupation}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{formatDate(user.memberSince)}</span>
                    </div>
                  </div>

                  {user.lastActivity && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Activity</label>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span>{formatDate(user.lastActivity)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Account Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {user.borrowerData && (
                    <Card className="bg-gray-50 border-0">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold">Borrower Statistics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Projects:</span>
                          <span className="font-medium">{user.borrowerData.totalProjects}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Active Projects:</span>
                          <span className="font-medium">{user.borrowerData.activeProjects}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Completed Projects:</span>
                          <span className="font-medium">{user.borrowerData.completedProjects}</span>
                        </div>
                        {user.borrowerData.industryType && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Industry:</span>
                            <span className="font-medium">{user.borrowerData.industryType}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {user.investorData && (
                    <Card className="bg-gray-50 border-0">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold">Investor Statistics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Investments:</span>
                          <span className="font-medium">{user.investorData.totalInvestments}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Active Investments:</span>
                          <span className="font-medium">{user.investorData.activeInvestments}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Portfolio Value:</span>
                          <span className="font-medium">{formatCurrency(user.investorData.portfolioValue)}</span>
                        </div>
                        {user.investorData.riskTolerance && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Risk Tolerance:</span>
                            <span className="font-medium">{user.investorData.riskTolerance}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Personal Profile Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-8">
                {/* Individual Account Fields */}
                {(user.accountType === 'individual' || user.isIndividualAccount !== false) && user.personalProfile && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        {isEditing ? (
                          <Input placeholder="First Name" defaultValue={user.personalProfile.firstName} />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg">{user.personalProfile.firstName || 'Not provided'}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        {isEditing ? (
                          <Input placeholder="Last Name" defaultValue={user.personalProfile.lastName} />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg">{user.personalProfile.lastName || 'Not provided'}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                        {isEditing ? (
                          <Input placeholder="Middle Name" defaultValue={user.personalProfile.middleName} />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg">{user.personalProfile.middleName || 'Not provided'}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        {isEditing ? (
                          <Input type="date" defaultValue={user.personalProfile.dateOfBirth} />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg">{user.personalProfile.dateOfBirth || 'Not provided'}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Place of Birth</label>
                        {isEditing ? (
                          <Input placeholder="Place of Birth" defaultValue={user.personalProfile.placeOfBirth} />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg">{user.personalProfile.placeOfBirth || 'Not provided'}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                        {isEditing ? (
                          <Input placeholder="Nationality" defaultValue={user.personalProfile.nationality} />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg">{user.personalProfile.nationality || 'Not provided'}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        {isEditing ? (
                          <Input placeholder="Gender" defaultValue={user.personalProfile.gender} />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg">{user.personalProfile.gender || 'Not provided'}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                        {isEditing ? (
                          <Input placeholder="Marital Status" defaultValue={user.personalProfile.maritalStatus} />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg">{user.personalProfile.maritalStatus || 'Not provided'}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        {isEditing ? (
                          <Input type="email" placeholder="Email" defaultValue={user.personalProfile.emailAddress} />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg">{user.personalProfile.emailAddress || user.email || 'Not provided'}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                        {isEditing ? (
                          <Input placeholder="Mobile Number" defaultValue={user.personalProfile.mobileNumber} />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg">{user.personalProfile.mobileNumber || user.phoneNumber || 'Not provided'}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Non-Individual Account Fields */}
                {(user.accountType === 'non-individual' || user.isIndividualAccount === false) && user.entityInfo && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Entity Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.entityInfo.entityType || 'Not provided'}</div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Entity Name</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.entityInfo.entityName || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.entityInfo.registrationNumber || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TIN</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.entityInfo.tin || 'Not provided'}</div>
                      </div>
                      <div className="md:col-span-1"></div>
                      
                      <div className="md:col-span-3">
                        <h4 className="text-md font-semibold text-gray-900 mt-4 mb-3">Contact Person</h4>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.entityInfo.contactPersonName || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.entityInfo.contactPersonPosition || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.entityInfo.contactPersonEmail || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.entityInfo.contactPersonPhone || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Business Registration (Non-Individual Borrowers Only) */}
                {(user.accountType === 'non-individual' || user.isIndividualAccount === false) && 
                 user.accountTypes.includes('borrower') && 
                 user.businessRegistration && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Registration Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Registration Type</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.businessRegistration.type || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {user.businessRegistration.date ? formatDate(user.businessRegistration.date) : 'Not provided'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Corporate TIN</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.businessRegistration.corporateTin || 'Not provided'}</div>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nature of Business</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.businessRegistration.natureOfBusiness || 'Not provided'}</div>
                      </div>
                      
                      <div className="md:col-span-3">
                        <h4 className="text-md font-semibold text-gray-900 mt-4 mb-3">Authorized Signatory</h4>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Signatory Name</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.businessRegistration.authorizedSignatoryName || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Position/Title</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.businessRegistration.authorizedSignatoryPosition || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.businessRegistration.authorizedSignatoryIdNumber || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Principal Office Address (Non-Individual Borrowers Only) */}
                {(user.accountType === 'non-individual' || user.isIndividualAccount === false) && 
                 user.accountTypes.includes('borrower') && 
                 user.principalOffice && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Principal Office Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.principalOffice.street || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.principalOffice.barangay || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.principalOffice.city || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.principalOffice.state || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.principalOffice.country || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.principalOffice.postalCode || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Entity Documents (Non-Individual Accounts) */}
                {(user.accountType === 'non-individual' || user.isIndividualAccount === false) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      📑 Entity Registration Documents
                    </h3>
                    
                    {user.entityDocuments && (
                      user.entityDocuments.registrationCertFile || 
                      user.entityDocuments.tinCertFile || 
                      user.entityDocuments.authorizationFile
                    ) ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Registration Certificate
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          {user.entityDocuments.registrationCertFile ? (
                            <Button 
                              variant="outline" 
                              className="w-full border-green-500 text-green-700 hover:bg-green-50"
                              onClick={() => {
                                console.log('Opening registration cert:', user.entityDocuments?.registrationCertFile);
                                window.open(user.entityDocuments?.registrationCertFile, '_blank');
                              }}
                            >
                              <EyeIcon className="w-4 h-4 mr-2" />
                              View Document
                            </Button>
                          ) : (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                              ❌ Required - Not uploaded
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            TIN Certificate
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          {user.entityDocuments.tinCertFile ? (
                            <Button 
                              variant="outline" 
                              className="w-full border-green-500 text-green-700 hover:bg-green-50"
                              onClick={() => {
                                console.log('Opening TIN cert:', user.entityDocuments?.tinCertFile);
                                window.open(user.entityDocuments?.tinCertFile, '_blank');
                              }}
                            >
                              <EyeIcon className="w-4 h-4 mr-2" />
                              View Document
                            </Button>
                          ) : (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                              ❌ Required - Not uploaded
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Authorization Letter
                            <span className="text-gray-400 ml-1 text-xs">(Optional)</span>
                          </label>
                          {user.entityDocuments.authorizationFile ? (
                            <Button 
                              variant="outline" 
                              className="w-full border-green-500 text-green-700 hover:bg-green-50"
                              onClick={() => {
                                console.log('Opening authorization file:', user.entityDocuments?.authorizationFile);
                                window.open(user.entityDocuments?.authorizationFile, '_blank');
                              }}
                            >
                              <EyeIcon className="w-4 h-4 mr-2" />
                              View Document
                            </Button>
                          ) : (
                            <div className="p-3 bg-gray-50 rounded-lg text-gray-500 text-sm">
                              Optional - Not uploaded
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center">
                            <span className="text-2xl">⚠️</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-yellow-900 mb-1">
                              No Documents Found
                            </h4>
                            <p className="text-sm text-yellow-800">
                              This non-individual account has not uploaded any registration documents yet. 
                              Registration Certificate and TIN Certificate are required for verification.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Employment Information (Individual Accounts Only) */}
                {(user.accountType === 'individual' || user.isIndividualAccount !== false) && 
                 user.borrowerData?.employmentInfo && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.borrowerData.employmentInfo.occupation || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employer Name</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.borrowerData.employmentInfo.employerName || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employer Address</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.borrowerData.employmentInfo.employerAddress || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.borrowerData.employmentInfo.employmentStatus || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income</label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {user.borrowerData.employmentInfo.grossAnnualIncome ? formatCurrency(user.borrowerData.employmentInfo.grossAnnualIncome) : 'Not provided'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Source of Income</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{user.borrowerData.employmentInfo.sourceOfIncome || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Identifications Tab */}
            {activeTab === 'identifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Identifications</h3>
                <p className="text-sm text-gray-500 mb-6">This tab contains detailed identifications information.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
                    {isEditing ? (
                      <Input placeholder="National ID Number" defaultValue={user.identifications?.nationalId} />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">{user.identifications?.nationalId || 'Not provided'}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                    {isEditing ? (
                      <Input placeholder="Passport Number" defaultValue={user.identifications?.passport} />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">{user.identifications?.passport || 'Not provided'}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TIN Number</label>
                    {isEditing ? (
                      <Input placeholder="TIN Number" defaultValue={user.identifications?.tin} />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">{user.identifications?.tin || 'Not provided'}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secondary ID Type</label>
                    {isEditing ? (
                      <Input placeholder="Secondary ID Type" defaultValue={user.identifications?.secondaryIdType} />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">{user.identifications?.secondaryIdType || 'Not provided'}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secondary ID Number</label>
                    {isEditing ? (
                      <Input placeholder="Secondary ID Number" defaultValue={user.identifications?.secondaryIdNumber} />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg">{user.identifications?.secondaryIdNumber || 'Not provided'}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {(user.accountType === 'non-individual' || user.isIndividualAccount === false) ? 'Business Address' : 'Addresses'}
                </h3>
                <p className="text-sm text-gray-500 mb-6">This tab contains detailed addresses information.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Present Address</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                      {isEditing ? (
                        <Input placeholder="Street Address" defaultValue={user.addresses?.present} />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg">{user.addresses?.present || 'Not provided'}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                      {isEditing ? (
                        <Input placeholder="Barangay" defaultValue={user.addresses?.barangay} />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg">{user.addresses?.barangay || 'Not provided'}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      {isEditing ? (
                        <Input placeholder="City" defaultValue={user.addresses?.city} />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg">{user.addresses?.city || 'Not provided'}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                      {isEditing ? (
                        <Input placeholder="State/Province" defaultValue={user.addresses?.state} />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg">{user.addresses?.state || 'Not provided'}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Additional Details</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      {isEditing ? (
                        <Input placeholder="Postal Code" defaultValue={user.addresses?.postalCode} />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg">{user.addresses?.postalCode || 'Not provided'}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      {isEditing ? (
                        <Input placeholder="Country" defaultValue={user.addresses?.country} />
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg">{user.addresses?.country || 'Not provided'}</div>
                      )}
                    </div>
                    {(user.accountType === 'individual' || user.isIndividualAccount !== false) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Permanent Address</label>
                        {isEditing ? (
                          <Input placeholder="Permanent Address" defaultValue={user.addresses?.permanent} />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg">{user.addresses?.permanent || 'Same as present'}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bank Accounts Tab */}
            {activeTab === 'bank' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Accounts</h3>
                <p className="text-sm text-gray-500 mb-6">This tab contains detailed bank information.</p>
                
                {user.bankAccounts && user.bankAccounts.length > 0 ? (
                  <div className="space-y-4">
                    {user.bankAccounts.map((account, index) => (
                      <Card key={index} className="bg-gray-50 border-0">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-900">{account.bankName || 'Bank Account'}</h4>
                            {account.isDefault && (
                              <Badge className="bg-green-100 text-green-800 border-0">Default</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                              <div className="p-2 bg-white rounded">{account.accountName || 'N/A'}</div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                              <div className="p-2 bg-white rounded">{account.accountNumber || 'N/A'}</div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                              <div className="p-2 bg-white rounded">{account.accountType || 'N/A'}</div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                              <div className="p-2 bg-white rounded">{account.iban || 'N/A'}</div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">SWIFT Code</label>
                              <div className="p-2 bg-white rounded">{account.swiftCode || 'N/A'}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No bank accounts registered
                  </div>
                )}
              </div>
            )}

            {/* Roles & Settings Tab */}
            {activeTab === 'roles' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Roles & Settings</h3>
                <p className="text-sm text-gray-500 mb-6">This tab contains detailed roles information.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Account Type</label>
                    <div className="p-3 bg-gray-50 rounded-lg capitalize">{user.rolesSettings?.accountType || 'Not set'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Has Borrower Account</label>
                    <div className="p-3 bg-gray-50 rounded-lg">{user.rolesSettings?.hasBorrowerAccount ? 'Yes' : 'No'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Has Investor Account</label>
                    <div className="p-3 bg-gray-50 rounded-lg">{user.rolesSettings?.hasInvestorAccount ? 'Yes' : 'No'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Is Admin</label>
                    <div className="p-3 bg-gray-50 rounded-lg">{user.rolesSettings?.isAdmin ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs show placeholder content */}
            {!['overview', 'personal', 'identifications', 'addresses', 'bank', 'roles'].includes(activeTab) && (
              <div className="text-center py-12">
                <h4 className="text-lg font-medium text-gray-900 mb-2">{USER_TABS.find(t => t.key === activeTab)?.label}</h4>
                <p className="text-gray-500">This tab contains detailed {activeTab} information.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Suspend User Dialog */}
        <Transition appear show={showSuspendDialog} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setShowSuspendDialog(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4">
                      <Dialog.Title as="h3" className="text-xl font-bold text-white flex items-center gap-2">
                        <AlertTriangleIcon className="w-6 h-6" />
                        Suspend User Account
                      </Dialog.Title>
                      <p className="text-yellow-50 text-sm mt-1">
                        Temporarily restrict user access to the platform
                      </p>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-5 space-y-5">
                      {/* Warning Box */}
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                        <div className="flex items-start">
                          <AlertTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                              Important Notice
                            </h4>
                            <p className="text-sm text-yellow-700">
                              The user will be immediately logged out and unable to access their account until reactivated.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Suspending User:</p>
                        <p className="font-semibold text-gray-900">{user?.fullName}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>

                      {/* Quick Reason Buttons */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Reason (or type custom reason below)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            'Suspicious Activity',
                            'Policy Violation',
                            'Security Concern',
                            'Payment Issues',
                            'Fraud Investigation',
                            'User Request'
                          ].map((reason) => (
                            <button
                              key={reason}
                              onClick={() => setSuspendReason(reason)}
                              className={`px-3 py-2 text-sm rounded-lg border-2 transition-all ${
                                suspendReason === reason
                                  ? 'border-yellow-500 bg-yellow-50 text-yellow-900 font-semibold'
                                  : 'border-gray-200 hover:border-yellow-300 text-gray-700'
                              }`}
                            >
                              {reason}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Reason */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reason for Suspension <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                          placeholder="Enter detailed reason for suspension (required)..."
                          value={suspendReason}
                          onChange={(e) => setSuspendReason(e.target.value)}
                          rows={4}
                          className="w-full border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          This reason will be sent to the user in a notification.
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowSuspendDialog(false);
                          setSuspendReason('');
                        }}
                        className="px-6"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSuspendUser}
                        disabled={!suspendReason.trim()}
                        className="px-6 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <AlertTriangleIcon className="w-4 h-4 mr-2" />
                        Confirm Suspension
                      </Button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Delete User Dialog */}
        <Transition appear show={showDeleteDialog} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setShowDeleteDialog(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Delete User
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        This action is irreversible. All user data, projects, and investments will be permanently removed.
                      </p>
                    </div>

                    <div className="mt-4 space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <AlertTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
                          <div>
                            <h4 className="text-sm font-medium text-red-800">Warning</h4>
                            <p className="text-sm text-red-700 mt-1">
                              This will permanently delete the user and all associated data.
                            </p>
                          </div>
                        </div>
                      </div>
                      <Input
                        placeholder="Type DELETE to confirm"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                      />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteDialog(false);
                          setDeleteConfirmText('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleDeleteUser}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        disabled={deleteConfirmText !== 'DELETE'}
                      >
                        Delete User
                      </Button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </OwnerLayout>
  );
};