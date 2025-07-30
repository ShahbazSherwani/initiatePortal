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
}

const ProjectFormContext = createContext<ProjectFormContextType | undefined>(undefined);

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

  return (
    <ProjectFormContext.Provider value={{ form, setForm }}>
      {children}
    </ProjectFormContext.Provider>
  );
};

export const useProjectForm = () => {
  const ctx = useContext(ProjectFormContext);
  if (!ctx) throw new Error("useProjectForm must be used within ProjectFormProvider");
  return ctx;
};