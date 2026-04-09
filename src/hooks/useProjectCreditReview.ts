import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';
import type { ProjectCreditReview } from '../lib/projectCreditRisk';

interface IssuerSnapshot {
  issuer_id: string | null;
  issuer_name: string | null;
  issuer_score: number | null;
  issuer_risk_bucket: string | null;
  issuer_rating: string | null;
  scoring_date: string | null;
  scoring_source: string | null;
}

interface ProjectContext {
  project_id: number;
  project_name: string;
  project_type: string | null;
  status: string | null;
  approval_status: string | null;
  facility_amount: number | null;
  tenor_raw: string | null;
}

interface CreditReviewData {
  issuerSnapshot: IssuerSnapshot;
  projectContext: ProjectContext;
  creditReview: ProjectCreditReview | null;
}

export function useProjectCreditReview(projectId: string | undefined) {
  const [data, setData] = useState<CreditReviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReview = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await authFetch(`${API_BASE_URL}/admin/projects/${projectId}/credit-review`);
      if (result?.success) {
        setData({
          issuerSnapshot: result.issuerSnapshot,
          projectContext: result.projectContext,
          creditReview: result.creditReview,
        });
      } else {
        setError(result?.error || 'Failed to load credit review');
      }
    } catch (err: any) {
      console.error('Error fetching credit review:', err);
      setError(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  const saveDraft = useCallback(async (payload: Partial<ProjectCreditReview>) => {
    if (!projectId) throw new Error('No project ID');
    const result = await authFetch(`${API_BASE_URL}/admin/projects/${projectId}/credit-review`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, review_status: 'draft' }),
    });
    if (result?.success) {
      setData(prev => prev ? { ...prev, creditReview: result.creditReview } : prev);
    }
    return result;
  }, [projectId]);

  const finalize = useCallback(async (payload: Partial<ProjectCreditReview>) => {
    if (!projectId) throw new Error('No project ID');
    const result = await authFetch(`${API_BASE_URL}/admin/projects/${projectId}/credit-review`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, review_status: 'finalized' }),
    });
    if (result?.success) {
      setData(prev => prev ? { ...prev, creditReview: result.creditReview } : prev);
    }
    return result;
  }, [projectId]);

  return { data, loading, error, refetch: fetchReview, saveDraft, finalize };
}
