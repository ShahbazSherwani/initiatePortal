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
import BorrowerCalender from "../screens/BorrowCalendar";

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
        

      </Route>
      <Route path="borrow/request" element={
        <PrivateRoute><BorrowerReg /></PrivateRoute>
      }/>
    </Routes>
  );
};

export default AppRoutes;