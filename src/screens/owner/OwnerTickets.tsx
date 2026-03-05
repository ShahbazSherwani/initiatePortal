// src/screens/owner/OwnerTickets.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { OwnerLayout } from '../../layouts/OwnerLayout';
import { authFetch } from '../../lib/api';
import { API_BASE_URL } from '../../config/environment';
import { toast } from 'react-hot-toast';
import {
  MessageCircle, Clock, CheckCircle, AlertCircle, XCircle,
  ChevronDown, ChevronUp, Search, RefreshCw, User,
  CalendarDays, ShieldOff, ShieldCheck, Wallet, BarChart3, Wrench,
  ExternalLink, Zap,
} from 'lucide-react';

interface Ticket {
  id: number;
  user_id: string;
  user_email: string;
  user_name: string;
  category: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Project { id: number; title: string; end_date: string; status: string; }
interface UserStatus { suspension_scope: string | null; suspension_reason: string | null; suspended_at: string | null; full_name: string; }

const CATEGORIES: Record<string, string> = {
  general: 'General Inquiry', account: 'Account Issue', investment: 'Investment Question',
  project: 'Project Issue', payment: 'Payment / Wallet', technical: 'Technical Problem', other: 'Other',
};

const STATUS_TABS = [
  { key: 'all', label: 'All' }, { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' }, { key: 'resolved', label: 'Resolved' }, { key: 'closed', label: 'Closed' },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open:        { label: 'Open',        color: 'bg-orange-100 text-orange-700', icon: <Clock className="w-3 h-3" /> },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700', icon: <AlertCircle className="w-3 h-3" /> },
  resolved:    { label: 'Resolved',    color: 'bg-green-100 text-[#0C4B20]',   icon: <CheckCircle className="w-3 h-3" /> },
  closed:      { label: 'Closed',      color: 'bg-gray-100 text-gray-600',     icon: <XCircle className="w-3 h-3" /> },
};

// Project deadline extension panel
const ProjectActions: React.FC<{ ticket: Ticket; onDone: () => void }> = ({ ticket, onDone }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [newDate, setNewDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authFetch(`${API_BASE_URL}/admin/ticket-actions/user-projects/${ticket.user_id}`)
      .then((d) => setProjects(d.projects || []))
      .catch(() => toast.error('Could not load user projects'))
      .finally(() => setLoading(false));
  }, [ticket.user_id]);

  const handleExtend = async () => {
    if (!selectedId || !newDate) { toast.error('Select a project and new date'); return; }
    try {
      setSaving(true);
      await authFetch(`${API_BASE_URL}/admin/ticket-actions/extend-deadline/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEndDate: newDate }),
      });
      toast.success('Project deadline extended!');
      onDone();
    } catch { toast.error('Failed to extend deadline'); }
    finally { setSaving(false); }
  };

  if (loading) return <p className="text-xs text-gray-400 italic">Loading projects...</p>;
  if (projects.length === 0) return <p className="text-xs text-gray-400 italic">No projects found for this user.</p>;

  const selected = projects.find((p) => String(p.id) === selectedId);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Select Project</label>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C4B20] focus:outline-none">
          <option value="">-- Choose a project --</option>
          {projects.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.title || `Project #${p.id}`}{p.end_date ? ` (ends ${new Date(p.end_date).toLocaleDateString()})` : ''}
            </option>
          ))}
        </select>
      </div>
      {selected?.end_date && (
        <p className="text-xs text-gray-500">Current end date: <span className="font-semibold">{new Date(selected.end_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
      )}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">New End Date</label>
        <input type="date" value={newDate} min={new Date().toISOString().split('T')[0]}
          onChange={(e) => setNewDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C4B20] focus:outline-none" />
      </div>
      <button onClick={handleExtend} disabled={saving || !selectedId || !newDate}
        className="px-4 py-2 bg-[#0C4B20] text-white rounded-lg text-sm font-semibold hover:bg-[#0C4B20]/90 disabled:opacity-50 transition-colors">
        {saving ? 'Extending...' : 'Extend Deadline'}
      </button>
    </div>
  );
};

// Account suspension panel
const AccountActions: React.FC<{ ticket: Ticket; onDone: () => void }> = ({ ticket, onDone }) => {
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchStatus = useCallback(() => {
    setLoading(true);
    authFetch(`${API_BASE_URL}/admin/ticket-actions/user-status/${ticket.user_id}`)
      .then((d) => setUserStatus(d.user))
      .catch(() => toast.error('Could not load user status'))
      .finally(() => setLoading(false));
  }, [ticket.user_id]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleUnsuspend = async () => {
    try {
      setSaving(true);
      await authFetch(`${API_BASE_URL}/admin/ticket-actions/unsuspend/${ticket.user_id}`, { method: 'POST' });
      toast.success('User account unsuspended!');
      fetchStatus(); onDone();
    } catch { toast.error('Failed to unsuspend user'); }
    finally { setSaving(false); }
  };

  if (loading) return <p className="text-xs text-gray-400 italic">Loading account status...</p>;
  if (!userStatus) return <p className="text-xs text-gray-400 italic">User not found.</p>;

  const isSuspended = !!userStatus.suspension_scope;

  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-3 p-3 rounded-lg ${isSuspended ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
        {isSuspended ? <ShieldOff className="w-5 h-5 text-red-500 flex-shrink-0" /> : <ShieldCheck className="w-5 h-5 text-[#0C4B20] flex-shrink-0" />}
        <div>
          <p className={`text-sm font-semibold ${isSuspended ? 'text-red-700' : 'text-[#0C4B20]'}`}>
            Account is {isSuspended ? `Suspended (${userStatus.suspension_scope})` : 'Active'}
          </p>
          {isSuspended && userStatus.suspension_reason && (
            <p className="text-xs text-gray-500 mt-0.5">Reason: {userStatus.suspension_reason}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {isSuspended && (
          <button onClick={handleUnsuspend} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#0C4B20] text-white rounded-lg text-sm font-semibold hover:bg-[#0C4B20]/90 disabled:opacity-50 transition-colors">
            <ShieldCheck className="w-4 h-4" />{saving ? 'Unsuspending...' : 'Unsuspend Account'}
          </button>
        )}
        <a href={`/owner/users/${ticket.user_id}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:border-[#0C4B20] hover:text-[#0C4B20] transition-colors">
          <ExternalLink className="w-4 h-4" />View User Profile
        </a>
      </div>
    </div>
  );
};

const PaymentActions: React.FC<{ ticket: Ticket }> = ({ ticket }) => (
  <div className="flex flex-wrap gap-2">
    <a href="/owner/topup-requests" target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 px-4 py-2 bg-[#0C4B20] text-white rounded-lg text-sm font-semibold hover:bg-[#0C4B20]/90 transition-colors">
      <Wallet className="w-4 h-4" />Go to Topup Requests
    </a>
    <a href={`/owner/users/${ticket.user_id}`} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:border-[#0C4B20] hover:text-[#0C4B20] transition-colors">
      <ExternalLink className="w-4 h-4" />View User Profile
    </a>
  </div>
);

const InvestmentActions: React.FC<{ ticket: Ticket }> = ({ ticket }) => (
  <div className="flex flex-wrap gap-2">
    <a href="/owner/investment-requests" target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 px-4 py-2 bg-[#0C4B20] text-white rounded-lg text-sm font-semibold hover:bg-[#0C4B20]/90 transition-colors">
      <BarChart3 className="w-4 h-4" />Go to Investment Requests
    </a>
    <a href={`/owner/users/${ticket.user_id}`} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:border-[#0C4B20] hover:text-[#0C4B20] transition-colors">
      <ExternalLink className="w-4 h-4" />View User Profile
    </a>
  </div>
);

const QUICK_ACTION_META: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  project:    { label: 'Project Actions',    icon: <CalendarDays className="w-4 h-4" />, description: 'Extend project deadline directly from here' },
  account:    { label: 'Account Actions',    icon: <ShieldOff className="w-4 h-4" />,   description: 'Check & fix account suspension status' },
  payment:    { label: 'Payment Actions',    icon: <Wallet className="w-4 h-4" />,       description: 'Review wallet / topup requests' },
  investment: { label: 'Investment Actions', icon: <BarChart3 className="w-4 h-4" />,   description: 'Review investment requests' },
  technical:  { label: 'Technical Support',  icon: <Wrench className="w-4 h-4" />,      description: 'Provide a solution in the reply below' },
  general:    { label: 'General Inquiry',    icon: <MessageCircle className="w-4 h-4"/>,description: 'Reply to the user below' },
  other:      { label: 'Other Request',      icon: <MessageCircle className="w-4 h-4"/>,description: 'Reply to the user below' },
};

export const OwnerTickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filtered, setFiltered] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authFetch(`${API_BASE_URL}/admin/tickets`);
      setTickets(data.tickets || []);
    } catch { toast.error('Failed to load tickets'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  useEffect(() => {
    let result = tickets;
    if (activeTab !== 'all') result = result.filter((t) => t.status === activeTab);
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter((t) =>
        t.subject.toLowerCase().includes(term) ||
        t.user_name?.toLowerCase().includes(term) ||
        t.user_email?.toLowerCase().includes(term) ||
        t.message.toLowerCase().includes(term)
      );
    }
    setFiltered(result);
  }, [tickets, activeTab, search]);

  const updateTicket = async (id: number, updates: { status?: string; admin_reply?: string }) => {
    try {
      setSaving(id);
      await authFetch(`${API_BASE_URL}/admin/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      toast.success('Ticket updated');
      fetchTickets();
    } catch { toast.error('Failed to update ticket'); }
    finally { setSaving(null); }
  };

  const counts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
  };

  return (
    <OwnerLayout activePage="tickets">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-[#0C4B20]" />
              Support Tickets
            </h1>
            <p className="text-gray-500 mt-1">Manage and respond to user support requests</p>
          </div>
          <button onClick={fetchTickets} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-[#0C4B20] hover:text-[#0C4B20] transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {STATUS_TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl border p-3 text-left transition-all ${activeTab === tab.key ? 'border-[#0C4B20] bg-[#0C4B20] text-white' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
              <p className={`text-xl font-bold ${activeTab === tab.key ? 'text-white' : 'text-gray-800'}`}>
                {counts[tab.key as keyof typeof counts]}
              </p>
              <p className={`text-xs mt-0.5 ${activeTab === tab.key ? 'text-green-200' : 'text-gray-500'}`}>{tab.label}</p>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="text" placeholder="Search by user, subject, or message..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0C4B20] focus:outline-none" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No tickets found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ticket) => {
              const cfg = statusConfig[ticket.status] || statusConfig.open;
              const isExpanded = expandedId === ticket.id;
              const catLabel = CATEGORIES[ticket.category] || ticket.category;
              const currentReply = replyText[ticket.id] ?? (ticket.admin_reply || '');
              const actionMeta = QUICK_ACTION_META[ticket.category] || QUICK_ACTION_META.other;
              const hasActionPanel = ['project', 'account', 'payment', 'investment'].includes(ticket.category);

              return (
                <div key={ticket.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <button className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : ticket.id)}>
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{ticket.subject}</span>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                          {cfg.icon}{cfg.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                          {actionMeta.icon} {catLabel}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">{ticket.user_name || ticket.user_email || 'Unknown'}</span>
                        {ticket.user_name && ticket.user_email && <span className="text-gray-400"> · {ticket.user_email}</span>}
                        <span className="text-gray-400"> · #{ticket.id} · {new Date(ticket.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        {ticket.admin_reply && <span className="ml-2 text-[#0C4B20] font-medium">· Replied</span>}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-gray-400 mt-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 py-5 space-y-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">User Message</p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{ticket.message}</p>
                      </div>

                      {hasActionPanel && (
                        <div className="border border-[#0C4B20]/20 rounded-xl p-4 bg-green-50/40">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-7 h-7 rounded-lg bg-[#0C4B20] flex items-center justify-center">
                              <Zap className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{actionMeta.label}</p>
                              <p className="text-xs text-gray-500">{actionMeta.description}</p>
                            </div>
                          </div>
                          {ticket.category === 'project' && <ProjectActions ticket={ticket} onDone={fetchTickets} />}
                          {ticket.category === 'account' && <AccountActions ticket={ticket} onDone={fetchTickets} />}
                          {ticket.category === 'payment' && <PaymentActions ticket={ticket} />}
                          {ticket.category === 'investment' && <InvestmentActions ticket={ticket} />}
                        </div>
                      )}

                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">Change Status:</p>
                        {(['open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
                          <button key={s} disabled={ticket.status === s || saving === ticket.id}
                            onClick={() => updateTicket(ticket.id, { status: s })}
                            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                              ticket.status === s ? 'bg-[#0C4B20] text-white border-[#0C4B20]' : 'border-gray-300 text-gray-600 hover:border-[#0C4B20] hover:text-[#0C4B20]'
                            }`}>
                            {statusConfig[s].label}
                          </button>
                        ))}
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-2">
                          {ticket.admin_reply ? 'Edit Reply' : 'Write a Reply to User'}
                        </label>
                        <textarea value={currentReply} rows={4}
                          onChange={(e) => setReplyText({ ...replyText, [ticket.id]: e.target.value })}
                          placeholder="Type your response to the user..."
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C4B20] focus:outline-none resize-none" />
                        <div className="flex justify-end mt-2">
                          <button disabled={saving === ticket.id || !currentReply.trim()}
                            onClick={() => updateTicket(ticket.id, {
                              admin_reply: currentReply,
                              status: ticket.status === 'open' ? 'in_progress' : ticket.status,
                            })}
                            className="px-5 py-2 bg-[#0C4B20] text-white rounded-lg text-sm font-semibold hover:bg-[#0C4B20]/90 disabled:opacity-50 transition-colors">
                            {saving === ticket.id ? 'Saving...' : 'Send Reply'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
};

export default OwnerTickets;
