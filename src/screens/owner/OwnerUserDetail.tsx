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
  
  // Enhanced profile data
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
  
  // Address information
  addresses?: {
    presentAddress?: string;
    permanentAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  
  // KYC and identification documents
  identifications?: {
    idType?: string;
    idNumber?: string;
    expiryDate?: string;
    issuingCountry?: string;
    verificationStatus?: 'pending' | 'verified' | 'rejected';
  }[];
  
  // Bank account information
  bankAccounts?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    accountType?: string;
    isDefault?: boolean;
    verificationStatus?: 'pending' | 'verified' | 'rejected';
  }[];
  
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
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
      await authFetch(`${API_BASE_URL}/owner/users/${user.id}/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: suspendReason })
      });
      
      toast.success('User suspended successfully');
      setUser({ ...user, status: 'suspended' });
      setShowSuspendDialog(false);
      setSuspendReason('');
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

            <Button 
              onClick={() => setShowDeleteDialog(true)}
              variant="outline" 
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete
            </Button>
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
                    <p>Profile Type: Individual</p>
                    <p>Account Types: {user.accountTypes.join(', ')}</p>
                    {user.issuerCode && <p>Issuer Code: {user.issuerCode}</p>}
                  </div>
                </div>
              </div>

              <Button
                variant={isEditing ? "default" : "outline"}
                onClick={() => setIsEditing(!isEditing)}
                className={isEditing ? "bg-[#0C4B20] text-white" : ""}
              >
                <EditIcon className="w-4 h-4 mr-2" />
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </Button>
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
            {activeTab === 'personal' && user.personalProfile && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <div className="p-3 bg-gray-50 rounded-lg">{user.personalProfile.firstName || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <div className="p-3 bg-gray-50 rounded-lg">{user.personalProfile.lastName || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                    <div className="p-3 bg-gray-50 rounded-lg">{user.personalProfile.middleName || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <div className="p-3 bg-gray-50 rounded-lg">{user.personalProfile.dateOfBirth || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Place of Birth</label>
                    <div className="p-3 bg-gray-50 rounded-lg">{user.personalProfile.placeOfBirth || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                    <div className="p-3 bg-gray-50 rounded-lg">{user.personalProfile.nationality || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <div className="p-3 bg-gray-50 rounded-lg">{user.personalProfile.gender || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                    <div className="p-3 bg-gray-50 rounded-lg">{user.personalProfile.maritalStatus || 'Not provided'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs show placeholder content for now */}
            {activeTab !== 'overview' && activeTab !== 'personal' && (
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
                      Suspend User
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        This will temporarily restrict the user's access to the platform.
                      </p>
                    </div>

                    <div className="mt-4">
                      <Textarea
                        placeholder="Reason for suspension (required)"
                        value={suspendReason}
                        onChange={(e) => setSuspendReason(e.target.value)}
                        rows={3}
                        className="w-full"
                      />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowSuspendDialog(false);
                          setSuspendReason('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSuspendUser}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        Suspend User
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