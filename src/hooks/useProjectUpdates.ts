import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';

export interface ProjectUpdate {
  id: number;
  project_id: number;
  author_uid: string;
  author_name: string;
  author_role: string;
  title: string;
  content: string;
  attachments: Array<{ url: string; caption?: string }>;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UseProjectUpdatesResult {
  updates: ProjectUpdate[];
  loading: boolean;
  error: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  refetch: () => Promise<void>;
  postUpdate: (data: { title: string; content: string; attachments: Array<{ url: string; caption?: string }> }) => Promise<{ success: boolean; error?: string }>;
  editUpdate: (updateId: number, data: { title: string; content: string; attachments: Array<{ url: string; caption?: string }> }) => Promise<{ success: boolean; error?: string }>;
}

export function useProjectUpdates(projectId: string | number | undefined): UseProjectUpdatesResult {
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchUpdates = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await authFetch(`${API_BASE_URL}/projects/${projectId}/updates`);
      if (data?.success) {
        setUpdates(data.updates || []);
        setIsOwner(data.isOwner || false);
        setIsAdmin(data.isAdmin || false);
      } else {
        setError(data?.error || 'Failed to fetch updates');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch updates');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  const postUpdate = useCallback(async (data: { title: string; content: string; attachments: Array<{ url: string; caption?: string }> }) => {
    if (!projectId) return { success: false, error: 'No project ID' };
    try {
      const result = await authFetch(`${API_BASE_URL}/projects/${projectId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (result?.success) {
        await fetchUpdates();
        return { success: true };
      }
      return { success: false, error: result?.error || 'Failed to post update' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to post update' };
    }
  }, [projectId, fetchUpdates]);

  const editUpdate = useCallback(async (updateId: number, data: { title: string; content: string; attachments: Array<{ url: string; caption?: string }> }) => {
    if (!projectId) return { success: false, error: 'No project ID' };
    try {
      const result = await authFetch(`${API_BASE_URL}/projects/${projectId}/updates/${updateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (result?.success) {
        await fetchUpdates();
        return { success: true };
      }
      return { success: false, error: result?.error || 'Failed to edit update' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to edit update' };
    }
  }, [projectId, fetchUpdates]);

  return { updates, loading, error, isOwner, isAdmin, refetch: fetchUpdates, postUpdate, editUpdate };
}
