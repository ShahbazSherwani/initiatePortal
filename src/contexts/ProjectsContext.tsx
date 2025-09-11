import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { useAccount } from './AccountContext';
import { API_BASE_URL } from '../config/environment';

interface Project {
  id: string;
  title: string;
  amount: number;
  description: string;
  interest_rate: number;
  start_date: string;
  end_date: string;
  image?: string;
  firebase_uid: string;
  creator_name?: string;
  creator_email?: string;
  borrower_profile?: {
    business_name?: string;
    phone?: string;
    address?: string;
  };
}

interface ProjectsContextType {
  projects: Project[];
  loading: boolean;
  loadProjects: () => Promise<void>;
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

  useEffect(() => {
    if (user && token) {
      loadProjects();
    }
  }, [user, token, currentAccountType, loadProjects]);

  const value = {
    projects,
    loading,
    loadProjects,
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
