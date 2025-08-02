import React, { createContext, useContext, useState } from "react";

export interface Milestone {
  amount: string;
  percentage: string;
  date: Date | null;
  file: File | null;
}

export interface ProjectForm {
  projectId: string; // Make sure this exists
  selectedType: string | null;
  projectDetails: any;
  milestones: Milestone[];
  roi: any;
  sales: any;
  payoutSchedule: any;
}

interface ProjectFormContextType {
  form: ProjectForm;
  setForm: React.Dispatch<React.SetStateAction<ProjectForm>>;
  loadProject: (project: any) => void; // Add this
}

export const ProjectFormContext = createContext<ProjectFormContextType | undefined>(undefined);

export const ProjectFormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [form, setForm] = useState<ProjectForm>({
    projectId: "",
    selectedType: null,
    projectDetails: {},
    milestones: [],
    roi: {},
    sales: {},
    payoutSchedule: {},
  });

  const loadProject = (project: any) => {
    console.log("Loading project into form:", project);
    setForm({
      projectId: project.id,
      selectedType: project.type || '',
      projectDetails: project.details || {},
      milestones: project.milestones || [],
      roi: project.roi || { expenses: [], income: [] },
      sales: project.sales || { projections: [] },
      payoutSchedule: project.payoutSchedule || []
    });
  };

  return (
    <ProjectFormContext.Provider value={{ form, setForm, loadProject }}>
      {children}
    </ProjectFormContext.Provider>
  );
};

export const useProjectForm = () => {
  const context = useContext(ProjectFormContext);
  if (!context) {
    throw new Error("useProjectForm must be used within a ProjectFormProvider");
  }
  return context;
};