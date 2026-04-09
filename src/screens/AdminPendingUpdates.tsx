import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'react-hot-toast';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';

interface PendingUpdate {
  id: string;
  project_id: string;
  project_name: string;
  author_uid: string;
  author_name: string;
  author_role: string;
  title: string;
  content: string;
  attachments: Array<{ name: string; url: string; type: string }>;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export const AdminPendingUpdates: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [updates, setUpdates] = useState<PendingUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile && !profile.isAdmin) {
      navigate('/borrow');
      toast.error('You do not have permission to access this page');
    }
  }, [profile, navigate]);

  const fetchPending = useCallback(async () => {
    try {
      const data = await authFetch(`${API_BASE_URL}/admin/pending-updates`);
      if (data?.success) {
        setUpdates(data.updates || []);
      }
    } catch (err) {
      console.error('Failed to fetch pending updates:', err);
      toast.error('Failed to load pending updates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleReview = async (update: PendingUpdate, status: 'approved' | 'rejected') => {
    setActionLoading(update.id);
    try {
      const body: any = { status };
      if (adminNotes[update.id]) body.admin_notes = adminNotes[update.id];

      const data = await authFetch(`${API_BASE_URL}/admin/projects/${update.project_id}/updates/${update.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (data?.success) {
        toast.success(`Update ${status}`);
        setAdminNotes(prev => ({ ...prev, [update.id]: '' }));
        setUpdates(prev => prev.filter(u => u.id !== update.id));
      } else {
        toast.error(data?.error || 'Failed to review update');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to review update');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Loading pending updates...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-2">Pending Project Updates</h1>
        <p className="text-gray-500 text-sm mb-6">
          Review and approve updates posted by project owners before they become visible to investors.
        </p>

        {updates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No pending updates</p>
            <p className="text-sm mt-1">All project updates have been reviewed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {updates.map(update => {
              const isActing = actionLoading === update.id;
              return (
                <div key={update.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <button
                        onClick={() => navigate(`/admin/project/${update.project_id}`)}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {update.project_name || 'Unknown Project'}
                      </button>
                      <span className="text-xs text-gray-400 ml-2">
                        by {update.author_name} ({update.author_role})
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(update.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-1">{update.title}</h4>
                  <div className="text-sm text-gray-700 mb-3 whitespace-pre-wrap line-clamp-4">{update.content}</div>

                  {update.attachments?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {update.attachments.map((att, i) => (
                        <div key={i} className="border rounded overflow-hidden" style={{ width: 80, height: 60 }}>
                          {att.type?.startsWith('image/') ? (
                            <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-xs text-gray-500 p-1 text-center">{att.name}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <Textarea
                    value={adminNotes[update.id] || ''}
                    onChange={e => setAdminNotes(prev => ({ ...prev, [update.id]: e.target.value }))}
                    placeholder="Feedback (optional, visible to borrower if rejected)"
                    rows={2}
                    className="text-sm mb-2"
                  />

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleReview(update, 'approved')}
                      disabled={isActing}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isActing ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReview(update, 'rejected')}
                      disabled={isActing}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isActing ? 'Processing...' : 'Reject'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/project/${update.project_id}`)}
                    >
                      View Project
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPendingUpdates;
