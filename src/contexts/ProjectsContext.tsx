import React, { createContext, useState, useContext } from "react";
import type { Milestone } from "../types/Milestone";


export interface Project {
  id: string;
  type: string;
  details: any;
  milestones: Milestone[];
  roi: any;
  sales: any;
  payoutSchedule: any;
  status: string; // <-- Add this line
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