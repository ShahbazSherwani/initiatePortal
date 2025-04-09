import { Outlet } from "react-router-dom";

export const MainLayout = () => {
  return (
    <main>
      {/* Optional shared header, nav, or footer */}
      <Outlet />
    </main>
  );
};

export default MainLayout;
