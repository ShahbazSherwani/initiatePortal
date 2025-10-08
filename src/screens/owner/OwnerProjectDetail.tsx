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
  // Common fields
  investorPercentage?: string;
  timeDuration?: string;
  videoLink?: string;
  // Lending-specific fields
  loanAmount?: string;
  loanAmountValue?: number;
  // Equity-specific fields
  dividendFrequency?: string;
  dividendOther?: string;
  // ROI and milestone data
  roi?: any;
  milestones?: any[];
  payout?: any;
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
      console.log('Fetched project data:', data);
      console.log('Project title:', data.title);
      console.log('Funding amount:', data.fundingAmount);
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
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
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

        {/* Project Images */}
        {project.thumbnail && (
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#0C4B20]" />
                Project Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <img 
                  src={project.thumbnail} 
                  alt={project.title}
                  className="w-full h-64 rounded-lg object-cover border border-gray-200 hover:scale-105 transition-transform cursor-pointer"
                  onClick={() => window.open(project.thumbnail, '_blank')}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project Type Specific Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Financial/Investment Details */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSignIcon className="w-5 h-5 text-[#0C4B20]" />
                {project.type === 'equity' ? 'Investment Details' : 'Loan Details'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.type === 'equity' ? (
                <>
                  {project.investorPercentage && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Investor Percentage</span>
                      <span className="font-semibold text-[#0C4B20]">{project.investorPercentage}%</span>
                    </div>
                  )}
                  {project.dividendFrequency && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Dividend Frequency</span>
                      <span className="font-semibold text-gray-900">{project.dividendFrequency}</span>
                    </div>
                  )}
                  {project.dividendOther && (
                    <div className="pt-2">
                      <p className="text-sm text-gray-600 mb-2">Dividend Details</p>
                      <p className="text-gray-800">{project.dividendOther}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {project.loanAmount && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Loan Amount Category</span>
                      <span className="font-semibold text-gray-900">{project.loanAmount}</span>
                    </div>
                  )}
                  {project.loanAmountValue && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Exact Loan Amount</span>
                      <span className="font-semibold text-[#0C4B20]">{formatCurrency(project.loanAmountValue)}</span>
                    </div>
                  )}
                </>
              )}
              
              {project.timeDuration && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(project.timeDuration).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Specifications */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileTextIcon className="w-5 h-5 text-[#0C4B20]" />
                Project Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.location && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Location</span>
                  <span className="font-semibold text-gray-900">{project.location}</span>
                </div>
              )}
              
              {project.videoLink && (
                <div className="py-2 border-b">
                  <p className="text-sm text-gray-600 mb-2">Video Link</p>
                  <a 
                    href={project.videoLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#0C4B20] hover:underline flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    Watch Project Video
                  </a>
                </div>
              )}
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Created Date</span>
                <span className="font-semibold text-gray-900">{formatDate(project.createdAt)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-semibold text-gray-900">{formatDate(project.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ROI Information */}
        {project.roi && Object.keys(project.roi).length > 0 && (
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="w-5 h-5 text-[#0C4B20]" />
                ROI & Financial Projections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {project.roi.totalAmount && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                    <p className="text-xl font-bold text-gray-900">{project.roi.totalAmount}</p>
                  </div>
                )}
                {project.roi.pricePerUnit && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Price Per Unit</p>
                    <p className="text-xl font-bold text-gray-900">{project.roi.pricePerUnit}</p>
                  </div>
                )}
                {project.roi.unitOfMeasure && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Unit of Measure</p>
                    <p className="text-xl font-bold text-gray-900">{project.roi.unitOfMeasure}</p>
                  </div>
                )}
              </div>
              {project.roi.expenseDetail && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Expense Details</p>
                  <p className="text-gray-800">{project.roi.expenseDetail}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Milestones */}
        {project.milestones && project.milestones.length > 0 && (
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-[#0C4B20]" />
                Project Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.milestones.map((milestone: any, index: number) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Milestone {index + 1}</h4>
                      {milestone.date && (
                        <span className="text-sm text-gray-600">
                          {new Date(milestone.date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {milestone.amount && (
                        <div>
                          <span className="text-gray-600">Amount: </span>
                          <span className="font-medium">{formatCurrency(parseInt(milestone.amount))}</span>
                        </div>
                      )}
                      {milestone.percentage && (
                        <div>
                          <span className="text-gray-600">Percentage: </span>
                          <span className="font-medium">{milestone.percentage}%</span>
                        </div>
                      )}
                    </div>
                    {milestone.description && (
                      <p className="mt-2 text-gray-700">{milestone.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payout Schedule */}
        {project.payout && Object.keys(project.payout).length > 0 && (
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#0C4B20]" />
                Payout Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.payout.scheduleDate && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Schedule Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(project.payout.scheduleDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {project.payout.scheduleAmount && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Schedule Amount</p>
                    <p className="text-lg font-semibold text-[#0C4B20]">
                      {formatCurrency(parseInt(project.payout.scheduleAmount))}
                    </p>
                  </div>
                )}
                {project.payout.payoutPercentage && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Payout Percentage</p>
                    <p className="text-lg font-semibold text-gray-900">{project.payout.payoutPercentage}%</p>
                  </div>
                )}
                {project.payout.netIncome && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Net Income</p>
                    <p className="text-lg font-semibold text-gray-900">{project.payout.netIncome}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Business Model & Revenue (if available) */}
        {(project.projectData?.details?.businessModel || project.projectData?.details?.revenueModel) && (
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="w-5 h-5 text-[#0C4B20]" />
                Business & Revenue Model
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.projectData.details.businessModel && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Business Model</h4>
                  <p className="text-gray-700">{project.projectData.details.businessModel}</p>
                </div>
              )}
              {project.projectData.details.revenueModel && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Revenue Model</h4>
                  <p className="text-gray-700">{project.projectData.details.revenueModel}</p>
                </div>
              )}
              {project.projectData.details.competitiveAdvantage && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Competitive Advantage</h4>
                  <p className="text-gray-700">{project.projectData.details.competitiveAdvantage}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Project Status & Timestamps */}
        <Card className="bg-white shadow-sm border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-[#0C4B20]" />
              Project Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Created Date</p>
                <p className="font-medium text-gray-900">{formatDate(project.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-medium text-gray-900">{formatDate(project.updatedAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Approval Status</p>
                <div className="flex items-center gap-2">
                  {project.approvalStatus === 'approved' && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                  {project.approvalStatus === 'pending' && <ClockIcon className="w-5 h-5 text-yellow-500" />}
                  {project.approvalStatus === 'rejected' && <XCircleIcon className="w-5 h-5 text-red-500" />}
                  <span className="font-medium text-gray-900 capitalize">{project.approvalStatus}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
};
