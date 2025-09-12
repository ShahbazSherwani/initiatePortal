import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getUserProfile, getUserSettings, updateUserSettings, changePassword } from "../lib/api";
import { generateProfileCode, generateIssuerCode, generateBorrowerCode } from "../lib/profileUtils";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  ShieldIcon,
  UserIcon,
  BellIcon,
  KeyIcon,
  LinkIcon,
  CheckCircleIcon,
  CameraIcon,
  UploadIcon,
} from "lucide-react";

export const Settings = (): JSX.Element => {
  const { user, profilePicture, setProfilePicture, setProfile } = useAuth();
  const navigate = useNavigate();

  // Profile Data State
  const [profileData, setProfileData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    nationality: "",
    address: {
      street: "",
      barangay: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
    },
    identification: {
      nationalId: "",
      passport: "",
      tin: "",
      secondaryIdType: "",
      secondaryIdNumber: "",
    },
    personalInfo: {
      placeOfBirth: "",
      gender: "",
      civilStatus: "",
      nationality: "",
      motherMaidenName: "",
      contactEmail: "",
    },
    employmentInfo: {
      employerName: "",
      occupation: "",
      employerAddress: "",
      sourceOfIncome: "",
      monthlyIncome: null as number | null,
    },
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
      address: "",
    },
    businessInfo: {
      entityType: "",
      businessRegistrationType: "",
      businessRegistrationNumber: "",
      businessRegistrationDate: "",
      corporateTin: "",
      natureOfBusiness: "",
      businessAddress: "",
      // GIS Fields for Non-Individual entities
      gisTotalAssets: null as number | null,
      gisTotalLiabilities: null as number | null,
      gisPaidUpCapital: null as number | null,
      gisNumberOfStockholders: null as number | null,
      gisNumberOfEmployees: null as number | null,
    },
    principalOfficeAddress: {
      street: "",
      barangay: "",
      municipality: "",
      province: "",
      country: "Philippines",
      postalCode: "",
    },
    authorizedSignatory: {
      name: "",
      position: "",
      idType: "",
      idNumber: "",
    },
    investmentInfo: {
      experience: "",
      preference: "",
      riskTolerance: "",
      portfolioValue: 0,
    },
    pepStatus: false,
    accountType: "",
    profileType: "",
  });

  // Privacy Settings State
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "private",
    showEmail: false,
    showPhone: false,
    allowMessaging: true,
    showInvestments: false,
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginNotifications: true,
    securityAlerts: true,
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    projectUpdates: true,
    paymentAlerts: true,
    systemAnnouncements: true,
  });

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // UI State
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, [user]);

  // Helper function to convert date to YYYY-MM-DD format
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Load profile data
      const profileResponse = await getUserProfile();
      if (profileResponse.success) {
        const profile = profileResponse.profile;
        // Convert date format for HTML input
        if (profile.dateOfBirth) {
          profile.dateOfBirth = formatDateForInput(profile.dateOfBirth);
        }
        
        // Merge with existing state to ensure all fields have values
        setProfileData(prev => ({
          ...prev,
          ...profile,
          // Ensure username is always a string
          username: profile.username || "",
          fullName: profile.fullName || "",
          email: profile.email || "",
          phone: profile.phone || "",
          dateOfBirth: profile.dateOfBirth || "",
          nationality: profile.nationality || "",
          address: {
            ...prev.address,
            ...(profile.address || {})
          },
          identification: {
            ...prev.identification,
            ...(profile.identification || {})
          }
        }));
      }
      
      // Load settings data
      const settingsResponse = await getUserSettings();
      if (settingsResponse.success) {
        setPrivacySettings(settingsResponse.settings.privacySettings);
        setNotificationSettings(settingsResponse.settings.notificationSettings);
        setSecuritySettings(settingsResponse.settings.securitySettings);
      }
      
      // Load profile picture
      try {
        const pictureResponse = await fetch('/api/profile/picture', {
          headers: {
            'Authorization': `Bearer ${user?.accessToken}`
          }
        });
        
        if (pictureResponse.ok) {
          const pictureData = await pictureResponse.json();
          if (pictureData.profilePicture) {
            setProfilePicture(pictureData.profilePicture);
          }
        }
      } catch (error) {
        console.log('No profile picture found or error loading:', error);
      }
      
    } catch (error) {
      console.error("Error loading user data:", error);
      // Keep mock data as fallback
      setProfileData({
        fullName: user?.displayName || "John Doe",
        email: user?.email || "john.doe@example.com",
        phone: "+63 912 345 6789",
        dateOfBirth: "1990-01-15",
        nationality: "Filipino",
        address: {
          street: "123 Main Street",
          barangay: "Poblacion",
          city: "Makati",
          state: "Metro Manila",
          country: "Philippines",
          postalCode: "1200",
        },
        identification: {
          nationalId: "1234-5678-9012",
          passport: "P123456789",
          tin: "123-456-789-000",
        },
        personalInfo: {
          placeOfBirth: "Manila",
          gender: "male",
          civilStatus: "single",
          nationality: "Filipino",
          motherMaidenName: "Dela Cruz",
        },
        employmentInfo: {
          employerName: "ABC Corporation",
          occupation: "Software Engineer",
          employerAddress: "BGC, Taguig City",
          sourceOfIncome: "employment",
          monthlyIncome: 50000,
        },
        emergencyContact: {
          name: "Maria Doe",
          relationship: "spouse",
          phone: "+63 912 345 6788",
          address: "123 Main Street, Makati",
        },
        businessInfo: {
          businessRegistrationType: "",
          businessRegistrationNumber: "",
          businessRegistrationDate: "",
          corporateTin: "",
          natureOfBusiness: "",
          businessAddress: "",
        },
        authorizedSignatory: {
          name: "",
          position: "",
          idNumber: "",
        },
        investmentInfo: {
          experience: "intermediate",
          preference: "both",
          riskTolerance: "moderate",
          portfolioValue: 100000,
        },
        pepStatus: false,
        accountType: "Individual",
        profileType: "Investor",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      const response = await updateUserSettings({
        profileData,
        privacySettings,
        notificationSettings,
        securitySettings
      });
      
      if (response.success) {
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert("Password must be at least 8 characters long!");
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.success) {
        alert("Password changed successfully!");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        alert("Failed to change password. Please try again.");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Failed to change password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorToggle = async (enabled: boolean) => {
    try {
      setIsLoading(true);
      // TODO: Implement 2FA setup/disable API
      setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: enabled }));
      console.log("2FA toggled:", enabled);
    } catch (error) {
      console.error("Error toggling 2FA:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setIsUploadingPicture(true);
      
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        
        try {
          // Save to server
          const response = await fetch('/api/profile/upload-picture', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user?.accessToken}`
            },
            body: JSON.stringify({
              profilePicture: base64String
            })
          });
          
          const result = await response.json();
          
          if (response.ok) {
            setProfilePicture(base64String);
            
            // Update AuthContext with new profile picture
            if (setProfile) {
              setProfile(prev => prev ? {
                ...prev,
                profilePicture: base64String
              } : prev);
            }
            
            console.log('✅ Profile picture uploaded successfully');
          } else {
            console.error('Failed to upload profile picture:', result.error);
            alert('Failed to upload profile picture. Please try again.');
          }
        } catch (error) {
          console.error('Error uploading profile picture:', error);
          alert('Failed to upload profile picture. Please try again.');
        } finally {
          setIsUploadingPicture(false);
        }
      };
      
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Error processing profile picture:', error);
      alert('Failed to process profile picture. Please try again.');
      setIsUploadingPicture(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      const response = await fetch('/api/profile/picture', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.accessToken}`
        }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setProfilePicture(null);
        
        // Update AuthContext
        if (setProfile) {
          setProfile(prev => prev ? {
            ...prev,
            profilePicture: null
          } : prev);
        }
        
        console.log('✅ Profile picture removed successfully');
      } else {
        console.error('Failed to remove profile picture:', result.error);
        alert('Failed to remove profile picture. Please try again.');
      }
    } catch (error) {
      console.error('Error removing profile picture:', error);
      alert('Failed to remove profile picture. Please try again.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[280px] flex-shrink-0">
          <Sidebar activePage="settings" />
        </div>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="mr-4"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-semibold font-poppins">Profile Settings</h1>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <ShieldIcon className="w-4 h-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <BellIcon className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <EyeIcon className="w-4 h-4" />
                Privacy
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Your personal details from KYC registration. Contact support to modify certain fields.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Profile Picture Section */}
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 p-6 bg-gray-50 rounded-lg border">
                    <div className="flex flex-col items-center gap-4">
                      {/* Profile Picture Display */}
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                          {profilePicture ? (
                            <img 
                              src={profilePicture} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#ffc00f] flex items-center justify-center">
                              <UserIcon className="w-12 h-12 text-black" />
                            </div>
                          )}
                        </div>
                        
                        {/* Camera Icon Overlay */}
                        <label 
                          htmlFor="profile-picture-upload"
                          className="absolute bottom-0 right-0 w-8 h-8 bg-[#ffc00f] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#e6b324] transition-colors shadow-lg border-2 border-white"
                        >
                          <CameraIcon className="w-4 h-4 text-black" />
                          <input
                            id="profile-picture-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePictureUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Profile Info and Actions */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-4">
                        <h3 className="text-xl font-semibold font-poppins text-gray-900">
                          {profileData.fullName || 'Alexa John'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Username:</span> {profileData.username || 'Not set'}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Profile Code:</span> {user?.uid ? generateProfileCode(user.uid) : 'Not available'}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Issuer Code:</span> {user?.uid ? generateIssuerCode(user.uid, profileData.accountType) : 'Not available'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Borrower Code:</span> {user?.uid ? generateBorrowerCode(user.uid, profileData.accountType) : 'Not available'}
                        </p>
                      </div>

                      {/* Upload Actions */}
                      <div className="flex flex-wrap gap-3">
                        <label 
                          htmlFor="profile-picture-upload-alt"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#ffc00f] text-black font-medium rounded-lg hover:bg-[#e6b324] transition-colors cursor-pointer"
                        >
                          <UploadIcon className="w-4 h-4" />
                          Upload New Picture
                          <input
                            id="profile-picture-upload-alt"
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePictureUpload}
                            className="hidden"
                          />
                        </label>
                        
                        {profilePicture && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleRemoveProfilePicture}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Remove Picture
                          </Button>
                        )}
                      </div>

                      {isUploadingPicture && (
                        <p className="text-sm text-blue-600 mt-2">Uploading...</p>
                      )}
                    </div>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label>Full Name*</Label>
                        <Input
                          value={profileData.fullName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                        />
                      </div>

                      {/* Username */}
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input
                          value={profileData.username || ""}
                          onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                          placeholder="Enter a unique username"
                        />
                        <p className="text-xs text-gray-500">
                          Only letters, numbers, dots, and underscores allowed
                        </p>
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label>Email Address*</Label>
                        <Input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input
                          value={profileData.phone}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>

                      {/* Date of Birth */}
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input
                          type="date"
                          value={profileData.dateOfBirth}
                          onChange={(e) => setProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        />
                      </div>

                      {/* Account Type */}
                      <div className="space-y-2">
                        <Label>Account Type</Label>
                        <Input
                          value={profileData.accountType}
                          disabled
                        />
                      </div>

                      {/* Profile Type */}
                      <div className="space-y-2">
                        <Label>Profile Type</Label>
                        <Input
                          value={profileData.profileType}
                          disabled
                        />
                      </div>
                    </div>

                    {/* Address Section */}
                    <div className="pt-6">
                      <h3 className="text-lg font-semibold mb-4">Address Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Street Address</Label>
                          <Input
                            value={profileData.address.street}
                            onChange={(e) => setProfileData(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, street: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Barangay</Label>
                          <Input
                            value={profileData.address.barangay}
                            onChange={(e) => setProfileData(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, barangay: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Input
                            value={profileData.address.city}
                            onChange={(e) => setProfileData(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, city: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>State/Province</Label>
                          <Input
                            value={profileData.address.state}
                            onChange={(e) => setProfileData(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, state: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Country</Label>
                          <Input
                            value={profileData.address.country}
                            onChange={(e) => setProfileData(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, country: e.target.value }
                            }))}
                            
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Postal Code</Label>
                          <Input
                            value={profileData.address.postalCode}
                            onChange={(e) => setProfileData(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, postalCode: e.target.value }
                            }))}
                            
                          />
                        </div>
                      </div>
                    </div>

                    {/* Identification Section */}
                    <div className="pt-6">
                      <h3 className="text-lg font-semibold mb-4">Identification Documents</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>National ID</Label>
                          <Input
                            value={profileData.identification.nationalId}
                            onChange={(e) => setProfileData(prev => ({ 
                              ...prev, 
                              identification: { ...prev.identification, nationalId: e.target.value }
                            }))}
                            
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Passport Number</Label>
                          <Input
                            value={profileData.identification.passport}
                            onChange={(e) => setProfileData(prev => ({ 
                              ...prev, 
                              identification: { ...prev.identification, passport: e.target.value }
                            }))}
                            
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>TIN</Label>
                          <Input
                            value={profileData.identification.tin}
                            onChange={(e) => setProfileData(prev => ({ 
                              ...prev, 
                              identification: { ...prev.identification, tin: e.target.value }
                            }))}
                            
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Secondary ID Type</Label>
                          <Select
                            value={profileData.identification.secondaryIdType}
                            onValueChange={(value) => setProfileData(prev => ({ 
                              ...prev, 
                              identification: { ...prev.identification, secondaryIdType: value }
                            }))}
                          >
                            <SelectTrigger >
                              <SelectValue placeholder="Select ID type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="drivers_license">Driver's License</SelectItem>
                              <SelectItem value="sss_id">SSS ID</SelectItem>
                              <SelectItem value="philhealth_id">PhilHealth ID</SelectItem>
                              <SelectItem value="voters_id">Voter's ID</SelectItem>
                              <SelectItem value="postal_id">Postal ID</SelectItem>
                              <SelectItem value="umid">UMID</SelectItem>
                              <SelectItem value="prc_license">PRC License</SelectItem>
                              <SelectItem value="other">Other Government ID</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Secondary ID Number</Label>
                          <Input
                            value={profileData.identification.secondaryIdNumber}
                            onChange={(e) => setProfileData(prev => ({ 
                              ...prev, 
                              identification: { ...prev.identification, secondaryIdNumber: e.target.value }
                            }))}
                            
                            placeholder="Enter secondary ID number"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Individual Account KYC Fields */}
                    {profileData.accountType?.toLowerCase() === 'individual' && (
                      <>
                        {/* Additional Personal Information */}
                        <div className="pt-6">
                          <h3 className="text-lg font-semibold mb-4">Additional Personal Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Place of Birth</Label>
                              <Input
                                value={profileData.personalInfo.placeOfBirth}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  personalInfo: { ...prev.personalInfo, placeOfBirth: e.target.value }
                                }))}
                                
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Gender</Label>
                              <Select
                                value={profileData.personalInfo.gender}
                                onValueChange={(value) => setProfileData(prev => ({ 
                                  ...prev, 
                                  personalInfo: { ...prev.personalInfo, gender: value }
                                }))}
                              >
                                <SelectTrigger >
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Civil Status</Label>
                              <Select
                                value={profileData.personalInfo.civilStatus}
                                onValueChange={(value) => setProfileData(prev => ({ 
                                  ...prev, 
                                  personalInfo: { ...prev.personalInfo, civilStatus: value }
                                }))}
                              >
                                <SelectTrigger >
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
                            <div className="space-y-2">
                              <Label>Contact Email</Label>
                              <Input
                                type="email"
                                value={profileData.personalInfo.contactEmail}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  personalInfo: { ...prev.personalInfo, contactEmail: e.target.value }
                                }))}
                                
                                placeholder="Contact email address"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Mother's Maiden Name</Label>
                              <Input
                                value={profileData.personalInfo.motherMaidenName}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  personalInfo: { ...prev.personalInfo, motherMaidenName: e.target.value }
                                }))}
                                
                              />
                            </div>
                          </div>
                        </div>

                        {/* Employment Information */}
                        <div className="pt-6">
                          <h3 className="text-lg font-semibold mb-4">Employment Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Employer/Company Name</Label>
                              <Input
                                value={profileData.employmentInfo.employerName}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  employmentInfo: { ...prev.employmentInfo, employerName: e.target.value }
                                }))}
                                
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Occupation/Position</Label>
                              <Input
                                value={profileData.employmentInfo.occupation}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  employmentInfo: { ...prev.employmentInfo, occupation: e.target.value }
                                }))}
                                
                              />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <Label>Employer Address</Label>
                              <Input
                                value={profileData.employmentInfo.employerAddress}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  employmentInfo: { ...prev.employmentInfo, employerAddress: e.target.value }
                                }))}
                                
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Primary Source of Income</Label>
                              <Select
                                value={profileData.employmentInfo.sourceOfIncome}
                                onValueChange={(value) => setProfileData(prev => ({ 
                                  ...prev, 
                                  employmentInfo: { ...prev.employmentInfo, sourceOfIncome: value }
                                }))}
                              >
                                <SelectTrigger >
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
                            <div className="space-y-2">
                              <Label>Monthly Income (PHP)</Label>
                              <Input
                                type="number"
                                value={profileData.employmentInfo.monthlyIncome || ''}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  employmentInfo: { ...prev.employmentInfo, monthlyIncome: e.target.value ? parseFloat(e.target.value) : null }
                                }))}
                                
                                min="0"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Emergency Contact Information */}
                        <div className="pt-6">
                          <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Contact Person Name</Label>
                              <Input
                                value={profileData.emergencyContact.name}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                                }))}
                                
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Relationship</Label>
                              <Select
                                value={profileData.emergencyContact.relationship}
                                onValueChange={(value) => setProfileData(prev => ({ 
                                  ...prev, 
                                  emergencyContact: { ...prev.emergencyContact, relationship: value }
                                }))}
                              >
                                <SelectTrigger >
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
                            <div className="space-y-2">
                              <Label>Contact Phone Number</Label>
                              <Input
                                value={profileData.emergencyContact.phone}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                                }))}
                                
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Contact Address</Label>
                              <Input
                                value={profileData.emergencyContact.address}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  emergencyContact: { ...prev.emergencyContact, address: e.target.value }
                                }))}
                                
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Non-Individual Account KYC Fields */}
                    {profileData.accountType?.toLowerCase() === 'non-individual' && (
                      <>
                        {/* Business Information */}
                        <div className="pt-6">
                          <h3 className="text-lg font-semibold mb-4">Business Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Entity Type</Label>
                              <Select
                                value={profileData.businessInfo.entityType}
                                onValueChange={(value) => setProfileData(prev => ({ 
                                  ...prev, 
                                  businessInfo: { ...prev.businessInfo, entityType: value }
                                }))}
                              >
                                <SelectTrigger >
                                  <SelectValue placeholder="Select entity type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Sole Proprietor">Sole Proprietor</SelectItem>
                                  <SelectItem value="MSME">MSME</SelectItem>
                                  <SelectItem value="NGO">NGO</SelectItem>
                                  <SelectItem value="Foundation">Foundation</SelectItem>
                                  <SelectItem value="Educational Institution">Educational Institution</SelectItem>
                                  <SelectItem value="Others">Others</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Registration Type</Label>
                              <Select
                                value={profileData.businessInfo.businessRegistrationType}
                                onValueChange={(value) => setProfileData(prev => ({ 
                                  ...prev, 
                                  businessInfo: { ...prev.businessInfo, businessRegistrationType: value }
                                }))}
                              >
                                <SelectTrigger >
                                  <SelectValue placeholder="Select registration type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="SEC">SEC (Securities and Exchange Commission)</SelectItem>
                                  <SelectItem value="CDA">CDA (Cooperative Development Authority)</SelectItem>
                                  <SelectItem value="DTI">DTI (Department of Trade and Industry)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Registration Number</Label>
                              <Input
                                value={profileData.businessInfo.businessRegistrationNumber}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  businessInfo: { ...prev.businessInfo, businessRegistrationNumber: e.target.value }
                                }))}
                                
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Registration Date</Label>
                              <Input
                                type="date"
                                value={profileData.businessInfo.businessRegistrationDate}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  businessInfo: { ...prev.businessInfo, businessRegistrationDate: e.target.value }
                                }))}
                                
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Corporate TIN</Label>
                              <Input
                                value={profileData.businessInfo.corporateTin}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  businessInfo: { ...prev.businessInfo, corporateTin: e.target.value }
                                }))}
                                
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Nature of Business</Label>
                              <Input
                                value={profileData.businessInfo.natureOfBusiness}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  businessInfo: { ...prev.businessInfo, natureOfBusiness: e.target.value }
                                }))}
                                
                              />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <Label>Business Address</Label>
                              <Input
                                value={profileData.businessInfo.businessAddress}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  businessInfo: { ...prev.businessInfo, businessAddress: e.target.value }
                                }))}
                                
                              />
                            </div>
                          </div>
                        </div>

                        {/* GIS (General Information Sheet) Fields */}
                        <div className="pt-6">
                          <h3 className="text-lg font-semibold mb-4">General Information Sheet (GIS)</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Total Assets (PHP)</Label>
                              <Input
                                type="number"
                                value={profileData.businessInfo.gisTotalAssets || ''}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  businessInfo: { ...prev.businessInfo, gisTotalAssets: e.target.value ? parseFloat(e.target.value) : null }
                                }))}
                                
                                min="0"
                                placeholder="Enter total assets"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Total Liabilities (PHP)</Label>
                              <Input
                                type="number"
                                value={profileData.businessInfo.gisTotalLiabilities || ''}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  businessInfo: { ...prev.businessInfo, gisTotalLiabilities: e.target.value ? parseFloat(e.target.value) : null }
                                }))}
                                
                                min="0"
                                placeholder="Enter total liabilities"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Paid-up Capital (PHP)</Label>
                              <Input
                                type="number"
                                value={profileData.businessInfo.gisPaidUpCapital || ''}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  businessInfo: { ...prev.businessInfo, gisPaidUpCapital: e.target.value ? parseFloat(e.target.value) : null }
                                }))}
                                
                                min="0"
                                placeholder="Enter paid-up capital"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Number of Stockholders</Label>
                              <Input
                                type="number"
                                value={profileData.businessInfo.gisNumberOfStockholders || ''}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  businessInfo: { ...prev.businessInfo, gisNumberOfStockholders: e.target.value ? parseInt(e.target.value) : null }
                                }))}
                                
                                min="0"
                                placeholder="Enter number of stockholders"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Number of Employees</Label>
                              <Input
                                type="number"
                                value={profileData.businessInfo.gisNumberOfEmployees || ''}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  businessInfo: { ...prev.businessInfo, gisNumberOfEmployees: e.target.value ? parseInt(e.target.value) : null }
                                }))}
                                
                                min="0"
                                placeholder="Enter number of employees"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Principal Office Address */}
                        <div className="pt-6">
                          <h3 className="text-lg font-semibold mb-4">Principal Office Address</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Street Address</Label>
                              <Input
                                value={profileData.principalOfficeAddress.street}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  principalOfficeAddress: { ...prev.principalOfficeAddress, street: e.target.value }
                                }))}
                                
                                placeholder="Street address"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Barangay</Label>
                              <Input
                                value={profileData.principalOfficeAddress.barangay}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  principalOfficeAddress: { ...prev.principalOfficeAddress, barangay: e.target.value }
                                }))}
                                
                                placeholder="Barangay"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Municipality/City</Label>
                              <Input
                                value={profileData.principalOfficeAddress.municipality}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  principalOfficeAddress: { ...prev.principalOfficeAddress, municipality: e.target.value }
                                }))}
                                
                                placeholder="Municipality or City"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Province</Label>
                              <Input
                                value={profileData.principalOfficeAddress.province}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  principalOfficeAddress: { ...prev.principalOfficeAddress, province: e.target.value }
                                }))}
                                
                                placeholder="Province"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Country</Label>
                              <Input
                                value={profileData.principalOfficeAddress.country}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  principalOfficeAddress: { ...prev.principalOfficeAddress, country: e.target.value }
                                }))}
                                
                                placeholder="Country"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Postal Code</Label>
                              <Input
                                value={profileData.principalOfficeAddress.postalCode}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  principalOfficeAddress: { ...prev.principalOfficeAddress, postalCode: e.target.value }
                                }))}
                                
                                placeholder="Postal code"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Authorized Signatory Information */}
                        <div className="pt-6">
                          <h3 className="text-lg font-semibold mb-4">Authorized Signatory</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Signatory Name</Label>
                              <Input
                                value={profileData.authorizedSignatory.name}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  authorizedSignatory: { ...prev.authorizedSignatory, name: e.target.value }
                                }))}
                                
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Position/Title</Label>
                              <Input
                                value={profileData.authorizedSignatory.position}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  authorizedSignatory: { ...prev.authorizedSignatory, position: e.target.value }
                                }))}
                                
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>ID Type</Label>
                              <Select
                                value={profileData.authorizedSignatory.idType}
                                onValueChange={(value) => setProfileData(prev => ({ 
                                  ...prev, 
                                  authorizedSignatory: { ...prev.authorizedSignatory, idType: value }
                                }))}
                              >
                                <SelectTrigger >
                                  <SelectValue placeholder="Select ID type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="national_id">National ID</SelectItem>
                                  <SelectItem value="drivers_license">Driver's License</SelectItem>
                                  <SelectItem value="passport">Passport</SelectItem>
                                  <SelectItem value="sss_id">SSS ID</SelectItem>
                                  <SelectItem value="philhealth_id">PhilHealth ID</SelectItem>
                                  <SelectItem value="voters_id">Voter's ID</SelectItem>
                                  <SelectItem value="other">Other Government ID</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>ID Number</Label>
                              <Input
                                value={profileData.authorizedSignatory.idNumber}
                                onChange={(e) => setProfileData(prev => ({ 
                                  ...prev, 
                                  authorizedSignatory: { ...prev.authorizedSignatory, idNumber: e.target.value }
                                }))}
                                
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Investment Information (for Investors) */}
                    {profileData.profileType?.toLowerCase().includes('investor') && (
                      <div className="pt-6">
                        <h3 className="text-lg font-semibold mb-4">Investment Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Investment Experience</Label>
                            <Select
                              value={profileData.investmentInfo.experience}
                              onValueChange={(value) => setProfileData(prev => ({ 
                                ...prev, 
                                investmentInfo: { ...prev.investmentInfo, experience: value }
                              }))}
                            >
                              <SelectTrigger >
                                <SelectValue placeholder="Select experience" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
                                <SelectItem value="intermediate">Intermediate (3-5 years)</SelectItem>
                                <SelectItem value="advanced">Advanced (5+ years)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Investment Preference</Label>
                            <Select
                              value={profileData.investmentInfo.preference}
                              onValueChange={(value) => setProfileData(prev => ({ 
                                ...prev, 
                                investmentInfo: { ...prev.investmentInfo, preference: value }
                              }))}
                            >
                              <SelectTrigger >
                                <SelectValue placeholder="Select preference" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="lending">Lending Projects</SelectItem>
                                <SelectItem value="equity">Equity Investments</SelectItem>
                                <SelectItem value="both">Both Lending & Equity</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Risk Tolerance</Label>
                            <Select
                              value={profileData.investmentInfo.riskTolerance}
                              onValueChange={(value) => setProfileData(prev => ({ 
                                ...prev, 
                                investmentInfo: { ...prev.investmentInfo, riskTolerance: value }
                              }))}
                            >
                              <SelectTrigger >
                                <SelectValue placeholder="Select risk tolerance" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="conservative">Conservative</SelectItem>
                                <SelectItem value="moderate">Moderate</SelectItem>
                                <SelectItem value="aggressive">Aggressive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Portfolio Value (PHP)</Label>
                            <Input
                              type="number"
                              value={profileData.investmentInfo.portfolioValue}
                              onChange={(e) => setProfileData(prev => ({ 
                                ...prev, 
                                investmentInfo: { ...prev.investmentInfo, portfolioValue: parseFloat(e.target.value) || 0 }
                              }))}
                              
                              min="0"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PEP Declaration */}
                    <div className="pt-6">
                      <h3 className="text-lg font-semibold mb-4">Compliance Declaration</h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="pepStatus"
                            checked={profileData.pepStatus}
                            onCheckedChange={(checked) => setProfileData(prev => ({ 
                              ...prev, 
                              pepStatus: !!checked 
                            }))}
                          />
                          <Label htmlFor="pepStatus" className="text-sm leading-relaxed">
                            {profileData.accountType?.toLowerCase() === 'individual' 
                              ? "I am a Politically Exposed Person (PEP) or have an immediate family member or close associate who is a PEP."
                              : "The entity or any of its beneficial owners, directors, or authorized signatories is a Politically Exposed Person (PEP) or has an immediate family member or close associate who is a PEP."
                            }
                          </Label>
                        </div>
                        <p className="text-xs text-gray-600">
                          Note: PEP status does not disqualify you from using our services but requires additional compliance procedures.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-6">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-[#ffc00f] hover:bg-[#ffc00f]/90 text-black font-semibold px-8"
                      >
                        {isLoading ? "Updating..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              {/* Password Change */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <KeyIcon className="w-5 h-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Current Password</Label>
                      <div className="relative">
                        <Input
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="h-12 pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 h-8 w-8"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="h-12 pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 h-8 w-8"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="h-12 pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 h-8 w-8"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-[#ffc00f] hover:bg-[#ffc00f]/90 text-black font-semibold"
                    >
                      {isLoading ? "Changing..." : "Change Password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Two-Factor Authentication */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldIcon className="w-5 h-5" />
                    Two-Factor Authentication
                  </CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">
                        Two-Factor Authentication
                        {securitySettings.twoFactorEnabled && (
                          <CheckCircleIcon className="w-4 h-4 text-green-600 inline ml-2" />
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        {securitySettings.twoFactorEnabled 
                          ? "Your account is protected with 2FA" 
                          : "Secure your account with 2FA"
                        }
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorEnabled}
                      onCheckedChange={handleTwoFactorToggle}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Security Preferences</CardTitle>
                  <CardDescription>
                    Manage your security notification preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Login Notifications</p>
                      <p className="text-sm text-gray-600">Get notified when someone logs into your account</p>
                    </div>
                    <Switch
                      checked={securitySettings.loginNotifications}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, loginNotifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Security Alerts</p>
                      <p className="text-sm text-gray-600">Get alerts for suspicious account activity</p>
                    </div>
                    <Switch
                      checked={securitySettings.securityAlerts}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, securityAlerts: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BellIcon className="w-5 h-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to be notified about account activity.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Communication Methods */}
                  <div>
                    <h3 className="font-semibold mb-4">Communication Methods</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-gray-600">Receive notifications via email</p>
                        </div>
                        <Switch
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">Push Notifications</p>
                          <p className="text-sm text-gray-600">Receive browser push notifications</p>
                        </div>
                        <Switch
                          checked={notificationSettings.pushNotifications}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">SMS Notifications</p>
                          <p className="text-sm text-gray-600">Receive notifications via text message</p>
                        </div>
                        <Switch
                          checked={notificationSettings.smsNotifications}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, smsNotifications: checked }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notification Types */}
                  <div>
                    <h3 className="font-semibold mb-4">Notification Types</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">Project Updates</p>
                          <p className="text-sm text-gray-600">Updates on your investments and projects</p>
                        </div>
                        <Switch
                          checked={notificationSettings.projectUpdates}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, projectUpdates: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">Payment Alerts</p>
                          <p className="text-sm text-gray-600">Notifications about payments and transactions</p>
                        </div>
                        <Switch
                          checked={notificationSettings.paymentAlerts}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, paymentAlerts: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">System Announcements</p>
                          <p className="text-sm text-gray-600">Important platform updates and maintenance</p>
                        </div>
                        <Switch
                          checked={notificationSettings.systemAnnouncements}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, systemAnnouncements: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">Marketing Emails</p>
                          <p className="text-sm text-gray-600">Promotional content and new features</p>
                        </div>
                        <Switch
                          checked={notificationSettings.marketingEmails}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, marketingEmails: checked }))}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <EyeIcon className="w-5 h-5" />
                    Privacy Controls
                  </CardTitle>
                  <CardDescription>
                    Control what information is visible to other users.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Visibility */}
                  <div>
                    <h3 className="font-semibold mb-4">Profile Visibility</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Who can see your profile?</Label>
                        <Select
                          value={privacySettings.profileVisibility}
                          onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, profileVisibility: value }))}
                        >
                          <SelectTrigger >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Everyone</SelectItem>
                            <SelectItem value="users">Platform Users Only</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">Show Email Address</p>
                          <p className="text-sm text-gray-600">Allow others to see your email</p>
                        </div>
                        <Switch
                          checked={privacySettings.showEmail}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showEmail: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">Show Phone Number</p>
                          <p className="text-sm text-gray-600">Allow others to see your phone number</p>
                        </div>
                        <Switch
                          checked={privacySettings.showPhone}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showPhone: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">Show Investment Portfolio</p>
                          <p className="text-sm text-gray-600">Display your investment activity publicly</p>
                        </div>
                        <Switch
                          checked={privacySettings.showInvestments}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showInvestments: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">Allow Direct Messages</p>
                          <p className="text-sm text-gray-600">Let other users send you messages</p>
                        </div>
                        <Switch
                          checked={privacySettings.allowMessaging}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, allowMessaging: checked }))}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Connected Accounts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="w-5 h-5" />
                    Connected Accounts
                  </CardTitle>
                  <CardDescription>
                    Manage external accounts linked to your profile.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">G</span>
                        </div>
                        <div>
                          <p className="font-medium">Google Account</p>
                          <p className="text-sm text-gray-600">{profileData.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">Connected</span>
                        <Button variant="outline" size="sm">
                          Disconnect
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">F</span>
                        </div>
                        <div>
                          <p className="font-medium">Facebook Account</p>
                          <p className="text-sm text-gray-600">Not connected</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Connect
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Settings;
