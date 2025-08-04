import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { getMyProjects, createProject as apiCreateProject, updateProject as apiUpdateProject, getAdminProjects as apiGetAdminProjects, getCalendarProjects } from '../lib/api';
import { AuthContext } from './AuthContext';
import type { Milestone } from "../types/Milestone";


export interface Project {
  id: string;
  type: string;
  details: {
    product?: string;
    loanAmount?: number;        // Change to number
    investmentAmount?: number;  // Change to number
    fundedAmount?: number;      // Change to number
    image?: string;
    timeDuration?: string;
    investorPercentage?: number; // Change to number
    // other existing details
  };
  milestones?: {
    id: string;
    name: string;
    amount: string;
    percentage: string;
    date?: Date | null;
    image: string; // This is crucial
  }[];     // Make optional
  timeDuration?: string;
  createdAt?: string;
  estimatedReturn?: number;
  fundingProgress?: number;
  approvalStatus?: "pending" | "approved" | "rejected"; // Add this
  roi?: {
    totalAmount?: number;       // Change to number
    description?: string;       // Add common properties
    pricePerUnit?: number;
    unitOfMeasure?: string;
    // other ROI properties
  };
  sales?: {
    totalSales?: number;        // Change to number
    netIncomeCalc?: number;     // Change to number
    description?: string;
    salesPricePerUnit?: number;
    expectedYield?: number;
    // other sales properties
  };
  payoutSchedule?: {            // Add this
    scheduleDate?: string;
    scheduleAmount?: number;
    totalPayoutReq?: number;
    payoutPercent?: number;
    netIncome?: number;
    penaltyAgree?: boolean;
    legalAgree?: boolean;
  };
  status: "draft" | "pending" | "published" | "funded" | "in-progress" | "completed" | "closed";
  investorRequests?: {
    investorId: string;
    name: string;
    amount: number;
    date: string;
    status: "pending" | "accepted" | "rejected";
  }[];
}

const ProjectsContext = createContext<{
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  loadProjects: () => Promise<void>;
  getAdminProjects: () => Promise<any[]>; // Add this line
  loading: boolean;
} | undefined>(undefined);

export const ProjectsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const { token, user, profile } = useContext(AuthContext)!;
  
  // Load projects whenever user or token changes
  useEffect(() => {
    if (user && token) {
      loadProjects();
    } else {
      // Clear projects when user logs out
      setProjects([]);
    }
  }, [user, token, profile?.role]);
  
  const loadProjects = async () => {
    try {
      setLoading(true);
      console.log("Loading projects for role:", profile?.role);
      
      let data;
      if (profile?.role === 'investor') {
        // For investors, load all approved projects from all borrowers
        data = await getCalendarProjects();
        console.log(`Loaded ${data.length} calendar projects for investor`);
      } else {
        // For borrowers, load only their own projects
        data = await getMyProjects();
        console.log(`Loaded ${data.length} own projects for borrower`);
      }
      
      setProjects(data);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const addProject = async (project: Project) => {
    try {
      setLoading(true);
      
      // Add status if not present
      if (!project.status) {
        project.status = "draft";
      }
      
      // Add creation date if not present
      if (!project.createdAt) {
        project.createdAt = new Date().toISOString();
      }
      
      console.log("Creating project:", project);
      const result = await apiCreateProject(project);
      
      if (result.success) {
        console.log("Project created successfully:", result);
        // Reload to get fresh data
        await loadProjects();
        return result;
      } else {
        throw new Error("Failed to create project");
      }
    } catch (error) {
      console.error("Project creation failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      setLoading(true);
      
      console.log("Updating project:", id, updates);
      
      // Find current project - compare as strings
      const currentProject = projects.find(p => p.id.toString() === id.toString());
      if (!currentProject) {
        console.error(`Project with ID ${id} not found in local state`);
        throw new Error(`Project with ID ${id} not found`);
      }
      
      // Merge updates with current project (deep merge for nested objects)
      const updatedProject = { 
        ...currentProject, 
        ...updates,
        // Deep merge for nested objects
        details: updates.details ? { ...currentProject.details, ...updates.details } : currentProject.details,
        milestones: updates.milestones || currentProject.milestones,
        roi: updates.roi ? { ...currentProject.roi, ...updates.roi } : currentProject.roi,
        sales: updates.sales ? { ...currentProject.sales, ...updates.sales } : currentProject.sales,
        payoutSchedule: updates.payoutSchedule ? { ...currentProject.payoutSchedule, ...updates.payoutSchedule } : currentProject.payoutSchedule,
      };
      
      const result = await apiUpdateProject(id, updatedProject);
      
      if (result.success) {
        console.log("Project updated successfully");
        // Update local state - keep ID as string
        setProjects(projects.map(p => 
          p.id.toString() === id.toString() ? { ...updatedProject, id: id.toString() } : p
        ));
        return result;
      } else {
        throw new Error("Failed to update project");
      }
    } catch (error) {
      console.error("Project update failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Add this function
  const getAdminProjects = async () => {
    try {
      setLoading(true);
      const data = await apiGetAdminProjects();
      return data;
    } catch (error) {
      console.error("Failed to fetch admin projects:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Include it in the provider value
  return (
    <ProjectsContext.Provider value={{ 
      projects, 
      addProject, 
      updateProject, 
      loadProjects,
      getAdminProjects, // Add this line
      loading
    }}>
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjects = () => {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used within ProjectsProvider");
  return ctx;
};