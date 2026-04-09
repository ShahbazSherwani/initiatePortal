// ─── Project-Level Credit Risk Assessment — Types & Scoring Logic ────────────
// Shared between frontend and backend. Pure functions, no side effects.
// This is SEPARATE from issuer scoring — it evaluates the project/facility risk.

// ── Risk Bucket ───────────────────────────────────────────────────────────────

export const RISK_BUCKETS = ['low', 'medium', 'high'] as const;
export type RiskBucket = typeof RISK_BUCKETS[number];

const RISK_SEVERITY: Record<RiskBucket, number> = { low: 0, medium: 1, high: 2 };

/** Normalize a loose string into a valid RiskBucket (defaults to 'high'). */
export function normalizeRiskBucket(value: string | null | undefined): RiskBucket {
  if (!value) return 'high';
  const v = value.trim().toLowerCase();
  if (v === 'low' || v === 'medium' || v === 'high') return v;
  return 'high';
}

/** Compare two buckets by severity. Returns positive if a > b, negative if a < b, 0 if equal. */
export function compareRiskSeverity(a: RiskBucket, b: RiskBucket): number {
  return RISK_SEVERITY[a] - RISK_SEVERITY[b];
}

/** Return the worst (highest severity) of two risk buckets. */
export function getWorstRiskBucket(a: RiskBucket, b: RiskBucket): RiskBucket {
  return RISK_SEVERITY[a] >= RISK_SEVERITY[b] ? a : b;
}

// ── Campaign Type ─────────────────────────────────────────────────────────────

export const CAMPAIGN_TYPES = ['debt', 'equity'] as const;
export type CampaignType = typeof CAMPAIGN_TYPES[number];

// ── Tenor Scoring ─────────────────────────────────────────────────────────────

export const TENOR_OPTIONS = [
  { label: '90 days or less', value: '90d_or_less', points: 1 },
  { label: 'Over 90 days to 180 days', value: '91d_to_180d', points: 2 },
  { label: 'Over 180 days to 1 year', value: '181d_to_1y', points: 3 },
  { label: 'Over 1 year up to 2 years', value: '1y_to_2y', points: 4 },
  { label: 'Over 1.5 years up to 3 years', value: '1_5y_to_3y', points: 5 },
  { label: 'Over 3 years with grace period of 1 year or less', value: '3y_gp_1y', points: 6 },
  { label: 'Over 4 years with grace period of over 1 year', value: '4y_gp_over_1y', points: 7 },
] as const;

export type TenorOption = typeof TENOR_OPTIONS[number]['value'];

// ── Track Record Scoring ──────────────────────────────────────────────────────

export const TRACK_RECORD_OPTIONS = [
  { label: 'Multiple successful campaigns and no delays/defaults', value: 'strong', points: 1 },
  { label: '1–2 successful campaigns and strong transaction volume', value: 'good', points: 2 },
  { label: 'Completed campaigns with minor delays', value: 'fair', points: 3 },
  { label: 'New issuer with no track record', value: 'none', points: 4 },
] as const;

export type TrackRecordOption = typeof TRACK_RECORD_OPTIONS[number]['value'];

// ── Debt Project Scoring ──────────────────────────────────────────────────────

export function getTenorPoints(option: TenorOption): number {
  return TENOR_OPTIONS.find(o => o.value === option)?.points ?? 0;
}

export function getTrackRecordPoints(option: TrackRecordOption): number {
  return TRACK_RECORD_OPTIONS.find(o => o.value === option)?.points ?? 0;
}

/**
 * Compute composite project credit score for debt campaigns.
 * Score range: 2 (best) to 11 (worst).
 * 
 * Thresholds:
 *   low    = total <= 4
 *   medium = total <= 7
 *   high   = total > 7
 */
export function computeDebtProjectScore(
  tenorOption: TenorOption,
  trackRecordOption: TrackRecordOption
): { tenorPoints: number; trackRecordPoints: number; totalScore: number; riskBucket: RiskBucket } {
  const tenorPoints = getTenorPoints(tenorOption);
  const trackRecordPoints = getTrackRecordPoints(trackRecordOption);
  const totalScore = tenorPoints + trackRecordPoints;

  let riskBucket: RiskBucket;
  if (totalScore <= 4) riskBucket = 'low';
  else if (totalScore <= 7) riskBucket = 'medium';
  else riskBucket = 'high';

  return { tenorPoints, trackRecordPoints, totalScore, riskBucket };
}

// ── Final Campaign Risk ───────────────────────────────────────────────────────

export interface FinalCampaignRiskInput {
  campaignType: CampaignType;
  issuerRiskBucket: RiskBucket | null;
  projectRiskBucket: RiskBucket | null;
  isOverride: boolean;
  overrideBucket?: RiskBucket;
}

/**
 * Compute the final campaign risk bucket.
 * - Debt: worst-case of issuer + project buckets.
 * - Equity: defaults to issuer bucket; admin may override.
 * - If override is active, the override bucket wins.
 */
export function computeFinalCampaignRisk(input: FinalCampaignRiskInput): RiskBucket {
  if (input.isOverride && input.overrideBucket) {
    return input.overrideBucket;
  }

  const issuer = input.issuerRiskBucket ? normalizeRiskBucket(input.issuerRiskBucket) : null;
  const project = input.projectRiskBucket ? normalizeRiskBucket(input.projectRiskBucket) : null;

  if (input.campaignType === 'equity') {
    // Equity defaults to issuer, fallback to project or 'high'
    return issuer ?? project ?? 'high';
  }

  // Debt: worst-case rule
  if (issuer && project) return getWorstRiskBucket(issuer, project);
  return issuer ?? project ?? 'high';
}

// ── Review Status ─────────────────────────────────────────────────────────────

export const REVIEW_STATUSES = ['draft', 'finalized'] as const;
export type ReviewStatus = typeof REVIEW_STATUSES[number];

// ── Scoring Version ───────────────────────────────────────────────────────────

export const SCORING_VERSION = '1.0.0';

// ── Full Review Shape ─────────────────────────────────────────────────────────

export interface ProjectCreditReview {
  id?: number;
  project_id: number;
  issuer_id?: string | null;
  issuer_score_snapshot?: number | null;
  issuer_risk_bucket_snapshot?: RiskBucket | null;
  issuer_rating_snapshot?: string | null;
  campaign_type: CampaignType;
  facility_amount?: number | null;
  tenor_value?: number | null;
  tenor_unit?: string | null;
  grace_period_value?: number | null;
  grace_period_unit?: string | null;
  tenor_score_option?: TenorOption | null;
  tenor_score?: number | null;
  track_record_category?: TrackRecordOption | null;
  track_record_score?: number | null;
  project_credit_score?: number | null;
  project_risk_bucket?: RiskBucket | null;
  final_campaign_risk_bucket: RiskBucket;
  is_override: boolean;
  override_reason?: string | null;
  reviewer_notes?: string | null;
  review_status: ReviewStatus;
  scoring_version: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}
