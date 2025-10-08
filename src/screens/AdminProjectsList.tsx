// src/screens/AdminProjectsList.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { getAdminProjects as apiGetAdminProjects } from '../lib/api';
import { 
  SearchIcon, 
  EyeIcon, 
  FolderIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FilterIcon
} from 'lucide-react';

export const AdminProjectsList: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [adminProjects, setAdminProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
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
        
        try {
          const minimalProjectData = data.map((p: any) => ({
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
          
          sessionStorage.setItem("cachedAdminProjects", JSON.stringify(minimalProjectData));
        } catch (storageError) {
          console.warn("Failed to cache admin projects:", storageError);
        }
      } catch (error) {
        console.error("Failed to load admin projects:", error);
        
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
  }, []);

  // Filter projects
  const filteredProjects = adminProjects.filter(project => {
    if (!project || !project.project_data) return false;
    
    // Apply status filter
    let matchesFilter = false;
    if (filter === 'all') {
      matchesFilter = true;
    } else if (filter === 'pending') {
      matchesFilter = (
        (project.project_data.status === 'draft') || 
        (project.project_data.status === 'published' && 
         (project.project_data.approvalStatus === 'pending' || !project.project_data.approvalStatus))
      );
    } else {
      matchesFilter = project.project_data.approvalStatus === filter;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        project.project_data.details?.product?.toLowerCase().includes(query) ||
        project.full_name?.toLowerCase().includes(query) ||
        project.id?.toString().includes(query);
      return matchesFilter && matchesSearch;
    }

    return matchesFilter;
  });

  const getStatusBadge = (status: string, approvalStatus?: string) => {
    if (approvalStatus === 'approved') {
      return (
        <Badge className="bg-green-100 text-green-800 border-0">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    }
    if (approvalStatus === 'rejected') {
      return (
        <Badge className="bg-red-100 text-red-800 border-0">
          <XCircleIcon className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    if (status === 'published') {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-0">
          <ClockIcon className="w-3 h-3 mr-1" />
          Pending Review
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800 border-0">
        Draft
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      equity: 'bg-purple-100 text-purple-800',
      lending: 'bg-blue-100 text-blue-800',
      donation: 'bg-green-100 text-green-800'
    };
    
    return (
      <Badge className={`${variants[type] || 'bg-gray-100 text-gray-800'} border-0`}>
        {type?.charAt(0).toUpperCase() + type?.slice(1) || 'N/A'}
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Projects</h1>
                <p className="text-gray-600 mt-1">Review and manage project submissions</p>
              </div>
              <Button 
                onClick={() => navigate('/calendar')} 
                className="bg-[#0C4B20] hover:bg-[#0A3D1A] text-white w-full sm:w-auto"
              >
                View Calendar
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white shadow-sm border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-gray-900">{adminProjects.length}</p>
                    </div>
                    <FolderIcon className="w-8 h-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {adminProjects.filter(p => 
                          p.project_data?.status === 'published' && 
                          (p.project_data?.approvalStatus === 'pending' || !p.project_data?.approvalStatus)
                        ).length}
                      </p>
                    </div>
                    <ClockIcon className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Approved</p>
                      <p className="text-2xl font-bold text-green-600">
                        {adminProjects.filter(p => p.project_data?.approvalStatus === 'approved').length}
                      </p>
                    </div>
                    <CheckCircleIcon className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Rejected</p>
                      <p className="text-2xl font-bold text-red-600">
                        {adminProjects.filter(p => p.project_data?.approvalStatus === 'rejected').length}
                      </p>
                    </div>
                    <XCircleIcon className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-4 md:p-6">
                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button 
                    onClick={() => setFilter('pending')}
                    variant={filter === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 sm:flex-none"
                  >
                    <ClockIcon className="w-4 h-4 mr-2" />
                    Pending
                  </Button>
                  <Button 
                    onClick={() => setFilter('approved')}
                    variant={filter === 'approved' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 sm:flex-none"
                  >
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Approved
                  </Button>
                  <Button 
                    onClick={() => setFilter('rejected')}
                    variant={filter === 'rejected' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 sm:flex-none"
                  >
                    <XCircleIcon className="w-4 h-4 mr-2" />
                    Rejected
                  </Button>
                  <Button 
                    onClick={() => setFilter('all')}
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 sm:flex-none"
                  >
                    <FilterIcon className="w-4 h-4 mr-2" />
                    All
                  </Button>
                </div>

                {/* Search */}
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search by project name, creator, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Projects List */}
            {loading ? (
              <Card className="bg-white shadow-sm border-0">
                <CardContent className="p-12 text-center">
                  <div className="text-gray-500">Loading projects...</div>
                </CardContent>
              </Card>
            ) : filteredProjects.length === 0 ? (
              <Card className="bg-white shadow-sm border-0">
                <CardContent className="p-12 text-center">
                  <FolderIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                  <p className="text-gray-500">
                    {searchQuery ? 'Try adjusting your search criteria' : `No ${filter} projects at the moment`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map(project => (
                  <Card key={project.id} className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Project Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                                {project.project_data.details?.product || 'Unnamed Project'}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                                <span className="flex items-center">
                                  <span className="font-medium text-gray-900">ID:</span> {project.id}
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="flex items-center">
                                  {project.full_name || 'Unknown'}
                                </span>
                                <span className="text-gray-300">•</span>
                                <span>
                                  {project.created_at ? format(new Date(project.created_at), 'MMM d, yyyy') : 'Unknown'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-2">
                            {getStatusBadge(project.project_data.status, project.project_data.approvalStatus)}
                            {getTypeBadge(project.project_data.type)}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-2 md:flex-col md:w-32">
                          <Button 
                            onClick={() => navigate(`/admin/project/${project.id}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                            size="sm"
                          >
                            <EyeIcon className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                          
                          <Button
                            onClick={() => navigate(`/owner/projects/${project.id}`)}
                            size="sm"
                            variant="outline"
                            className="w-full"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
  );
};

export default AdminProjectsList;
