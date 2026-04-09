import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'react-hot-toast';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';

interface ProjectUpdate {
  id: string;
  project_id: string;
  author_uid: string;
  author_name: string;
  author_role: string;
  title: string;
  content: string;
  attachments: Array<{ name: string; url: string; type: string }>;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const AdminProjectUpdatesTab: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const fetchUpdates = useCallback(async () => {
    try {
      const data = await authFetch(`${API_BASE_URL}/projects/${projectId}/updates`);
      if (data?.success) {
        setUpdates(data.updates || []);
      }
    } catch (err) {
      console.error('Failed to fetch updates:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchUpdates(); }, [fetchUpdates]);

  const handleReview = async (updateId: string, status: 'approved' | 'rejected') => {
    setActionLoading(updateId);
    try {
      const body: any = { status };
      if (adminNotes[updateId]) body.admin_notes = adminNotes[updateId];
      if (editingId === updateId) {
        body.title = editTitle;
        body.content = editContent;
      }

      const data = await authFetch(`${API_BASE_URL}/admin/projects/${projectId}/updates/${updateId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (data?.success) {
        toast.success(`Update ${status}`);
        setEditingId(null);
        setAdminNotes(prev => ({ ...prev, [updateId]: '' }));
        fetchUpdates();
      } else {
        toast.error(data?.error || 'Failed to review update');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to review update');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (updateId: string) => {
    if (!window.confirm('Are you sure you want to delete this update? This cannot be undone.')) return;
    setActionLoading(updateId);
    try {
      const data = await authFetch(`${API_BASE_URL}/admin/projects/${projectId}/updates/${updateId}`, {
        method: 'DELETE',
      });
      if (data?.success) {
        toast.success('Update deleted');
        fetchUpdates();
      } else {
        toast.error('Failed to delete update');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete');
    } finally {
      setActionLoading(null);
    }
  };

  const startEdit = (update: ProjectUpdate) => {
    setEditingId(update.id);
    setEditTitle(update.title);
    setEditContent(update.content);
  };

  if (loading) return <div className="p-4 text-gray-500">Loading updates...</div>;

  const pending = updates.filter(u => u.status === 'pending');
  const approved = updates.filter(u => u.status === 'approved');
  const rejected = updates.filter(u => u.status === 'rejected');

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const renderUpdate = (update: ProjectUpdate) => {
    const isEditing = editingId === update.id;
    const isActing = actionLoading === update.id;

    return (
      <div key={update.id} className="border rounded-lg p-4 mb-4 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {statusBadge(update.status)}
            <span className="text-sm text-gray-500">
              by {update.author_name} ({update.author_role})
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {new Date(update.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {isEditing ? (
          <div className="space-y-2 mb-3">
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm font-semibold"
              placeholder="Title"
            />
            <Textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={4}
              placeholder="Content"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            <h4 className="font-semibold text-gray-900 mb-1">{update.title}</h4>
            <div className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{update.content}</div>
          </>
        )}

        {update.attachments?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {update.attachments.map((att, i) => (
              <div key={i} className="border rounded overflow-hidden" style={{ width: 100, height: 80 }}>
                {att.type?.startsWith('image/') ? (
                  <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-gray-500 p-1 text-center">{att.name}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {update.admin_notes && (
          <div className="bg-gray-50 rounded p-2 mb-3 text-sm">
            <span className="font-medium text-gray-600">Admin notes:</span> {update.admin_notes}
          </div>
        )}

        {update.reviewed_at && (
          <div className="text-xs text-gray-400 mb-3">
            Reviewed {new Date(update.reviewed_at).toLocaleDateString()} by {update.reviewed_by || 'admin'}
          </div>
        )}

        {/* Admin actions */}
        <div className="space-y-2">
          <Textarea
            value={adminNotes[update.id] || ''}
            onChange={e => setAdminNotes(prev => ({ ...prev, [update.id]: e.target.value }))}
            placeholder="Admin notes (optional, visible to borrower if rejected)"
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2 flex-wrap">
            {update.status !== 'approved' && (
              <Button
                size="sm"
                onClick={() => handleReview(update.id, 'approved')}
                disabled={isActing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isActing ? 'Processing...' : 'Approve'}
              </Button>
            )}
            {update.status !== 'rejected' && (
              <Button
                size="sm"
                onClick={() => handleReview(update.id, 'rejected')}
                disabled={isActing}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isActing ? 'Processing...' : 'Reject'}
              </Button>
            )}
            {!isEditing && (
              <Button size="sm" variant="outline" onClick={() => startEdit(update)} disabled={isActing}>
                Edit Content
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(update.id)}
              disabled={isActing}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {updates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg font-medium">No updates posted yet</p>
          <p className="text-sm">Project updates submitted by the borrower will appear here for review.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                Pending Review
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">{pending.length}</span>
              </h3>
              {pending.map(renderUpdate)}
            </div>
          )}

          {approved.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                Approved
                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">{approved.length}</span>
              </h3>
              {approved.map(renderUpdate)}
            </div>
          )}

          {rejected.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                Rejected
                <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">{rejected.length}</span>
              </h3>
              {rejected.map(renderUpdate)}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminProjectUpdatesTab;
