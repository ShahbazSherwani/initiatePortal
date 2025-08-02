import React, { useContext, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { LogIn } from "../screens/LogIn/LogIn";
import { RegisterStep } from "../screens/LogIn/RegisterStep";
import { BorrowerHome } from "../screens/BorrowerHome";
import { BorrowerReg } from "../screens/BorrowerReg";
import { BorrowerOccupation } from "../screens/BorrowOcu";
import { AuthContext } from "../contexts/AuthContext";
import { BorrowerWallet } from "../screens/BorrowerWallet";
import { BorrowerCalender } from "../screens/BorrowCalendar";
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
import { InvestorDiscovery } from "../screens/InvestorDiscovery";
import { InvestorProjectView } from "../screens/InvestorProjectView";
import { InvestorCalendar } from "../screens/InvestorCalendar";
import { useAuth } from '../contexts/AuthContext';
import { BorrowerPayoutSchedule } from "../screens/BorrowerPayoutSchedule";

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

export const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect based on auth state
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User not logged in, redirect to home
        navigate("/", { replace: true });
      }
    }
  }, [user, loading, navigate]);

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
            
            {/* All other routes with MainLayout */}
            <Route element={<MainLayout />}>
              {/* Authentication */}
              <Route path="register" element={<RegisterStep />} />
              
              {/* Initial account selection and registration flow */}
              <Route
                path="borrow"
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
                    <BorrowerCreateNew />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="borwNewProjEq" 
                element={
                  <PrivateRoute>
                    <BorrowerCreateNewEq />
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
              
              {/* Investor routes */}
              <Route 
                path="/investor/discover" 
                element={
                  <PrivateRoute>
                    <InvestorDiscovery />
                  </PrivateRoute>
                } 
              />
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
            </Route>
          </Routes>
        </ProjectFormProvider>
      </ProjectsProvider>
    </RegistrationProvider>
  );
};

export default AppRoutes;