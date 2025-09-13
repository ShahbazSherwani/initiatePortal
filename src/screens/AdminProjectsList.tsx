import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { getAdminProjects as apiGetAdminProjects } from '../lib/api';

export const AdminProjectsList: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [adminProjects, setAdminProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Redirect if not admin
  useEffect(() => {
    if (profile && !profile.isAdmin) {
      navigate('/borrow');
      toast.error('You do not have permission to access this page');
    }
  }, [profile, navigate]);
  
  // Fetch admin projects
  useEffect(() => {
    async function fetchAdminProjects() {
      setLoading(true);
      try {
        const data = await apiGetAdminProjects();
        console.log("Admin projects loaded:", data);
        setAdminProjects(data);
        
        // Only store minimal data to avoid quota issues
        try {
          const minimalProjectData = data.map(p => ({
            id: p.id,
            firebase_uid: p.firebase_uid,
            full_name: p.full_name,
            created_at: p.created_at,
            project_data: {
              status: p.project_data?.status,
              type: p.project_data?.type,
              approvalStatus: p.project_data?.approvalStatus,
              details: {
                product: p.project_data?.details?.product
              }
            }
          }));
          
          // Use sessionStorage instead of localStorage
          sessionStorage.setItem("cachedAdminProjects", JSON.stringify(minimalProjectData));
        } catch (storageError) {
          console.warn("Failed to cache admin projects:", storageError);
          // Continue without caching
        }
      } catch (error) {
        console.error("Failed to load admin projects:", error);
        
        // Try to use cached data
        try {
          const cachedData = sessionStorage.getItem("cachedAdminProjects") || 
                             localStorage.getItem("cachedAdminProjects");
          if (cachedData) {
            console.log("Using cached admin projects data");
            setAdminProjects(JSON.parse(cachedData));
          } else {
            toast.error("Failed to load projects");
          }
        } catch (cacheError) {
          console.error("Error reading cache:", cacheError);
          toast.error("Failed to load projects");
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchAdminProjects();
  }, []); // Remove getAdminProjects from dependencies
  
  // Log projects data structure for debugging
  console.log("Projects data structure:", adminProjects.map(p => ({
    id: p.id,
    hasProjectData: !!p.project_data,
    status: p.project_data?.status,
    approvalStatus: p.project_data?.approvalStatus
  })));
  
  // Add this at the top of your AdminProjectsList component:
  console.log("Raw projects data:", adminProjects);

  const safeFilteredProjects = adminProjects
    .filter(project => project && project.project_data) // Only include valid projects
    .filter(project => {
      try {
        if (filter === 'all') return true;
        
        if (filter === 'pending') {
          return (project.project_data.status === 'published' && 
                  (project.project_data.approvalStatus === 'pending' || 
                   !project.project_data.approvalStatus));
        }
        
        return project.project_data.approvalStatus === filter;
      } catch (error) {
        console.error("Error filtering project:", project, error);
        return false;
      }
    });
  
  // Filter projects based on selected filter
  const filteredProjects = adminProjects.filter(project => {
    // Skip any projects with missing project_data
    if (!project || !project.project_data) {
      console.warn("Found project with missing project_data:", project);
      return false;
    }
    
    if (filter === 'all') return true;
    if (filter === 'pending') {
      // Include both:
      // 1. Published projects waiting for approval
      // 2. Draft projects needing review
      return (
        (project.project_data.status === 'draft') || 
        (project.project_data.status === 'published' && 
         (project.project_data.approvalStatus === 'pending' || !project.project_data.approvalStatus))
      );
    }
    return project.project_data.approvalStatus === filter;
  });
  
  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block w-[280px] flex-shrink-0">
          <Sidebar activePage="admin" />
        </div>
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Admin Project Management</h1>
              <Button onClick={() => navigate('/calendar')} className="bg-[#0C4B20] text-white">
                View Calendar
              </Button>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex gap-4 mb-6">
                <Button 
                  onClick={() => setFilter('pending')}
                  variant={filter === 'pending' ? 'default' : 'outline'}
                >
                  Pending Approval
                </Button>
                <Button 
                  onClick={() => setFilter('approved')}
                  variant={filter === 'approved' ? 'default' : 'outline'}
                >
                  Approved
                </Button>
                <Button 
                  onClick={() => setFilter('rejected')}
                  variant={filter === 'rejected' ? 'default' : 'outline'}
                >
                  Rejected
                </Button>
                <Button 
                  onClick={() => setFilter('all')}
                  variant={filter === 'all' ? 'default' : 'outline'}
                >
                  All Projects
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map(project => (
                      <TableRow key={project.id}>
                        <TableCell>{project.id}</TableCell>
                        <TableCell>
                          {project.project_data.details?.product || 'Unnamed Project'}
                        </TableCell>
                        <TableCell>{project.full_name || 'Unknown'}</TableCell>
                        <TableCell>{project.project_data.type || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {/* Project status (draft or published) */}
                            <Badge className={
                              project.project_data.status === 'published' ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {project.project_data.status === 'draft' ? 'Draft' : 'Published'}
                            </Badge>
                            
                            {/* Approval status (if applicable) */}
                            {project.project_data.status === 'published' && project.project_data.approvalStatus && (
                              <Badge className={
                                project.project_data.approvalStatus === 'approved' ? 'bg-blue-100 text-blue-800' :
                                project.project_data.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }>
                                {project.project_data.approvalStatus}
                              </Badge>
                            )}
                            
                            {/* Submitted for review indicator */}
                            {project.project_data.status === 'draft' && project.project_data.submittedForReview && (
                              <Badge className="bg-purple-100 text-purple-800">
                                Ready for Review
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {project.created_at ? format(new Date(project.created_at), 'MMM d, yyyy') : 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Button 
                            onClick={() => navigate(`/admin/project/${project.id}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Review
                          </Button>
                          
                          <Button
                            onClick={() => navigate(`/borrower/project/${project.id}/details`)}
                            size="sm"
                            variant="outline"
                            className="w-full"
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No projects found matching your criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminProjectsList;