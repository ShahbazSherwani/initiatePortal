// src/screens/owner/OwnerTickets.tsx
import React, { useState, useEffect } from 'react';
import { OwnerLayout } from '../../layouts/OwnerLayout';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { authFetch } from '../../lib/api';
import { API_BASE_URL } from '../../config/environment';
import { toast } from 'react-hot-toast';
import {
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  User,
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

const CATEGORIES: Record<string, string> = {
  general: 'General Inquiry',
  account: 'Account Issue',
  investment: 'Investment Question',
  project: 'Project Issue',
  payment: 'Payment / Wallet',
  technical: 'Technical Problem',
  other: 'Other',
};

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-700', icon: <Clock className="w-3 h-3" /> },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700', icon: <AlertCircle className="w-3 h-3" /> },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600', icon: <XCircle className="w-3 h-3" /> },
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

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await authFetch(`${API_BASE_URL}/admin/tickets`);
      setTickets(data.tickets || []);
    } catch {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

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
    } catch {
      toast.error('Failed to update ticket');
    } finally {
      setSaving(null);
    }
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-[#0C4B20]" />
              Support Tickets
            </h1>
            <p className="text-gray-500 mt-1">Manage and respond to user support requests</p>
          </div>
          <Button variant="outline" onClick={fetchTickets} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl border p-3 text-left transition-all ${
                activeTab === tab.key
                  ? 'border-[#0C4B20] bg-[#0C4B20] text-white'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <p className={`text-xl font-bold ${activeTab === tab.key ? 'text-white' : 'text-gray-800'}`}>
                {counts[tab.key as keyof typeof counts]}
              </p>
              <p className={`text-xs mt-0.5 ${activeTab === tab.key ? 'text-green-200' : 'text-gray-500'}`}>
                {tab.label}
              </p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by user, subject, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0C4B20] focus:outline-none"
          />
        </div>

        {/* Ticket list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          </div>
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

              return (
                <div key={ticket.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Row */}
                  <button
                    className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 truncate">{ticket.subject}</span>
                        <Badge className={`${cfg.color} flex items-center gap-1 text-xs px-2 py-0.5`}>
                          {cfg.icon}{cfg.label}
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5">{catLabel}</Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">{ticket.user_name || ticket.user_email || 'Unknown user'}</span>
                        {ticket.user_email && ticket.user_name && (
                          <span className="text-gray-400"> · {ticket.user_email}</span>
                        )}
                        <span className="text-gray-400"> · #{ticket.id} · {new Date(ticket.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-gray-400 mt-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 py-5 space-y-5">
                      {/* User message */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">User Message</p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{ticket.message}</p>
                      </div>

                      {/* Status update */}
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-medium text-gray-700 whitespace-nowrap">Change Status:</p>
                        <div className="flex flex-wrap gap-2">
                          {(['open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
                            <button
                              key={s}
                              disabled={ticket.status === s || saving === ticket.id}
                              onClick={() => updateTicket(ticket.id, { status: s })}
                              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                                ticket.status === s
                                  ? 'bg-[#0C4B20] text-white border-[#0C4B20]'
                                  : 'border-gray-300 hover:border-[#0C4B20] hover:text-[#0C4B20]'
                              }`}
                            >
                              {statusConfig[s].label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Reply */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">
                          {ticket.admin_reply ? 'Edit Reply' : 'Write a Reply'}
                        </label>
                        <textarea
                          value={currentReply}
                          onChange={(e) => setReplyText({ ...replyText, [ticket.id]: e.target.value })}
                          rows={4}
                          placeholder="Type your response to the user..."
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C4B20] focus:outline-none resize-none"
                        />
                        <div className="flex justify-end mt-2">
                          <Button
                            disabled={saving === ticket.id || !currentReply.trim()}
                            onClick={() => updateTicket(ticket.id, { admin_reply: currentReply, status: ticket.status === 'open' ? 'in_progress' : ticket.status })}
                            className="bg-[#0C4B20] hover:bg-[#0C4B20]/90 text-white"
                          >
                            {saving === ticket.id ? 'Saving...' : 'Send Reply'}
                          </Button>
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
