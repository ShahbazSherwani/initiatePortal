// src/screens/owner/OwnerReports.tsx
import React, { useState, useEffect } from 'react';
import { OwnerLayout } from '../../layouts/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { authFetch } from '../../lib/api';
import { API_BASE_URL } from '../../config/environment';
import { AuditLogs } from '../../components/owner/AuditLogs';
import { 
  BarChart3,
  Users,
  TrendingUp,
  DollarSign,
  FolderOpen,
  Download,
  Calendar,
  RefreshCw,
  Shield,
  FileText,
  Activity,
  PieChart,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wallet,
  Eye
} from 'lucide-react';

interface ReportData {
  users: {
    total: number;
    investors: number;
    borrowers: number;
    newThisWeek: number;
    newThisMonth: number;
    activeToday: number;
    suspended: number;
    verified: number;
    unverified: number;
  };
  investments: {
    totalCount: number;
    totalAmount: number;
    pendingCount: number;
    pendingAmount: number;
    approvedCount: number;
    approvedAmount: number;
    rejectedCount: number;
    thisWeekCount: number;
    thisWeekAmount: number;
    thisMonthCount: number;
    thisMonthAmount: number;
    averageAmount: number;
  };
  projects: {
    total: number;
    active: number;
    pending: number;
    completed: number;
    suspended: number;
    equity: number;
    lending: number;
    donation: number;
    totalFundingTarget: number;
    totalFundingRaised: number;
  };
  payments: {
    totalTopups: number;
    totalTopupAmount: number;
    pendingTopups: number;
    pendingTopupAmount: number;
    paymongoPayments: number;
    paymongoAmount: number;
  };
  platform: {
    totalWalletBalance: number;
    totalTransactions: number;
    uptime: string;
  };
}

type TabType = 'overview' | 'users' | 'investments' | 'projects' | 'payments' | 'audit';

export const OwnerReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [exporting, setExporting] = useState(false);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch all metrics
      const [users, investments, projects, topups, platform] = await Promise.all([
        authFetch(`${API_BASE_URL}/admin/metrics/users`).catch(() => null),
        authFetch(`${API_BASE_URL}/admin/metrics/investments`).catch(() => null),
        authFetch(`${API_BASE_URL}/admin/metrics/projects`).catch(() => null),
        authFetch(`${API_BASE_URL}/admin/metrics/topups`).catch(() => null),
        authFetch(`${API_BASE_URL}/admin/metrics/platform`).catch(() => null)
      ]);

      // Also fetch additional data
      const [overview, allUsers, allInvestments] = await Promise.all([
        authFetch(`${API_BASE_URL}/admin/metrics/overview`).catch(() => null),
        authFetch(`${API_BASE_URL}/owner/users?limit=1000`).catch(() => ({ users: [] })),
        authFetch(`${API_BASE_URL}/admin/investment-requests?limit=1000`).catch(() => ({ investments: [] }))
      ]);

      // Calculate user stats
      const userList = allUsers?.users || [];
      const verifiedUsers = userList.filter((u: any) => u.is_verified || u.isVerified).length;
      
      // Calculate investment stats
      const investmentList = allInvestments?.investments || [];
      const approvedInvestments = investmentList.filter((i: any) => i.status === 'approved');
      const rejectedInvestments = investmentList.filter((i: any) => i.status === 'rejected');
      const pendingInvestments = investmentList.filter((i: any) => i.status === 'pending');

      setReportData({
        users: {
          total: users?.total || overview?.users?.total || 0,
          investors: users?.investors || 0,
          borrowers: users?.borrowers || 0,
          newThisWeek: users?.newThisWeek || 0,
          newThisMonth: users?.newThisMonth || 0,
          activeToday: users?.activeToday || overview?.users?.activeToday || 0,
          suspended: users?.suspended || 0,
          verified: verifiedUsers,
          unverified: (users?.total || 0) - verifiedUsers
        },
        investments: {
          totalCount: investments?.total?.count || 0,
          totalAmount: investments?.total?.amount || 0,
          pendingCount: pendingInvestments.length || investments?.pending?.count || 0,
          pendingAmount: pendingInvestments.reduce((sum: number, i: any) => sum + (Number(i.amount) || 0), 0) || investments?.pending?.amount || 0,
          approvedCount: approvedInvestments.length,
          approvedAmount: approvedInvestments.reduce((sum: number, i: any) => sum + (Number(i.amount) || 0), 0),
          rejectedCount: rejectedInvestments.length,
          thisWeekCount: investments?.week?.count || 0,
          thisWeekAmount: investments?.week?.amount || 0,
          thisMonthCount: investments?.month?.count || 0,
          thisMonthAmount: investments?.month?.amount || 0,
          averageAmount: investments?.averageAmount || 0
        },
        projects: {
          total: projects?.total || overview?.projects?.total || 0,
          active: projects?.active || overview?.projects?.active || 0,
          pending: projects?.pending || 0,
          completed: projects?.completed || 0,
          suspended: projects?.suspended || 0,
          equity: projects?.equity || 0,
          lending: projects?.lending || 0,
          donation: projects?.donation || 0,
          totalFundingTarget: projects?.totalFundingTarget || 0,
          totalFundingRaised: projects?.totalFundedAmount || 0
        },
        payments: {
          totalTopups: topups?.total?.count || 0,
          totalTopupAmount: topups?.total?.amount || 0,
          pendingTopups: topups?.pending?.count || overview?.topups?.pendingCount || 0,
          pendingTopupAmount: topups?.pending?.amount || overview?.topups?.pendingAmount || 0,
          paymongoPayments: 0,
          paymongoAmount: 0
        },
        platform: {
          totalWalletBalance: platform?.walletBalance || overview?.platform?.walletBalance || 0,
          totalTransactions: platform?.transactions || 0,
          uptime: platform?.uptimeFormatted || `${Math.floor((platform?.uptime || 0) / 3600)} hours`
        }
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExportReport = async (reportType: string) => {
    try {
      setExporting(true);
      
      let data: any[] = [];
      let headers: string[] = [];
      let filename = '';
      
      switch (reportType) {
        case 'users':
          const usersRes = await authFetch(`${API_BASE_URL}/owner/users?limit=10000`);
          data = usersRes.users || [];
          headers = ['ID', 'Name', 'Email', 'Type', 'Status', 'Verified', 'Created At'];
          filename = 'users-report';
          data = data.map((u: any) => [
            u.id,
            `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'N/A',
            u.email,
            u.accountType || 'N/A',
            u.isSuspended ? 'Suspended' : 'Active',
            u.isVerified ? 'Yes' : 'No',
            new Date(u.createdAt || u.created_at).toLocaleDateString()
          ]);
          break;
          
        case 'investments':
          const investRes = await authFetch(`${API_BASE_URL}/admin/investment-requests?limit=10000`);
          data = investRes.investments || [];
          headers = ['ID', 'Project', 'Investor', 'Amount', 'Status', 'Date'];
          filename = 'investments-report';
          data = data.map((i: any) => [
            i.id,
            i.projectTitle || i.project_title || 'N/A',
            i.investorEmail || i.investor_email || 'N/A',
            i.amount,
            i.status,
            new Date(i.createdAt || i.created_at).toLocaleDateString()
          ]);
          break;
          
        case 'projects':
          const projRes = await authFetch(`${API_BASE_URL}/owner/projects?limit=10000`);
          data = projRes.projects || projRes || [];
          headers = ['ID', 'Title', 'Type', 'Status', 'Target Amount', 'Funded Amount', 'Created At'];
          filename = 'projects-report';
          data = data.map((p: any) => [
            p.id,
            p.title || 'N/A',
            p.projectType || p.project_type || 'N/A',
            p.status || 'N/A',
            p.fundingGoal || p.funding_goal || 0,
            p.currentFunding || p.current_funding || 0,
            new Date(p.createdAt || p.created_at).toLocaleDateString()
          ]);
          break;
          
        case 'payments':
          const topupRes = await authFetch(`${API_BASE_URL}/admin/topup-requests?limit=10000`);
          data = topupRes.requests || topupRes || [];
          headers = ['ID', 'User', 'Amount', 'Status', 'Date', 'Reviewed At'];
          filename = 'payments-report';
          data = data.map((t: any) => [
            t.id,
            t.userEmail || t.user_email || 'N/A',
            t.amount,
            t.status,
            new Date(t.createdAt || t.created_at).toLocaleDateString(),
            t.reviewedAt ? new Date(t.reviewedAt).toLocaleDateString() : 'N/A'
          ]);
          break;
          
        case 'full':
          // Export all data as a comprehensive report
          const [allUsers, allInvest, allProj, allTopups] = await Promise.all([
            authFetch(`${API_BASE_URL}/owner/users?limit=10000`),
            authFetch(`${API_BASE_URL}/admin/investment-requests?limit=10000`),
            authFetch(`${API_BASE_URL}/owner/projects?limit=10000`),
            authFetch(`${API_BASE_URL}/admin/topup-requests?limit=10000`)
          ]);
          
          // Create a comprehensive JSON report
          const fullReport = {
            generatedAt: new Date().toISOString(),
            summary: reportData,
            users: allUsers.users || [],
            investments: allInvest.investments || [],
            projects: allProj.projects || allProj || [],
            topups: allTopups.requests || allTopups || []
          };
          
          const jsonBlob = new Blob([JSON.stringify(fullReport, null, 2)], { type: 'application/json' });
          const jsonUrl = window.URL.createObjectURL(jsonBlob);
          const jsonLink = document.createElement('a');
          jsonLink.href = jsonUrl;
          jsonLink.download = `full-platform-report-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(jsonLink);
          jsonLink.click();
          document.body.removeChild(jsonLink);
          window.URL.revokeObjectURL(jsonUrl);
          setExporting(false);
          return;
      }
      
      // Generate CSV
      const csvRows = [
        headers.join(','),
        ...data.map((row: any[]) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ];
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
    } finally {
      setExporting(false);
    }
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'users' as TabType, label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'investments' as TabType, label: 'Investments', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'projects' as TabType, label: 'Projects', icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'payments' as TabType, label: 'Payments', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'audit' as TabType, label: 'Audit Logs', icon: <Shield className="w-4 h-4" /> }
  ];

  if (loading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#0C4B20]" />
          <span className="ml-3 text-gray-600">Loading reports...</span>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-500">Comprehensive platform statistics and audit logs</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchReportData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              className="bg-[#0C4B20] hover:bg-[#0C4B20]/90 text-white"
              onClick={() => handleExportReport('full')}
              disabled={exporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export Full Report'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b pb-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              className={activeTab === tab.id ? "bg-[#0C4B20] text-white" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </Button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && reportData && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Users</p>
                      <p className="text-3xl font-bold text-blue-900">{reportData.users.total.toLocaleString()}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        +{reportData.users.newThisWeek} this week
                      </p>
                    </div>
                    <Users className="w-12 h-12 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Total Investments</p>
                      <p className="text-3xl font-bold text-green-900">{formatCurrency(reportData.investments.totalAmount)}</p>
                      <p className="text-xs text-green-600 mt-1">
                        {reportData.investments.totalCount.toLocaleString()} total
                      </p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Active Projects</p>
                      <p className="text-3xl font-bold text-purple-900">{reportData.projects.active}</p>
                      <p className="text-xs text-purple-600 mt-1">
                        of {reportData.projects.total} total
                      </p>
                    </div>
                    <FolderOpen className="w-12 h-12 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600 font-medium">Platform Balance</p>
                      <p className="text-3xl font-bold text-orange-900">{formatCurrency(reportData.platform.totalWalletBalance)}</p>
                      <p className="text-xs text-orange-600 mt-1">
                        Uptime: {reportData.platform.uptime}
                      </p>
                    </div>
                    <Wallet className="w-12 h-12 text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Items Alert */}
            {(reportData.investments.pendingCount > 0 || reportData.payments.pendingTopups > 0) && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <AlertTriangle className="w-6 h-6 text-orange-500" />
                    <div className="flex-1">
                      <p className="font-medium text-orange-900">Pending Items Require Attention</p>
                      <p className="text-sm text-orange-700">
                        {reportData.investments.pendingCount} pending investments ({formatCurrency(reportData.investments.pendingAmount)}) • 
                        {reportData.payments.pendingTopups} pending top-ups ({formatCurrency(reportData.payments.pendingTopupAmount)})
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-blue-500" />
                    Weekly Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">New Users</span>
                      <span className="font-bold text-lg">{reportData.users.newThisWeek}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">New Investments</span>
                      <span className="font-bold text-lg">{reportData.investments.thisWeekCount}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Investment Volume</span>
                      <span className="font-bold text-lg">{formatCurrency(reportData.investments.thisWeekAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <PieChart className="w-5 h-5 mr-2 text-purple-500" />
                    Project Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Equity Projects</span>
                      <Badge className="bg-blue-100 text-blue-700">{reportData.projects.equity}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Lending Projects</span>
                      <Badge className="bg-green-100 text-green-700">{reportData.projects.lending}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Donation Projects</span>
                      <Badge className="bg-purple-100 text-purple-700">{reportData.projects.donation}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && reportData && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => handleExportReport('users')} disabled={exporting}>
                <Download className="w-4 h-4 mr-2" />
                Export Users CSV
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Users</p>
                      <p className="text-2xl font-bold">{reportData.users.total.toLocaleString()}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Investors</p>
                      <p className="text-2xl font-bold">{reportData.users.investors}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Borrowers</p>
                      <p className="text-2xl font-bold">{reportData.users.borrowers}</p>
                    </div>
                    <FolderOpen className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Active Today</p>
                      <p className="text-2xl font-bold">{reportData.users.activeToday}</p>
                    </div>
                    <Activity className="w-8 h-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">New This Week</p>
                      <p className="text-2xl font-bold">{reportData.users.newThisWeek}</p>
                    </div>
                    <ArrowUp className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">New This Month</p>
                      <p className="text-2xl font-bold">{reportData.users.newThisMonth}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Verified</p>
                      <p className="text-2xl font-bold">{reportData.users.verified}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Suspended</p>
                      <p className="text-2xl font-bold text-red-600">{reportData.users.suspended}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Investments Tab */}
        {activeTab === 'investments' && reportData && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => handleExportReport('investments')} disabled={exporting}>
                <Download className="w-4 h-4 mr-2" />
                Export Investments CSV
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Card className="md:col-span-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Investment Volume</p>
                      <p className="text-3xl font-bold text-green-600">{formatCurrency(reportData.investments.totalAmount)}</p>
                      <p className="text-sm text-gray-500 mt-1">{reportData.investments.totalCount} total investments</p>
                    </div>
                    <DollarSign className="w-12 h-12 text-green-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Average Investment</p>
                      <p className="text-2xl font-bold">{formatCurrency(reportData.investments.averageAmount)}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600">Pending Approval</p>
                      <p className="text-2xl font-bold text-orange-700">{reportData.investments.pendingCount}</p>
                      <p className="text-xs text-orange-600">{formatCurrency(reportData.investments.pendingAmount)}</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">Approved</p>
                      <p className="text-2xl font-bold text-green-700">{reportData.investments.approvedCount}</p>
                      <p className="text-xs text-green-600">{formatCurrency(reportData.investments.approvedAmount)}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">This Week</p>
                      <p className="text-2xl font-bold">{reportData.investments.thisWeekCount}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(reportData.investments.thisWeekAmount)}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">This Month</p>
                      <p className="text-2xl font-bold">{reportData.investments.thisMonthCount}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(reportData.investments.thisMonthAmount)}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && reportData && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => handleExportReport('projects')} disabled={exporting}>
                <Download className="w-4 h-4 mr-2" />
                Export Projects CSV
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Projects</p>
                      <p className="text-2xl font-bold">{reportData.projects.total}</p>
                    </div>
                    <FolderOpen className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">Active</p>
                      <p className="text-2xl font-bold text-green-700">{reportData.projects.active}</p>
                    </div>
                    <Activity className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600">Pending Review</p>
                      <p className="text-2xl font-bold text-orange-700">{reportData.projects.pending}</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Completed</p>
                      <p className="text-2xl font-bold">{reportData.projects.completed}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Equity</p>
                      <p className="text-2xl font-bold">{reportData.projects.equity}</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700">Equity</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Lending</p>
                      <p className="text-2xl font-bold">{reportData.projects.lending}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Lending</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Donation</p>
                      <p className="text-2xl font-bold">{reportData.projects.donation}</p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700">Donation</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600">Suspended</p>
                      <p className="text-2xl font-bold text-red-700">{reportData.projects.suspended}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Funding Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Total Funding Target</p>
                    <p className="text-3xl font-bold text-blue-600">{formatCurrency(reportData.projects.totalFundingTarget)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Total Funding Raised</p>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(reportData.projects.totalFundingRaised)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && reportData && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => handleExportReport('payments')} disabled={exporting}>
                <Download className="w-4 h-4 mr-2" />
                Export Payments CSV
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="md:col-span-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Top-up Volume</p>
                      <p className="text-3xl font-bold text-green-600">{formatCurrency(reportData.payments.totalTopupAmount)}</p>
                      <p className="text-sm text-gray-500 mt-1">{reportData.payments.totalTopups} total requests</p>
                    </div>
                    <Wallet className="w-12 h-12 text-green-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600">Pending Top-ups</p>
                      <p className="text-2xl font-bold text-orange-700">{reportData.payments.pendingTopups}</p>
                      <p className="text-xs text-orange-600">{formatCurrency(reportData.payments.pendingTopupAmount)}</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Platform Balance</p>
                      <p className="text-2xl font-bold">{formatCurrency(reportData.platform.totalWalletBalance)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <AuditLogs />
        )}
      </div>
    </OwnerLayout>
  );
};

export default OwnerReports;
