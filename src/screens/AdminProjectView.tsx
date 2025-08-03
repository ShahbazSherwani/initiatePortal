import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../lib/api';
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
        const data = await authFetch(`/api/admin/projects/${projectId}`);
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
  
  if (loading) return <div>Loading project details...</div>;
  if (!project) return <div>Project not found</div>;
  
  // Rest of your component to display project details
  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block w-[280px] flex-shrink-0">
          <Sidebar activePage="admin" />
        </div>
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Project details */}
          <h1>Project: {project.project_data?.details?.product || "Untitled Project"}</h1>
          
          {/* Admin Actions */}
          <div className="mt-6 flex gap-4">
            <Button
              onClick={() => navigate(`/admin/project/${projectId}`)} // Change from "/admin/projects/${projectId}/approve"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Approve Project
            </Button>
            
            <Button
              onClick={() => navigate(`/admin/project/${projectId}`)} // Change from "/admin/projects/${projectId}/reject"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Reject Project
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};