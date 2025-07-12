import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { LogIn } from "../screens/LogIn/LogIn";
import { RegisterStep } from "../screens/LogIn/RegisterStep";
import { BorrowerHome } from "../screens/BorrowerHome";
import { BorrowerReg } from "../screens/BorrowerReg";
import { BorrowerOccupation } from "../screens/BorrowOcu";
import { AuthContext } from "../contexts/AuthContext";
import { BorrowerWallet } from "../screens/BorrowerWallet";
import {BorrowerCalender} from "../screens/BorrowCalendar";
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
  return (
  <RegistrationProvider>
    <Routes>
      <Route path="/" element={<MainLayout />}>        
        <Route index element={<LogIn />} />
        <Route path="register" element={<RegisterStep />} />
        {/* Protect the borrow route */}
        <Route
          path="borrow"
          element={
            <PrivateRoute>
              <BorrowerHome />
            </PrivateRoute>
          }
          
        />
        
        <Route path="borrowreg" element={<BorrowerReg />} />
        <Route path="borrowocu" element={<BorrowerOccupation />} />
        <Route path="borrowWallet" element={<BorrowerWallet />} />
        <Route path="borrowCalendar" element={<BorrowerCalender />} />
        <Route path="borrowEvents" element={<BorrowerEvent />} />
        <Route path="borrowProj" element={<BorrowerProject />} />
        <Route path="borrowBank" element={<BorrowerBankDet />} />
        <Route path="borwMyProj"      element={<BorrowerMyProjects />} />
        <Route path="borwNewProj"     element={<BorrowerCreateNew  />} />
        <Route path="borwNewProjEq"   element={<BorrowerCreateNewEq />} />
        <Route path="borwMilestones" element={<BorrowerMilestones />} />
        <Route path="milestones" element={<Milestones />} />
        <Route path="addMilestones" element={<AddMilestones />} />
        <Route path="borrowROI" element={<PrivateRoute><BorrowerROI/></PrivateRoute>} />
        <Route path="borrowROISales" element={<PrivateRoute><BorrowerROISales/></PrivateRoute>} />
        <Route path="borrowPayout" element={<PrivateRoute><BorrowerPayoutSchedule/></PrivateRoute>
        
  }
/>
        

        






        

      </Route>
      <Route path="borrow/request" element={
        <PrivateRoute><BorrowerReg /></PrivateRoute>
      }/>
    </Routes>
    </RegistrationProvider>
  );
};

export default AppRoutes;