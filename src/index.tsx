import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import { AppRoutes } from "./routes/AppRoutes";
import { AuthProvider } from './contexts/AuthContext';  // correct path
import { ProjectsProvider } from './contexts/ProjectsContext'; // <-- Add this import
import { AccountProvider } from './contexts/AccountContext'; // Add AccountProvider
import { NotificationProvider } from './contexts/NotificationContext'; // Add NotificationProvider

function ScrollManager() {
  const location = useLocation();

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return null;
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollManager />
      <AuthProvider>
        <AccountProvider> {/* Wrap with AccountProvider */}
          <NotificationProvider> {/* Add NotificationProvider */}
            <ProjectsProvider> {/* <-- Wrap your routes with ProjectsProvider */}
              <AppRoutes />
            </ProjectsProvider>
          </NotificationProvider>
        </AccountProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);


