// src/screens/owner/OwnerUserDetail.tsx
import React, { useEffect, useState, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OwnerLayout } from '../../layouts/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Textarea } from '../../components/ui/textarea';
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
  CameraIcon
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
  
  // Profile data based on account types
  borrowerData?: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    industryType?: string;
  };
  
  investorData?: {
    totalInvestments: number;
    activeInvestments: number;
    portfolioValue: number;
    riskTolerance?: string;
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
  { key: 'details', label: 'User Details' },
  { key: 'projects', label: 'Projects' },
];

export const OwnerUserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<UserDetail>>({});
  const [suspendReason, setSuspendReason] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserDetail();
    }
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      
      const [userData, projectsData] = await Promise.all([
        authFetch(`${API_BASE_URL}/owner/users/${userId}`),
        authFetch(`${API_BASE_URL}/owner/users/${userId}/projects`)
      ]);
      
      setUser(userData);
      setUserProjects(projectsData);
      setEditedUser(userData);
      
    } catch (error) {
      console.error('Error fetching user detail:', error);
      toast.error('Failed to load user details');
      
      // Mock data for development
      setUser({
        id: '1',
        firebaseUid: userId || '28745',
        fullName: 'Alexa John',
        email: 'alexajohn12@gmail.com',
        username: 'alex_john',
        phoneNumber: '+63 912 345 6789',
        accountTypes: ['borrower', 'investor'],
        status: 'active',
        memberSince: '2023-11-20',
        lastActivity: '2024-01-15',
        location: 'Manila, Philippines',
        occupation: 'Business Owner',
        issuerCode: '554Xd1',
        borrowerData: {
          totalProjects: 4,
          activeProjects: 1,
          completedProjects: 2,
          industryType: 'Agriculture'
        },
        investorData: {
          totalInvestments: 8,
          activeInvestments: 3,
          portfolioValue: 500000,
          riskTolerance: 'Medium'
        }
      });
      
      setUserProjects([
        {
          id: 'PFL4345N',
          title: 'Rice Field Expansion Project',
          status: 'active',
          fundingAmount: 100000,
          fundingProgress: '45%',
          createdAt: '2024-01-10'
        }
      ]);
      
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      await authFetch(`${API_BASE_URL}/owner/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(editedUser)
      });
      
      setUser({ ...user!, ...editedUser });
      setIsEditing(false);
      toast.success('User details updated successfully');
      
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user details');
    }
  };

  const handleSuspendUser = async () => {
    if (!suspendReason.trim()) {
      toast.error('Please provide a reason for suspension');
      return;
    }

    try {
      await authFetch(`${API_BASE_URL}/owner/users/${userId}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason: suspendReason })
      });
      
      setUser({ ...user!, status: 'suspended' });
      setShowSuspendDialog(false);
      setSuspendReason('');
      toast.success('User suspended successfully');
      
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Failed to suspend user');
    }
  };

  const handleDeleteUser = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    try {
      await authFetch(`${API_BASE_URL}/owner/users/${userId}`, {
        method: 'DELETE'
      });
      
      toast.success('User deleted successfully');
      navigate('/owner/users');
      
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleReactivateUser = async () => {
    try {
      await authFetch(`${API_BASE_URL}/owner/users/${userId}/reactivate`, {
        method: 'POST'
      });
      
      setUser({ ...user!, status: 'active' });
      toast.success('User reactivated successfully');
      
    } catch (error) {
      console.error('Error reactivating user:', error);
      toast.error('Failed to reactivate user');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-yellow-100 text-yellow-800', 
      deleted: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={`${variants[status as keyof typeof variants]} border-0`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <OwnerLayout activePage="users">
        <div className="p-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-lg text-gray-600">Loading user details...</div>
          </div>
        </div>
      </OwnerLayout>
    );
  }

  if (!user) {
    return (
      <OwnerLayout activePage="users">
        <div className="p-8">
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-12 text-center">
              <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">User not found</h3>
              <p className="text-gray-500 mb-4">The requested user could not be found.</p>
              <Button onClick={() => navigate('/owner/users')}>
                Back to Users
              </Button>
            </CardContent>
          </Card>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout activePage="users">
      <div className="p-8 space-y-6">
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
              <p className="text-gray-600">Manage user profile and account settings</p>
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
                className="text-yellow-600 border-yellow-600"
              >
                <UserXIcon className="w-4 h-4 mr-2" />
                Suspend
              </Button>
            )}

            <Button 
              onClick={() => setShowDeleteDialog(true)}
              variant="outline" 
              className="text-red-600 border-red-600"
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
              <nav className="flex space-x-8">
                {USER_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
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
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* General Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      {isEditing ? (
                        <Input
                          value={editedUser.fullName || ''}
                          onChange={(e) => setEditedUser({...editedUser, fullName: e.target.value})}
                        />
                      ) : (
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                          <span>{user.fullName}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={editedUser.email || ''}
                          onChange={(e) => setEditedUser({...editedUser, email: e.target.value})}
                        />
                      ) : (
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <MailIcon className="w-4 h-4 text-gray-400 mr-2" />
                          <span>{user.email}</span>
                        </div>
                      )}
                    </div>

                    {user.username && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Username
                        </label>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <span>@{user.username}</span>
                        </div>
                      </div>
                    )}

                    {user.phoneNumber && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                          <span>{user.phoneNumber}</span>
                        </div>
                      </div>
                    )}

                    {user.location && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <MapPinIcon className="w-4 h-4 text-gray-400 mr-2" />
                          <span>{user.location}</span>
                        </div>
                      </div>
                    )}

                    {user.occupation && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Occupation
                        </label>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <BriefcaseIcon className="w-4 h-4 text-gray-400 mr-2" />
                          <span>{user.occupation}</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Member Since
                      </label>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span>{formatDate(user.memberSince)}</span>
                      </div>
                    </div>

                    {user.lastActivity && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Activity
                        </label>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                          <span>{formatDate(user.lastActivity)}</span>
                        </div>
                      </div>
                    )}
                  </div>
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

            {activeTab === 'projects' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    User Projects ({userProjects.length})
                  </h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">All</Button>
                    <Button size="sm" variant="outline">Pending</Button>
                    <Button size="sm" variant="outline">Active</Button>
                    <Button size="sm" variant="outline">Completed</Button>
                  </div>
                </div>

                {userProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <BriefcaseIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No projects found</h4>
                    <p className="text-gray-500">This user hasn't created any projects yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userProjects.map((project) => (
                      <Card key={project.id} className="bg-gray-50 border-0">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                                  {project.status}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  Status: {project.status}
                                </span>
                              </div>
                              
                              <h4 className="font-semibold text-gray-900 mb-2">{project.title}</h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">Project ID:</span>
                                  <div className="font-medium">{project.id}</div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Funding Requirement:</span>
                                  <div className="font-medium">{formatCurrency(project.fundingAmount)}</div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Funding Progress:</span>
                                  <div className="font-medium">{project.fundingProgress}</div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Created:</span>
                                  <div className="font-medium">{formatDate(project.createdAt)}</div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/owner/projects/${project.id}`)}
                              >
                                <EyeIcon className="w-3 h-3 mr-1" />
                                View Project
                              </Button>
                              <Button size="sm" variant="outline" className="text-gray-500">
                                Remove
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Save/Cancel buttons for editing */}
            {isEditing && (
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedUser(user);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveChanges}
                  className="bg-[#0C4B20] hover:bg-[#8FB200] text-white"
                >
                  Save Changes
                </Button>
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