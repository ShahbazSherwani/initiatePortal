// Tests for project credit risk scoring helpers
// Run: npx vitest run src/lib/__tests__/projectCreditRisk.test.js

import { describe, it, expect } from 'vitest';
import {
  normalizeRiskBucket,
  compareRiskSeverity,
  getWorstRiskBucket,
  computeDebtProjectScore,
  computeFinalCampaignRisk,
} from '../projectCreditRisk.ts';

// ── normalizeRiskBucket ─────────────────────────────────────────────────────

describe('normalizeRiskBucket', () => {
  it('returns low for "low"', () => expect(normalizeRiskBucket('low')).toBe('low'));
  it('is case-insensitive', () => expect(normalizeRiskBucket('MEDIUM')).toBe('medium'));
  it('handles "High"', () => expect(normalizeRiskBucket('High')).toBe('high'));
  it('defaults null to high', () => expect(normalizeRiskBucket(null)).toBe('high'));
  it('defaults undefined to high', () => expect(normalizeRiskBucket(undefined)).toBe('high'));
  it('defaults invalid to high', () => expect(normalizeRiskBucket('invalid')).toBe('high'));
  it('trims whitespace', () => expect(normalizeRiskBucket('  low  ')).toBe('low'));
});

// ── compareRiskSeverity ─────────────────────────────────────────────────────

describe('compareRiskSeverity', () => {
  it('low == low', () => expect(compareRiskSeverity('low', 'low')).toBe(0));
  it('medium > low', () => expect(compareRiskSeverity('medium', 'low')).toBeGreaterThan(0));
  it('high > medium', () => expect(compareRiskSeverity('high', 'medium')).toBeGreaterThan(0));
  it('low < high', () => expect(compareRiskSeverity('low', 'high')).toBeLessThan(0));
});

// ── getWorstRiskBucket ──────────────────────────────────────────────────────

describe('getWorstRiskBucket', () => {
  it('low + low = low', () => expect(getWorstRiskBucket('low', 'low')).toBe('low'));
  it('low + medium = medium', () => expect(getWorstRiskBucket('low', 'medium')).toBe('medium'));
  it('medium + low = medium', () => expect(getWorstRiskBucket('medium', 'low')).toBe('medium'));
  it('low + high = high', () => expect(getWorstRiskBucket('low', 'high')).toBe('high'));
  it('high + low = high', () => expect(getWorstRiskBucket('high', 'low')).toBe('high'));
  it('medium + high = high', () => expect(getWorstRiskBucket('medium', 'high')).toBe('high'));
  it('high + high = high', () => expect(getWorstRiskBucket('high', 'high')).toBe('high'));
});

// ── computeDebtProjectScore ─────────────────────────────────────────────────

describe('computeDebtProjectScore', () => {
  it('90d + strong = low (score 2)', () => {
    const r = computeDebtProjectScore('90d_or_less', 'strong');
    expect(r.tenorPoints).toBe(1);
    expect(r.trackRecordPoints).toBe(1);
    expect(r.totalScore).toBe(2);
    expect(r.riskBucket).toBe('low');
  });

  it('1y_to_2y + fair = medium (score 7)', () => {
    const r = computeDebtProjectScore('1y_to_2y', 'fair');
    expect(r.totalScore).toBe(7);
    expect(r.riskBucket).toBe('medium');
  });

  it('4y_gp_over_1y + none = high (score 11)', () => {
    const r = computeDebtProjectScore('4y_gp_over_1y', 'none');
    expect(r.totalScore).toBe(11);
    expect(r.riskBucket).toBe('high');
  });

  it('181d_to_1y + good = medium (score 5)', () => {
    const r = computeDebtProjectScore('181d_to_1y', 'good');
    expect(r.totalScore).toBe(5);
    expect(r.riskBucket).toBe('medium');
  });

  it('boundary: score 4 = low', () => {
    const r = computeDebtProjectScore('91d_to_180d', 'good'); // 2+2=4
    expect(r.totalScore).toBe(4);
    expect(r.riskBucket).toBe('low');
  });

  it('boundary: score 8 = high', () => {
    const r = computeDebtProjectScore('1_5y_to_3y', 'fair'); // 5+3=8
    expect(r.totalScore).toBe(8);
    expect(r.riskBucket).toBe('high');
  });
});

// ── computeFinalCampaignRisk ────────────────────────────────────────────────

describe('computeFinalCampaignRisk — debt worst-case', () => {
  it('issuer high + project low => high', () => {
    expect(computeFinalCampaignRisk({ campaignType: 'debt', issuerRiskBucket: 'high', projectRiskBucket: 'low', isOverride: false })).toBe('high');
  });
  it('issuer medium + project low => medium', () => {
    expect(computeFinalCampaignRisk({ campaignType: 'debt', issuerRiskBucket: 'medium', projectRiskBucket: 'low', isOverride: false })).toBe('medium');
  });
  it('issuer low + project high => high', () => {
    expect(computeFinalCampaignRisk({ campaignType: 'debt', issuerRiskBucket: 'low', projectRiskBucket: 'high', isOverride: false })).toBe('high');
  });
  it('issuer low + project low => low', () => {
    expect(computeFinalCampaignRisk({ campaignType: 'debt', issuerRiskBucket: 'low', projectRiskBucket: 'low', isOverride: false })).toBe('low');
  });
});

describe('computeFinalCampaignRisk — missing buckets', () => {
  it('null issuer => project bucket', () => {
    expect(computeFinalCampaignRisk({ campaignType: 'debt', issuerRiskBucket: null, projectRiskBucket: 'medium', isOverride: false })).toBe('medium');
  });
  it('null project => issuer bucket', () => {
    expect(computeFinalCampaignRisk({ campaignType: 'debt', issuerRiskBucket: 'low', projectRiskBucket: null, isOverride: false })).toBe('low');
  });
  it('both null => high', () => {
    expect(computeFinalCampaignRisk({ campaignType: 'debt', issuerRiskBucket: null, projectRiskBucket: null, isOverride: false })).toBe('high');
  });
});

describe('computeFinalCampaignRisk — equity', () => {
  it('defaults to issuer bucket', () => {
    expect(computeFinalCampaignRisk({ campaignType: 'equity', issuerRiskBucket: 'low', projectRiskBucket: null, isOverride: false })).toBe('low');
  });
  it('no issuer => high', () => {
    expect(computeFinalCampaignRisk({ campaignType: 'equity', issuerRiskBucket: null, projectRiskBucket: null, isOverride: false })).toBe('high');
  });
});

describe('computeFinalCampaignRisk — override', () => {
  it('override always wins for debt', () => {
    expect(computeFinalCampaignRisk({ campaignType: 'debt', issuerRiskBucket: 'high', projectRiskBucket: 'high', isOverride: true, overrideBucket: 'low' })).toBe('low');
  });
  it('override wins for equity', () => {
    expect(computeFinalCampaignRisk({ campaignType: 'equity', issuerRiskBucket: 'high', projectRiskBucket: null, isOverride: true, overrideBucket: 'medium' })).toBe('medium');
  });
});
