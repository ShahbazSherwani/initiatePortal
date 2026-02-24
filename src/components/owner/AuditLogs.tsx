// src/components/owner/AuditLogs.tsx
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Download, 
  Filter, 
  Search, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  FileText,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { authFetch } from '../../lib/api';
import { API_BASE_URL } from '../../config/environment';

interface AuditLog {
  id: number;
  user_id: string;
  user_email: string;
  action_type: string;
  action_category: string;
  resource_type: string;
  resource_id: string;
  description: string;
  ip_address: string;
  user_agent: string;
  status: string;
  created_at: string;
  metadata: Record<string, any>;
}

interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const logsPerPage = 50;

  // Filters
  const [filters, setFilters] = useState({
    actionCategory: '',
    status: '',
    startDate: '',
    endDate: '',
    searchTerm: ''
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * logsPerPage;
      
      let url = `${API_BASE_URL}/admin/audit-logs?limit=${logsPerPage}&offset=${offset}`;
      
      if (filters.actionCategory) url += `&actionCategory=${filters.actionCategory}`;
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.startDate) url += `&startDate=${filters.startDate}`;
      if (filters.endDate) url += `&endDate=${filters.endDate}`;
      
      const data = await authFetch(url);
      
      // Filter by search term client-side
      let filteredLogs = data.logs || [];
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filteredLogs = filteredLogs.filter((log: AuditLog) => 
          log.user_email?.toLowerCase().includes(term) ||
          log.description?.toLowerCase().includes(term) ||
          log.action_type?.toLowerCase().includes(term)
        );
      }
      
      setLogs(filteredLogs);
      setTotalCount(data.count || filteredLogs.length);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await authFetch(`${API_BASE_URL}/admin/audit-logs/stats`);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching audit stats:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [currentPage, filters.actionCategory, filters.status, filters.startDate, filters.endDate]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchLogs();
      } else {
        setCurrentPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.searchTerm]);

  const handleExport = async () => {
    try {
      setExporting(true);
      let url = `${API_BASE_URL}/admin/audit-logs/export?`;
      if (filters.startDate) url += `startDate=${filters.startDate}&`;
      if (filters.endDate) url += `endDate=${filters.endDate}`;
      
      const data = await authFetch(url);
      
      // Convert to CSV
      if (data.logs && data.logs.length > 0) {
        const headers = ['ID', 'Date', 'User Email', 'Action', 'Category', 'Description', 'Status', 'IP Address'];
        const csvRows = [
          headers.join(','),
          ...data.logs.map((log: AuditLog) => [
            log.id,
            new Date(log.created_at).toISOString(),
            log.user_email || 'N/A',
            log.action_type,
            log.action_category,
            `"${log.description?.replace(/"/g, '""')}"`,
            log.status,
            log.ip_address || 'N/A'
          ].join(','))
        ];
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Success</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-700"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      'AUTH': 'bg-blue-100 text-blue-700',
      'USER': 'bg-purple-100 text-purple-700',
      'PROJECT': 'bg-green-100 text-green-700',
      'INVESTMENT': 'bg-yellow-100 text-yellow-700',
      'ADMIN': 'bg-red-100 text-red-700',
      'SYSTEM': 'bg-gray-100 text-gray-700',
      'PAYMENT': 'bg-emerald-100 text-emerald-700'
    };
    return <Badge className={colors[category] || 'bg-gray-100 text-gray-700'}>{category}</Badge>;
  };

  const totalPages = Math.ceil(totalCount / logsPerPage);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Logs</p>
                <p className="text-2xl font-bold">{stats?.totalLogs?.toLocaleString() || '0'}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Activity</p>
                <p className="text-2xl font-bold">{stats?.todayLogs?.toLocaleString() || '0'}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold">
                  {stats?.byStatus ? 
                    Math.round((stats.byStatus['success'] || 0) / (stats.totalLogs || 1) * 100) : 0}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Failed Actions</p>
                <p className="text-2xl font-bold">{stats?.byStatus?.['failed'] || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search logs..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filters.actionCategory}
              onChange={(e) => setFilters({ ...filters, actionCategory: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="AUTH">Authentication</option>
              <option value="USER">User Actions</option>
              <option value="PROJECT">Projects</option>
              <option value="INVESTMENT">Investments</option>
              <option value="ADMIN">Admin Actions</option>
              <option value="PAYMENT">Payments</option>
              <option value="SYSTEM">System</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="warning">Warning</option>
            </select>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="End Date"
            />
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setFilters({ actionCategory: '', status: '', startDate: '', endDate: '', searchTerm: '' });
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
            <Button
              variant="outline"
              onClick={() => { fetchLogs(); fetchStats(); }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="bg-[#0C4B20] hover:bg-[#0C4B20]/90 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Audit Logs
            </span>
            <span className="text-sm font-normal text-gray-500">
              Showing {logs.length} of {totalCount} logs
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No audit logs found matching your criteria.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Time</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">User</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Category</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Action</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Description</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center">
                            <User className="w-3 h-3 mr-1 text-gray-400" />
                            <span className="truncate max-w-[150px]" title={log.user_email}>
                              {log.user_email || 'System'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getCategoryBadge(log.action_category)}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">
                          {log.action_type}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          <span className="truncate max-w-[250px] block" title={log.description}>
                            {log.description}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(log.status)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {log.ip_address || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;
