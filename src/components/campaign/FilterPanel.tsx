import React from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface FilterState {
  risk: string[];
  projectType: string[];
  industry: string[];
}

interface FilterPanelProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onReset: () => void;
  onClose: () => void;
  industries: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────
const RISK_LEVELS = ['Low', 'Medium', 'High'] as const;
const PROJECT_TYPES = ['Newest', 'Top Popular', 'Ending Soon', 'Individuals', 'MSME(Company)'] as const;

const RISK_META: Record<string, { label: string }> = {
  Low: { label: 'Low Risk' },
  Medium: { label: 'Medium Risk' },
  High: { label: 'High Risk' },
};

// ── Checkbox ──────────────────────────────────────────────────────────────────
const CB: React.FC<{ checked: boolean; label: string; onToggle: () => void }> = ({ checked, label, onToggle }) => (
  <label
    style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#555', cursor: 'pointer', padding: '6px 0', userSelect: 'none' }}
    onClick={onToggle}
  >
    <div style={{
      width: 18, height: 18, borderRadius: 5,
      border: `2px solid ${checked ? '#1B3A2D' : '#D4D0C8'}`,
      background: checked ? '#1B3A2D' : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, transition: 'all 0.15s',
    }}>
      {checked && (
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      )}
    </div>
    <span>{label}</span>
  </label>
);

// ── Close icon ────────────────────────────────────────────────────────────────
const XIcon = () => (
  <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────
export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onChange, onReset, onClose, industries }) => {
  const toggle = (key: keyof FilterState, val: string) => {
    const cur = filters[key] || [];
    onChange({ ...filters, [key]: cur.includes(val) ? cur.filter((v: string) => v !== val) : [...cur, val] });
  };

  return (
    <div className="cf-filter-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 600, color: '#1B3A2D' }}>Filters</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', display: 'flex', padding: 4 }}>
          <XIcon />
        </button>
      </div>
      <div className="cf-filter-grid">
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1B3A2D', margin: '0 0 12px' }}>Risk Level:</h4>
          {RISK_LEVELS.map(r => (
            <CB key={r} label={RISK_META[r].label} checked={filters.risk.includes(r)} onToggle={() => toggle('risk', r)} />
          ))}
        </div>
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1B3A2D', margin: '0 0 12px' }}>Project Type:</h4>
          {PROJECT_TYPES.map(t => (
            <CB key={t} label={t} checked={filters.projectType.includes(t)} onToggle={() => toggle('projectType', t)} />
          ))}
        </div>
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1B3A2D', margin: '0 0 12px' }}>Industry:</h4>
          {industries.map(ind => (
            <CB key={ind} label={ind} checked={filters.industry.includes(ind)} onToggle={() => toggle('industry', ind)} />
          ))}
        </div>
      </div>
      <div className="cf-filter-footer">
        <button onClick={onReset} style={{
          background: 'none', border: 'none', fontSize: 14, fontWeight: 500, color: '#999',
          cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", textDecoration: 'underline', textUnderlineOffset: 3,
        }}>Reset Filters</button>
        <button onClick={onClose} style={{
          padding: '10px 28px', border: 'none', borderRadius: 10, background: '#1B3A2D',
          color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
        }}>Apply</button>
      </div>
    </div>
  );
};
