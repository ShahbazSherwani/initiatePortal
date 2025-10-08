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
import { InvestorRegIncomeDetails } from "../screens/InvestorRegIncomeDetails";
import { InvestorRegBankDetails } from "../screens/InvestorRegBankDetails";
import Settings from "../screens/Settings";
import BorwCreateNewProjDonation from "../screens/BorwCreateNewProjDonation";
import BorwCreateNewProjRewards from "../screens/BorwCreateNewProjRewards";

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
  const navigate = useNavigate();

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
    
    // Redirect based on current account type
    if (currentAccountType === 'investor') {
      navigate("/investor/discover", { replace: true });
    } else {
      navigate("/borrow", { replace: true });
    }
    
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-red-600">Access denied. Redirecting...</p>
      </div>
    </div>;
  }

  console.log('✅ Admin access granted for user:', profile);
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
      else if (!profile.hasCompletedRegistration && currentPath !== "/borrow" && currentPath !== "/borrowreg" && currentPath !== "/borrower-reg-non-individual" && currentPath !== "/borrower-bank-details-non-individual" && currentPath !== "/borrowocu" && currentPath !== "/borrowWallet" && currentPath !== "/investor/register" && currentPath !== "/investor-reg-individual" && currentPath !== "/investor-reg-non-individual" && currentPath !== "/investor-reg-direct-lender" && currentPath !== "/investor-reg-income-details" && currentPath !== "/investor-reg-bank-details" && currentPath !== "/register") {
        navigate("/borrow", { replace: true });
      }
    } else if (!loading && !user) {
      // User not logged in, allow access to login and register pages
      if (window.location.pathname !== "/" && window.location.pathname !== "/register") {
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

              {/* Owner routes - Admin only */}
              <Route path="/owner" element={<Navigate to="/owner/dashboard" replace />} />
              <Route 
                path="/owner/dashboard" 
                element={
                  <AdminRoute>
                    <OwnerDashboard />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/owner/users" 
                element={
                  <AdminRoute>
                    <OwnerUsers />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/owner/users/:userId" 
                element={
                  <AdminRoute>
                    <OwnerUserDetail />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/owner/projects" 
                element={
                  <AdminRoute>
                    <OwnerProjects />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/owner/projects/:projectId" 
                element={
                  <AdminRoute>
                    <OwnerProjectDetail />
                  </AdminRoute>
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