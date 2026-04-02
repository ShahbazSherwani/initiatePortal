import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { toast } from 'react-hot-toast';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';
import {
  type SuitabilityAnswers,
  type ScoreBreakdown,
  type InvestmentExperience,
  calculateSuitabilityScore,
  EMPLOYMENT_OPTIONS, EMPLOYMENT_LABELS,
  INCOME_BANDS, INCOME_LABELS,
  NET_WORTH_BANDS, NET_WORTH_LABELS,
  LIQUIDITY_BANDS, LIQUIDITY_LABELS,
  INVESTMENT_GOALS, GOAL_LABELS,
  INVESTMENT_HORIZONS, HORIZON_LABELS,
  KNOWLEDGE_LEVELS, KNOWLEDGE_LABELS,
  EXPERIENCE_OPTIONS, EXPERIENCE_LABELS,
  LOSS_REACTIONS, LOSS_REACTION_LABELS,
  HIGH_RISK_ALLOCATIONS, ALLOCATION_LABELS,
  RISK_COMFORT_OPTIONS, RISK_COMFORT_LABELS,
  PROFILE_LABELS,
} from '../lib/suitability';

// ─── Step Definitions ────────────────────────────────────────────────────────

const STEPS = [
  { key: 'personal', title: 'Personal Information', section: 'A' },
  { key: 'financial', title: 'Employment & Financial Profile', section: 'B' },
  { key: 'objectives', title: 'Investment Objectives & Experience', section: 'C' },
  { key: 'risk', title: 'Risk Tolerance', section: 'D' },
  { key: 'review', title: 'Review & Submit', section: 'E' },
  { key: 'result', title: 'Assessment Result', section: '' },
] as const;

const INITIAL: SuitabilityAnswers = {
  full_name: '',
  date_of_birth: '',
  nationality: '',
  government_id_or_tin: '',
  address: '',
  contact_number: '',
  email: '',
  employment_status: 'employed',
  occupation_or_business_type: '',
  gross_annual_income_band: 'below_250k',
  net_worth_band: 'below_500k',
  liquidity_band: 'below_100k',
  main_investment_goal: 'capital_preservation',
  investment_horizon: 'less_than_1_year',
  investment_knowledge_level: 'none',
  investment_experience: [],
  reaction_to_loss: 'sell_all',
  high_risk_allocation: 'less_than_10_percent',
  risk_comfort_statement: 'guaranteed_low_returns',
  declaration_accepted: false,
  risk_disclosure_accepted: false,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function InvestorSuitabilityAssessment() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<SuitabilityAnswers>({ ...INITIAL });
  const [scores, setScores] = useState<ScoreBreakdown | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Prefill personal info from profile
  useEffect(() => {
    if (profile) {
      setAnswers(prev => ({
        ...prev,
        full_name: prev.full_name || profile.fullName || profile.name || '',
        email: prev.email || profile.email || '',
      }));
    }
  }, [profile]);

  const set = <K extends keyof SuitabilityAnswers>(field: K, value: SuitabilityAnswers[K]) =>
    setAnswers(prev => ({ ...prev, [field]: value }));

  const toggleExperience = (exp: InvestmentExperience) => {
    setAnswers(prev => {
      const current = prev.investment_experience;
      if (exp === 'none') return { ...prev, investment_experience: ['none'] };
      const without = current.filter(e => e !== 'none');
      return {
        ...prev,
        investment_experience: without.includes(exp)
          ? without.filter(e => e !== exp)
          : [...without, exp],
      };
    });
  };

  // Validate current step
  const canProceed = useMemo(() => {
    switch (step) {
      case 0: // Personal
        return !!(answers.full_name && answers.email);
      case 1: // Financial
        return !!(answers.employment_status && answers.gross_annual_income_band && answers.net_worth_band && answers.liquidity_band);
      case 2: // Objectives
        return !!(answers.main_investment_goal && answers.investment_horizon && answers.investment_knowledge_level && answers.investment_experience.length > 0);
      case 3: // Risk
        return !!(answers.reaction_to_loss && answers.high_risk_allocation && answers.risk_comfort_statement);
      case 4: // Review
        return answers.declaration_accepted && answers.risk_disclosure_accepted;
      default:
        return true;
    }
  }, [step, answers]);

  const previewScore = useMemo(() => calculateSuitabilityScore(answers), [answers]);

  const handleSubmit = async () => {
    if (!answers.declaration_accepted || !answers.risk_disclosure_accepted) {
      toast.error('You must accept both declarations to proceed.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await authFetch(`${API_BASE_URL}/investor/suitability-assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      });

      if (result?.success && result.assessment) {
        setScores(result.assessment);
        setStep(5); // result step
        toast.success('Assessment completed!');
      } else {
        toast.error(result?.error || 'Failed to submit assessment');
      }
    } catch (err: any) {
      console.error('Assessment submission error:', err);
      toast.error(err?.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Shared Styles ──────────────────────────────────────────────────────────
  const cardClass = 'bg-white rounded-2xl border border-gray-100 p-6 md:p-8';
  const sectionTitle = 'text-lg font-semibold text-gray-900 mb-1';
  const sectionDesc = 'text-sm text-gray-500 mb-6';
  const fieldLabel = 'block text-sm font-medium text-gray-700 mb-1.5';
  const inputClass = 'rounded-xl border-gray-200 focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20]';
  const radioItemClass = 'flex items-center gap-2.5 px-4 py-3 rounded-xl border border-gray-200 hover:border-[#1B5E20] hover:bg-green-50/30 transition-colors cursor-pointer';

  // ── Progress Bar ───────────────────────────────────────────────────────────
  const renderProgress = () => (
    <div className="flex items-center gap-1 mb-8">
      {STEPS.slice(0, 5).map((s, i) => (
        <div key={s.key} className="flex-1 flex flex-col items-center gap-1.5">
          <div className={`h-1.5 w-full rounded-full transition-colors ${i <= step ? 'bg-[#1B5E20]' : 'bg-gray-200'}`} />
          <span className={`text-[11px] font-medium ${i <= step ? 'text-[#1B5E20]' : 'text-gray-400'}`}>
            {s.section}. {s.title.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  );

  // ── Radio Group Helper ─────────────────────────────────────────────────────
  const renderRadioOptions = <T extends string>(
    field: keyof SuitabilityAnswers,
    options: readonly T[],
    labels: Record<T, string>,
    value: T
  ) => (
    <RadioGroup
      value={value}
      onValueChange={(v) => set(field, v as any)}
      className="space-y-2"
    >
      {options.map((opt) => (
        <label key={opt} className={radioItemClass}>
          <RadioGroupItem value={opt} id={`${field}-${opt}`} />
          <Label htmlFor={`${field}-${opt}`} className="text-sm cursor-pointer flex-1">{labels[opt]}</Label>
        </label>
      ))}
    </RadioGroup>
  );

  // ── Step 0: Personal Information ───────────────────────────────────────────
  const renderPersonal = () => (
    <div className={cardClass}>
      <h2 className={sectionTitle}>A. Personal Information</h2>
      <p className={sectionDesc}>Some fields are prefilled from your profile. Update if necessary.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={fieldLabel}>Full Name <span className="text-red-500">*</span></label>
          <Input value={answers.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Juan Dela Cruz" className={inputClass} />
        </div>
        <div>
          <label className={fieldLabel}>Email <span className="text-red-500">*</span></label>
          <Input type="email" value={answers.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" className={inputClass} />
        </div>
        <div>
          <label className={fieldLabel}>Date of Birth</label>
          <Input type="date" value={answers.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={fieldLabel}>Nationality</label>
          <Input value={answers.nationality} onChange={e => set('nationality', e.target.value)} placeholder="Filipino" className={inputClass} />
        </div>
        <div>
          <label className={fieldLabel}>TIN / Government ID No.</label>
          <Input value={answers.government_id_or_tin} onChange={e => set('government_id_or_tin', e.target.value)} placeholder="123-456-789" className={inputClass} />
        </div>
        <div>
          <label className={fieldLabel}>Contact Number</label>
          <Input value={answers.contact_number} onChange={e => set('contact_number', e.target.value)} placeholder="+63 9XX XXX XXXX" className={inputClass} />
        </div>
        <div className="md:col-span-2">
          <label className={fieldLabel}>Address</label>
          <Input value={answers.address} onChange={e => set('address', e.target.value)} placeholder="Full address" className={inputClass} />
        </div>
      </div>
    </div>
  );

  // ── Step 1: Financial Profile ──────────────────────────────────────────────
  const renderFinancial = () => (
    <div className={cardClass}>
      <h2 className={sectionTitle}>B. Employment & Financial Profile</h2>
      <p className={sectionDesc}>This helps us assess your financial capacity for investing.</p>
      <div className="space-y-6">
        <div>
          <label className={fieldLabel}>1. Employment Status <span className="text-red-500">*</span></label>
          {renderRadioOptions('employment_status', EMPLOYMENT_OPTIONS, EMPLOYMENT_LABELS, answers.employment_status)}
        </div>
        <div>
          <label className={fieldLabel}>2. Occupation / Business Type</label>
          <Input value={answers.occupation_or_business_type} onChange={e => set('occupation_or_business_type', e.target.value)} placeholder="e.g. Software Engineer, Retail Business Owner" className={inputClass} />
        </div>
        <div>
          <label className={fieldLabel}>3. Gross Annual Income <span className="text-red-500">*</span></label>
          {renderRadioOptions('gross_annual_income_band', INCOME_BANDS, INCOME_LABELS, answers.gross_annual_income_band)}
        </div>
        <div>
          <label className={fieldLabel}>4. Estimated Net Worth (excluding primary residence) <span className="text-red-500">*</span></label>
          {renderRadioOptions('net_worth_band', NET_WORTH_BANDS, NET_WORTH_LABELS, answers.net_worth_band)}
        </div>
        <div>
          <label className={fieldLabel}>5. Liquidity of Net Assets (cash, deposits, marketable securities) <span className="text-red-500">*</span></label>
          {renderRadioOptions('liquidity_band', LIQUIDITY_BANDS, LIQUIDITY_LABELS, answers.liquidity_band)}
        </div>
      </div>
    </div>
  );

  // ── Step 2: Investment Objectives ──────────────────────────────────────────
  const renderObjectives = () => (
    <div className={cardClass}>
      <h2 className={sectionTitle}>C. Investment Objectives & Experience</h2>
      <p className={sectionDesc}>Tell us about your investment goals and prior experience.</p>
      <div className="space-y-6">
        <div>
          <label className={fieldLabel}>6. Main Investment Goal <span className="text-red-500">*</span></label>
          {renderRadioOptions('main_investment_goal', INVESTMENT_GOALS, GOAL_LABELS, answers.main_investment_goal)}
        </div>
        <div>
          <label className={fieldLabel}>7. Investment Horizon <span className="text-red-500">*</span></label>
          {renderRadioOptions('investment_horizon', INVESTMENT_HORIZONS, HORIZON_LABELS, answers.investment_horizon)}
        </div>
        <div>
          <label className={fieldLabel}>Investment Knowledge Level <span className="text-red-500">*</span></label>
          {renderRadioOptions('investment_knowledge_level', KNOWLEDGE_LEVELS, KNOWLEDGE_LABELS, answers.investment_knowledge_level)}
        </div>
        <div>
          <label className={fieldLabel}>8. Experience with Investments <span className="text-red-500">*</span> <span className="text-gray-400 font-normal">(check all that apply)</span></label>
          <div className="space-y-2">
            {EXPERIENCE_OPTIONS.map(opt => (
              <label key={opt} className={`${radioItemClass} ${answers.investment_experience.includes(opt) ? 'border-[#1B5E20] bg-green-50/40' : ''}`}>
                <Checkbox
                  checked={answers.investment_experience.includes(opt)}
                  onCheckedChange={() => toggleExperience(opt)}
                  className="data-[state=checked]:bg-[#1B5E20] data-[state=checked]:border-[#1B5E20]"
                />
                <span className="text-sm">{EXPERIENCE_LABELS[opt]}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step 3: Risk Tolerance ─────────────────────────────────────────────────
  const renderRisk = () => (
    <div className={cardClass}>
      <h2 className={sectionTitle}>D. Risk Tolerance</h2>
      <p className={sectionDesc}>These questions help us understand your behavioral risk appetite.</p>
      <div className="space-y-6">
        <div>
          <label className={fieldLabel}>9. How would you react to a 20% drop in investment value? <span className="text-red-500">*</span></label>
          {renderRadioOptions('reaction_to_loss', LOSS_REACTIONS, LOSS_REACTION_LABELS, answers.reaction_to_loss)}
        </div>
        <div>
          <label className={fieldLabel}>10. What portion of your savings are you willing to invest in high-risk assets? <span className="text-red-500">*</span></label>
          {renderRadioOptions('high_risk_allocation', HIGH_RISK_ALLOCATIONS, ALLOCATION_LABELS, answers.high_risk_allocation)}
        </div>
        <div>
          <label className={fieldLabel}>11. Which statement best describes your risk comfort level? <span className="text-red-500">*</span></label>
          {renderRadioOptions('risk_comfort_statement', RISK_COMFORT_OPTIONS, RISK_COMFORT_LABELS, answers.risk_comfort_statement)}
        </div>
      </div>
    </div>
  );

  // ── Step 4: Review & Declaration ───────────────────────────────────────────
  const renderReview = () => {
    const ps = previewScore;
    const profileInfo = PROFILE_LABELS[ps.investor_risk_profile];
    return (
      <div className="space-y-6">
        <div className={cardClass}>
          <h2 className={sectionTitle}>E. Review Your Answers</h2>
          <p className={sectionDesc}>Please verify your responses before submitting.</p>

          {/* Summary grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <SummaryRow label="Full Name" value={answers.full_name} />
            <SummaryRow label="Email" value={answers.email} />
            <SummaryRow label="Employment" value={EMPLOYMENT_LABELS[answers.employment_status]} />
            <SummaryRow label="Annual Income" value={INCOME_LABELS[answers.gross_annual_income_band]} />
            <SummaryRow label="Net Worth" value={NET_WORTH_LABELS[answers.net_worth_band]} />
            <SummaryRow label="Liquidity" value={LIQUIDITY_LABELS[answers.liquidity_band]} />
            <SummaryRow label="Investment Goal" value={GOAL_LABELS[answers.main_investment_goal]} />
            <SummaryRow label="Horizon" value={HORIZON_LABELS[answers.investment_horizon]} />
            <SummaryRow label="Knowledge" value={KNOWLEDGE_LABELS[answers.investment_knowledge_level]} />
            <SummaryRow
              label="Experience"
              value={answers.investment_experience.map(e => EXPERIENCE_LABELS[e]).join(', ')}
            />
            <SummaryRow label="Reaction to Loss" value={LOSS_REACTION_LABELS[answers.reaction_to_loss]} />
            <SummaryRow label="High-Risk Allocation" value={ALLOCATION_LABELS[answers.high_risk_allocation]} />
            <div className="md:col-span-2">
              <SummaryRow label="Risk Statement" value={RISK_COMFORT_LABELS[answers.risk_comfort_statement]} />
            </div>
          </div>
        </div>

        {/* Score preview */}
        <div className={cardClass}>
          <h3 className="text-base font-semibold mb-3">Score Preview</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl font-bold text-[#1B3A2D]" style={{ fontFamily: "'Fraunces',serif" }}>{ps.total_score}</div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold" style={{ background: profileInfo.bg, color: profileInfo.color, border: `1px solid ${profileInfo.border}` }}>
                {profileInfo.label}
              </span>
              <p className="text-xs text-gray-500 mt-1">{profileInfo.description}</p>
            </div>
          </div>
          <ScoreBar label="Financial Capacity" score={ps.income_score + ps.net_worth_score + ps.liquidity_score} max={30} />
          <ScoreBar label="Investment Experience" score={ps.knowledge_score + ps.experience_score} max={20} />
          <ScoreBar label="Investment Objectives" score={ps.primary_goal_score + ps.horizon_score} max={20} />
          <ScoreBar label="Risk Tolerance" score={ps.reaction_score + ps.allocation_score + ps.risk_attitude_score} max={30} />
        </div>

        {/* Declaration */}
        <div className={cardClass}>
          <h3 className="text-base font-semibold mb-4">Declaration & Consent</h3>
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={answers.declaration_accepted}
                onCheckedChange={(v) => set('declaration_accepted', !!v)}
                className="mt-0.5 data-[state=checked]:bg-[#1B5E20] data-[state=checked]:border-[#1B5E20]"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                I hereby declare that all information provided is true, accurate, and complete.
                I understand that this information will be used to assess my suitability for investment opportunities,
                comply with applicable SEC crowdfunding regulations, and perform risk profiling and investor classification.
                I undertake to notify INITIATE PH, Inc. of any material changes in my financial condition or investment objectives.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={answers.risk_disclosure_accepted}
                onCheckedChange={(v) => set('risk_disclosure_accepted', !!v)}
                className="mt-0.5 data-[state=checked]:bg-[#1B5E20] data-[state=checked]:border-[#1B5E20]"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                I acknowledge that investments carry risks, including possible loss of capital, 
                and that past performance is not indicative of future results.
              </span>
            </label>
          </div>
        </div>
      </div>
    );
  };

  // ── Step 5: Result ─────────────────────────────────────────────────────────
  const renderResult = () => {
    const sc = scores!;
    const profileInfo = PROFILE_LABELS[sc.investor_risk_profile];
    return (
      <div className="space-y-6">
        <div className={`${cardClass} text-center`}>
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: profileInfo.bg, border: `2px solid ${profileInfo.border}` }}>
            <span className="text-3xl font-bold" style={{ color: profileInfo.color, fontFamily: "'Fraunces',serif" }}>{sc.total_score}</span>
          </div>
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-3" style={{ background: profileInfo.bg, color: profileInfo.color, border: `1px solid ${profileInfo.border}` }}>
            {profileInfo.label} Investor
          </span>
          <p className="text-gray-600 text-sm max-w-lg mx-auto">{profileInfo.description}</p>
        </div>

        <div className={cardClass}>
          <h3 className="text-base font-semibold mb-4">Score Breakdown</h3>
          <ScoreBar label="Financial Capacity (30)" score={sc.income_score + sc.net_worth_score + sc.liquidity_score} max={30} detail={`Income: ${sc.income_score} · Net Worth: ${sc.net_worth_score} · Liquidity: ${sc.liquidity_score}`} />
          <ScoreBar label="Investment Experience (20)" score={sc.knowledge_score + sc.experience_score} max={20} detail={`Knowledge: ${sc.knowledge_score} · Experience: ${sc.experience_score}`} />
          <ScoreBar label="Investment Objectives (20)" score={sc.primary_goal_score + sc.horizon_score} max={20} detail={`Goal: ${sc.primary_goal_score} · Horizon: ${sc.horizon_score}`} />
          <ScoreBar label="Risk Tolerance (30)" score={sc.reaction_score + sc.allocation_score + sc.risk_attitude_score} max={30} detail={`Reaction: ${sc.reaction_score} · Allocation: ${sc.allocation_score} · Attitude: ${sc.risk_attitude_score}`} />
        </div>

        <div className={cardClass}>
          <h3 className="text-base font-semibold mb-3">What You Can Invest In</h3>
          <div className="space-y-3 text-sm">
            {sc.investor_risk_profile === 'conservative' && (
              <>
                <Rule ok>Low–medium risk debt (lending) campaigns with tenor ≤ 1 year</Rule>
                <Rule>High-risk debt campaigns</Rule>
                <Rule>Debt campaigns with tenor {'>'} 1 year</Rule>
                <Rule>All equity campaigns</Rule>
              </>
            )}
            {sc.investor_risk_profile === 'moderate' && (
              <>
                <Rule ok>All debt (lending) campaigns</Rule>
                <Rule ok>Low–medium risk equity campaigns</Rule>
                <Rule>High-risk equity campaigns</Rule>
              </>
            )}
            {sc.investor_risk_profile === 'aggressive' && (
              <>
                <Rule ok>All debt (lending) campaigns</Rule>
                <Rule ok>All equity campaigns</Rule>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => navigate('/investor/discover')} className="flex-1 bg-[#1B5E20] text-white hover:bg-[#2E7D32] rounded-xl py-3">
            Browse Campaigns
          </Button>
        </div>
      </div>
    );
  };

  // ── Main Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1B3A2D]" style={{ fontFamily: "'Fraunces',serif" }}>
            Investor Suitability Assessment
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Required by SEC Crowdfunding Rules. Assess your risk profile to unlock investment opportunities.
          </p>
        </div>

        {step < 5 && renderProgress()}

        {/* Step Content */}
        {step === 0 && renderPersonal()}
        {step === 1 && renderFinancial()}
        {step === 2 && renderObjectives()}
        {step === 3 && renderRisk()}
        {step === 4 && renderReview()}
        {step === 5 && renderResult()}

        {/* Navigation */}
        {step < 5 && (
          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="rounded-xl px-6">
                ← Back
              </Button>
            ) : <div />}
            {step < 4 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed} className="bg-[#1B5E20] text-white hover:bg-[#2E7D32] rounded-xl px-6">
                Continue →
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canProceed || submitting} className="bg-[#1B5E20] text-white hover:bg-[#2E7D32] rounded-xl px-8">
                {submitting ? 'Submitting…' : 'Submit Assessment'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helper Components ───────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3">
      <span className="text-xs text-gray-500 block">{label}</span>
      <span className="font-medium text-gray-900">{value || '—'}</span>
    </div>
  );
}

function ScoreBar({ label, score, max, detail }: { label: string; score: number; max: number; detail?: string }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs font-medium mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-[#1B5E20]">{score}/{max}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#1B5E20] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      {detail && <p className="text-[11px] text-gray-400 mt-0.5">{detail}</p>}
    </div>
  );
}

function Rule({ ok, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex items-start gap-2 px-4 py-2.5 rounded-xl ${ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
      <span className="text-base mt-0.5">{ok ? '✓' : '✕'}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
}
