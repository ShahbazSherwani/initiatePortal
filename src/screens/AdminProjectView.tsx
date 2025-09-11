import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge'; // Add this import
import { toast } from 'react-hot-toast';

export const AdminProjectView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchProject() {
      setLoading(true);
      try {
        // Try to fetch from server
        const data = await authFetch(`${API_BASE_URL}/admin/projects/${projectId}`);
        console.log("Admin project data:", data);
        setProject(data);
        
        // Cache project data for offline use
        localStorage.setItem(`project_${projectId}`, JSON.stringify(data));
      } catch (error) {
        console.error("Failed to load project:", error);
        
        // Try to load from cache if network error
        if (error.code === "auth/network-request-failed") {
          const cachedProject = localStorage.getItem(`project_${projectId}`);
          if (cachedProject) {
            console.log("Using cached project data");
            setProject(JSON.parse(cachedProject));
            return;
          }
        }
        
        toast.error("Failed to load project details");
      } finally {
        setLoading(false);
      }
    }
    
    fetchProject();
  }, [projectId]);
  
  // Redirect directly to the approval page instead of showing intermediate buttons
  useEffect(() => {
    if (projectId) {
      navigate(`/admin/project/${projectId}`, { replace: true });
    }
  }, [projectId, navigate]);
  
  return <div>Redirecting to project review...</div>;
};