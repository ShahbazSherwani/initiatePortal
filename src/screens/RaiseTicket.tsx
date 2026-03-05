import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  RotateCcw,
  PlusCircle,
} from 'lucide-react';

interface Ticket {
  id: number;
  category: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

const CATEGORIES = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'account', label: 'Account Issue' },
  { value: 'investment', label: 'Investment Question' },
  { value: 'project', label: 'Project Issue' },
  { value: 'payment', label: 'Payment / Wallet' },
  { value: 'technical', label: 'Technical Problem' },
  { value: 'other', label: 'Other' },
];

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

type StatusKey = 'open' | 'in_progress' | 'resolved' | 'closed';

const STATUS_CONFIG: Record<StatusKey, { label: string; color: string; bg: string; stripColor: string; icon: React.ReactNode }> = {
  open: {
    label: 'Open',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    stripColor: 'bg-orange-400',
    icon: <Clock className="w-4 h-4 text-orange-500" />,
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    stripColor: 'bg-orange-500',
    icon: <RotateCcw className="w-4 h-4 text-orange-600" />,
  },
  resolved: {
    label: 'Resolved',
    color: 'text-[#0C4B20]',
    bg: 'bg-green-50',
    stripColor: 'bg-[#0C4B20]',
    icon: <CheckCircle className="w-4 h-4 text-[#0C4B20]" />,
  },
  closed: {
    label: 'Closed',
    color: 'text-red-500',
    bg: 'bg-red-50',
    stripColor: 'bg-red-400',
    icon: <XCircle className="w-4 h-4 text-red-500" />,
  },
};

type View = 'list' | 'form' | 'detail';

export const RaiseTicket: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ category: 'general', subject: '', message: '' });

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await authFetch(`${API_BASE_URL}/tickets/my`);
      setTickets(data.tickets || []);
    } catch {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const filteredTickets = activeTab === 'all'
    ? tickets
    : tickets.filter((t) => t.status === activeTab);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      setSubmitting(true);
      await authFetch(`${API_BASE_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      toast.success("Ticket submitted! We'll get back to you shortly.");
      setForm({ category: 'general', subject: '', message: '' });
      setView('list');
      fetchTickets();
    } catch {
      toast.error('Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const catLabel = (key: string) =>
    CATEGORIES.find((c) => c.value === key)?.label || key;

  /* ── SHARED HEADER ─────────────────────────────────────────── */
  const PageHeader = ({ onBack }: { onBack: () => void }) => (
    <div className="flex items-center gap-3 mb-8">
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0"
      >
        <ArrowLeft className="w-4 h-4 text-gray-600" />
      </button>
      <h1 className="text-2xl font-bold text-gray-900">Raise Tickets</h1>
    </div>
  );

  /* ── FORM VIEW ─────────────────────────────────────────────── */
  if (view === 'form') {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar activePage="initiate-request" />
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <PageHeader onBack={() => setView('list')} />

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Submit Your Request</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm appearance-none focus:ring-2 focus:ring-[#0C4B20] focus:outline-none bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▼</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Enter here"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#0C4B20] focus:outline-none"
                  maxLength={200}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  placeholder="Enter here"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#0C4B20] focus:outline-none resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 rounded-lg bg-[#0C4B20] text-white font-semibold text-sm hover:bg-[#0C4B20]/90 transition-colors disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  /* ── DETAIL VIEW ───────────────────────────────────────────── */
  if (view === 'detail' && selectedTicket) {
    const cfg = STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG.open;
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar activePage="initiate-request" />
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <PageHeader onBack={() => { setView('list'); setSelectedTicket(null); }} />

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl space-y-5">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${cfg.bg} ${cfg.color}`}>
              {cfg.icon} Status: {cfg.label}
            </div>

            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Subject</p>
              <p className="text-lg font-bold text-gray-900">{selectedTicket.subject}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Category</p>
              <p className="text-sm text-gray-700">{catLabel(selectedTicket.category)}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Message</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedTicket.message}</p>
            </div>

            <p className="text-xs text-gray-400">
              Submitted {new Date(selectedTicket.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>

            {selectedTicket.admin_reply ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-[#0C4B20] uppercase tracking-wide mb-2">Response from Admin</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{selectedTicket.admin_reply}</p>
                {selectedTicket.replied_at && (
                  <p className="text-xs text-gray-400 mt-3">
                    Replied {new Date(selectedTicket.replied_at).toLocaleString('en-PH')}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-400 text-center italic">
                Awaiting admin response...
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  /* ── LIST VIEW ─────────────────────────────────────────────── */
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar activePage="initiate-request" />
      <main className="flex-1 overflow-y-auto p-6 md:p-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Raise Tickets</h1>
          </div>
          <button
            onClick={() => setView('form')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0C4B20] text-white text-sm font-semibold hover:bg-[#0C4B20]/90 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Add New Request
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#0C4B20] text-white border-[#0C4B20]'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#0C4B20] hover:text-[#0C4B20]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C4B20]" />
          </div>

        ) : filteredTickets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-semibold">No tickets found</p>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab === 'all'
                ? 'Click "Add New Request" to raise a support ticket.'
                : `No ${activeTab.replace('_', ' ')} tickets.`}
            </p>
          </div>

        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4 font-medium">
              You have {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredTickets.map((ticket) => {
                const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                return (
                  <div key={ticket.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    {/* Top accent strip */}
                    <div className={`h-1.5 w-full ${cfg.stripColor}`} />

                    <div className="p-5 flex-1 flex flex-col gap-3">
                      {/* Status */}
                      <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${cfg.color}`}>
                        {cfg.icon} Status: {cfg.label}
                      </div>

                      {/* Subject */}
                      <h3 className="font-bold text-gray-900 text-base leading-snug">{ticket.subject}</h3>

                      {/* Category */}
                      <div className="text-xs text-gray-500">
                        <span className="font-medium text-gray-400">Category: </span>
                        <span className="text-gray-700">{catLabel(ticket.category)}</span>
                      </div>

                      {/* Message preview */}
                      <div className="text-xs text-gray-500">
                        <span className="font-medium text-gray-400">Message: </span>
                        <span className="text-gray-600 line-clamp-2">{ticket.message}</span>
                      </div>

                      {ticket.admin_reply && (
                        <p className="text-xs text-[#0C4B20] font-semibold">✓ Admin replied</p>
                      )}
                    </div>

                    {/* View button */}
                    <div className="px-5 pb-5">
                      <button
                        onClick={() => { setSelectedTicket(ticket); setView('detail'); }}
                        className="w-full py-2.5 rounded-lg bg-[#0C4B20] text-white text-sm font-semibold hover:bg-[#0C4B20]/90 transition-colors"
                      >
                        View Request Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default RaiseTicket;
