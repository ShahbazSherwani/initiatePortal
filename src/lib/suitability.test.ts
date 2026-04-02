import { describe, it, expect } from 'vitest';
import {
  calculateSuitabilityScore,
  checkCampaignEligibility,
  type SuitabilityAnswers,
  type RiskProfile,
} from './suitability';

// Base answers (all-minimum)
const baseAnswers: SuitabilityAnswers = {
  full_name: 'Test User',
  date_of_birth: '1990-01-01',
  nationality: 'Filipino',
  government_id_or_tin: '123-456-789',
  address: '123 Test St',
  contact_number: '+63 912 345 6789',
  email: 'test@example.com',
  employment_status: 'employed',
  occupation_or_business_type: 'Engineer',
  gross_annual_income_band: 'below_250k',
  net_worth_band: 'below_500k',
  liquidity_band: 'below_100k',
  main_investment_goal: 'capital_preservation',
  investment_horizon: 'less_than_1_year',
  investment_knowledge_level: 'none',
  investment_experience: ['none'],
  reaction_to_loss: 'sell_all',
  high_risk_allocation: 'less_than_10_percent',
  risk_comfort_statement: 'guaranteed_low_returns',
  declaration_accepted: true,
  risk_disclosure_accepted: true,
};

// ── Income Score Tests ─────────────────────────────────────────────────
describe('Income Scoring', () => {
  it.each([
    ['below_250k', 2],
    ['250k_to_500k', 4],
    ['500k_to_1m', 6],
    ['1m_to_5m', 8],
    ['above_5m', 10],
  ] as const)('income band %s → score %d', (band, expected) => {
    const s = calculateSuitabilityScore({ ...baseAnswers, gross_annual_income_band: band });
    expect(s.income_score).toBe(expected);
  });
});

// ── Net Worth Score Tests ──────────────────────────────────────────────
describe('Net Worth Scoring', () => {
  it.each([
    ['below_500k', 4],
    ['500k_to_1m', 6],
    ['1m_to_5m', 8],
    ['above_5m', 10],
  ] as const)('net worth band %s → score %d', (band, expected) => {
    const s = calculateSuitabilityScore({ ...baseAnswers, net_worth_band: band });
    expect(s.net_worth_score).toBe(expected);
  });
});

// ── Liquidity Score Tests ──────────────────────────────────────────────
describe('Liquidity Scoring', () => {
  it.each([
    ['below_100k', 4],
    ['100k_to_500k', 8],
    ['above_500k', 10],
  ] as const)('liquidity band %s → score %d', (band, expected) => {
    const s = calculateSuitabilityScore({ ...baseAnswers, liquidity_band: band });
    expect(s.liquidity_score).toBe(expected);
  });
});

// ── Knowledge Score Tests ──────────────────────────────────────────────
describe('Knowledge Scoring', () => {
  it.each([
    ['none', 1],
    ['basic', 6],
    ['intermediate', 8],
    ['advanced', 10],
  ] as const)('knowledge %s → score %d', (level, expected) => {
    const s = calculateSuitabilityScore({ ...baseAnswers, investment_knowledge_level: level });
    expect(s.knowledge_score).toBe(expected);
  });
});

// ── Experience Score Tests (sum + cap) ─────────────────────────────────
describe('Experience Scoring', () => {
  it('none → 0', () => {
    const s = calculateSuitabilityScore({ ...baseAnswers, investment_experience: ['none'] });
    expect(s.experience_score).toBe(0);
  });

  it('single: bank_deposits → 2', () => {
    const s = calculateSuitabilityScore({ ...baseAnswers, investment_experience: ['bank_deposits'] });
    expect(s.experience_score).toBe(2);
  });

  it('multiple items summed: stocks(4) + bonds(3) = 7', () => {
    const s = calculateSuitabilityScore({ ...baseAnswers, investment_experience: ['stocks', 'bonds'] });
    expect(s.experience_score).toBe(7);
  });

  it('caps at 10 when total exceeds', () => {
    const s = calculateSuitabilityScore({
      ...baseAnswers,
      investment_experience: ['stocks', 'real_estate', 'private_placements_or_crowdfunding', 'bonds'],
    });
    // stocks=4 + real_estate=4 + private=4 + bonds=3 = 15 → capped at 10
    expect(s.experience_score).toBe(10);
  });
});

// ── Goal Score Tests ───────────────────────────────────────────────────
describe('Goal Scoring', () => {
  it.each([
    ['capital_preservation', 2],
    ['regular_income', 5],
    ['moderate_growth', 7],
    ['high_growth_speculative', 10],
  ] as const)('goal %s → score %d', (goal, expected) => {
    const s = calculateSuitabilityScore({ ...baseAnswers, main_investment_goal: goal });
    expect(s.primary_goal_score).toBe(expected);
  });
});

// ── Horizon Score Tests ────────────────────────────────────────────────
describe('Horizon Scoring', () => {
  it.each([
    ['less_than_1_year', 2],
    ['one_to_three_years', 5],
    ['three_to_five_years', 8],
    ['more_than_five_years', 10],
  ] as const)('horizon %s → score %d', (horizon, expected) => {
    const s = calculateSuitabilityScore({ ...baseAnswers, investment_horizon: horizon });
    expect(s.horizon_score).toBe(expected);
  });
});

// ── Risk Tolerance Score Tests ─────────────────────────────────────────
describe('Risk Tolerance Scoring', () => {
  it.each([
    ['sell_all', 2],
    ['wait_and_monitor', 6],
    ['invest_more', 10],
  ] as const)('loss reaction %s → score %d', (reaction, expected) => {
    const s = calculateSuitabilityScore({ ...baseAnswers, reaction_to_loss: reaction });
    expect(s.reaction_score).toBe(expected);
  });

  it.each([
    ['less_than_10_percent', 2],
    ['ten_to_thirty_percent', 6],
    ['over_30_percent', 10],
  ] as const)('allocation %s → score %d', (alloc, expected) => {
    const s = calculateSuitabilityScore({ ...baseAnswers, high_risk_allocation: alloc });
    expect(s.allocation_score).toBe(expected);
  });

  it.each([
    ['guaranteed_low_returns', 2],
    ['moderate_fluctuations_for_growth', 6],
    ['comfortable_with_losses_for_high_returns', 10],
  ] as const)('risk comfort %s → score %d', (comfort, expected) => {
    const s = calculateSuitabilityScore({ ...baseAnswers, risk_comfort_statement: comfort });
    expect(s.risk_attitude_score).toBe(expected);
  });
});

// ── Profile Classification Boundaries ──────────────────────────────────
describe('Profile Classification', () => {
  it('all-minimum answers → conservative', () => {
    const s = calculateSuitabilityScore(baseAnswers);
    // 2+4+4+1+0+2+2+2+2+2 = 21
    expect(s.total_score).toBe(21);
    expect(s.investor_risk_profile).toBe('conservative');
  });

  it('score exactly 40 → conservative', () => {
    const s = calculateSuitabilityScore({
      ...baseAnswers,
      gross_annual_income_band: 'above_5m',             // 10
      net_worth_band: 'above_5m',                        // 10
      liquidity_band: 'below_100k',                      // 4
      investment_knowledge_level: 'none',                 // 1
      investment_experience: ['bank_deposits', 'bonds'],  // 2+3=5
      main_investment_goal: 'capital_preservation',       // 2
      investment_horizon: 'less_than_1_year',             // 2
      reaction_to_loss: 'sell_all',                       // 2
      high_risk_allocation: 'less_than_10_percent',       // 2
      risk_comfort_statement: 'guaranteed_low_returns',   // 2
      // sum: 10+10+4+1+5+2+2+2+2+2 = 40
    });
    expect(s.total_score).toBe(40);
    expect(s.investor_risk_profile).toBe('conservative');
  });

  it('score 45 → moderate', () => {
    const s = calculateSuitabilityScore({
      ...baseAnswers,
      gross_annual_income_band: 'above_5m',               // 10
      net_worth_band: 'above_5m',                          // 10
      liquidity_band: 'below_100k',                        // 4
      investment_knowledge_level: 'basic',                  // 6
      investment_experience: ['bank_deposits', 'bonds'],    // 2+3=5
      main_investment_goal: 'capital_preservation',         // 2
      investment_horizon: 'less_than_1_year',               // 2
      reaction_to_loss: 'sell_all',                         // 2
      high_risk_allocation: 'less_than_10_percent',         // 2
      risk_comfort_statement: 'guaranteed_low_returns',     // 2
      // 10+10+4+6+5+2+2+2+2+2 = 45
    });
    expect(s.total_score).toBe(45);
    expect(s.investor_risk_profile).toBe('moderate');
  });

  it('score 71 → aggressive', () => {
    const s = calculateSuitabilityScore({
      ...baseAnswers,
      gross_annual_income_band: 'above_5m',             // 10
      net_worth_band: 'above_5m',                        // 10
      liquidity_band: 'above_500k',                      // 10
      investment_knowledge_level: 'advanced',             // 10
      investment_experience: ['stocks', 'real_estate', 'bonds'], // 4+4+3=11→10
      main_investment_goal: 'capital_preservation',       // 2
      investment_horizon: 'one_to_three_years',           // 5
      reaction_to_loss: 'sell_all',                       // 2
      high_risk_allocation: 'ten_to_thirty_percent',      // 6
      risk_comfort_statement: 'moderate_fluctuations_for_growth', // 6
      // 10+10+10+10+10+2+5+2+6+6 = 71
    });
    expect(s.total_score).toBe(71);
    expect(s.investor_risk_profile).toBe('aggressive');
  });

  it('all-maximum answers → aggressive (100)', () => {
    const s = calculateSuitabilityScore({
      ...baseAnswers,
      gross_annual_income_band: 'above_5m',
      net_worth_band: 'above_5m',
      liquidity_band: 'above_500k',
      investment_knowledge_level: 'advanced',
      investment_experience: ['stocks', 'real_estate', 'private_placements_or_crowdfunding', 'bonds'],
      main_investment_goal: 'high_growth_speculative',
      investment_horizon: 'more_than_five_years',
      reaction_to_loss: 'invest_more',
      high_risk_allocation: 'over_30_percent',
      risk_comfort_statement: 'comfortable_with_losses_for_high_returns',
    });
    expect(s.total_score).toBe(100);
    expect(s.investor_risk_profile).toBe('aggressive');
  });
});

// ── Action Matrix / Eligibility Tests ──────────────────────────────────
describe('Campaign Eligibility (Action Matrix)', () => {
  describe('Conservative', () => {
    const p: RiskProfile = 'conservative';

    it('allows low-risk debt ≤ 12 months', () => {
      expect(checkCampaignEligibility(p, { type: 'debt', riskLevel: 'low', tenorMonths: 12 }).eligible).toBe(true);
    });
    it('allows medium-risk debt ≤ 12 months', () => {
      expect(checkCampaignEligibility(p, { type: 'debt', riskLevel: 'medium', tenorMonths: 12 }).eligible).toBe(true);
    });
    it('blocks high-risk debt', () => {
      expect(checkCampaignEligibility(p, { type: 'debt', riskLevel: 'high', tenorMonths: 6 }).eligible).toBe(false);
    });
    it('blocks debt > 12 months', () => {
      expect(checkCampaignEligibility(p, { type: 'debt', riskLevel: 'low', tenorMonths: 13 }).eligible).toBe(false);
    });
    it('blocks all equity', () => {
      expect(checkCampaignEligibility(p, { type: 'equity', riskLevel: 'low', tenorMonths: 6 }).eligible).toBe(false);
    });
  });

  describe('Moderate', () => {
    const p: RiskProfile = 'moderate';

    it('allows all debt incl. high-risk long-tenor', () => {
      expect(checkCampaignEligibility(p, { type: 'debt', riskLevel: 'high', tenorMonths: 36 }).eligible).toBe(true);
    });
    it('allows low-risk equity', () => {
      expect(checkCampaignEligibility(p, { type: 'equity', riskLevel: 'low', tenorMonths: 12 }).eligible).toBe(true);
    });
    it('allows medium-risk equity', () => {
      expect(checkCampaignEligibility(p, { type: 'equity', riskLevel: 'medium', tenorMonths: 12 }).eligible).toBe(true);
    });
    it('blocks high-risk equity', () => {
      expect(checkCampaignEligibility(p, { type: 'equity', riskLevel: 'high', tenorMonths: 12 }).eligible).toBe(false);
    });
  });

  describe('Aggressive', () => {
    const p: RiskProfile = 'aggressive';

    it('allows all debt', () => {
      expect(checkCampaignEligibility(p, { type: 'debt', riskLevel: 'high', tenorMonths: 60 }).eligible).toBe(true);
    });
    it('allows all equity including high-risk', () => {
      expect(checkCampaignEligibility(p, { type: 'equity', riskLevel: 'high', tenorMonths: 60 }).eligible).toBe(true);
    });
  });

  describe('Donation & Rewards always allowed', () => {
    it('donation for conservative', () => {
      expect(checkCampaignEligibility('conservative', { type: 'donation' }).eligible).toBe(true);
    });
    it('rewards for conservative', () => {
      expect(checkCampaignEligibility('conservative', { type: 'rewards' }).eligible).toBe(true);
    });
  });
});

// ── Total Score Arithmetic ─────────────────────────────────────────────
describe('Total Score', () => {
  it('sums all 10 component scores correctly', () => {
    const s = calculateSuitabilityScore({
      ...baseAnswers,
      gross_annual_income_band: '500k_to_1m',               // 6
      net_worth_band: '1m_to_5m',                             // 8
      liquidity_band: '100k_to_500k',                         // 8
      investment_knowledge_level: 'intermediate',              // 8
      investment_experience: ['stocks'],                       // 4
      main_investment_goal: 'moderate_growth',                 // 7
      investment_horizon: 'three_to_five_years',               // 8
      reaction_to_loss: 'wait_and_monitor',                    // 6
      high_risk_allocation: 'ten_to_thirty_percent',           // 6
      risk_comfort_statement: 'moderate_fluctuations_for_growth', // 6
    });
    const sum = s.income_score + s.net_worth_score + s.liquidity_score +
      s.knowledge_score + s.experience_score +
      s.primary_goal_score + s.horizon_score +
      s.reaction_score + s.allocation_score + s.risk_attitude_score;
    expect(s.total_score).toBe(sum);
    // 6+8+8+8+4+7+8+6+6+6 = 67
    expect(s.total_score).toBe(67);
  });
});
