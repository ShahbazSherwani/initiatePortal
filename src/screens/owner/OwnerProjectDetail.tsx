// src/screens/owner/OwnerProjectDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OwnerLayout } from '../../layouts/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { authFetch } from '../../lib/api';
import { API_BASE_URL } from '../../config/environment';
import { 
  ArrowLeftIcon,
  UserIcon,
  CalendarIcon,
  DollarSignIcon,
  MapPinIcon,
  FileTextIcon,
  ImageIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrendingUpIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProjectDetail {
  id: string;
  title: string;
  description: string;
  borrowerName: string;
  borrowerUid: string;
  borrowerEmail: string;
  type: string;
  status: string;
  approvalStatus: string;
  fundingAmount: number;
  fundingProgress: string;
  amountRaised: number;
  location?: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  projectData?: any;
}

export const OwnerProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const data = await authFetch(`${API_BASE_URL}/owner/projects/${projectId}`);
      setProject(data);
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: JSX.Element }> = {
      pending: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: <ClockIcon className="w-3 h-3" /> },
      active: { color: 'bg-green-100 text-green-700 border-green-300', icon: <CheckCircleIcon className="w-3 h-3" /> },
      completed: { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: <CheckCircleIcon className="w-3 h-3" /> },
      suspended: { color: 'bg-red-100 text-red-700 border-red-300', icon: <AlertTriangleIcon className="w-3 h-3" /> },
      default: { color: 'bg-gray-100 text-gray-700 border-gray-300', icon: <XCircleIcon className="w-3 h-3" /> },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.color} border flex items-center gap-1`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig: Record<string, string> = {
      equity: 'bg-blue-100 text-blue-700 border-blue-300',
      lending: 'bg-green-100 text-green-700 border-green-300',
      donation: 'bg-purple-100 text-purple-700 border-purple-300',
      rewards: 'bg-amber-100 text-amber-700 border-amber-300',
    };

    return (
      <Badge className={`${typeConfig[type] || 'bg-gray-100 text-gray-700 border-gray-300'} border`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </OwnerLayout>
    );
  }

  if (!project) {
    return (
      <OwnerLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <AlertTriangleIcon className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Project Not Found</h2>
          <Button onClick={() => navigate('/owner/projects')}>
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/owner/projects')}
            className="hover:bg-gray-50"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          <div className="flex items-center gap-2">
            {getStatusBadge(project.status)}
            {getTypeBadge(project.type)}
          </div>
        </div>

        {/* Project Header */}
        <Card className="bg-white shadow-sm border-0">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  {project.title}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <UserIcon className="w-4 h-4" />
                    <span>{project.borrowerName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Created {formatDate(project.createdAt)}</span>
                  </div>
                  {project.location && (
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{project.location}</span>
                    </div>
                  )}
                </div>
              </div>
              {project.thumbnail && (
                <img 
                  src={project.thumbnail} 
                  alt={project.title}
                  className="w-32 h-32 rounded-lg object-cover"
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Funding Goal</p>
                <p className="text-2xl font-bold text-[#0C4B20]">
                  {formatCurrency(project.fundingAmount)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Amount Raised</p>
                <p className="text-2xl font-bold text-[#8FB200]">
                  {formatCurrency(project.amountRaised || 0)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Progress</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-[#0C4B20] h-3 rounded-full transition-all duration-300"
                      style={{ width: project.fundingProgress }}
                    />
                  </div>
                  <span className="text-lg font-semibold text-gray-700">
                    {project.fundingProgress}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Description */}
          <Card className="lg:col-span-2 bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileTextIcon className="w-5 h-5 text-[#0C4B20]" />
                Project Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {project.description || 'No description available.'}
              </p>
            </CardContent>
          </Card>

          {/* Borrower Info */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-[#0C4B20]" />
                Borrower Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-900">{project.borrowerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">UID</p>
                <p className="font-medium text-gray-900">{project.borrowerUid}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{project.borrowerEmail}</p>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate(`/owner/users/${project.borrowerUid}`)}
              >
                View Borrower Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Project Data */}
        {project.projectData && (
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="w-5 h-5 text-[#0C4B20]" />
                Additional Project Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(project.projectData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </OwnerLayout>
  );
};
