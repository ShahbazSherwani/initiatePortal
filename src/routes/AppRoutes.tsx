import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { LogIn } from "../screens/LogIn/LogIn";
import { RegisterStep } from "../screens/LogIn/RegisterStep";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<LogIn />} />
        <Route path="register" element={<RegisterStep />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
