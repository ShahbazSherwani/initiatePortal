import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'react-hot-toast';
import { useProjectCreditReview } from '../hooks/useProjectCreditReview';
import {
  TENOR_OPTIONS,
  TRACK_RECORD_OPTIONS,
  RISK_BUCKETS,
  computeDebtProjectScore,
  computeFinalCampaignRisk,
  normalizeRiskBucket,
  SCORING_VERSION,
  type RiskBucket,
  type CampaignType,
  type TenorOption,
  type TrackRecordOption,
} from '../lib/projectCreditRisk';

// ── Risk badge ────────────────────────────────────────────────────────────────

const riskColors: Record<RiskBucket, { bg: string; text: string; border: string }> = {
  low:    { bg: 'bg-green-50',  text: 'text-green-800',  border: 'border-green-200' },
  medium: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
  high:   { bg: 'bg-red-50',   text: 'text-red-800',   border: 'border-red-200' },
};

function RiskBadge({ bucket, label }: { bucket: RiskBucket | null; label?: string }) {
  if (!bucket) return <span className="text-gray-400 text-sm italic">Not assessed</span>;
  const c = riskColors[bucket];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-2 h-2 rounded-full ${bucket === 'low' ? 'bg-green-500' : bucket === 'medium' ? 'bg-yellow-500' : 'bg-red-500'}`} />
      {label || `${bucket.charAt(0).toUpperCase() + bucket.slice(1)} Risk`}
    </span>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-lg p-5 bg-white mb-5">
      <h3 className="text-base font-semibold text-gray-800 mb-4 border-b pb-2">{title}</h3>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface CreditRiskReviewTabProps {
  projectId: string;
}

export const CreditRiskReviewTab: React.FC<CreditRiskReviewTabProps> = ({ projectId }) => {
  const { data, loading, error, saveDraft, finalize } = useProjectCreditReview(projectId);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [campaignType, setCampaignType] = useState<CampaignType>('debt');
  const [facilityAmount, setFacilityAmount] = useState('');
  const [tenorValue, setTenorValue] = useState('');
  const [tenorUnit, setTenorUnit] = useState('months');
  const [gracePeriodValue, setGracePeriodValue] = useState('');
  const [gracePeriodUnit, setGracePeriodUnit] = useState('months');
  const [tenorScoreOption, setTenorScoreOption] = useState<TenorOption | ''>('');
  const [trackRecordCategory, setTrackRecordCategory] = useState<TrackRecordOption | ''>('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isOverride, setIsOverride] = useState(false);
  const [overrideBucket, setOverrideBucket] = useState<RiskBucket>('medium');
  const [overrideReason, setOverrideReason] = useState('');
  const [saving, setSaving] = useState(false);

  const isFinalized = data?.creditReview?.review_status === 'finalized';

  // ── Hydrate form from existing review ───────────────────────────────────────
  useEffect(() => {
    if (!data) return;

    const ctx = data.projectContext;
    const r = data.creditReview;

    // Infer campaign type from project
    const inferredType: CampaignType =
      r?.campaign_type ||
      (ctx.project_type === 'lending' || ctx.project_type === 'debt' ? 'debt' : 'equity');
    setCampaignType(inferredType);

    if (r) {
      setFacilityAmount(r.facility_amount?.toString() || ctx.facility_amount?.toString() || '');
      setTenorValue(r.tenor_value?.toString() || '');
      setTenorUnit(r.tenor_unit || 'months');
      setGracePeriodValue(r.grace_period_value?.toString() || '');
      setGracePeriodUnit(r.grace_period_unit || 'months');
      setTenorScoreOption((r.tenor_score_option as TenorOption) || '');
      setTrackRecordCategory((r.track_record_category as TrackRecordOption) || '');
      setReviewerNotes(r.reviewer_notes || '');
      setIsOverride(r.is_override || false);
      setOverrideBucket(r.is_override && r.final_campaign_risk_bucket ? normalizeRiskBucket(r.final_campaign_risk_bucket) : 'medium');
      setOverrideReason(r.override_reason || '');
    } else {
      setFacilityAmount(ctx.facility_amount?.toString() || '');
    }
  }, [data]);

  // ── Computed scoring ────────────────────────────────────────────────────────
  const debtScore = useMemo(() => {
    if (campaignType !== 'debt' || !tenorScoreOption || !trackRecordCategory) return null;
    return computeDebtProjectScore(tenorScoreOption as TenorOption, trackRecordCategory as TrackRecordOption);
  }, [campaignType, tenorScoreOption, trackRecordCategory]);

  const issuerRiskBucket = data?.issuerSnapshot?.issuer_risk_bucket
    ? normalizeRiskBucket(data.issuerSnapshot.issuer_risk_bucket)
    : null;

  const projectRiskBucket: RiskBucket | null = campaignType === 'debt' ? (debtScore?.riskBucket ?? null) : null;

  const finalBucket = useMemo(() => {
    return computeFinalCampaignRisk({
      campaignType,
      issuerRiskBucket,
      projectRiskBucket,
      isOverride,
      overrideBucket: isOverride ? overrideBucket : undefined,
    });
  }, [campaignType, issuerRiskBucket, projectRiskBucket, isOverride, overrideBucket]);

  // ── Build payload ───────────────────────────────────────────────────────────
  function buildPayload() {
    return {
      issuer_id: data?.issuerSnapshot?.issuer_id,
      issuer_score_snapshot: data?.issuerSnapshot?.issuer_score ?? null,
      issuer_risk_bucket_snapshot: (data?.issuerSnapshot?.issuer_risk_bucket as RiskBucket) ?? null,
      issuer_rating_snapshot: data?.issuerSnapshot?.issuer_rating ?? null,
      campaign_type: campaignType,
      facility_amount: facilityAmount ? parseFloat(facilityAmount) : null,
      tenor_value: tenorValue ? parseFloat(tenorValue) : null,
      tenor_unit: tenorUnit,
      grace_period_value: gracePeriodValue ? parseFloat(gracePeriodValue) : null,
      grace_period_unit: gracePeriodUnit,
      tenor_score_option: tenorScoreOption || null,
      tenor_score: debtScore?.tenorPoints ?? null,
      track_record_category: trackRecordCategory || null,
      track_record_score: debtScore?.trackRecordPoints ?? null,
      project_credit_score: debtScore?.totalScore ?? null,
      project_risk_bucket: projectRiskBucket,
      final_campaign_risk_bucket: finalBucket,
      is_override: isOverride,
      override_reason: isOverride ? overrideReason : null,
      reviewer_notes: reviewerNotes,
      scoring_version: SCORING_VERSION,
    };
  }

  async function handleSaveDraft() {
    setSaving(true);
    try {
      const result = await saveDraft(buildPayload());
      if (result?.success) {
        toast.success('Credit review draft saved');
      } else {
        toast.error(result?.error || 'Failed to save draft');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error saving draft');
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalize() {
    if (isOverride && !overrideReason.trim()) {
      toast.error('Override reason is required');
      return;
    }
    if (campaignType === 'debt' && (!tenorScoreOption || !trackRecordCategory)) {
      toast.error('Tenor and track record scoring are required for debt campaigns');
      return;
    }

    setSaving(true);
    try {
      const result = await finalize(buildPayload());
      if (result?.success) {
        toast.success('Credit review finalized');
      } else {
        toast.error(result?.error || 'Failed to finalize');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error finalizing review');
    } finally {
      setSaving(false);
    }
  }

  // ── Loading / error states ──────────────────────────────────────────────────
  if (loading) {
    return <div className="p-6 text-gray-500">Loading credit review data...</div>;
  }
  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load credit review: {error}
        </div>
      </div>
    );
  }
  if (!data) return null;

  const { issuerSnapshot } = data;

  return (
    <div className="space-y-0">
      {/* Finalized banner */}
      {isFinalized && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 mb-5 text-sm text-green-700 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          This credit review has been finalized{data.creditReview?.reviewed_at ? ` on ${new Date(data.creditReview.reviewed_at).toLocaleDateString()}` : ''}.
        </div>
      )}

      {/* ── SECTION A: Issuer Risk Snapshot ──────────────────────────────────── */}
      <Section title="A — Issuer Risk Snapshot">
        {!issuerSnapshot.issuer_score && !issuerSnapshot.issuer_risk_bucket ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
            No issuer credit score is available for this project. You may proceed with the project-level assessment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Issuer</p>
              <p className="font-medium">{issuerSnapshot.issuer_name || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Issuer Score</p>
              <p className="font-medium">{issuerSnapshot.issuer_score ?? '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Issuer Risk Bucket</p>
              <RiskBadge bucket={issuerSnapshot.issuer_risk_bucket as RiskBucket | null} />
            </div>
            {issuerSnapshot.issuer_rating && (
              <div>
                <p className="text-gray-500">Rating</p>
                <p className="font-medium">{issuerSnapshot.issuer_rating}</p>
              </div>
            )}
            {issuerSnapshot.scoring_date && (
              <div>
                <p className="text-gray-500">Scored On</p>
                <p className="font-medium">{new Date(issuerSnapshot.scoring_date).toLocaleDateString()}</p>
              </div>
            )}
            {issuerSnapshot.scoring_source && (
              <div>
                <p className="text-gray-500">Source</p>
                <p className="font-medium">{issuerSnapshot.scoring_source}</p>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ── SECTION B: Project / Facility Risk Assessment ────────────────────── */}
      <Section title="B — Project / Facility Risk Assessment">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Campaign type */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Campaign Type *</label>
            <select
              value={campaignType}
              onChange={e => setCampaignType(e.target.value as CampaignType)}
              disabled={isFinalized}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
            >
              <option value="debt">Debt</option>
              <option value="equity">Equity</option>
            </select>
          </div>

          {/* Facility amount */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Facility Amount</label>
            <input
              type="number"
              value={facilityAmount}
              onChange={e => setFacilityAmount(e.target.value)}
              disabled={isFinalized}
              placeholder="e.g. 5000000"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </div>

          {/* Tenor */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Tenor Value</label>
            <input
              type="number"
              value={tenorValue}
              onChange={e => setTenorValue(e.target.value)}
              disabled={isFinalized}
              placeholder="e.g. 12"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Tenor Unit</label>
            <select
              value={tenorUnit}
              onChange={e => setTenorUnit(e.target.value)}
              disabled={isFinalized}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
            >
              <option value="days">Days</option>
              <option value="months">Months</option>
              <option value="years">Years</option>
            </select>
          </div>

          {/* Grace period */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Grace Period (optional)</label>
            <input
              type="number"
              value={gracePeriodValue}
              onChange={e => setGracePeriodValue(e.target.value)}
              disabled={isFinalized}
              placeholder="e.g. 3"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Grace Period Unit</label>
            <select
              value={gracePeriodUnit}
              onChange={e => setGracePeriodUnit(e.target.value)}
              disabled={isFinalized}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
            >
              <option value="days">Days</option>
              <option value="months">Months</option>
              <option value="years">Years</option>
            </select>
          </div>
        </div>

        {/* Debt-specific scoring controls */}
        {campaignType === 'debt' && (
          <div className="border-t pt-4 mt-2 space-y-4">
            <h4 className="text-sm font-semibold text-gray-700">Debt Scoring Factors</h4>

            {/* Tenor scoring */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tenor / Facility Duration Score *</label>
              <select
                value={tenorScoreOption}
                onChange={e => setTenorScoreOption(e.target.value as TenorOption)}
                disabled={isFinalized}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
              >
                <option value="">Select tenor bracket…</option>
                {TENOR_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label} — {o.points} pt{o.points !== 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Track record */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Issuer Track Record *</label>
              <select
                value={trackRecordCategory}
                onChange={e => setTrackRecordCategory(e.target.value as TrackRecordOption)}
                disabled={isFinalized}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
              >
                <option value="">Select track record…</option>
                {TRACK_RECORD_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label} — {o.points} pt{o.points !== 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Score preview */}
            {debtScore && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tenor Points</span>
                  <span className="font-medium">{debtScore.tenorPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Track Record Points</span>
                  <span className="font-medium">{debtScore.trackRecordPoints}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 font-semibold">Total Score</span>
                  <span className="font-bold">{debtScore.totalScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Project Risk Bucket</span>
                  <RiskBadge bucket={debtScore.riskBucket} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Equity note */}
        {campaignType === 'equity' && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700 mt-2">
            For equity campaigns, the final campaign risk defaults to the issuer risk bucket. Use the override below if adjustment is needed.
          </div>
        )}

        {/* Reviewer notes */}
        <div className="mt-4">
          <label className="block text-sm text-gray-600 mb-1">Project Review Notes</label>
          <Textarea
            value={reviewerNotes}
            onChange={e => setReviewerNotes(e.target.value)}
            disabled={isFinalized}
            placeholder="Additional observations about this project/facility…"
            className="h-24"
          />
        </div>
      </Section>

      {/* ── SECTION C: Final Campaign Risk Decision ──────────────────────────── */}
      <Section title="C — Final Campaign Risk Decision">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Issuer Risk Bucket</p>
            <RiskBadge bucket={issuerRiskBucket} />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Project Risk Bucket</p>
            <RiskBadge bucket={projectRiskBucket} />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Final Campaign Risk</p>
            <RiskBadge bucket={finalBucket} label={`${finalBucket.charAt(0).toUpperCase() + finalBucket.slice(1)} Risk${isOverride ? ' (Override)' : ''}`} />
          </div>
        </div>

        {/* Override toggle */}
        <div className="border-t pt-4 mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isOverride}
              onChange={e => setIsOverride(e.target.checked)}
              disabled={isFinalized}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Override final risk bucket</span>
          </label>

          {isOverride && (
            <div className="mt-3 space-y-3 pl-6">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Override Bucket *</label>
                <select
                  value={overrideBucket}
                  onChange={e => setOverrideBucket(e.target.value as RiskBucket)}
                  disabled={isFinalized}
                  className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                >
                  {RISK_BUCKETS.map(b => (
                    <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)} Risk</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Override Reason *</label>
                <Textarea
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  disabled={isFinalized}
                  placeholder="Justify why the override is necessary…"
                  className="h-20"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!isFinalized && (
          <div className="flex gap-3 mt-6 border-t pt-4">
            <Button
              onClick={handleSaveDraft}
              disabled={saving}
              variant="outline"
              className="px-6"
            >
              {saving ? 'Saving…' : 'Save Draft'}
            </Button>
            <Button
              onClick={handleFinalize}
              disabled={saving}
              className="bg-[#0C4B20] hover:bg-[#0A3D1A] text-white px-6"
            >
              {saving ? 'Finalizing…' : 'Finalize Review'}
            </Button>
          </div>
        )}

        {/* Scoring version / audit footer */}
        <div className="text-xs text-gray-400 mt-4 flex gap-4">
          <span>Scoring v{data.creditReview?.scoring_version || SCORING_VERSION}</span>
          {data.creditReview?.reviewed_by && (
            <span>Reviewed by: {data.creditReview.reviewed_by}</span>
          )}
        </div>
      </Section>
    </div>
  );
};

export default CreditRiskReviewTab;
