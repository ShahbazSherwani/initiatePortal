import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';
import { 
  TrendingUpIcon, 
  DollarSignIcon, 
  TargetIcon, 
  ClockIcon,
  ArrowRightIcon,
  LoaderIcon,
  WalletIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  ShieldCheckIcon,
  RefreshCwIcon
} from 'lucide-react';

interface DashboardStatsData {
  totalInvested: number;
  totalCampaignsFunded: number;
  approvedInvestments: number;
  pendingInvestments: number;
  activeInvestments: number;
  totalProjects: number;
}

interface TopUpRequest {
  id: number;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
}

interface SuitabilityData {
  total_score: number;
  investor_risk_profile: 'conservative' | 'moderate' | 'aggressive';
  created_at: string;
  financial_capacity_score: number;
  investment_experience_score: number;
  investment_objectives_score: number;
  risk_tolerance_score: number;
}

export const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequest[]>([]);
  const [suitability, setSuitability] = useState<SuitabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🔍 Fetching dashboard stats...");
        const [statsData, topUpData, suitabilityData] = await Promise.all([
          authFetch(`${API_BASE_URL}/user/dashboard-stats`),
          authFetch(`${API_BASE_URL}/topup/my-requests`).catch(() => []),
          authFetch(`${API_BASE_URL}/investor/suitability-assessment`).catch(() => null)
        ]);
        console.log("📊 Dashboard stats received:", statsData);
        console.log("💰 Top-up requests received:", topUpData);
        setStats(statsData);
        setTopUpRequests(topUpData || []);
        if (suitabilityData && !suitabilityData.error) {
          setSuitability(suitabilityData);
        }
      } catch (err) {
        console.error("❌ Error fetching dashboard stats:", err);
        setError("Failed to load stats");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className="w-full bg-gradient-to-r from-blue-50 to-green-50 border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <LoaderIcon className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading investment stats...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="w-full bg-gradient-to-r from-red-50 to-orange-50 border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error || "Failed to load investment statistics"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: "Total Invested",
      value: formatCurrency(stats.totalInvested),
      icon: <DollarSignIcon className="w-8 h-8 text-white" />,
      bgColor: "bg-[#0C4B20] hover:bg-[#8FB200]",
      description: "Total amount invested across all projects"
    },
    {
      title: "Campaigns Funded",
      value: stats.totalCampaignsFunded.toString(),
      icon: <TargetIcon className="w-8 h-8 text-white" />,
      bgColor: "bg-[#0C4B20] hover:bg-[#8FB200]",
      description: "Successfully funded campaigns"
    },
    {
      title: "Active Investments",
      value: stats.activeInvestments.toString(),
      icon: <TrendingUpIcon className="w-8 h-8 text-white" />,
      bgColor: "bg-[#0C4B20] hover:bg-[#8FB200]",
      description: "Currently active investment positions"
    },
    {
      title: "Pending Approval",
      value: formatCurrency(stats.pendingInvestments),
      icon: <ClockIcon className="w-8 h-8 text-white" />,
      bgColor: "bg-[#0C4B20] hover:bg-[#8FB200]",
      description: "Investments awaiting approval"
    }
  ];

  // Get recent pending/latest top-up requests
  const recentTopUps = topUpRequests.slice(0, 3);
  const pendingTopUps = topUpRequests.filter(t => t.status === 'pending');

  const profileConfig = {
    conservative: {
      color: 'from-[#0C4B20] to-[#1a6b30]',
      bgLight: 'bg-[#f0f7f2] border-[#0C4B20]/20',
      textColor: 'text-[#0C4B20]',
      badgeBg: 'bg-[#0C4B20]/10 text-[#0C4B20]',
      label: 'Conservative',
      description: 'Low-risk debt instruments with shorter terms',
      allowed: 'Low & Medium Risk Debt (≤1 year)'
    },
    moderate: {
      color: 'from-[#0C4B20] to-[#8FB200]',
      bgLight: 'bg-[#f5f9ec] border-[#8FB200]/30',
      textColor: 'text-[#5a7a00]',
      badgeBg: 'bg-[#8FB200]/15 text-[#5a7a00]',
      label: 'Moderate',
      description: 'Balanced mix of debt and select equity investments',
      allowed: 'All Debt + Low & Medium Risk Equity'
    },
    aggressive: {
      color: 'from-[#8FB200] to-[#b8d940]',
      bgLight: 'bg-[#fafce8] border-[#8FB200]/30',
      textColor: 'text-[#6a8500]',
      badgeBg: 'bg-[#8FB200]/20 text-[#4a5d00]',
      label: 'Aggressive',
      description: 'Full access to all investment types and risk levels',
      allowed: 'All Investment Types & Risk Levels'
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top-Up Request Status Banner */}
      {recentTopUps.length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <WalletIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Top-Up Request Status</h3>
                <p className="text-sm text-gray-600">
                  {pendingTopUps.length > 0 
                    ? `${pendingTopUps.length} pending request${pendingTopUps.length > 1 ? 's' : ''}`
                    : 'Your recent top-up requests'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              {recentTopUps.map((request) => (
                <div 
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <p className="font-medium text-gray-900">
                        ₱{request.amount.toLocaleString()} {request.currency}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                      {request.status === 'pending' ? 'Pending' : request.status === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {topUpRequests.length > 3 && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Showing latest 3 of {topUpRequests.length} requests
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Risk Profile Card */}
      {suitability ? (() => {
        const profileKey = (suitability.investor_risk_profile || '').toLowerCase() as keyof typeof profileConfig;
        const cfg = profileConfig[profileKey] || profileConfig.conservative;
        const assessmentDate = new Date(suitability.created_at);
        const expiryDate = new Date(assessmentDate);
        expiryDate.setMonth(expiryDate.getMonth() + 12);
        const isExpiringSoon = expiryDate.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
        return (
          <Card className={`border shadow-lg ${cfg.bgLight}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${cfg.color} rounded-xl flex items-center justify-center shadow-md`}>
                    <ShieldCheckIcon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-medium text-gray-600">Your Risk Profile</h3>
                      <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${cfg.badgeBg}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{suitability.total_score}<span className="text-base font-normal text-gray-500">/100</span></p>
                    <p className="text-xs text-gray-500 mt-1">{cfg.description}</p>
                  </div>
                </div>
                <div className="hidden md:flex flex-col items-end gap-2">
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>Financial: <strong className={cfg.textColor}>{suitability.financial_capacity_score}/30</strong></span>
                    <span>Experience: <strong className={cfg.textColor}>{suitability.investment_experience_score}/20</strong></span>
                    <span>Objectives: <strong className={cfg.textColor}>{suitability.investment_objectives_score}/20</strong></span>
                    <span>Risk: <strong className={cfg.textColor}>{suitability.risk_tolerance_score}/30</strong></span>
                  </div>
                  <p className="text-xs text-gray-400">Eligible: {cfg.allowed}</p>
                  <div className="flex items-center gap-2">
                    {isExpiringSoon && (
                      <span className="text-xs text-orange-600 font-medium">Expiring soon</span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/investor/suitability-assessment')}
                      className="text-xs h-7 px-3 gap-1"
                    >
                      <RefreshCwIcon className="w-3 h-3" />
                      Retake
                    </Button>
                  </div>
                </div>
              </div>
              {/* Mobile score breakdown */}
              <div className="md:hidden mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                <span>Financial: <strong className={cfg.textColor}>{suitability.financial_capacity_score}/30</strong></span>
                <span>Experience: <strong className={cfg.textColor}>{suitability.investment_experience_score}/20</strong></span>
                <span>Objectives: <strong className={cfg.textColor}>{suitability.investment_objectives_score}/20</strong></span>
                <span>Risk: <strong className={cfg.textColor}>{suitability.risk_tolerance_score}/30</strong></span>
              </div>
              <div className="md:hidden mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-400">Eligible: {cfg.allowed}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/investor/suitability-assessment')}
                  className="text-xs h-7 px-3 gap-1"
                >
                  <RefreshCwIcon className="w-3 h-3" />
                  Retake
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })() : (
        <Card className="border shadow-lg bg-[#f0f7f2] border-[#0C4B20]/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#0C4B20]/20 rounded-xl flex items-center justify-center">
                  <ShieldCheckIcon className="w-7 h-7 text-[#0C4B20]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Risk Profile</h3>
                  <p className="text-lg font-semibold text-gray-700">Not Yet Assessed</p>
                  <p className="text-xs text-gray-500">Complete your suitability assessment to unlock investments</p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/investor/suitability-assessment')}
                className="bg-[#0C4B20] hover:bg-[#8FB200] text-white font-semibold px-5 py-2 rounded-xl"
              >
                Take Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Investment Overview</h2>
          <p className="text-gray-600 mt-1">Track your investment performance and impact</p>
        </div>
        <Button 
          onClick={() => navigate('/investor/investments')}
          className="bg-[#0C4B20] hover:bg-[#8FB200] text-white font-semibold px-6 py-2 rounded-xl transition-colors duration-200 flex items-center gap-2"
        >
          See More
          <ArrowRightIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
            onClick={() => navigate('/investor/investments')}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className={`w-16 h-16 ${stat.bgColor} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    {stat.icon}
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">{stat.title}</h3>
                  <p className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-[#0C4B20] to-[#8FB200]">
        <CardContent className="p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Your Investment Impact</h3>
              <p className="text-white/90 mb-4">
                You've supported <strong>{stats.totalCampaignsFunded}</strong> campaigns 
                {stats.totalProjects > 0 && ` across ${stats.totalProjects} projects`}, 
                contributing <strong>{formatCurrency(stats.approvedInvestments)}</strong> to fund innovative ideas.
              </p>
              {stats.pendingInvestments > 0 && (
                <p className="text-white/80 text-sm">
                  Additional {formatCurrency(stats.pendingInvestments)} pending approval.
                </p>
              )}
            </div>
            <div className="hidden md:flex">
              <TrendingUpIcon className="w-16 h-16 text-white/20" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};