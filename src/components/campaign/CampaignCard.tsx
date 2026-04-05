import React from 'react';
import type { FeedCampaign } from '../../lib/campaignMappers';

// ── Risk badge metadata ───────────────────────────────────────────────────────
const RISK_META: Record<string, { color: string; bg: string; border: string; label: string; icon: string }> = {
  Low:    { color: '#15803D', bg: '#F0FDF4', border: '#86EFAC', label: 'Low Risk',    icon: '🛡️' },
  Medium: { color: '#CA8A04', bg: '#FEFCE8', border: '#FDE047', label: 'Medium Risk', icon: '⚡' },
  High:   { color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5', label: 'High Risk',   icon: '🔥' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const pct = (r: number, g: number) => g > 0 ? Math.min(100, Math.round((r / g) * 100)) : 0;
const fmtAmt = (n: number) => n >= 1e6 ? `₱${(n / 1e6).toFixed(1)}M` : `₱${n.toLocaleString()}`;

// ── SVG icons ─────────────────────────────────────────────────────────────────
const MapIcon = () => (
  <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);
const ChevRIcon = () => (
  <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);
const LockIcon = () => (
  <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
);

// ── Placeholder image palette ─────────────────────────────────────────────────
const PALS = [['#1B3A2D','#3D7A5A','#6BC5A0'],['#2D5A3F','#5FA37A','#A8E6C3'],['#1A3C34','#4D8B6F','#8FCFAB'],['#274D3A','#6BAF8D','#B5E8D0'],['#1F4B3A','#4A9A70','#7DDBA8'],['#2A5C48','#5DB88A','#9EEAC5']];

const CampaignImg: React.FC<{ url: string | null; index: number }> = ({ url, index }) => {
  if (url) return <img src={url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />;
  const p = PALS[index % PALS.length];
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id={`cg${index}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={p[0]} /><stop offset="50%" stopColor={p[1]} /><stop offset="100%" stopColor={p[2]} /></linearGradient></defs>
        <rect width="600" height="400" fill={`url(#cg${index})`} />
        <circle cx="300" cy="170" r="24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
        <rect x="255" y="215" width="90" height="55" rx="3" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      </svg>
    </div>
  );
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface CampaignCardProps {
  campaign: FeedCampaign;
  index: number;
  eligible: boolean;
  investorProfile: string;
  reason?: string;
  onViewDetails: (id: number | string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, index, eligible, investorProfile, reason, onViewDetails }) => {
  const risk = RISK_META[campaign.riskLevel] || RISK_META.Medium;
  const progress = pct(campaign.fundingRaised, campaign.fundingGoal);

  return (
    <div className={`cf-card cf-anim ${!eligible ? 'cf-card-locked' : ''}`} style={{ animationDelay: `${index * 0.06}s` }}>
      {/* Image */}
      <div className="cf-card-img-wrap">
        <CampaignImg url={campaign.imageUrl} index={index} />
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`, backdropFilter: 'blur(4px)' }}>
            {risk.icon} {risk.label}
          </span>
        </div>
        <span style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)', color: '#fff', fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.15)' }}>
          {campaign.industry}
        </span>
        {!eligible && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><LockIcon /></div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="cf-card-body">
        <div className="cf-card-header">
          <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: '#1B3A2D' }}>{campaign.title}</h3>
          {campaign.status === 'Active' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', flexShrink: 0, marginTop: 6, boxShadow: '0 0 0 3px rgba(34,197,94,0.2)' }} />}
        </div>
        <p style={{ fontSize: 13, color: '#888', lineHeight: 1.4, margin: '4px 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{campaign.description}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, color: '#888', fontSize: 12 }}>
          <MapIcon /><span>{campaign.company.name}{campaign.company.city ? ` · ${campaign.company.city}` : ''}</span>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
            <span style={{ color: '#555', fontWeight: 500 }}>Funding</span>
            <span style={{ fontWeight: 700, color: progress > 0 ? '#1B3A2D' : '#999' }}>{progress}%</span>
          </div>
          <div style={{ width: '100%', height: 6, borderRadius: 100, background: '#EDEAE4', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 100, background: 'linear-gradient(90deg,#1B3A2D,#3D7A5A)', transition: 'width 0.6s ease', width: `${progress}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#aaa' }}>
            <span>{fmtAmt(campaign.fundingRaised)}</span>
            <span>of {campaign.fundingGoal > 0 ? fmtAmt(campaign.fundingGoal) : '—'}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="cf-stats-row">
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>Required</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', whiteSpace: 'nowrap' }}>{campaign.fundingGoal > 0 ? fmtAmt(campaign.fundingGoal) : '0 PHP'}</span>
          </div>
          <div style={{ width: 1, background: '#EDEAE4', alignSelf: 'stretch' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>Est. Return</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#15803D', whiteSpace: 'nowrap' }}>{campaign.estReturn}</span>
          </div>
          <div style={{ width: 1, background: '#EDEAE4', alignSelf: 'stretch' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>Duration</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', whiteSpace: 'nowrap' }}>{campaign.duration}</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="cf-card-footer">
        {eligible ? (
          <button onClick={() => onViewDetails(campaign.id)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: 13, border: 'none', borderRadius: 12,
            background: 'linear-gradient(135deg,#1B3A2D,#2D5A3F)', color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans',sans-serif", boxShadow: '0 2px 8px rgba(27,58,45,0.2)',
          }}>
            View Details <ChevRIcon />
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 0 2px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#999' }}>
              <LockIcon /><span style={{ fontSize: 13, fontWeight: 500 }}>Not eligible for your Risk Profile</span>
            </div>
            <span style={{ fontSize: 11, color: '#bbb' }}>
              {reason || `Your profile: ${investorProfile} · Required: ${campaign.riskLevel}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
