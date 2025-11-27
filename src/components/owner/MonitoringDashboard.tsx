import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Server, 
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Wallet,
  FileText
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendUp,
  loading 
}) => (
  <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className="text-gray-600 text-sm font-medium">{title}</div>
      <div className="text-blue-600">{icon}</div>
    </div>
    {loading ? (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
    ) : (
      <>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {value.toLocaleString()}
        </div>
        {subtitle && (
          <div className="text-sm text-gray-500">{subtitle}</div>
        )}
        {trend && (
          <div className={`text-xs mt-2 flex items-center ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            <span>{trend}</span>
          </div>
        )}
      </>
    )}
  </div>
);

interface UserMetrics {
  total: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  activeToday: number;
  investors: number;
  borrowers: number;
  suspended: number;
}

interface InvestmentMetrics {
  today: { count: number; amount: number };
  week: { count: number; amount: number };
  month: { count: number; amount: number };
  total: { count: number; amount: number };
  pending: { count: number; amount: number };
  averageAmount: number;
}

interface TopupMetrics {
  today: { count: number; amount: number };
  week: { count: number; amount: number };
  pending: { count: number; amount: number };
  approvedToday: { count: number; amount: number };
  rejectedToday: number;
}

interface ProjectMetrics {
  total: number;
  active: number;
  funded: number;
  fundedThisWeek: number;
  totalFundedAmount: number;
}

interface PlatformMetrics {
  uptime: number;
  uptimeFormatted: string;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    activeConnections: number;
    maxConnections: number;
  };
  security: {
    eventsLast24h: number;
    auditLogsLast24h: number;
    unresolvedVulnerabilities: number;
  };
}

export const MonitoringDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [investmentMetrics, setInvestmentMetrics] = useState<InvestmentMetrics | null>(null);
  const [topupMetrics, setTopupMetrics] = useState<TopupMetrics | null>(null);
  const [projectMetrics, setProjectMetrics] = useState<ProjectMetrics | null>(null);
  const [platformMetrics, setPlatformMetrics] = useState<PlatformMetrics | null>(null);

  const fetchMetrics = async () => {
    const token = localStorage.getItem('fb_token');
    if (!token) return;

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [users, investments, topups, projects, platform] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/metrics/users`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/metrics/investments`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/metrics/topups`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/metrics/projects`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/metrics/platform`, { headers })
      ]);

      const [usersData, investmentsData, topupsData, projectsData, platformData] = await Promise.all([
        users.json(),
        investments.json(),
        topups.json(),
        projects.json(),
        platform.json()
      ]);

      setUserMetrics(usersData);
      setInvestmentMetrics(investmentsData);
      setTopupMetrics(topupsData);
      setProjectMetrics(projectsData);
      setPlatformMetrics(platformData);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'down':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Monitoring</h1>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="autoRefresh" className="text-sm text-gray-700">
              Auto-refresh ({refreshInterval}s)
            </label>
          </div>
          <button
            onClick={fetchMetrics}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
              <p className="text-sm text-gray-500">All systems operational</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full ${getStatusColor('operational')}`}>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">User Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Users"
            value={userMetrics?.total || 0}
            subtitle={`${userMetrics?.investors || 0} investors, ${userMetrics?.borrowers || 0} borrowers`}
            icon={<Users className="w-6 h-6" />}
            loading={loading}
          />
          <MetricCard
            title="Active Today"
            value={userMetrics?.activeToday || 0}
            subtitle="Users logged in (24h)"
            icon={<Activity className="w-6 h-6" />}
            loading={loading}
          />
          <MetricCard
            title="New Today"
            value={userMetrics?.newToday || 0}
            subtitle={`${userMetrics?.newThisWeek || 0} this week`}
            icon={<TrendingUp className="w-6 h-6" />}
            loading={loading}
          />
          <MetricCard
            title="New This Month"
            value={userMetrics?.newThisMonth || 0}
            subtitle="Registered users"
            icon={<Users className="w-6 h-6" />}
            loading={loading}
          />
        </div>
      </div>

      {/* Investment Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Investment Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Today's Investments"
            value={investmentMetrics?.today.count || 0}
            subtitle={formatCurrency(investmentMetrics?.today.amount || 0)}
            icon={<DollarSign className="w-6 h-6" />}
            loading={loading}
          />
          <MetricCard
            title="This Week"
            value={investmentMetrics?.week.count || 0}
            subtitle={formatCurrency(investmentMetrics?.week.amount || 0)}
            icon={<TrendingUp className="w-6 h-6" />}
            loading={loading}
          />
          <MetricCard
            title="This Month"
            value={investmentMetrics?.month.count || 0}
            subtitle={formatCurrency(investmentMetrics?.month.amount || 0)}
            icon={<BarChart3 className="w-6 h-6" />}
            loading={loading}
          />
          <MetricCard
            title="Average Investment"
            value={formatCurrency(investmentMetrics?.averageAmount || 0)}
            subtitle={`${investmentMetrics?.total.count || 0} total investments`}
            icon={<DollarSign className="w-6 h-6" />}
            loading={loading}
          />
        </div>
      </div>

      {/* Top-up Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top-up Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Pending Top-ups"
            value={topupMetrics?.pending.count || 0}
            subtitle={formatCurrency(topupMetrics?.pending.amount || 0)}
            icon={<Clock className="w-6 h-6" />}
            loading={loading}
          />
          <MetricCard
            title="Approved Today"
            value={topupMetrics?.approvedToday.count || 0}
            subtitle={formatCurrency(topupMetrics?.approvedToday.amount || 0)}
            icon={<CheckCircle className="w-6 h-6" />}
            loading={loading}
          />
          <MetricCard
            title="Today's Requests"
            value={topupMetrics?.today.count || 0}
            subtitle={formatCurrency(topupMetrics?.today.amount || 0)}
            icon={<Wallet className="w-6 h-6" />}
            loading={loading}
          />
          <MetricCard
            title="This Week"
            value={topupMetrics?.week.count || 0}
            subtitle={formatCurrency(topupMetrics?.week.amount || 0)}
            icon={<TrendingUp className="w-6 h-6" />}
            loading={loading}
          />
        </div>
      </div>

      {/* Project Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Projects"
            value={projectMetrics?.total || 0}
            subtitle="All time"
            icon={<FileText className="w-6 h-6" />}
            loading={loading}
          />
          <MetricCard
            title="Active Projects"
            value={projectMetrics?.active || 0}
            subtitle="Currently fundraising"
            icon={<Activity className="w-6 h-6" />}
            loading={loading}
          />
          <MetricCard
            title="Funded Projects"
            value={projectMetrics?.funded || 0}
            subtitle={`${projectMetrics?.fundedThisWeek || 0} this week`}
            icon={<CheckCircle className="w-6 h-6" />}
            loading={loading}
          />
          <MetricCard
            title="Total Funded"
            value={formatCurrency(projectMetrics?.totalFundedAmount || 0)}
            subtitle="All investments"
            icon={<DollarSign className="w-6 h-6" />}
            loading={loading}
          />
        </div>
      </div>

      {/* Platform Performance */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Uptime"
            value={platformMetrics?.uptimeFormatted || '0d 0h 0m'}
            subtitle="Server uptime"
            icon={<Server className="w-6 h-6" />}
            loading={loading}
          />
          <MetricCard
            title="Memory Usage"
            value={`${platformMetrics?.memory.percentage || 0}%`}
            subtitle={`${platformMetrics?.memory.used || 0}MB / ${platformMetrics?.memory.total || 0}MB`}
            icon={<Activity className="w-6 h-6" />}
            loading={loading}
          />
          <MetricCard
            title="Database Connections"
            value={`${platformMetrics?.database.activeConnections || 0}/${platformMetrics?.database.maxConnections || 25}`}
            subtitle="Active connections"
            icon={<Server className="w-6 h-6" />}
            loading={loading}
          />
          <MetricCard
            title="Security Events"
            value={platformMetrics?.security.eventsLast24h || 0}
            subtitle={`${platformMetrics?.security.unresolvedVulnerabilities || 0} vulnerabilities`}
            icon={<AlertCircle className="w-6 h-6" />}
            loading={loading}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Activity className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Monitoring Tools</h3>
            <p className="text-sm text-gray-600 mb-4">
              Set up external monitoring tools for comprehensive platform oversight:
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span><strong>UptimeRobot:</strong> Monitor uptime at <code className="bg-white px-2 py-1 rounded">/api/health</code></span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span><strong>Google Analytics:</strong> Track user behavior and traffic</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span><strong>Sentry:</strong> Error tracking and performance monitoring</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
