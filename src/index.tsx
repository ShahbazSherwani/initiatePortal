import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes/AppRoutes";
import { AuthProvider } from './contexts/AuthContext';  // correct path
import { ProjectsProvider } from './contexts/ProjectsContext'; // <-- Add this import
import { AccountProvider } from './contexts/AccountContext'; // Add AccountProvider

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AccountProvider> {/* Wrap with AccountProvider */}
          <ProjectsProvider> {/* <-- Wrap your routes with ProjectsProvider */}
            <AppRoutes />
          </ProjectsProvider>
        </AccountProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);


