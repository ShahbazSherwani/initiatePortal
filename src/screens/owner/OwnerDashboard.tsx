// src/screens/owner/OwnerDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnerLayout } from '../../layouts/OwnerLayout';
import { OwnerKPICard } from '../../components/owner/OwnerKPICard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { authFetch } from '../../lib/api';
import { API_BASE_URL } from '../../config/environment';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  UsersIcon, 
  UserCheckIcon, 
  TrendingUpIcon, 
  FolderIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  ClockIcon,
  EyeIcon,
  PieChart,
  BarChart3Icon,
  Settings2Icon,
  BellIcon,
  CheckCircleIcon,
  MessageCircle,
  DollarSign,
  FileTextIcon,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PaymentAnalytics } from '../../components/owner/PaymentAnalytics';
import { MonitoringDashboard } from '../../components/owner/MonitoringDashboard';

interface OwnerStats {
  totalBorrowers: number;
  totalInvestors: number;
  totalGuarantors: number;
  totalProjects: number;
  activeProjects: number;
  pendingProjects: number;
  suspendedUsers: number;
  suspendedProjects: number;
  totalInvestmentAmount: number;
  monthlyGrowth: {
    users: number;
    projects: number;
    investments: number;
  };
}

interface RecentProject {
  id: string;
  title: string;
  borrowerName: string;
  fundingProgress: string;
  amount: number;
  status: string;
  createdAt: string;
  thumbnail?: string;
}

interface ProjectInsights {
  equity: number;
  lending: number;
  donation: number;
  highValue: number; // Above 100k PHP
}

export const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [projectInsights, setProjectInsights] = useState<ProjectInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'monitoring'>('overview');
  
  // Use notifications context
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead 
  } = useNotifications();

  useEffect(() => {
    fetchOwnerData();
    fetchNotifications(); // Fetch notifications on mount
  }, [fetchNotifications]);

  const fetchOwnerData = async () => {
    try {
      setLoading(true);
      
      // Fetch all owner dashboard data in parallel
      const [statsRes, projectsRes, insightsRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/owner/stats`),
        authFetch(`${API_BASE_URL}/owner/recent-projects`),
        authFetch(`${API_BASE_URL}/owner/project-insights`)
      ]);

      setStats(statsRes);
      setRecentProjects(projectsRes);
      setProjectInsights(insightsRes);
      
    } catch (error: any) {
      console.error('Error fetching owner data:', error);
      
      // Check if it's an authorization error
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('403')) {
        toast.error('Access denied: Admin privileges required');
        console.error('❌ Dashboard access denied - user is not an admin');
        setLoading(false);
        return; // Don't show mock data for unauthorized users
      }
      
      toast.error('Failed to load dashboard data - using cached data');
      
      // Set mock data for development
      setStats({
        totalBorrowers: 45,
        totalInvestors: 33,
        totalGuarantors: 45,
        totalProjects: 41,
        activeProjects: 15,
        pendingProjects: 8,
        suspendedUsers: 2,
        suspendedProjects: 1,
        totalInvestmentAmount: 2500000,
        monthlyGrowth: {
          users: 12,
          projects: 8,
          investments: 15
        }
      });
      
      setRecentProjects([
        {
          id: 'PFL4345N',
          title: 'Securing Farming Funding for Growth and Sustainability',
          borrowerName: 'Shahbaz Sherwani',
          fundingProgress: '45%',
          amount: 925000,
          status: 'active',
          createdAt: '2024-01-15',
          thumbnail: '/public/group-1.png'
        },
        {
          id: 'PFL4346N',
          title: 'Rice Field Expansion Project',
          borrowerName: 'Maria Santos',
          fundingProgress: '67%',
          amount: 750000,
          status: 'active',
          createdAt: '2024-01-10'
        }
      ]);

      setProjectInsights({
        equity: 67,
        lending: 27,
        donation: 5,
        highValue: 21
      });
      
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Handle notification click - navigate to related page
  const handleNotificationClick = (notification: any) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type and related data
    if (notification.related_request_id) {
      switch (notification.related_request_type) {
        case 'project':
          navigate(`/owner/projects/${notification.related_request_id}`);
          break;
        case 'investment':
          navigate(`/admin/investment-requests`);
          break;
        case 'topup':
          navigate(`/admin/topup-requests`);
          break;
        case 'user':
          navigate(`/owner/users/${notification.related_request_id}`);
          break;
        default:
          navigate('/owner/dashboard');
      }
    } else {
      // Default navigation based on notification type
      if (notification.notification_type.includes('project')) {
        navigate('/owner/projects');
      } else if (notification.notification_type.includes('investment')) {
        navigate('/admin/investment-requests');
      } else if (notification.notification_type.includes('topup')) {
        navigate('/admin/topup-requests');
      } else if (notification.notification_type.includes('team')) {
        navigate('/owner/team');
      }
    }
  };

  if (loading) {
    return (
      <OwnerLayout activePage="dashboard">
        <div className="p-8">
          <div className="flex items-center justify-center min-h-96">
            <LoadingSpinner 
              size="lg" 
              text="Loading dashboard..." 
              showText={true}
            />
          </div>
        </div>
      </OwnerLayout>
    );
  }
  return (
    <OwnerLayout activePage="dashboard">
      <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">Monitor platform-wide performance and activity</p>
        </div>

        {/* Tabs */}
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-[#0C4B20] text-[#0C4B20]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <BarChart3Icon className="w-4 h-4 mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`${
                activeTab === 'analytics'
                  ? 'border-[#0C4B20] text-[#0C4B20]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <PieChart className="w-4 h-4 mr-2" />
              Payment Analytics
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`${
                activeTab === 'monitoring'
                  ? 'border-[#0C4B20] text-[#0C4B20]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Activity className="w-4 h-4 mr-2" />
              Live Monitoring
            </button>
          </nav>
        </div>lassName="text-gray-600">Monitor platform-wide performance and activity</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <OwnerKPICard
            title="Total Issuers/Borrowers"
            value={stats?.totalBorrowers || 0}
            description="Active borrower accounts"
            icon={<UsersIcon />}
            onClick={() => navigate('/owner/users?tab=borrowers')}
            trend={{ value: stats?.monthlyGrowth.users || 0, isPositive: true }}
          />
          
          <OwnerKPICard
            title="Total Guarantors"
            value={stats?.totalGuarantors || 0}
            description="Verified guarantors"
            icon={<UserCheckIcon />}
            onClick={() => navigate('/owner/users?tab=guarantors')}
          />
          
          <OwnerKPICard
            title="Total Investors"
            value={stats?.totalInvestors || 0}
            description="Active investor accounts"
            icon={<TrendingUpIcon />}
            onClick={() => navigate('/owner/users?tab=investors')}
            trend={{ value: stats?.monthlyGrowth.users || 0, isPositive: true }}
          />
          
          <OwnerKPICard
            title="Total Projects"
            value={stats?.totalProjects || 0}
            description="All-time projects"
            icon={<FolderIcon />}
            onClick={() => navigate('/owner/projects')}
            trend={{ value: stats?.monthlyGrowth.projects || 0, isPositive: true }}
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <OwnerKPICard
            title="Active Projects"
            value={stats?.activeProjects || 0}
            description="Currently funding"
            icon={<ShieldCheckIcon />}
            onClick={() => navigate('/owner/projects?status=active')}
          />
          
          <OwnerKPICard
            title="Pending Verifications"
            value={stats?.pendingProjects || 0}
            description="Awaiting approval"
            icon={<ClockIcon />}
            onClick={() => navigate('/owner/projects?status=pending')}
          />
          
          <OwnerKPICard
            title="Suspended Projects"
            value={stats?.suspendedProjects || 0}
            description="Compliance issues"
            icon={<AlertTriangleIcon />}
            onClick={() => navigate('/owner/projects?status=suspended')}
          />
          
          <OwnerKPICard
            title="Total Investment"
            value={formatCurrency(stats?.totalInvestmentAmount || 0)}
            description="Platform-wide funding"
            icon={<BarChart3Icon />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Projects */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-white shadow-sm border-0">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold">Recent Projects</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/owner/projects')}
                  className="text-[#0C4B20] hover:text-[#8FB200]"
                >
                  See All
                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                      <img
                        src={project.thumbnail || "/public/group-1.png"}
                        alt={project.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/public/group-1.png";
                        }}
                      />
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {project.title}
                          </p>
                          <p className="text-xs text-gray-500 mb-1">
                            ID: {project.id} • {project.borrowerName}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {project.fundingProgress} Funding Progress
                            </Badge>
                            <Badge 
                              variant={project.status === 'active' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {project.status}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/owner/projects/${project.id}`)}
                          className="ml-2"
                        >
                          <EyeIcon className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card className="bg-white shadow-sm border-0">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <BellIcon className="w-5 h-5 text-[#0C4B20]" />
                  Recent Notifications
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadCount}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BellIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <>
                    {notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          notification.is_read
                            ? 'bg-white border-gray-200 hover:bg-gray-50'
                            : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            notification.notification_type.includes('approved') || notification.notification_type.includes('submitted')
                              ? 'bg-green-100'
                              : notification.notification_type.includes('rejected') || notification.notification_type.includes('failed')
                              ? 'bg-red-100'
                              : 'bg-blue-100'
                          }`}>
                            {notification.notification_type.includes('project') ? (
                              <FileTextIcon className={`w-4 h-4 ${
                                notification.notification_type.includes('approved')
                                  ? 'text-green-600'
                                  : notification.notification_type.includes('rejected')
                                  ? 'text-red-600'
                                  : 'text-blue-600'
                              }`} />
                            ) : notification.notification_type.includes('investment') ? (
                              <TrendingUpIcon className={`w-4 h-4 ${
                                notification.notification_type.includes('approved')
                                  ? 'text-green-600'
                                  : notification.notification_type.includes('rejected')
                                  ? 'text-red-600'
                                  : 'text-blue-600'
                              }`} />
                            ) : notification.notification_type.includes('topup') ? (
                              <DollarSign className={`w-4 h-4 ${
                                notification.notification_type.includes('approved')
                                  ? 'text-green-600'
                                  : notification.notification_type.includes('rejected')
                                  ? 'text-red-600'
                                  : 'text-blue-600'
                              }`} />
                            ) : (
                              <MessageCircle className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(notification.created_at).toLocaleDateString()} at{' '}
                              {new Date(notification.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                          
                          {notification.is_read ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Project Insights */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-[#0C4B20]" />
                Project Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Simple pie chart representation */}
              <div className="space-y-4">
                <div className="relative w-32 h-32 mx-auto">
                  {/* This would be replaced with a proper chart library */}
                  <div className="w-full h-full rounded-full bg-gradient-conic from-[#0C4B20] via-[#8FB200] via-green-300 to-red-200"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-700">
                        {stats?.totalProjects}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-[#0C4B20] rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Equity</span>
                    </div>
                    <span className="text-sm font-medium">{projectInsights?.equity || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-[#8FB200] rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Lending</span>
                    </div>
                    <span className="text-sm font-medium">{projectInsights?.lending || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-300 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Above 100k (PHP)</span>
                    </div>
                    <span className="text-sm font-medium">{projectInsights?.highValue || 0}%</span>
          </>
        )}

        {/* Payment Analytics Tab */}
        {activeTab === 'analytics' && (
          <PaymentAnalytics />
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <MonitoringDashboard />
        )}
      </div>
    </OwnerLayout>
  );
};      </div>

        {/* Quick Links */}
        <Card className="bg-white shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center hover:border-[#0C4B20] hover:text-[#0C4B20]"
                onClick={() => navigate('/owner/projects')}
              >
                <Settings2Icon className="w-5 h-5 mb-1" />
                <span className="text-sm">All Projects</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center hover:border-[#0C4B20] hover:text-[#0C4B20]"
                onClick={() => navigate('/owner/topup-requests')}
              >
                <ClockIcon className="w-5 h-5 mb-1" />
                <span className="text-sm">Top-up Requests</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center hover:border-[#0C4B20] hover:text-[#0C4B20]"
                onClick={() => navigate('/owner/investment-requests')}
              >
                <TrendingUpIcon className="w-5 h-5 mb-1" />
                <span className="text-sm">Investment Requests</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Analytics Section */}
        <PaymentAnalytics />
      </div>
    </OwnerLayout>
  );
};