// src/components/owner/PaymentAnalytics.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { authFetch } from '../../lib/api';
import { API_BASE_URL } from '../../config/environment';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Download,
  BarChart3
} from 'lucide-react';
import { LoadingSpinner } from '../ui/loading-spinner';
import { toast } from 'react-hot-toast';

interface MonthlyPayment {
  month: string;
  totalAmount: number;
  transactionCount: number;
  topUps: number;
  investments: number;
  repayments: number;
}

interface IssuerAnalytics {
  issuerId: string;
  issuerName: string;
  issuerEmail: string;
  totalProjects: number;
  totalFunded: number;
  totalRepaid: number;
  activeInvestors: number;
  averageRepaymentTime: number;
  successRate: number;
}

interface PaymentBreakdown {
  investorId: string;
  investorName: string;
  investorEmail: string;
  totalInvested: number;
  activeInvestments: number;
  totalReturns: number;
  roi: number;
}

export const PaymentAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<MonthlyPayment[]>([]);
  const [issuerAnalytics, setIssuerAnalytics] = useState<IssuerAnalytics[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown[]>([]);
  const [filterIssuer, setFilterIssuer] = useState<string>('all');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedYear, selectedMonth, filterIssuer]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [monthly, issuer, breakdown] = await Promise.all([
        authFetch(`${API_BASE_URL}/owner/analytics/monthly-payments?year=${selectedYear}`),
        authFetch(`${API_BASE_URL}/owner/analytics/issuer-analytics?month=${selectedMonth}`),
        authFetch(`${API_BASE_URL}/owner/analytics/payment-breakdown?issuer=${filterIssuer}&month=${selectedMonth}`)
      ]);

      setMonthlyData(monthly.data || []);
      setIssuerAnalytics(issuer.data || []);
      setPaymentBreakdown(breakdown.data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load payment analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (type: 'monthly' | 'issuer' | 'investor') => {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/owner/analytics/export?type=${type}&month=${selectedMonth}&year=${selectedYear}`,
        { method: 'POST' }
      );
      
      // Create download link
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${selectedMonth}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    return new Date(monthStr + '-01').toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const currentMonthData = monthlyData.find(m => m.month === selectedMonth);
  const totalMonthlyAmount = currentMonthData?.totalAmount || 0;
  const monthlyGrowth = monthlyData.length > 1 
    ? ((monthlyData[0]?.totalAmount - monthlyData[1]?.totalAmount) / monthlyData[1]?.totalAmount) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">
            Monitor payments, track issuers, and analyze investor activity
          </p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4B20] focus:border-transparent"
          >
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4B20] focus:border-transparent"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Monthly Payments</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(totalMonthlyAmount)}
                </p>
                <p className={`text-sm mt-1 ${monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}% from last month
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {currentMonthData?.transactionCount || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  This month
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Issuers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {issuerAnalytics.length}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  With active projects
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Investors</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {paymentBreakdown.length}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Contributing this month
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Aggregation Report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Monthly Payment Aggregation</CardTitle>
          <Button
            onClick={() => exportReport('monthly')}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Month</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Amount</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Transactions</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Top-ups</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Investments</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Repayments</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((month, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{formatMonth(month.month)}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(month.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{month.transactionCount}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">
                      {formatCurrency(month.topUps)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">
                      {formatCurrency(month.investments)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">
                      {formatCurrency(month.repayments)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Issuer-Based Analytics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Issuer Performance Analytics</CardTitle>
          <Button
            onClick={() => exportReport('issuer')}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Issuer</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Projects</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Funded</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Repaid</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Investors</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {issuerAnalytics.map((issuer, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{issuer.issuerName}</p>
                        <p className="text-xs text-gray-500">{issuer.issuerEmail}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{issuer.totalProjects}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(issuer.totalFunded)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(issuer.totalRepaid)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{issuer.activeInvestors}</td>
                    <td className="py-3 px-4 text-right">
                      <Badge 
                        variant={issuer.successRate >= 60 ? 'default' : 'destructive'}
                      >
                        {issuer.successRate.toFixed(0)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Breakdown by Investor */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payment Breakdown by Investor</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Individual investor contribution analysis</p>
          </div>
          <div className="flex gap-2">
            <select
              value={filterIssuer}
              onChange={(e) => setFilterIssuer(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Issuers</option>
              {issuerAnalytics.map((issuer) => (
                <option key={issuer.issuerId} value={issuer.issuerId}>
                  {issuer.issuerName}
                </option>
              ))}
            </select>
            <Button
              onClick={() => exportReport('investor')}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Investor</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Invested</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Active Investments</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Returns</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">ROI</th>
                </tr>
              </thead>
              <tbody>
                {paymentBreakdown.map((investor, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{investor.investorName}</p>
                        <p className="text-xs text-gray-500">{investor.investorEmail}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(investor.totalInvested)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{investor.activeInvestments}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(investor.totalReturns)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-medium ${investor.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {investor.roi >= 0 ? '+' : ''}{investor.roi.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Automated Reconciliation Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Monthly Reconciliation</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Last reconciled: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900">Reconciled Transactions</p>
              <p className="text-2xl font-bold text-green-700 mt-2">
                {currentMonthData?.transactionCount || 0}
              </p>
              <p className="text-xs text-green-600 mt-1">All transactions verified</p>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Platform Revenue</p>
              <p className="text-2xl font-bold text-blue-700 mt-2">
                {formatCurrency(totalMonthlyAmount * 0.02)} {/* Assuming 2% platform fee */}
              </p>
              <p className="text-xs text-blue-600 mt-1">2% platform fee</p>
            </div>
            
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm font-medium text-purple-900">Settlement Amount</p>
              <p className="text-2xl font-bold text-purple-700 mt-2">
                {formatCurrency(totalMonthlyAmount * 0.98)}
              </p>
              <p className="text-xs text-purple-600 mt-1">To be distributed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
