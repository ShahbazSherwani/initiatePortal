import React, { createContext, useState, useContext } from "react";
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
  status: string;
}

const ProjectsContext = createContext<{
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
} | undefined>(undefined);

export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);

  const addProject = (project: Project) => {
    console.log("Adding project:", project);
    setProjects(prev => [...prev, project]);
  };
  const updateProject = (id: string, data: Partial<Project>) =>
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));

  return (
    <ProjectsContext.Provider value={{ projects, addProject, updateProject }}>
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjects = () => {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used within ProjectsProvider");
  return ctx;
};