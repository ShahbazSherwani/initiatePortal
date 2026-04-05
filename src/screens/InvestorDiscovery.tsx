// src/screens/InvestorDiscovery.tsx
// ── CampaignFeed-based investor discovery page ────────────────────────────────
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../lib/api';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { API_BASE_URL } from '../config/environment';
import { mapProjectToFeed, toSuitabilityInfo, type FeedCampaign } from '../lib/campaignMappers';
import { checkCampaignEligibility, PROFILE_LABELS, type RiskProfile } from '../lib/suitability';
import { CampaignCard } from '../components/campaign/CampaignCard';
import { FilterPanel } from '../components/campaign/FilterPanel';
import { HelpTopicsBar } from '../components/HelpTopicsBar';

// ── Risk meta for the header legend ───────────────────────────────────────────
const RISK_META: Record<string, { color: string; bg: string; border: string; label: string; icon: string }> = {
  Low:    { color: '#15803D', bg: '#F0FDF4', border: '#86EFAC', label: 'Low Risk',    icon: '🛡️' },
  Medium: { color: '#CA8A04', bg: '#FEFCE8', border: '#FDE047', label: 'Medium Risk', icon: '⚡' },
  High:   { color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5', label: 'High Risk',   icon: '🔥' },
};

// ── Profile card meta (matches CampaignFeed.jsx PROFILE_META) ─────────────────
const PROFILE_CARD_META: Record<string, { color: string; bg: string; border: string; desc: string }> = {
  conservative: { color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0', desc: 'Low-risk notes, secured deals, short-term CF' },
  moderate:     { color: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD', desc: 'Mix of secured + unsecured CF deals' },
  aggressive:   { color: '#9333EA', bg: '#FAF5FF', border: '#D8B4FE', desc: 'High-risk startups, early-stage ventures' },
};

// ── SVG icons (inline, no deps) ───────────────────────────────────────────────
const ShieldIc = () => (
  <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);
const SparkleIc = () => (
  <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
  </svg>
);
const SearchIc = () => (
  <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);
const FilterIc = () => (
  <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
  </svg>
);
const XIc = () => (
  <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

// ── CSS (from CampaignFeed.jsx) ───────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap');
.cf-page{font-family:'DM Sans',sans-serif;background:#F8F6F2;min-height:100vh;color:#1a1a1a}
.cf-wrap{max-width:1280px;margin:0 auto;padding:0 40px}
.cf-hero{background:linear-gradient(135deg,#1B3A2D 0%,#2D5A3F 40%,#1B3A2D 100%);padding:40px 0 36px}
.cf-hero-inner{display:flex;justify-content:space-between;align-items:center;gap:20px}
.cf-hero-title{font-family:'Fraunces',serif;font-size:30px;font-weight:700;color:#fff;letter-spacing:-0.02em}
.cf-hero-sub{font-size:15px;color:rgba(255,255,255,0.6);margin-top:6px}
.cf-profile-card{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:14px 18px;backdrop-filter:blur(8px);color:#fff;max-width:280px;flex-shrink:0}
.cf-toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:16px;padding-top:28px}
.cf-tab-group{display:flex;gap:4px;background:#EDEAE4;border-radius:14px;padding:4px;flex-shrink:0}
.cf-controls{display:flex;gap:10px;align-items:center}
.cf-search{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #E8E4DD;border-radius:12px;padding:8px 14px;min-width:220px}
.cf-search input{border:none;outline:none;font-size:14px;font-family:'DM Sans',sans-serif;background:transparent;width:100%;color:#1a1a1a}
.cf-banner{background:#fff;border:1px solid #E8E4DD;border-radius:14px;padding:16px 20px;margin-bottom:8px;margin-top:4px}
.cf-banner-inner{display:flex;align-items:center;gap:10px}
.cf-legend{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;margin-top:4px}
.cf-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.cf-filter-panel{background:#fff;border:1px solid #E8E4DD;border-radius:16px;padding:28px;margin-bottom:16px}
.cf-filter-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:32px}
.cf-filter-footer{display:flex;justify-content:space-between;align-items:center;margin-top:24px;padding-top:20px;border-top:1px solid #EDEAE4}
.cf-card{background:#fff;border-radius:18px;border:1px solid #E8E4DD;overflow:hidden;display:flex;flex-direction:column;transition:transform 0.2s,box-shadow 0.2s}
.cf-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(27,58,45,0.12)}
.cf-card-locked .cf-card-img-wrap{filter:grayscale(0.5) brightness(0.85)}
.cf-card-img-wrap{position:relative;aspect-ratio:16/10;overflow:hidden;background:#1B3A2D}
.cf-card-body{padding:20px 22px 0;flex:1;display:flex;flex-direction:column}
.cf-card-header{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px}
.cf-stats-row{display:flex;justify-content:space-between;gap:12px;padding:14px 0;border-top:1px solid #F3F1EC;margin-top:auto}
.cf-card-footer{padding:16px 22px 20px}
.cf-summary{text-align:center;margin-top:32px;font-size:13px;color:#aaa}
.cf-empty{text-align:center;padding:60px 20px}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.cf-anim{animation:fadeUp 0.4s ease both}
@media(max-width:1024px){.cf-wrap{padding:0 24px}.cf-hero{padding:32px 0 28px}.cf-hero-title{font-size:26px}.cf-grid{grid-template-columns:repeat(2,1fr);gap:20px}.cf-filter-grid{grid-template-columns:1fr 1fr;gap:24px}.cf-toolbar{flex-wrap:wrap}.cf-search{min-width:180px}}
@media(max-width:640px){.cf-wrap{padding:0 16px}.cf-hero{padding:24px 0 20px}.cf-hero-inner{flex-direction:column;align-items:flex-start}.cf-hero-title{font-size:22px}.cf-hero-sub{font-size:13px}.cf-profile-card{max-width:100%;width:100%}.cf-toolbar{flex-direction:column;align-items:stretch;gap:12px;padding-top:20px}.cf-tab-group{align-self:stretch}.cf-tab-group button{flex:1;justify-content:center}.cf-controls{flex-direction:column;align-items:stretch}.cf-search{min-width:unset;width:100%}.cf-filter-btn{width:100%;justify-content:center}.cf-grid{grid-template-columns:1fr;gap:16px}.cf-filter-grid{grid-template-columns:1fr;gap:16px}.cf-filter-panel{padding:20px 16px}.cf-filter-footer{flex-direction:column;gap:12px}.cf-filter-footer button{width:100%;text-align:center}.cf-banner{padding:14px 16px}.cf-banner-inner{flex-direction:column;align-items:flex-start;gap:8px}.cf-legend{gap:6px}.cf-card-body{padding:16px 16px 0}.cf-card-footer{padding:14px 16px 16px}.cf-stats-row{gap:6px}}
`;

// ── Default industries (fallback if none are found dynamically) ────────────────
const DEFAULT_INDUSTRIES = ['Agriculture', 'Hospitality', 'Food & Beverages', 'Retail', 'Medical & Pharmaceutical', 'Construction', 'Others'];

// ── Helper: check eligibility using real suitability engine ────────────────────
function campaignEligible(profile: string, campaign: FeedCampaign): { eligible: boolean; reason?: string } {
  const riskProfile = profile.toLowerCase() as RiskProfile;
  const info = toSuitabilityInfo(campaign);
  return checkCampaignEligibility(riskProfile, info);
}

export const InvestorDiscovery: React.FC = () => {
  // ── State ────────────────────────────────────────────────────────────────
  const [campaigns, setCampaigns] = useState<FeedCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [investorProfile, setInvestorProfile] = useState<string>('');
  const [tab, setTab] = useState<'for-you' | 'all'>('for-you');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{ risk: string[]; projectType: string[]; industry: string[] }>({ risk: [], projectType: [], industry: [] });
  const navigate = useNavigate();

  // ── Fetch campaigns + suitability in parallel ───────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [projectsRes, suitRes] = await Promise.all([
          authFetch(`${API_BASE_URL}/projects?status=published`),
          authFetch(`${API_BASE_URL}/investor/suitability-assessment`).catch(() => null),
        ]);
        const projects: any[] = Array.isArray(projectsRes) ? projectsRes : [];
        setCampaigns(projects.map(mapProjectToFeed));

        const profile = suitRes?.assessment?.investor_risk_profile || suitRes?.investor_risk_profile || '';
        setInvestorProfile(profile.toLowerCase());
      } catch (err: any) {
        console.error('Error loading discovery data:', err);
        setError('Failed to load campaigns. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────
  const handleView = useCallback((id: number | string) => navigate(`/investor/project/${id}`), [navigate]);
  const hasActiveFilters = useMemo(() => Object.values(filters).some(a => a.length > 0), [filters]);

  const industries = useMemo(() => {
    const set = new Set(campaigns.map(c => c.industry));
    const sorted = Array.from(set).sort();
    return sorted.length > 0 ? sorted : DEFAULT_INDUSTRIES;
  }, [campaigns]);

  const displayed = useMemo(() => {
    let list = campaigns;
    // "For You" tab: only eligible campaigns
    if (tab === 'for-you' && investorProfile) {
      list = list.filter(c => campaignEligible(investorProfile, c).eligible);
    }
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.company.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q)
      );
    }
    // Filters
    if (filters.risk.length) list = list.filter(c => filters.risk.includes(c.riskLevel));
    if (filters.projectType.length) list = list.filter(c => filters.projectType.includes(c.projectType));
    if (filters.industry.length) list = list.filter(c => filters.industry.includes(c.industry));
    return list;
  }, [campaigns, tab, search, filters, investorProfile]);

  const forYouCount = useMemo(() => {
    if (!investorProfile) return campaigns.length;
    return campaigns.filter(c => campaignEligible(investorProfile, c).eligible).length;
  }, [campaigns, investorProfile]);

  const profileLabel = investorProfile
    ? (PROFILE_LABELS[investorProfile as RiskProfile]?.label || investorProfile.charAt(0).toUpperCase() + investorProfile.slice(1))
    : '';
  const profileCard = PROFILE_CARD_META[investorProfile] || PROFILE_CARD_META.moderate;

  // ── Tab button ──────────────────────────────────────────────────────────
  const TabBtn: React.FC<{ id: 'for-you' | 'all'; label: string; count: number; icon: React.ReactNode }> = ({ id, label, count, icon }) => (
    <button onClick={() => setTab(id)} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', borderRadius: 11,
      background: tab === id ? '#fff' : 'transparent', fontSize: 14,
      fontWeight: tab === id ? 600 : 500, color: tab === id ? '#1B3A2D' : '#6B6B6B',
      cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap',
      boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
    }}>
      {icon} {label}
      <span style={{ fontSize: 11, fontWeight: 700, background: tab === id ? '#1B3A2D' : '#E8E4DD', color: tab === id ? '#fff' : '#888', borderRadius: 100, padding: '2px 8px', minWidth: 20, textAlign: 'center' }}>{count}</span>
    </button>
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <DashboardLayout activePage="investment-opportunities">
      <div className="cf-page">
        <style>{CSS}</style>

        {/* ═══ HERO ═══ */}
        <div className="cf-hero">
          <div className="cf-wrap">
            <div className="cf-hero-inner">
              <div>
                <h1 className="cf-hero-title">Investment Opportunities</h1>
                <p className="cf-hero-sub">Discover campaigns that match your investment goals</p>
              </div>
              {investorProfile && (
                <div className="cf-profile-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <ShieldIc /><span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Your Risk Profile</span>
                  </div>
                  <span style={{ display: 'inline-block', fontSize: 13, fontWeight: 700, padding: '5px 16px', borderRadius: 100, background: profileCard.bg, color: profileCard.color, border: `1px solid ${profileCard.border}` }}>
                    {profileLabel}
                  </span>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: '8px 0 0', lineHeight: 1.4 }}>{profileCard.desc}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ TOOLBAR ═══ */}
        <div className="cf-wrap">
          <div className="cf-toolbar">
            <div className="cf-tab-group">
              <TabBtn id="for-you" label="For You" count={forYouCount} icon={<SparkleIc />} />
              <TabBtn id="all" label="All Campaigns" count={campaigns.length} icon={null} />
            </div>
            <div className="cf-controls">
              <div className="cf-search">
                <span style={{ color: '#999' }}><SearchIc /></span>
                <input type="text" placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', display: 'flex' }}><XIc /></button>}
              </div>
              <button className="cf-filter-btn" onClick={() => setShowFilters(!showFilters)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
                border: `1px solid ${hasActiveFilters ? '#1B3A2D' : '#E8E4DD'}`, borderRadius: 12,
                background: '#fff', fontSize: 14, fontWeight: hasActiveFilters ? 600 : 500,
                color: hasActiveFilters ? '#1B3A2D' : '#555', cursor: 'pointer',
                fontFamily: "'DM Sans',sans-serif", position: 'relative', whiteSpace: 'nowrap',
              }}>
                <FilterIc /><span>Filters</span>
                {hasActiveFilters && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#DC2626', position: 'absolute', top: 8, right: 8 }} />}
              </button>
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters({ risk: [], projectType: [], industry: [] })}
              onClose={() => setShowFilters(false)}
              industries={industries}
            />
          )}

          {/* For-You banner */}
          {tab === 'for-you' && investorProfile && (
            <div className="cf-banner">
              <div className="cf-banner-inner">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: profileCard.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: profileCard.color, border: `1px solid ${profileCard.border}`, flexShrink: 0 }}><SparkleIc /></div>
                <div>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1B3A2D' }}>Showing campaigns that match your <strong style={{ color: profileCard.color }}>{profileLabel}</strong> risk profile</span>
                  <span style={{ display: 'block', fontSize: 12, color: '#888', marginTop: 2 }}>{profileCard.desc}</span>
                </div>
              </div>
            </div>
          )}

          {/* All-tab risk legend */}
          {tab === 'all' && investorProfile && (
            <div className="cf-legend">
              <span style={{ fontSize: 13, color: '#888', fontWeight: 500, marginRight: 4 }}>Risk levels:</span>
              {(['Low', 'Medium', 'High'] as const).map(r => {
                const m = RISK_META[r];
                const ok = campaignEligible(investorProfile, { riskLevel: r, campaignType: 'lending', tenorMonths: 12 } as FeedCampaign).eligible;
                return (
                  <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 100, background: m.bg, color: m.color, border: `1px solid ${m.border}`, opacity: ok ? 1 : 0.5 }}>
                    {m.icon} {m.label} {ok ? '✓' : '✗'}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══ CARDS ═══ */}
        <div className="cf-wrap" style={{ paddingTop: 24, paddingBottom: 60 }}>
          {loading ? (
            <div className="cf-empty">
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
              <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 600, color: '#1B3A2D', marginBottom: 8 }}>Loading campaigns...</h3>
              <p style={{ fontSize: 14, color: '#888' }}>Fetching the latest investment opportunities for you.</p>
            </div>
          ) : error ? (
            <div className="cf-empty">
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 600, color: '#1B3A2D', marginBottom: 8 }}>Something went wrong</h3>
              <p style={{ fontSize: 14, color: '#888' }}>{error}</p>
            </div>
          ) : displayed.length > 0 ? (
            <>
              <div className="cf-grid">
                {displayed.map((c, i) => {
                  const elig = investorProfile ? campaignEligible(investorProfile, c) : { eligible: true };
                  return (
                    <CampaignCard
                      key={c.id}
                      campaign={c}
                      index={i}
                      eligible={tab === 'for-you' ? true : elig.eligible}
                      investorProfile={profileLabel}
                      reason={elig.reason}
                      onViewDetails={handleView}
                    />
                  );
                })}
              </div>
              <div className="cf-summary">
                Showing {displayed.length} of {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
                {tab === 'for-you' && investorProfile && <span> · Matching your <strong>{profileLabel}</strong> profile</span>}
              </div>
            </>
          ) : (
            <div className="cf-empty">
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 600, color: '#1B3A2D', marginBottom: 8 }}>No campaigns found</h3>
              <p style={{ fontSize: 14, color: '#888', lineHeight: 1.5 }}>
                {tab === 'for-you'
                  ? 'No campaigns match your risk profile right now. Check back later or view all campaigns.'
                  : 'Try adjusting your search or filters.'}
              </p>
              {tab === 'for-you' && (
                <button onClick={() => setTab('all')} style={{ padding: '10px 28px', border: 'none', borderRadius: 10, background: '#1B3A2D', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", marginTop: 16 }}>
                  View All Campaigns
                </button>
              )}
            </div>
          )}
        </div>

        {/* Help & Knowledge Base quick-access */}
        <div className="cf-wrap" style={{ paddingBottom: 48 }}>
          <HelpTopicsBar />
        </div>
      </div>
    </DashboardLayout>
  );
};
