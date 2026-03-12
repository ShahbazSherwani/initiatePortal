// src/screens/owner/OwnerEscrowReconciliation.tsx
import React, { useEffect, useState } from 'react';
import { OwnerLayout } from '../../layouts/OwnerLayout';
import { authFetch } from '../../lib/api';
import { API_BASE_URL } from '../../config/environment';
import { Card, CardContent } from '../../components/ui/card';
import { WalletIcon, AlertCircleIcon, CheckCircleIcon, RefreshCwIcon } from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { toast } from 'react-hot-toast';

interface ReconciliationRow {
  projectId: number;
  projectName: string;
  borrowerName: string;
  status: string;
  fundingTarget: number;
  amountRaised: number;
  sumFromRequests: number;
  investorCount: number;
  discrepancy: number;
  hasDiscrepancy: boolean;
}

interface ReconciliationData {
  rows: ReconciliationRow[];
  totalProjects: number;
  totalDiscrepancies: number;
  totalWalletBalance: number;
}

const fmt = (n: number) =>
  '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  funded: 'bg-blue-100 text-blue-700',
  closed: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
};

export const OwnerEscrowReconciliation: React.FC = () => {
  const [data, setData] = useState<ReconciliationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await authFetch(`${API_BASE_URL}/admin/escrow/reconciliation`);
      setData(result);
    } catch {
      toast.error('Failed to load escrow reconciliation data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <OwnerLayout activePage="escrow">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </OwnerLayout>
    );
  }

  const displayRows = data
    ? showAll
      ? data.rows
      : data.rows.filter((r) => r.hasDiscrepancy)
    : [];

  return (
    <OwnerLayout activePage="escrow">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <WalletIcon className="w-6 h-6 text-[#0C4B20]" />
              Escrow Reconciliation
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Compares recorded <code>amountRaised</code> against the sum of individual investor request amounts. Discrepancies ≥ ₱1 are flagged.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600"
          >
            <RefreshCwIcon className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Summary cards */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Projects</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{data.totalProjects}</p>
              </CardContent>
            </Card>
            <Card className={`border-0 shadow-sm ${data.totalDiscrepancies > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <CardContent className="p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Discrepancies Found</p>
                <p className={`text-3xl font-bold mt-1 ${data.totalDiscrepancies > 0 ? 'text-red-700' : 'text-green-700'}`}>
                  {data.totalDiscrepancies}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Wallet Balance (All Users)</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{fmt(data.totalWalletBalance)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter toggle */}
        <div className="flex gap-2 text-sm">
          <button
            onClick={() => setShowAll(false)}
            className={`px-4 py-1.5 rounded-full font-medium border transition-colors ${!showAll ? 'bg-red-600 text-white border-red-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            Discrepancies only ({data?.totalDiscrepancies ?? 0})
          </button>
          <button
            onClick={() => setShowAll(true)}
            className={`px-4 py-1.5 rounded-full font-medium border transition-colors ${showAll ? 'bg-[#0C4B20] text-white border-[#0C4B20]' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            All projects ({data?.totalProjects ?? 0})
          </button>
        </div>

        {/* Table */}
        {displayRows.length === 0 ? (
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="py-12 text-center text-gray-400">
              <CheckCircleIcon className="w-10 h-10 mx-auto mb-3 text-green-400" />
              <p className="font-medium text-green-700">No discrepancies found — all balances reconcile.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Project</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Funding Target</th>
                  <th className="text-right px-4 py-3 font-semibold">Amount Raised (Recorded)</th>
                  <th className="text-right px-4 py-3 font-semibold">Sum of Requests</th>
                  <th className="text-right px-4 py-3 font-semibold">Investors</th>
                  <th className="text-right px-4 py-3 font-semibold">Discrepancy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {displayRows.map((row) => (
                  <tr key={row.projectId} className={row.hasDiscrepancy ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 line-clamp-1">{row.projectName}</p>
                      <p className="text-xs text-gray-500">{row.borrowerName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[row.status] || 'bg-gray-100 text-gray-600'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(row.fundingTarget)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(row.amountRaised)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(row.sumFromRequests)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{row.investorCount}</td>
                    <td className="px-4 py-3 text-right">
                      {row.hasDiscrepancy ? (
                        <span className="inline-flex items-center gap-1 text-red-700 font-semibold">
                          <AlertCircleIcon className="w-3.5 h-3.5" />
                          {fmt(row.discrepancy)}
                        </span>
                      ) : (
                        <span className="text-green-600 flex items-center justify-end gap-1">
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
};
