// ─── Investor Suitability Assessment — Types & Scoring Logic ─────────────────
// Shared between frontend and backend. Pure functions, no side effects.

// ── Enums / Literals ──────────────────────────────────────────────────────────

export const EMPLOYMENT_OPTIONS = ['employed', 'self_employed', 'unemployed', 'retired', 'student'] as const;
export type EmploymentStatus = typeof EMPLOYMENT_OPTIONS[number];

export const INCOME_BANDS = ['below_250k', '250k_to_500k', '500k_to_1m', '1m_to_5m', 'above_5m'] as const;
export type IncomeBand = typeof INCOME_BANDS[number];

export const NET_WORTH_BANDS = ['below_500k', '500k_to_1m', '1m_to_5m', 'above_5m'] as const;
export type NetWorthBand = typeof NET_WORTH_BANDS[number];

export const LIQUIDITY_BANDS = ['below_100k', '100k_to_500k', 'above_500k'] as const;
export type LiquidityBand = typeof LIQUIDITY_BANDS[number];

export const INVESTMENT_GOALS = ['capital_preservation', 'regular_income', 'moderate_growth', 'high_growth_speculative'] as const;
export type InvestmentGoal = typeof INVESTMENT_GOALS[number];

export const INVESTMENT_HORIZONS = ['less_than_1_year', 'one_to_three_years', 'three_to_five_years', 'more_than_five_years'] as const;
export type InvestmentHorizon = typeof INVESTMENT_HORIZONS[number];

export const KNOWLEDGE_LEVELS = ['none', 'basic', 'intermediate', 'advanced'] as const;
export type KnowledgeLevel = typeof KNOWLEDGE_LEVELS[number];

export const EXPERIENCE_OPTIONS = [
  'bank_deposits', 'bonds', 'stocks', 'mutual_funds_or_uitf',
  'real_estate', 'private_placements_or_crowdfunding', 'crypto_or_alternatives', 'none'
] as const;
export type InvestmentExperience = typeof EXPERIENCE_OPTIONS[number];

export const LOSS_REACTIONS = ['sell_all', 'wait_and_monitor', 'invest_more'] as const;
export type LossReaction = typeof LOSS_REACTIONS[number];

export const HIGH_RISK_ALLOCATIONS = ['less_than_10_percent', 'ten_to_thirty_percent', 'over_30_percent'] as const;
export type HighRiskAllocation = typeof HIGH_RISK_ALLOCATIONS[number];

export const RISK_COMFORT_OPTIONS = ['guaranteed_low_returns', 'moderate_fluctuations_for_growth', 'comfortable_with_losses_for_high_returns'] as const;
export type RiskComfort = typeof RISK_COMFORT_OPTIONS[number];

export const RISK_PROFILES = ['conservative', 'moderate', 'aggressive'] as const;
export type RiskProfile = typeof RISK_PROFILES[number];

// ── Assessment Data Shape ─────────────────────────────────────────────────────

export interface SuitabilityAnswers {
  // A. Personal (optional — may be prefilled from investor_profiles)
  full_name?: string;
  date_of_birth?: string;
  nationality?: string;
  government_id_or_tin?: string;
  address?: string;
  contact_number?: string;
  email?: string;

  // B. Employment & Financial
  employment_status: EmploymentStatus;
  occupation_or_business_type: string;
  gross_annual_income_band: IncomeBand;
  net_worth_band: NetWorthBand;
  liquidity_band: LiquidityBand;

  // C. Investment Objectives & Experience
  main_investment_goal: InvestmentGoal;
  investment_horizon: InvestmentHorizon;
  investment_knowledge_level: KnowledgeLevel;
  investment_experience: InvestmentExperience[];

  // D. Risk Tolerance
  reaction_to_loss: LossReaction;
  high_risk_allocation: HighRiskAllocation;
  risk_comfort_statement: RiskComfort;

  // E. Declaration
  declaration_accepted: boolean;
  risk_disclosure_accepted: boolean;
}

// ── Score Breakdown ───────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  income_score: number;
  net_worth_score: number;
  liquidity_score: number;
  knowledge_score: number;
  experience_score: number;
  primary_goal_score: number;
  horizon_score: number;
  reaction_score: number;
  allocation_score: number;
  risk_attitude_score: number;
  total_score: number;
  investor_risk_profile: RiskProfile;
}

// ── Full Assessment Record (from DB) ──────────────────────────────────────────

export interface SuitabilityAssessment extends SuitabilityAnswers, ScoreBreakdown {
  id: number;
  user_id: string;
  declaration_accepted_at: string | null;
  risk_disclosure_accepted_at: string | null;
  assessment_version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Scoring Tables ────────────────────────────────────────────────────────────

const INCOME_SCORE: Record<IncomeBand, number> = {
  below_250k: 2,
  '250k_to_500k': 4,
  '500k_to_1m': 6,
  '1m_to_5m': 8,
  above_5m: 10,
};

const NET_WORTH_SCORE: Record<NetWorthBand, number> = {
  below_500k: 4,
  '500k_to_1m': 6,
  '1m_to_5m': 8,
  above_5m: 10,
};

const LIQUIDITY_SCORE: Record<LiquidityBand, number> = {
  below_100k: 4,
  '100k_to_500k': 8,
  above_500k: 10,
};

const KNOWLEDGE_SCORE: Record<KnowledgeLevel, number> = {
  none: 1,
  basic: 6,
  intermediate: 8,
  advanced: 10,
};

const EXPERIENCE_SCORE: Record<InvestmentExperience, number> = {
  bank_deposits: 2,
  bonds: 3,
  stocks: 4,
  mutual_funds_or_uitf: 3,
  real_estate: 4,
  private_placements_or_crowdfunding: 4,
  crypto_or_alternatives: 3,
  none: 0,
};

const GOAL_SCORE: Record<InvestmentGoal, number> = {
  capital_preservation: 2,
  regular_income: 5,
  moderate_growth: 7,
  high_growth_speculative: 10,
};

const HORIZON_SCORE: Record<InvestmentHorizon, number> = {
  less_than_1_year: 2,
  one_to_three_years: 5,
  three_to_five_years: 8,
  more_than_five_years: 10,
};

const REACTION_SCORE: Record<LossReaction, number> = {
  sell_all: 2,
  wait_and_monitor: 6,
  invest_more: 10,
};

const ALLOCATION_SCORE: Record<HighRiskAllocation, number> = {
  less_than_10_percent: 2,
  ten_to_thirty_percent: 6,
  over_30_percent: 10,
};

const RISK_ATTITUDE_SCORE: Record<RiskComfort, number> = {
  guaranteed_low_returns: 2,
  moderate_fluctuations_for_growth: 6,
  comfortable_with_losses_for_high_returns: 10,
};

// ── Scoring Function ──────────────────────────────────────────────────────────

export function calculateSuitabilityScore(answers: SuitabilityAnswers): ScoreBreakdown {
  const income_score = INCOME_SCORE[answers.gross_annual_income_band] ?? 0;
  const net_worth_score = NET_WORTH_SCORE[answers.net_worth_band] ?? 0;
  const liquidity_score = LIQUIDITY_SCORE[answers.liquidity_band] ?? 0;
  const knowledge_score = KNOWLEDGE_SCORE[answers.investment_knowledge_level] ?? 0;

  // Cumulative experience, capped at 10
  const rawExperience = answers.investment_experience.reduce(
    (sum, exp) => sum + (EXPERIENCE_SCORE[exp] ?? 0), 0
  );
  const experience_score = Math.min(rawExperience, 10);

  const primary_goal_score = GOAL_SCORE[answers.main_investment_goal] ?? 0;
  const horizon_score = HORIZON_SCORE[answers.investment_horizon] ?? 0;
  const reaction_score = REACTION_SCORE[answers.reaction_to_loss] ?? 0;
  const allocation_score = ALLOCATION_SCORE[answers.high_risk_allocation] ?? 0;
  const risk_attitude_score = RISK_ATTITUDE_SCORE[answers.risk_comfort_statement] ?? 0;

  const total_score =
    income_score + net_worth_score + liquidity_score +
    knowledge_score + experience_score +
    primary_goal_score + horizon_score +
    reaction_score + allocation_score + risk_attitude_score;

  const investor_risk_profile: RiskProfile =
    total_score <= 40 ? 'conservative' :
    total_score <= 70 ? 'moderate' :
    'aggressive';

  return {
    income_score,
    net_worth_score,
    liquidity_score,
    knowledge_score,
    experience_score,
    primary_goal_score,
    horizon_score,
    reaction_score,
    allocation_score,
    risk_attitude_score,
    total_score,
    investor_risk_profile,
  };
}

// ── Eligibility Checker ───────────────────────────────────────────────────────

export interface CampaignSuitabilityInfo {
  type: 'debt' | 'equity' | 'lending' | 'donation' | 'rewards';
  riskLevel?: 'low' | 'medium' | 'high';
  tenorMonths?: number; // duration in months; ≤12 = 1 year
}

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

export function checkCampaignEligibility(
  profile: RiskProfile,
  campaign: CampaignSuitabilityInfo
): EligibilityResult {
  // Donation & rewards are always allowed
  if (campaign.type === 'donation' || campaign.type === 'rewards') {
    return { eligible: true };
  }

  const risk = campaign.riskLevel || 'medium';
  const isDebt = campaign.type === 'debt' || campaign.type === 'lending';
  const isEquity = campaign.type === 'equity';
  const tenor = campaign.tenorMonths ?? 12;

  if (profile === 'aggressive') {
    return { eligible: true };
  }

  if (profile === 'moderate') {
    // All debt OK
    if (isDebt) return { eligible: true };
    // Equity: only low or medium risk
    if (isEquity) {
      if (risk === 'high') {
        return { eligible: false, reason: 'Your Moderate risk profile does not allow investment in high-risk equity campaigns.' };
      }
      return { eligible: true };
    }
  }

  if (profile === 'conservative') {
    // No equity at all
    if (isEquity) {
      return { eligible: false, reason: 'Your Conservative risk profile does not allow investment in equity campaigns.' };
    }
    // Debt: only low/medium risk AND tenor ≤ 12 months
    if (isDebt) {
      if (risk === 'high') {
        return { eligible: false, reason: 'Your Conservative risk profile does not allow investment in high-risk debt campaigns.' };
      }
      if (tenor > 12) {
        return { eligible: false, reason: 'Your Conservative risk profile only allows debt campaigns with a tenor of 1 year or less.' };
      }
      return { eligible: true };
    }
  }

  return { eligible: true };
}

// ── Label Helpers ─────────────────────────────────────────────────────────────

export const PROFILE_LABELS: Record<RiskProfile, { label: string; color: string; bg: string; border: string; description: string }> = {
  conservative: {
    label: 'Conservative',
    color: '#1D4ED8',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    description: 'Capital preservation focus. Can invest in low–medium risk debt campaigns (≤1 year tenor).',
  },
  moderate: {
    label: 'Moderate',
    color: '#B45309',
    bg: '#FFFBEB',
    border: '#FDE68A',
    description: 'Balanced risk–return. Can invest in all debt campaigns and low–medium risk equity campaigns.',
  },
  aggressive: {
    label: 'Aggressive',
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
    description: 'High risk tolerance. Can invest in all debt and equity campaigns.',
  },
};

export const INCOME_LABELS: Record<IncomeBand, string> = {
  below_250k: 'Below ₱250,000',
  '250k_to_500k': '₱250,000 – ₱500,000',
  '500k_to_1m': '₱500,001 – ₱1,000,000',
  '1m_to_5m': '₱1,000,001 – ₱5,000,000',
  above_5m: 'Over ₱5,000,000',
};

export const NET_WORTH_LABELS: Record<NetWorthBand, string> = {
  below_500k: 'Below ₱500,000',
  '500k_to_1m': '₱500,000 – ₱1,000,000',
  '1m_to_5m': '₱1,000,001 – ₱5,000,000',
  above_5m: 'Above ₱5,000,000',
};

export const LIQUIDITY_LABELS: Record<LiquidityBand, string> = {
  below_100k: 'Below ₱100,000',
  '100k_to_500k': '₱100,000 – ₱500,000',
  above_500k: 'Over ₱500,000',
};

export const GOAL_LABELS: Record<InvestmentGoal, string> = {
  capital_preservation: 'Capital preservation',
  regular_income: 'Regular income',
  moderate_growth: 'Moderate growth',
  high_growth_speculative: 'High growth / speculative returns',
};

export const HORIZON_LABELS: Record<InvestmentHorizon, string> = {
  less_than_1_year: 'Less than 1 year',
  one_to_three_years: '1 – 3 years',
  three_to_five_years: '3 – 5 years',
  more_than_five_years: 'More than 5 years',
};

export const KNOWLEDGE_LABELS: Record<KnowledgeLevel, string> = {
  none: 'None',
  basic: 'Basic',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const EXPERIENCE_LABELS: Record<InvestmentExperience, string> = {
  bank_deposits: 'Bank Deposits / Time Deposits',
  bonds: 'Bonds',
  stocks: 'Stocks',
  mutual_funds_or_uitf: 'Mutual Funds / UITFs',
  real_estate: 'Real Estate',
  private_placements_or_crowdfunding: 'Private Placements / Crowdfunding',
  crypto_or_alternatives: 'Crypto / Alternatives',
  none: 'None',
};

export const LOSS_REACTION_LABELS: Record<LossReaction, string> = {
  sell_all: 'Sell all to prevent further loss',
  wait_and_monitor: 'Wait and monitor recovery',
  invest_more: 'Invest more to buy at lower prices',
};

export const ALLOCATION_LABELS: Record<HighRiskAllocation, string> = {
  less_than_10_percent: 'Less than 10%',
  ten_to_thirty_percent: '10 – 30%',
  over_30_percent: 'Over 30%',
};

export const RISK_COMFORT_LABELS: Record<RiskComfort, string> = {
  guaranteed_low_returns: 'I prefer guaranteed returns, even if they are low.',
  moderate_fluctuations_for_growth: 'I can accept moderate fluctuations in exchange for growth.',
  comfortable_with_losses_for_high_returns: "I'm comfortable with losses in pursuit of high returns.",
};

export const EMPLOYMENT_LABELS: Record<EmploymentStatus, string> = {
  employed: 'Employed',
  self_employed: 'Self-employed',
  unemployed: 'Unemployed',
  retired: 'Retired',
  student: 'Student',
};

export const ASSESSMENT_VERSION = '1.0';
export const REASSESSMENT_MONTHS = 12;
