// src/screens/owner/OwnerAmlLog.tsx
import React, { useEffect, useState } from 'react';
import { OwnerLayout } from '../../layouts/OwnerLayout';
import { authFetch } from '../../lib/api';
import { API_BASE_URL } from '../../config/environment';
import { Card, CardContent } from '../../components/ui/card';
import { ShieldOffIcon, AlertTriangleIcon, CheckCircleIcon, ClockIcon } from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { toast } from 'react-hot-toast';

interface AmlLog {
  id: number;
  logged_by: string;
  logged_by_name: string | null;
  subject_uid: string | null;
  subject_name: string | null;
  report_type: string;
  amount: string | null;
  currency: string;
  reason: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const REPORT_TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  STR: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Suspicious Transaction Report' },
  CTR: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Cash Transaction Report' },
  'red-flag': { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Red Flag' },
};

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  open: { color: 'bg-yellow-100 text-yellow-700', icon: <ClockIcon className="w-3 h-3" /> },
  filed: { color: 'bg-blue-100 text-blue-700', icon: <CheckCircleIcon className="w-3 h-3" /> },
  cleared: { color: 'bg-green-100 text-green-700', icon: <CheckCircleIcon className="w-3 h-3" /> },
};

export const OwnerAmlLog: React.FC = () => {
  const [logs, setLogs] = useState<AmlLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ subjectUid: '', subjectName: '', reportType: 'STR', amount: '', currency: 'PHP', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await authFetch(`${API_BASE_URL}/admin/aml/logs`);
      setLogs(data.logs || []);
    } catch {
      toast.error('Failed to load AML logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.reason.trim()) { toast.error('Reason is required'); return; }
    setSubmitting(true);
    try {
      await authFetch(`${API_BASE_URL}/admin/aml/log`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      toast.success('AML log entry created');
      setForm({ subjectUid: '', subjectName: '', reportType: 'STR', amount: '', currency: 'PHP', reason: '' });
      fetchLogs();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create log entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    setUpdating(id);
    try {
      await authFetch(`${API_BASE_URL}/admin/aml/log/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      toast.success('Status updated');
      fetchLogs();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <OwnerLayout activePage="aml">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout activePage="aml">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldOffIcon className="w-6 h-6 text-red-600" />
            AML / Financial Intelligence Logs
          </h1>
          <p className="text-gray-500 mt-1">Log Suspicious Transaction Reports (STR), Cash Transaction Reports (CTR), and AML red-flag alerts per AMLA requirements.</p>
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-3">
          {(['STR', 'CTR', 'red-flag'] as const).map((type) => {
            const count = logs.filter((l) => l.report_type === type).length;
            const openCount = logs.filter((l) => l.report_type === type && l.status === 'open').length;
            const cfg = REPORT_TYPE_CONFIG[type];
            return (
              <div key={type} className={`px-4 py-2 rounded-xl border text-sm font-semibold ${cfg.color}`}>
                {type}: {count} total ({openCount} open)
              </div>
            );
          })}
        </div>

        {/* Existing log entries */}
        {logs.length > 0 && (
          <div className="space-y-3">
            {logs.map((log) => {
              const typeCfg = REPORT_TYPE_CONFIG[log.report_type] || REPORT_TYPE_CONFIG['red-flag'];
              const statusCfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.open;
              return (
                <Card key={log.id} className="bg-white shadow-sm border-0">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${typeCfg.color}`}>
                            {log.report_type}
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${statusCfg.color}`}>
                            {statusCfg.icon} {log.status}
                          </span>
                          <span className="text-xs text-gray-400">#{log.id}</span>
                        </div>
                        <p className="text-sm text-gray-800">{log.reason}</p>
                        {log.subject_name || log.subject_uid ? (
                          <p className="text-xs text-gray-500">
                            Subject: {log.subject_name || log.subject_uid}
                            {log.amount && ` · Amount: ₱${parseFloat(log.amount).toLocaleString()}`}
                          </p>
                        ) : null}
                        <p className="text-xs text-gray-400">
                          Logged by {log.logged_by_name || log.logged_by} · {new Date(log.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {log.status === 'open' && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleUpdateStatus(log.id, 'filed')}
                            disabled={updating === log.id}
                            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            Mark Filed
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(log.id, 'cleared')}
                            disabled={updating === log.id}
                            className="text-xs px-3 py-1.5 rounded-lg border border-green-500 text-green-700 hover:bg-green-50 disabled:opacity-50"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {logs.length === 0 && (
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="py-12 text-center text-gray-400">
              <CheckCircleIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No AML logs yet</p>
            </CardContent>
          </Card>
        )}

        {/* New Entry Form */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangleIcon className="w-4 h-4 text-red-500" />
                Create New AML Log Entry
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Per Republic Act 9160 (AMLA), STRs must be filed with AMLC within 5 business days of determination.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Report Type</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C4B20]"
                  value={form.reportType}
                  onChange={(e) => setForm((p) => ({ ...p, reportType: e.target.value }))}
                >
                  <option value="STR">STR — Suspicious Transaction Report</option>
                  <option value="CTR">CTR — Cash Transaction Report</option>
                  <option value="red-flag">Red Flag — AML Alert</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount Involved (₱) — optional</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C4B20]"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subject Name — optional</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C4B20]"
                  placeholder="Full name of subject"
                  value={form.subjectName}
                  onChange={(e) => setForm((p) => ({ ...p, subjectName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subject Firebase UID — optional</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C4B20]"
                  placeholder="Firebase UID (for account flagging)"
                  value={form.subjectUid}
                  onChange={(e) => setForm((p) => ({ ...p, subjectUid: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Reason / Description <span className="text-red-500">*</span></label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C4B20] resize-none"
                rows={3}
                placeholder="Describe the suspicious activity or basis for this report…"
                value={form.reason}
                onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Logging…' : 'Log Report'}
            </button>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
};
