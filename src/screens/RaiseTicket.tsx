import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';
import { toast } from 'react-hot-toast';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  MessageCircle,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
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

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-700', icon: <Clock className="w-3 h-3" /> },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700', icon: <AlertCircle className="w-3 h-3" /> },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600', icon: <XCircle className="w-3 h-3" /> },
};

export const RaiseTicket: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
      toast.success('Ticket submitted! We\'ll get back to you shortly.');
      setForm({ category: 'general', subject: '', message: '' });
      setShowForm(false);
      fetchTickets();
    } catch {
      toast.error('Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar activePage="initiate-request" />
      <main className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-[#0C4B20]" />
              Support Tickets
            </h1>
            <p className="text-gray-500 mt-1">Submit a request or view the status of your existing tickets</p>
          </div>
          <Button
            className="bg-[#0C4B20] hover:bg-[#0C4B20]/90 text-white gap-2"
            onClick={() => setShowForm((v) => !v)}
          >
            <PlusCircle className="w-4 h-4" />
            {showForm ? 'Cancel' : 'New Ticket'}
          </Button>
        </div>

        {/* New Ticket Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Submit a New Ticket</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C4B20] focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Brief summary of your request"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C4B20] focus:outline-none"
                  maxLength={200}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  placeholder="Describe your issue or question in detail..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={5}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C4B20] focus:outline-none resize-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#0C4B20] hover:bg-[#0C4B20]/90 text-white"
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Ticket List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C4B20]" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg font-medium">No tickets yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "New Ticket" to get help from our team</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const cfg = statusConfig[ticket.status] || statusConfig.open;
              const isExpanded = expandedId === ticket.id;
              const catLabel = CATEGORIES.find((c) => c.value === ticket.category)?.label || ticket.category;
              return (
                <div key={ticket.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Ticket header row */}
                  <button
                    className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 truncate">{ticket.subject}</span>
                        <Badge className={`${cfg.color} flex items-center gap-1 text-xs px-2 py-0.5`}>
                          {cfg.icon}{cfg.label}
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5">{catLabel}</Badge>
                      </div>
                      <p className="text-xs text-gray-400">
                        #{ticket.id} · Submitted {new Date(ticket.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                        {ticket.admin_reply && <span className="ml-2 text-green-600 font-medium">· Admin replied</span>}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-gray-400 mt-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Your Message</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
                      </div>
                      {ticket.admin_reply && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Admin Reply</p>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{ticket.admin_reply}</p>
                          {ticket.replied_at && (
                            <p className="text-xs text-gray-400 mt-2">
                              Replied on {new Date(ticket.replied_at).toLocaleString('en-PH')}
                            </p>
                          )}
                        </div>
                      )}
                      {!ticket.admin_reply && (
                        <p className="text-xs text-gray-400 italic">Awaiting admin response...</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default RaiseTicket;
