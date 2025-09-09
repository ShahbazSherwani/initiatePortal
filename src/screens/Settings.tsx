import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getUserProfile, getUserSettings, updateUserSettings, changePassword } from "../lib/api";
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
} from "lucide-react";

export const Settings = (): JSX.Element => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Profile Data State
  const [profileData, setProfileData] = useState({
    fullName: "",
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
    },
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
        setProfileData(profile);
      }
      
      // Load settings data
      const settingsResponse = await getUserSettings();
      if (settingsResponse.success) {
        setPrivacySettings(settingsResponse.settings.privacySettings);
        setNotificationSettings(settingsResponse.settings.notificationSettings);
        setSecuritySettings(settingsResponse.settings.securitySettings);
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

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
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
            <h1 className="text-2xl md:text-3xl font-semibold">Profile Settings</h1>
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
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label>Full Name*</Label>
                        <Input
                          value={profileData.fullName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                          className="h-12"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label>Email Address*</Label>
                        <Input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                          className="h-12"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input
                          value={profileData.phone}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          className="h-12"
                        />
                      </div>

                      {/* Date of Birth */}
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input
                          type="date"
                          value={profileData.dateOfBirth}
                          onChange={(e) => setProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                          className="h-12"
                        />
                      </div>

                      {/* Account Type */}
                      <div className="space-y-2">
                        <Label>Account Type</Label>
                        <Input
                          value={profileData.accountType}
                          className="h-12"
                          disabled
                        />
                      </div>

                      {/* Profile Type */}
                      <div className="space-y-2">
                        <Label>Profile Type</Label>
                        <Input
                          value={profileData.profileType}
                          className="h-12"
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
                            className="h-12"
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
                            className="h-12"
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
                            className="h-12"
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
                            className="h-12"
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
                            className="h-12"
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
                            className="h-12"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Identification Section */}
                    <div className="pt-6">
                      <h3 className="text-lg font-semibold mb-4">Identification Documents</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>National ID</Label>
                          <Input
                            value={profileData.identification.nationalId}
                            onChange={(e) => setProfileData(prev => ({ 
                              ...prev, 
                              identification: { ...prev.identification, nationalId: e.target.value }
                            }))}
                            className="h-12"
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
                            className="h-12"
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
                            className="h-12"
                          />
                        </div>
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
                          <SelectTrigger className="h-12">
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
