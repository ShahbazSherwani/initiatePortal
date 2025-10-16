// src/screens/owner/OwnerProjects.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OwnerLayout } from '../../layouts/OwnerLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { authFetch } from '../../lib/api';
import { API_BASE_URL } from '../../config/environment';
import { useAuth } from '../../contexts/AuthContext';
import { 
  SearchIcon, 
  EyeIcon, 
  FolderIcon,
  CalendarIcon,
  UserIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  ClockIcon,
  PauseCircleIcon,
  CheckCircleIcon,
  SlidersHorizontalIcon,
  FilterIcon,
  MoreHorizontalIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Project {
  id: string;
  title: string;
  borrowerName: string;
  borrowerUid: string;
  type: 'equity' | 'lending' | 'donation';
  status: 'pending' | 'active' | 'published' | 'completed' | 'default' | 'suspended';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  fundingAmount: number;
  fundingProgress: string;
  location?: string;
  createdAt: string;
  thumbnail?: string;
  description?: string;
}

const PROJECT_TABS = [
  { key: 'all', label: 'All Projects', icon: <FolderIcon className="w-4 h-4" /> },
  { key: 'pending', label: 'Pending Approval', icon: <ClockIcon className="w-4 h-4" /> },
  { key: 'active', label: 'Active', icon: <ShieldCheckIcon className="w-4 h-4" /> },
  { key: 'completed', label: 'Completed', icon: <CheckCircleIcon className="w-4 h-4" /> },
  { key: 'suspended', label: 'Suspended', icon: <PauseCircleIcon className="w-4 h-4" /> },
];

const PROJECT_TYPES = [
  { key: 'all', label: 'All Types' },
  { key: 'equity', label: 'Equity' },
  { key: 'lending', label: 'Lending' },
  { key: 'donation', label: 'Donation' },
];

export const OwnerProjects: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get('status') || 'all');
  const [selectedType, setSelectedType] = useState('all');
  const [filters, setFilters] = useState({
    dateRange: 'all',
    fundingRange: 'all'
  });
  const [canApproveProjects, setCanApproveProjects] = useState(false);

  // Fetch user permissions to check if they can approve projects
  useEffect(() => {
    const fetchPermissions = async () => {
      // Admins can always approve
      if (profile?.isAdmin) {
        setCanApproveProjects(true);
        return;
      }

      try {
        const data = await authFetch(`${API_BASE_URL}/team/my-permissions`);
        const hasApprovePermission = data.permissions?.includes('projects.approve') || false;
        setCanApproveProjects(hasApprovePermission);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setCanApproveProjects(false);
      }
    };

    if (profile) {
      fetchPermissions();
    }
  }, [profile]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchQuery, activeTab, selectedType, filters]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await authFetch(`${API_BASE_URL}/owner/projects`);
      console.log('✅ Projects loaded successfully:', data.length, 'projects');
      setProjects(data);
    } catch (error: any) {
      console.error('❌ Error fetching projects:', error);
      
      // Check if it's a timeout or database error
      if (error?.message?.includes('timeout') || error?.message?.includes('Database error')) {
        toast.error('Database timeout - please contact administrator');
        setProjects([]); // Show empty instead of mock data
      } else {
        toast.error('Failed to load projects');
        setProjects([]); // Show empty instead of mock data
      }
      
      // REMOVED: Mock data fallback - was hiding the real error
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(query) ||
        project.borrowerName.toLowerCase().includes(query) ||
        project.id.toLowerCase().includes(query) ||
        project.location?.toLowerCase().includes(query)
      );
    }

    // Filter by status tab
    if (activeTab !== 'all') {
      if (activeTab === 'pending') {
        filtered = filtered.filter(p => p.approvalStatus === 'pending');
      } else if (activeTab === 'active') {
        // Active tab shows approved projects that are published/active
        filtered = filtered.filter(p => 
          p.approvalStatus === 'approved' && 
          (p.status === 'active' || p.status === 'published')
        );
      } else {
        filtered = filtered.filter(p => p.status === activeTab);
      }
    }

    // Filter by project type
    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.type === selectedType);
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(p => 
        new Date(p.createdAt) >= filterDate
      );
    }

    // Filter by funding range
    if (filters.fundingRange !== 'all') {
      filtered = filtered.filter(p => {
        switch (filters.fundingRange) {
          case 'small': return p.fundingAmount < 100000;
          case 'medium': return p.fundingAmount >= 100000 && p.fundingAmount < 500000;
          case 'large': return p.fundingAmount >= 500000;
          default: return true;
        }
      });
    }

    setFilteredProjects(filtered);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('status', tab);
    setSearchParams(newParams);
  };

  const getStatusBadge = (status: string, approvalStatus?: string) => {
    if (approvalStatus === 'pending') {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-0">
          Pending Approval
        </Badge>
      );
    }

    const variants = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      suspended: 'bg-red-100 text-red-800',
      default: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={`${variants[status as keyof typeof variants]} border-0`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      equity: 'bg-purple-100 text-purple-800',
      lending: 'bg-green-100 text-green-800',
      donation: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <Badge variant="secondary" className={`${variants[type as keyof typeof variants]} border-0`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleApproveProject = async (projectId: string) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/owner/projects/${projectId}/approve`, {
        method: 'POST'
      });
      
      // Update project with response from backend
      setProjects(projects.map(p => 
        p.id === projectId 
          ? { ...p, approvalStatus: 'approved', status: response.status || 'active' }
          : p
      ));
      
      toast.success('Project approved successfully! It is now live and visible to borrowers.');
      
      // Reload the projects list to get the updated data
      setTimeout(() => {
        fetchProjects();
      }, 500);
    } catch (error) {
      console.error('Error approving project:', error);
      toast.error('Failed to approve project');
    }
  };

  const handleRejectProject = async (projectId: string) => {
    try {
      await authFetch(`${API_BASE_URL}/owner/projects/${projectId}/reject`, {
        method: 'POST'
      });
      
      setProjects(projects.map(p => 
        p.id === projectId 
          ? { ...p, approvalStatus: 'rejected' }
          : p
      ));
      
      toast.success('Project rejected. View it in the "All" tab.');
      
      // If we're on the pending tab, switch to all tab to show all projects
      if (activeTab === 'pending') {
        setTimeout(() => {
          handleTabChange('all');
        }, 1500);
      }
    } catch (error) {
      console.error('Error rejecting project:', error);
      toast.error('Failed to reject project');
    }
  };

  if (loading) {
    return (
      <OwnerLayout activePage="projects">
        <div className="p-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-lg text-gray-600">Loading projects...</div>
          </div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout activePage="projects">
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Projects</h1>
          <p className="text-gray-600">Manage all projects across the platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                </div>
                <FolderIcon className="w-8 h-8 text-[#0C4B20]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {projects.filter(p => p.approvalStatus === 'pending').length}
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
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {projects.filter(p => p.status === 'active').length}
                  </p>
                </div>
                <ShieldCheckIcon className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {projects.filter(p => p.status === 'completed').length}
                  </p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {PROJECT_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-[#0C4B20] text-[#0C4B20]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
                {activeTab === tab.key && (
                  <Badge className="ml-2 bg-[#0C4B20] text-white border-0">
                    {filteredProjects.length}
                  </Badge>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by project title, borrower, ID, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 w-full border-gray-300 focus:border-[#0C4B20] focus:ring-[#0C4B20]"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#0C4B20] focus:ring-[#0C4B20]"
                >
                  {PROJECT_TYPES.map(type => (
                    <option key={type.key} value={type.key}>{type.label}</option>
                  ))}
                </select>
                
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#0C4B20] focus:ring-[#0C4B20]"
                >
                  <option value="all">All Time</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="3months">Last 3 Months</option>
                </select>
                
                <select
                  value={filters.fundingRange}
                  onChange={(e) => setFilters({...filters, fundingRange: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#0C4B20] focus:ring-[#0C4B20]"
                >
                  <option value="all">All Amounts</option>
                  <option value="small">Under ₱100k</option>
                  <option value="medium">₱100k - ₱500k</option>
                  <option value="large">Over ₱500k</option>
                </select>

                <Button variant="outline" size="sm">
                  <SlidersHorizontalIcon className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects List */}
        {filteredProjects.length === 0 ? (
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-12 text-center">
              <FolderIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-500">
                {searchQuery ? 'Try adjusting your search terms or filters' : 'No projects match your current filters'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1 min-w-0">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden mr-4">
                        <img
                          src={project.thumbnail || "/public/group-1.png"}
                          alt={project.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/public/group-1.png";
                          }}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                              {project.title}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(project.status, project.approvalStatus)}
                              {getTypeBadge(project.type)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Project ID:</span>
                            <div className="font-medium">{project.id}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Borrower:</span>
                            <div className="font-medium">{project.borrowerName}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Funding Amount:</span>
                            <div className="font-medium text-green-600">{formatCurrency(project.fundingAmount)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Progress:</span>
                            <div className="font-medium">{project.fundingProgress}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Created:</span>
                            <div className="font-medium">{formatDate(project.createdAt)}</div>
                          </div>
                          {project.location && (
                            <div>
                              <span className="text-gray-500">Location:</span>
                              <div className="font-medium">{project.location}</div>
                            </div>
                          )}
                        </div>

                        {project.description && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-6">
                      {project.approvalStatus === 'pending' && canApproveProjects && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveProject(project.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectProject(project.id)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/owner/projects/${project.id}`)}
                          className="text-[#0C4B20] border-[#0C4B20] hover:bg-[#0C4B20] hover:text-white"
                        >
                          <EyeIcon className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                        
                        <Button size="sm" variant="outline" className="p-2">
                          <MoreHorizontalIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredProjects.length > 0 && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Showing {filteredProjects.length} of {projects.length} projects
              </span>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
};