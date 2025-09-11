import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { useAccount } from './AccountContext';
import { API_BASE_URL } from '../config/environment';

interface Project {
  id: number;
  firebase_uid: string;
  project_data: {
    type?: string;
    status?: string;
    approvalStatus?: string;
    details?: {
      product?: string;
      loanAmount?: string;
      investmentAmount?: string;
      projectRequirements?: string;
      investorPercentage?: string;
      timeDuration?: string;
      location?: string;
      overview?: string;
      image?: string;
      fundedAmount?: string;
      [key: string]: any;
    };
    milestones?: any[];
    roi?: {
      totalAmount?: string;
      [key: string]: any;
    };
    sales?: {
      totalSales?: string;
      netIncomeCalc?: string;
      [key: string]: any;
    };
    payout?: any;
    investorRequests?: any[];
    interestRequests?: any[];
    [key: string]: any;
  };
  created_at: string;
  updated_at?: string;
  full_name?: string;
  // Legacy fields for backward compatibility
  title?: string;
  amount?: number;
  description?: string;
  interest_rate?: number;
  start_date?: string;
  end_date?: string;
  image?: string;
  creator_name?: string;
  creator_email?: string;
  borrower_profile?: {
    business_name?: string;
    phone?: string;
    address?: string;
  };
  // Additional legacy fields that might exist on project objects
  status?: string;
  roi?: any;
  sales?: any;
  milestones?: any[];
  investorRequests?: any[];
  interestRequests?: any[];
  fundingProgress?: number;
  estimatedReturn?: number;
  timeDuration?: string;
  createdAt?: string;
  [key: string]: any;  // Allow any additional properties for flexibility
}

interface ProjectsContextType {
  projects: Project[];
  loading: boolean;
  loadProjects: () => Promise<void>;
  updateProject: (id: string, updates: any) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addProject: (projectData: any) => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const ProjectsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, token, profile } = useContext(AuthContext)!;
  const { currentAccountType } = useAccount();

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Loading projects for account type:", currentAccountType);
      console.log("Loading projects for role:", profile?.role);
      console.log("API_BASE_URL:", API_BASE_URL);

      // For investor account type, use calendar endpoint to get projects from all users
      // For borrower account type, use projects endpoint to get only user's own projects
      const endpoint = currentAccountType === 'investor' 
        ? '/calendar/projects' 
        : '/projects';

      console.log("Using endpoint:", endpoint);
      console.log("Full URL:", `${API_BASE_URL}${endpoint}`);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("API Response:", data);
        
        // Handle both response formats: direct array or {success: true, data: []}
        let projectsData = [];
        if (Array.isArray(data)) {
          // Direct array response
          projectsData = data;
        } else if (data.success && data.data) {
          // Wrapped response
          projectsData = data.data;
        } else {
          console.error('Unexpected response format:', data);
          setProjects([]);
          return;
        }
        
        console.log("Projects loaded:", projectsData);
        
        // For borrower account type, filter projects to show only user's own projects
        if (currentAccountType === 'borrower' && user) {
          console.log("Filtering projects for user:", user.uid);
          projectsData = projectsData.filter((project: Project) => {
            console.log("Project firebase_uid:", project.firebase_uid, "User uid:", user.uid);
            return project.firebase_uid === user.uid;
          });
          console.log("Filtered projects:", projectsData);
        }
        
        setProjects(projectsData);
      } else {
        console.error('Failed to fetch projects:', response.status);
        setProjects([]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [token, currentAccountType, user]);

  const updateProject = useCallback(async (id: string, updates: any) => {
    try {
      console.log(`Updating project ${id} with:`, updates);
      
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        console.log(`✅ Project ${id} updated successfully`);
        // Reload projects to get the updated data
        await loadProjects();
      } else {
        const errorData = await response.json();
        console.error('Failed to update project:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }, [token, loadProjects]);

  const deleteProject = useCallback(async (id: string) => {
    try {
      console.log(`Deleting project ${id}`);
      
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log(`✅ Project ${id} deleted successfully`);
        // Reload projects to get the updated list
        await loadProjects();
      } else {
        const errorData = await response.json();
        console.error('Failed to delete project:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }, [token, loadProjects]);

  const addProject = useCallback(async (projectData: any) => {
    try {
      console.log(`Adding new project:`, projectData);
      
      const response = await fetch(`${API_BASE_URL}/projects/create-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Project created successfully:`, result);
        // Reload projects to get the updated list
        await loadProjects();
        return result;
      } else {
        const errorData = await response.json();
        console.error('Failed to create project:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }, [token, loadProjects]);

  useEffect(() => {
    if (user && token) {
      loadProjects();
    }
  }, [user, token, currentAccountType, loadProjects]);

  const value = {
    projects,
    loading,
    loadProjects,
    updateProject,
    deleteProject,
    addProject,
  };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};
