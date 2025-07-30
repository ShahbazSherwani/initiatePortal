import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes/AppRoutes";
import { AuthProvider } from './contexts/AuthContext';  // correct path
import { ProjectsProvider } from './contexts/ProjectsContext'; // <-- Add this import



const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProjectsProvider> {/* <-- Wrap your routes with ProjectsProvider */}
          <AppRoutes />
        </ProjectsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);


