import React, { useContext, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { LogIn } from "../screens/LogIn/LogIn";
import { RegisterStep } from "../screens/LogIn/RegisterStep";
import { RegisterKYC } from "../screens/LogIn/RegisterKYC";
import { BorrowerHome } from "../screens/BorrowerHome";
import { BorrowerReg } from "../screens/BorrowerReg";
import { BorrowerOccupation } from "../screens/BorrowOcu";
import { AuthContext } from "../contexts/AuthContext";
import { useAccount } from "../contexts/AccountContext";
import { BorrowerWallet } from "../screens/BorrowerWallet";
import { BorrowerCalender } from "../screens/BorrowCalendarNew";
import { BorrowerEvent } from "../screens/BorrowEvents";
import { BorrowerProject } from "../screens/BorrowProject";
import { BorrowerBankDet } from "../screens/BorrowerBankDet";
import { BorrowerMyProjects } from "../screens/BorwMyProjects";
import { BorrowerCreateNew } from "../screens/BorwCreateNewProjLend";
import { BorrowerCreateNewEq } from "../screens/BorwCreateNewProjEquity";
import { BorrowerMilestones } from "../screens/BorrowerMilestones";
import { Milestones } from "../screens/Milestones";
import { AddMilestones } from "../screens/AddMilestones";
import { BorrowerROI } from "../screens/BorrowerROI";
import { BorrowerROISales } from "../screens/BorrowerROISales";
import { RegistrationProvider } from "../contexts/RegistrationContext";
import { ProjectsProvider } from "../contexts/ProjectsContext";
import { ProjectFormProvider } from "../contexts/ProjectFormContext";
import BorwEditProjectLend from "../screens/BorwEditProjectLend";
import ProjectDetailsView from "../screens/ProjectDetailsView";
import { InvestorReg } from "../screens/InvestorReg";
import { InvestorDiscovery } from "../screens/InvestorDiscovery";
import { InvestorProjectView } from "../screens/InvestorProjectView";
// import InvestorProjectDetailsView from "../screens/InvestorProjectDetailsView";
import { InvestorCalendar } from "../screens/InvestorCalendar";
import { InvestorInvestments } from "../screens/InvestorInvestments";
import { useAuth } from '../contexts/AuthContext';
import { BorrowerPayoutSchedule } from "../screens/BorrowerPayoutSchedule";
import { AdminProjectsList } from "../screens/AdminProjectsList";
import { AdminProjectApproval } from "../screens/AdminProjectApproval";
import { UnifiedCalendarView } from "../screens/UnifiedCalendarView";
import { AdminProjectView } from "../screens/AdminProjectView";
import { AdminTopUpRequests } from "../screens/AdminTopUpRequests";
import { ForgotPassword } from "../screens/ForgotPassword";
import { AdminInvestmentRequests } from "../screens/AdminInvestmentRequests";
import { BorrowerRegNonIndividual } from "../screens/BorrowerRegNonIndividual";
import { BorrowerBankDetailsNonIndividual } from "../screens/BorrowerBankDetailsNonIndividual";
import { InvestorRegSelection } from "../screens/InvestorRegSelection";
import { InvestorRegIndividual } from "../screens/InvestorRegIndividual";
import { InvestorRegNonIndividual } from "../screens/InvestorRegNonIndividual";
import { InvestorRegDirectLender } from "../screens/InvestorRegDirectLender";

// Owner Flow Components
import { OwnerLayout } from "../layouts/OwnerLayout";
import { OwnerDashboard } from "../screens/owner/OwnerDashboard";
import { OwnerUsers } from "../screens/owner/OwnerUsers";
import { OwnerUserDetail } from "../screens/owner/OwnerUserDetail";
import { OwnerProjects } from "../screens/owner/OwnerProjects";
import { OwnerProjectDetail } from "../screens/owner/OwnerProjectDetail";
import { OwnerTeam } from "../screens/owner/OwnerTeam";
import { AcceptInvitation } from "../screens/team/AcceptInvitation";
import { OwnerTopUpRequests } from "../screens/owner/OwnerTopUpRequests";
import { OwnerInvestmentRequests } from "../screens/owner/OwnerInvestmentRequests";
import { OwnerReports } from "../screens/owner/OwnerReports";
import { InvestorRegIncomeDetails } from "../screens/InvestorRegIncomeDetails";
import { InvestorRegBankDetails } from "../screens/InvestorRegBankDetails";
import Settings from "../screens/Settings";
import BorwCreateNewProjDonation from "../screens/BorwCreateNewProjDonation";
import BorwCreateNewProjRewards from "../screens/BorwCreateNewProjRewards";
import { EmailVerification } from "../screens/EmailVerification";
import { EmailVerificationPending } from "../screens/EmailVerificationPending";
import { ResetPassword } from "../screens/ResetPassword";
import { PaymentSuccess } from "../screens/PaymentSuccess";
import { RaiseTicket } from "../screens/RaiseTicket";
import { OwnerTickets } from "../screens/owner/OwnerTickets";

// A wrapper for protected routes
const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const token = authContext?.token;
  if (!token) {
    // not authenticated, redirect to login
    return <Navigate to="/" replace />;
  }
  return children;
};

// A wrapper for admin-only routes
const AdminRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const { profile, loading } = useAuth();
  const { currentAccountType } = useAccount();

  const token = authContext?.token;
  
  if (!token) {
    // not authenticated, redirect to login
    return <Navigate to="/" replace />;
  }

  if (loading || !profile) {
    // Still loading profile, show loading state
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C4B20] mx-auto mb-4"></div>
        <p className="text-gray-600">Verifying admin access...</p>
      </div>
    </div>;
  }

  if (!profile.isAdmin) {
    // Not an admin, redirect to appropriate dashboard
    console.log('🚫 Admin access denied for user:', profile);
    
    // Use Navigate component instead of imperative navigate() to avoid setState during render
    const redirectPath = currentAccountType === 'investor' ? "/investor/discover" : "/borrow";
    return <Navigate to={redirectPath} replace />;
  }

  console.log('✅ Admin access granted for user:', profile);
  return children;
};

// A wrapper for routes accessible by admin OR team members with permissions
// Smart redirect for /owner route based on admin or team member status
const OwnerRedirect: React.FC = () => {
  const authContext = useContext(AuthContext);
  const { profile, loading } = useAuth();
  const { currentAccountType } = useAccount();
  const [redirect, setRedirect] = React.useState<string | null>(null);

  const token = authContext?.token;

  React.useEffect(() => {
    const determineRedirect = async () => {
      if (!profile) return;

      // Admin goes to dashboard
      if (profile.isAdmin) {
        setRedirect('/owner/dashboard');
        return;
      }

      // Check team member permissions
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/team/my-permissions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          // Redirect based on available permissions
          if (data.permissions.includes('projects.view')) {
            setRedirect('/owner/projects');
          } else if (data.permissions.includes('users.view')) {
            setRedirect('/owner/users');
          } else {
            // No permissions, redirect to regular dashboard
            setRedirect(currentAccountType === 'investor' ? '/investor/discover' : '/borrow');
          }
        } else {
          // Not a team member, redirect to regular dashboard
          setRedirect(currentAccountType === 'investor' ? '/investor/discover' : '/borrow');
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
        setRedirect(currentAccountType === 'investor' ? '/investor/discover' : '/borrow');
      }
    };

    if (profile && !loading) {
      determineRedirect();
    }
  }, [profile, loading, token, currentAccountType]);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (loading || !profile || !redirect) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C4B20] mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>;
  }

  return <Navigate to={redirect} replace />;
};

const TeamOrAdminRoute: React.FC<{ 
  children: JSX.Element; 
  requiredPermission?: string;
  requiredPermissions?: string[]; // Support array of permissions
}> = ({ children, requiredPermission, requiredPermissions }) => {
  const authContext = useContext(AuthContext);
  const { profile, loading } = useAuth();
  const { currentAccountType } = useAccount();
  const [hasAccess, setHasAccess] = React.useState<boolean | null>(null);
  const [checkingPermissions, setCheckingPermissions] = React.useState(true);

  const token = authContext?.token;
  
  React.useEffect(() => {
    const checkTeamPermissions = async () => {
      if (!profile || profile.isAdmin) {
        // Admin has full access, no need to check team permissions
        setHasAccess(profile?.isAdmin || false);
        setCheckingPermissions(false);
        return;
      }

      try {
        // Check if user is a team member with permissions
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/team/my-permissions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          // Check if user has required permission or is owner
          if (data.isOwner) {
            setHasAccess(true);
          } else if (!requiredPermission && !requiredPermissions) {
            // No specific permission required
            setHasAccess(true);
          } else {
            // Check if user has any of the required permissions or wildcard
            const permsToCheck = requiredPermissions || (requiredPermission ? [requiredPermission] : []);
            const hasAnyPermission = permsToCheck.some(perm => 
              data.permissions.includes('*') || 
              data.permissions.includes(perm) ||
              // Also check for edit permission if view is required
              (perm.endsWith('.view') && data.permissions.includes(perm.replace('.view', '.edit')))
            );
            console.log(`🔐 Route access check: Required [${permsToCheck.join(', ')}], User has [${data.permissions.join(', ')}], Access: ${hasAnyPermission ? '✅' : '❌'}`);
            setHasAccess(hasAnyPermission);
          }
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Error checking team permissions:', error);
        setHasAccess(false);
      } finally {
        setCheckingPermissions(false);
      }
    };

    if (profile) {
      checkTeamPermissions();
    }
  }, [profile, token, requiredPermission, requiredPermissions]);
  
  if (!token) {
    // not authenticated, redirect to login
    return <Navigate to="/" replace />;
  }

  if (loading || !profile || checkingPermissions) {
    // Still loading profile or checking permissions, show loading state
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C4B20] mx-auto mb-4"></div>
        <p className="text-gray-600">Verifying access...</p>
      </div>
    </div>;
  }

  if (hasAccess === false) {
    // No access, redirect to appropriate dashboard
    console.log('🚫 Access denied for user:', profile);
    const redirectPath = currentAccountType === 'investor' ? "/investor/discover" : "/borrow";
    return <Navigate to={redirectPath} replace />;
  }

  console.log('✅ Access granted for user:', profile);
  return children;
};

// A wrapper for account-specific routes
const AccountProtectedRoute: React.FC<{ 
  children: JSX.Element;
  requiredAccountType: 'borrower' | 'investor';
  redirectTo?: string;
}> = ({ children, requiredAccountType, redirectTo }) => {
  const { hasAccount, currentAccountType } = useAccount();
  
  // If user doesn't have the required account type, redirect to setup or different route
  if (!hasAccount(requiredAccountType)) {
    if (requiredAccountType === 'borrower') {
      return <Navigate to="/borrowreg" replace />;
    } else {
      return <Navigate to="/investor/register" replace />;
    }
  }

  // If user has the account but is currently using a different account type, allow access
  // This enables users to access routes even when switched to other account
  return children;
};

// A wrapper for project creation routes that checks if user can create new projects
const ProjectCreationGuard: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { canCreateNewProject, currentAccountType, borrowerProfile } = useAccount();
  
  console.log('🚦 ProjectCreationGuard:', {
    canCreateNewProject,
    currentAccountType,
    hasActiveProject: borrowerProfile?.hasActiveProject,
    borrowerProfile: borrowerProfile ? 'exists' : 'missing'
  });
  
  // Only apply this guard to borrower account
  if (currentAccountType === 'borrower' && !canCreateNewProject) {
    console.log('❌ Project creation blocked: User has active project or cannot create new project');
    console.log('   Redirecting to /borwMyProj');
    return <Navigate to="/borwMyProj" replace />;
  }
  
  console.log('✅ Project creation allowed');
  return children;
};

export const AppRoutes: React.FC = () => {
  const { user, loading, profile } = useAuth();
  const { currentAccountType, borrowerProfile, investorProfile, hasAccount } = useAccount();
  const navigate = useNavigate();

  // Redirect based on auth state and account type
  useEffect(() => {
    if (!loading && user) {
      const currentPath = window.location.pathname;
      
      // Wait for profile and account context to be loaded
      if (!profile) {
        return; // Profile is still loading, don't redirect yet
      }
      
      // Check email verification - redirect to verification pending if not verified
      // Exceptions: 
      // 1. Admin users bypass email verification
      // 2. Owner email bypasses email verification
      // 3. verification-pending and verify-email pages
      const isAdmin = profile.isAdmin || user.email === 'm.shahbazsherwani@gmail.com';
      
      if (!profile.emailVerified && 
          !isAdmin &&
          currentPath !== "/verification-pending" && 
          !currentPath.startsWith("/verify-email/")) {
        console.log('📧 Email not verified - redirecting to verification pending page');
        navigate("/verification-pending", { replace: true });
        return;
      }
      
      // Special redirect for owner email - always go to /owner
      if (user.email === 'm.shahbazsherwani@gmail.com') {
        if (currentPath === "/" || currentPath === "/register") {
          navigate("/owner", { replace: true });
          return;
        }
      }
      
      // If user has completed registration and has accounts
      if (profile.hasCompletedRegistration) {
        // Don't redirect if already on a valid page or registration/auth pages
        if (currentPath !== "/" && currentPath !== "/register") {
          return; // Stay on current page
        }
        
        // Only redirect from home page to appropriate dashboard based on current account
        if (currentPath === "/") {
          if (currentAccountType === 'investor' && hasAccount('investor')) {
            navigate("/investor/discover", { replace: true });
          } else if (currentAccountType === 'borrower' && hasAccount('borrower')) {
            navigate("/borrow", { replace: true });
          } else if (profile.isAdmin) {
            navigate("/owner/dashboard", { replace: true });
          } else {
            // No accounts exist, redirect to account setup
            navigate("/borrow", { replace: true });
          }
        }
      }
      // If user needs to set up accounts
      else if (!profile.hasCompletedRegistration && currentPath !== "/borrow" && currentPath !== "/borrowreg" && currentPath !== "/borrower-reg-non-individual" && currentPath !== "/borrower-bank-details-non-individual" && currentPath !== "/borrowocu" && currentPath !== "/borrowWallet" && currentPath !== "/investor/register" && currentPath !== "/investor-reg-individual" && currentPath !== "/investor-reg-non-individual" && currentPath !== "/investor-reg-direct-lender" && currentPath !== "/investor-reg-income-details" && currentPath !== "/investor-reg-bank-details" && currentPath !== "/register" && currentPath !== "/verification-pending" && !currentPath.startsWith("/verify-email/")) {
        navigate("/borrow", { replace: true });
      }
    } else if (!loading && !user) {
      // User not logged in, allow access to login, register, and password reset pages
      const allowedPaths = ["/", "/register", "/forgot-password"];
      const isResetPasswordPath = window.location.pathname.startsWith("/reset-password/");
      
      if (!allowedPaths.includes(window.location.pathname) && !isResetPasswordPath) {
        navigate("/", { replace: true });
      }
    }
  }, [user, loading, navigate, profile, currentAccountType, borrowerProfile, investorProfile, hasAccount]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <RegistrationProvider>
      <ProjectsProvider>
        <ProjectFormProvider>
          <Routes>
            {/* Auth routes - no layout needed */}
            <Route path="/" element={<LogIn />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<EmailVerification />} />
            <Route path="/verification-pending" element={
              <PrivateRoute>
                <EmailVerificationPending />
              </PrivateRoute>
            } />
            <Route path="/accept-invitation/:token" element={
              <PrivateRoute>
                <AcceptInvitation />
              </PrivateRoute>
            } />
            
            {/* All other routes with MainLayout */}
            <Route element={<MainLayout />}>
            {/* Authentication */}
            <Route path="register" element={<RegisterStep />} />
            <Route path="register-kyc" element={<RegisterKYC />} />              {/* Initial account selection and registration flow */}
              <Route
                path="borrow"
                element={
                  <PrivateRoute>
                    <BorrowerHome />
                  </PrivateRoute>
                }
              />
              <Route
                path="borrowerHome"
                element={
                  <PrivateRoute>
                    <BorrowerHome />
                  </PrivateRoute>
                }
              />
              <Route 
                path="borrowreg" 
                element={
                  <PrivateRoute>
                    <BorrowerReg />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="borrower-reg-non-individual" 
                element={
                  <PrivateRoute>
                    <BorrowerRegNonIndividual />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="borrower-bank-details-non-individual" 
                element={
                  <PrivateRoute>
                    <BorrowerBankDetailsNonIndividual />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="borrowocu" 
                element={
                  <PrivateRoute>
                    <BorrowerOccupation />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="borrowWallet" 
                element={
                  <PrivateRoute>
                    <BorrowerWallet />
                  </PrivateRoute>
                } 
              />
              
              {/* Borrower/User features */}
              <Route 
                path="borrowCalendar" 
                element={
                  <PrivateRoute>
                    <BorrowerCalender />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="borrowEvents" 
                element={
                  <PrivateRoute>
                    <BorrowerEvent />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="borrowProj" 
                element={
                  <PrivateRoute>
                    <BorrowerProject />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="borrowBank" 
                element={
                  <PrivateRoute>
                    <BorrowerBankDet />
                  </PrivateRoute>
                } 
              />
              
              {/* Projects management */}
              <Route 
                path="borwMyProj" 
                element={
                  <PrivateRoute>
                    <BorrowerMyProjects />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="borwNewProj" 
                element={
                  <PrivateRoute>
                    <ProjectCreationGuard>
                      <BorrowerCreateNew />
                    </ProjectCreationGuard>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="borwNewProjEq" 
                element={
                  <PrivateRoute>
                    <ProjectCreationGuard>
                      <BorrowerCreateNewEq />
                    </ProjectCreationGuard>
                  </PrivateRoute>
                } 
              />
              {/* Donation and Rewards routes hidden
              <Route 
                path="borwNewProjDonation" 
                element={
                  <PrivateRoute>
                    <ProjectCreationGuard>
                      <BorwCreateNewProjDonation />
                    </ProjectCreationGuard>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="borwNewProjRewards" 
                element={
                  <PrivateRoute>
                    <ProjectCreationGuard>
                      <BorwCreateNewProjRewards />
                    </ProjectCreationGuard>
                  </PrivateRoute>
                } 
              />
              */}
              <Route 
                path="borwCreateNewProjLend" 
                element={
                  <PrivateRoute>
                    <BorwEditProjectLend />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="borwEditProject/:projectId" 
                element={
                  <PrivateRoute>
                    <BorwEditProjectLend />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="project/:projectId" 
                element={
                  <PrivateRoute>
                    <ProjectDetailsView />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/borrower/project/:projectId/details" 
                element={
                  <PrivateRoute>
                    <ProjectDetailsView />
                  </PrivateRoute>
                } 
              />
              
              {/* Milestones */}
              <Route 
                path="borwMilestones" 
                element={
                  <PrivateRoute>
                    <BorrowerMilestones />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="milestones" 
                element={
                  <PrivateRoute>
                    <Milestones />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="addMilestones" 
                element={
                  <PrivateRoute>
                    <AddMilestones />
                  </PrivateRoute>
                } 
              />
              
              {/* ROI and Payouts */}
              <Route
                path="borrowROI"
                element={
                  <PrivateRoute>
                    <BorrowerROI />
                  </PrivateRoute>
                }
              />
              <Route
                path="borrowROISales"
                element={
                  <PrivateRoute>
                    <BorrowerROISales />
                  </PrivateRoute>
                }
              />
              <Route
                path="borrowPayout"
                element={
                  <PrivateRoute>
                    <BorrowerPayoutSchedule />
                  </PrivateRoute>
                }
              />

              {/* Request routes */}
              <Route
                path="borrow/request"
                element={
                  <PrivateRoute>
                    <BorrowerReg />
                  </PrivateRoute>
                }
              />
              
              {/* Investor registration and routes */}
              <Route 
                path="/investor/register" 
                element={
                  <PrivateRoute>
                    <InvestorRegSelection />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/investor-reg-individual" 
                element={
                  <PrivateRoute>
                    <InvestorRegIndividual />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/investor-reg-non-individual" 
                element={
                  <PrivateRoute>
                    <InvestorRegNonIndividual />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/investor-reg-direct-lender" 
                element={
                  <PrivateRoute>
                    <InvestorRegDirectLender />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/investor-reg-income-details" 
                element={
                  <PrivateRoute>
                    <InvestorRegIncomeDetails />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/investor-reg-bank-details" 
                element={
                  <PrivateRoute>
                    <InvestorRegBankDetails />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/investor/discover" 
                element={
                  <PrivateRoute>
                    <InvestorDiscovery />
                  </PrivateRoute>
                } 
              />
              {/* <Route 
                path="/investor/project/:projectId/details" 
                element={
                  <PrivateRoute>
                    <InvestorProjectDetailsView />
                  </PrivateRoute>
                } 
              /> */}
              <Route 
                path="/investor/project/:projectId" 
                element={
                  <PrivateRoute>
                    <InvestorProjectView />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/investor/calendar" 
                element={
                  <PrivateRoute>
                    <InvestorCalendar />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/investor/investments" 
                element={
                  <PrivateRoute>
                    <InvestorInvestments />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/investor/wallet" 
                element={
                  <PrivateRoute>
                    <BorrowerWallet />
                  </PrivateRoute>
                } 
              />
              
              {/* Payment routes */}
              <Route 
                path="/payment/success" 
                element={
                  <PrivateRoute>
                    <PaymentSuccess />
                  </PrivateRoute>
                } 
              />
              
              {/* Admin routes */}
              <Route 
                path="/admin/projects" 
                element={
                  <PrivateRoute>
                    <OwnerLayout activePage="admin-projects">
                      <AdminProjectsList />
                    </OwnerLayout>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/project/:projectId" 
                element={
                  <PrivateRoute>
                    <OwnerLayout activePage="admin-projects">
                      <AdminProjectApproval />
                    </OwnerLayout>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/projects/:projectId" 
                element={
                  <PrivateRoute>
                    <OwnerLayout activePage="admin-projects">
                      <AdminProjectView />
                    </OwnerLayout>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/topup-requests" 
                element={
                  <PrivateRoute>
                    <OwnerLayout activePage="admin-topup">
                      <AdminTopUpRequests />
                    </OwnerLayout>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/investment-requests" 
                element={
                  <PrivateRoute>
                    <OwnerLayout activePage="admin-investment">
                      <AdminInvestmentRequests />
                    </OwnerLayout>
                  </PrivateRoute>
                } 
              />

              {/* Owner routes - Admin and Team Members */}
              <Route path="/owner" element={<OwnerRedirect />} />
              <Route 
                path="/owner/dashboard" 
                element={
                  <TeamOrAdminRoute>
                    <OwnerDashboard />
                  </TeamOrAdminRoute>
                } 
              />
              <Route 
                path="/owner/reports" 
                element={
                  <AdminRoute>
                    <OwnerReports />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/owner/users" 
                element={
                  <TeamOrAdminRoute requiredPermission="users.view">
                    <OwnerUsers />
                  </TeamOrAdminRoute>
                } 
              />
              <Route 
                path="/owner/users/:userId" 
                element={
                  <TeamOrAdminRoute requiredPermission="users.view">
                    <OwnerUserDetail />
                  </TeamOrAdminRoute>
                } 
              />
              <Route 
                path="/owner/projects" 
                element={
                  <TeamOrAdminRoute requiredPermission="projects.view">
                    <OwnerProjects />
                  </TeamOrAdminRoute>
                } 
              />
              <Route 
                path="/owner/projects/:projectId" 
                element={
                  <TeamOrAdminRoute requiredPermission="projects.view">
                    <OwnerProjectDetail />
                  </TeamOrAdminRoute>
                } 
              />
              <Route 
                path="/owner/team" 
                element={
                  <AdminRoute>
                    <OwnerTeam />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/owner/topup-requests" 
                element={
                  <AdminRoute>
                    <OwnerTopUpRequests />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/owner/investment-requests" 
                element={
                  <AdminRoute>
                    <OwnerInvestmentRequests />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/owner/tickets" 
                element={
                  <AdminRoute>
                    <OwnerTickets />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/borrow/request" 
                element={
                  <PrivateRoute>
                    <RaiseTicket />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/calendar" 
                element={
                  <PrivateRoute>
                    <UnifiedCalendarView />
                  </PrivateRoute>
                } 
              />

              {/* Settings */}
              <Route 
                path="/settings" 
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                } 
              />
            </Route>
          </Routes>
        </ProjectFormProvider>
      </ProjectsProvider>
    </RegistrationProvider>
  );
};

export default AppRoutes;