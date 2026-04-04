import { useState, useMemo, useCallback } from "react";

// ═══════════════════════════════════════════
// SAMPLE DATA — replace with your API data
// ═══════════════════════════════════════════

const SAMPLE_INVESTOR = {
  name: "Juan Dela Cruz",
  riskProfile: "Moderate", // "Conservative" | "Moderate" | "Aggressive"
};

const SAMPLE_CAMPAIGNS = [
  { id: 1, title: "Mangoes", description: "Mango plantation", imageUrl: null, industry: "Agriculture", projectType: "MSME(Company)", riskLevel: "Low", fundingRaised: 7500, fundingGoal: 100000, estReturn: "25%", duration: "Dec 15, 2026", status: "Active", company: { name: "Mango Farms PH", city: "Davao City" } },
  { id: 2, title: "Unnamed Project", description: "No description available", imageUrl: null, industry: "Agriculture", projectType: "Individuals", riskLevel: "High", fundingRaised: 0, fundingGoal: 0, estReturn: "N/A%", duration: "TBD", status: "Active", company: { name: "Unknown Issuer", city: "Manila" } },
  { id: 3, title: "Solar Installer", description: "test", imageUrl: null, industry: "Construction", projectType: "MSME(Company)", riskLevel: "Medium", fundingRaised: 10000, fundingGoal: 0, estReturn: "4%", duration: "May 30, 2026", status: "Active", company: { name: "Solar Installer PH", city: "Makati City" } },
  { id: 4, title: "BrewHaus Coffee Co.", description: "Specialty coffee roasting & retail chain expansion across Visayas", imageUrl: null, industry: "Food & Beverages", projectType: "MSME(Company)", riskLevel: "Low", fundingRaised: 450000, fundingGoal: 1000000, estReturn: "12%", duration: "Aug 1, 2027", status: "Active", company: { name: "BrewHaus Inc.", city: "Cebu City" } },
  { id: 5, title: "MedTech Diagnostics", description: "AI-powered diagnostic imaging for rural health centers", imageUrl: null, industry: "Medical & Pharmaceutical", projectType: "MSME(Company)", riskLevel: "High", fundingRaised: 2800000, fundingGoal: 10000000, estReturn: "35%", duration: "Jan 20, 2028", status: "Active", company: { name: "MedTech Solutions", city: "Taguig City" } },
  { id: 6, title: "BahaySolar Homes", description: "Affordable solar-powered housing development in Bulacan", imageUrl: null, industry: "Construction", projectType: "MSME(Company)", riskLevel: "Medium", fundingRaised: 1200000, fundingGoal: 5000000, estReturn: "15%", duration: "Mar 10, 2027", status: "Active", company: { name: "BahaySolar Dev Corp.", city: "Malolos City" } },
];

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const RISK_MATRIX = { Conservative: ["Low"], Moderate: ["Low", "Medium"], Aggressive: ["Low", "Medium", "High"] };
const RISK_META = {
  Low:    { color: "#15803D", bg: "#F0FDF4", border: "#86EFAC", label: "Low Risk",    icon: "🛡️" },
  Medium: { color: "#CA8A04", bg: "#FEFCE8", border: "#FDE047", label: "Medium Risk", icon: "⚡" },
  High:   { color: "#DC2626", bg: "#FEF2F2", border: "#FCA5A5", label: "High Risk",   icon: "🔥" },
};
const PROFILE_META = {
  Conservative: { color: "#15803D", bg: "#F0FDF4", border: "#BBF7D0", desc: "Low-risk notes, secured deals, short-term CF" },
  Moderate:     { color: "#0369A1", bg: "#F0F9FF", border: "#BAE6FD", desc: "Mix of secured + unsecured CF deals" },
  Aggressive:   { color: "#9333EA", bg: "#FAF5FF", border: "#D8B4FE", desc: "High-risk startups, early-stage ventures" },
};
const INDUSTRIES = ["Agriculture", "Hospitality", "Food & Beverages", "Retail", "Medical & Pharmaceutical", "Construction", "Others"];
const PROJECT_TYPES = ["Newest", "Top Popular", "Ending Soon", "Individuals", "MSME(Company)"];

// ═══════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════

const pct = (r, g) => g > 0 ? Math.min(100, Math.round((r / g) * 100)) : 0;
const fmtAmt = (n) => n >= 1e6 ? `₱${(n / 1e6).toFixed(1)}M` : `₱${n.toLocaleString()}`;
const isEligible = (profile, risk) => (RISK_MATRIX[profile] || []).includes(risk);

// ═══════════════════════════════════════════
// ICON FACTORY
// ═══════════════════════════════════════════

const I = (d, sz = 16, sw = 1.5) => (
  <svg width={sz} height={sz} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" d={p} />)}
  </svg>
);
const Ic = {
  filter: () => I("M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"),
  search: () => I("m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"),
  x: () => I("M6 18 18 6M6 6l12 12", 16, 2),
  chevR: () => I("m8.25 4.5 7.5 7.5-7.5 7.5", 16, 2),
  lock: () => I(["M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"]),
  shield: () => I("M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"),
  map: () => I(["M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z", "M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"]),
  sparkle: () => I(["M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"]),
};

// ═══════════════════════════════════════════
// PLACEHOLDER IMAGE
// ═══════════════════════════════════════════

const PALS = [["#1B3A2D","#3D7A5A","#6BC5A0"],["#2D5A3F","#5FA37A","#A8E6C3"],["#1A3C34","#4D8B6F","#8FCFAB"],["#274D3A","#6BAF8D","#B5E8D0"],["#1F4B3A","#4A9A70","#7DDBA8"],["#2A5C48","#5DB88A","#9EEAC5"]];

const CampaignImg = ({ url, index = 0, style = {} }) => {
  if (url) return <img src={url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...style }} />;
  const p = PALS[index % PALS.length];
  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", ...style }}>
      <svg width="100%" height="100%" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id={`cg${index}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={p[0]}/><stop offset="50%" stopColor={p[1]}/><stop offset="100%" stopColor={p[2]}/></linearGradient></defs>
        <rect width="600" height="400" fill={`url(#cg${index})`}/><circle cx="300" cy="170" r="24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/><rect x="255" y="215" width="90" height="55" rx="3" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      </svg>
    </div>
  );
};

// ═══════════════════════════════════════════
// RESPONSIVE CSS — ALL LAYOUT VIA CLASSES
// ═══════════════════════════════════════════

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap');
*{box-sizing:border-box;margin:0}

/* === BASE === */
.cf-page{font-family:'DM Sans',sans-serif;background:#F8F6F2;min-height:100vh;color:#1a1a1a}
.cf-wrap{max-width:1280px;margin:0 auto;padding:0 40px}

/* Hero */
.cf-hero{background:linear-gradient(135deg,#1B3A2D 0%,#2D5A3F 40%,#1B3A2D 100%);padding:40px 0 36px}
.cf-hero-inner{display:flex;justify-content:space-between;align-items:center;gap:20px}
.cf-hero-title{font-family:'Fraunces',serif;font-size:30px;font-weight:700;color:#fff;letter-spacing:-0.02em}
.cf-hero-sub{font-size:15px;color:rgba(255,255,255,0.6);margin-top:6px}
.cf-profile-card{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:14px 18px;backdrop-filter:blur(8px);color:#fff;max-width:280px;flex-shrink:0}

/* Toolbar */
.cf-toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:16px;padding-top:28px}
.cf-tab-group{display:flex;gap:4px;background:#EDEAE4;border-radius:14px;padding:4px;flex-shrink:0}
.cf-controls{display:flex;gap:10px;align-items:center}
.cf-search{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #E8E4DD;border-radius:12px;padding:8px 14px;min-width:220px}
.cf-search input{border:none;outline:none;font-size:14px;font-family:'DM Sans',sans-serif;background:transparent;width:100%;color:#1a1a1a}

/* Banner / legend */
.cf-banner{background:#fff;border:1px solid #E8E4DD;border-radius:14px;padding:16px 20px;margin-bottom:8px;margin-top:4px}
.cf-banner-inner{display:flex;align-items:center;gap:10px}
.cf-legend{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;margin-top:4px}

/* Cards grid */
.cf-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}

/* Filter panel */
.cf-filter-panel{background:#fff;border:1px solid #E8E4DD;border-radius:16px;padding:28px;margin-bottom:16px}
.cf-filter-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:32px}
.cf-filter-footer{display:flex;justify-content:space-between;align-items:center;margin-top:24px;padding-top:20px;border-top:1px solid #EDEAE4}

/* Card internals */
.cf-card{background:#fff;border-radius:18px;border:1px solid #E8E4DD;overflow:hidden;display:flex;flex-direction:column;transition:transform 0.2s,box-shadow 0.2s}
.cf-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(27,58,45,0.12)}
.cf-card-locked .cf-card-img-wrap{filter:grayscale(0.5) brightness(0.85)}
.cf-card-img-wrap{position:relative;aspect-ratio:16/10;overflow:hidden;background:#1B3A2D}
.cf-card-body{padding:20px 22px 0;flex:1;display:flex;flex-direction:column}
.cf-card-header{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px}
.cf-stats-row{display:flex;justify-content:space-between;gap:12px;padding:14px 0;border-top:1px solid #F3F1EC;margin-top:auto}
.cf-card-footer{padding:16px 22px 20px}

/* Summary */
.cf-summary{text-align:center;margin-top:32px;font-size:13px;color:#aaa}

/* Empty */
.cf-empty{text-align:center;padding:60px 20px}

/* Animations */
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.cf-anim{animation:fadeUp 0.4s ease both}

/* ═══════════════════════════════ */
/* TABLET ≤1024px                 */
/* ═══════════════════════════════ */
@media(max-width:1024px){
  .cf-wrap{padding:0 24px}
  .cf-hero{padding:32px 0 28px}
  .cf-hero-title{font-size:26px}
  .cf-grid{grid-template-columns:repeat(2,1fr);gap:20px}
  .cf-filter-grid{grid-template-columns:1fr 1fr;gap:24px}
  .cf-toolbar{flex-wrap:wrap}
  .cf-search{min-width:180px}
}

/* ═══════════════════════════════ */
/* MOBILE ≤640px                  */
/* ═══════════════════════════════ */
@media(max-width:640px){
  .cf-wrap{padding:0 16px}

  /* Hero stacks */
  .cf-hero{padding:24px 0 20px}
  .cf-hero-inner{flex-direction:column;align-items:flex-start}
  .cf-hero-title{font-size:22px}
  .cf-hero-sub{font-size:13px}
  .cf-profile-card{max-width:100%;width:100%}

  /* Toolbar stacks */
  .cf-toolbar{flex-direction:column;align-items:stretch;gap:12px;padding-top:20px}
  .cf-tab-group{align-self:stretch}
  .cf-tab-group button{flex:1;justify-content:center}
  .cf-controls{flex-direction:column;align-items:stretch}
  .cf-search{min-width:unset;width:100%}

  /* Filter button full width */
  .cf-filter-btn{width:100%;justify-content:center}

  /* Grid single column */
  .cf-grid{grid-template-columns:1fr;gap:16px}
  .cf-filter-grid{grid-template-columns:1fr;gap:16px}
  .cf-filter-panel{padding:20px 16px}
  .cf-filter-footer{flex-direction:column;gap:12px}
  .cf-filter-footer button{width:100%;text-align:center}

  /* Banner */
  .cf-banner{padding:14px 16px}
  .cf-banner-inner{flex-direction:column;align-items:flex-start;gap:8px}

  /* Legend wraps */
  .cf-legend{gap:6px}

  /* Card body tighter */
  .cf-card-body{padding:16px 16px 0}
  .cf-card-footer{padding:14px 16px 16px}
  .cf-stats-row{gap:6px}
}
`;

// ═══════════════════════════════════════════
// CAMPAIGN CARD
// ═══════════════════════════════════════════

function CampaignCard({ campaign, index, eligible, investorProfile, onViewDetails }) {
  const risk = RISK_META[campaign.riskLevel] || RISK_META.Medium;
  const progress = pct(campaign.fundingRaised, campaign.fundingGoal);

  return (
    <div className={`cf-card cf-anim ${!eligible ? "cf-card-locked" : ""}`} style={{ animationDelay: `${index * 0.06}s` }}>
      {/* Image */}
      <div className="cf-card-img-wrap">
        <CampaignImg url={campaign.imageUrl} index={index} />
        <div style={{ position: "absolute", top: 12, left: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100, background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`, backdropFilter: "blur(4px)" }}>
            {risk.icon} {risk.label}
          </span>
        </div>
        <span style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)", color: "#fff", fontSize: 11, fontWeight: 500, padding: "4px 10px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.15)" }}>
          {campaign.industry}
        </span>
        {!eligible && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>{Ic.lock()}</div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="cf-card-body">
        <div className="cf-card-header">
          <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: "#1B3A2D" }}>{campaign.title}</h3>
          {campaign.status === "Active" && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", flexShrink: 0, marginTop: 6, boxShadow: "0 0 0 3px rgba(34,197,94,0.2)" }} />}
        </div>
        <p style={{ fontSize: 13, color: "#888", lineHeight: 1.4, margin: "4px 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{campaign.description}</p>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, color: "#888", fontSize: 12 }}>
          {Ic.map()}<span>{campaign.company.name} · {campaign.company.city}</span>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
            <span style={{ color: "#555", fontWeight: 500 }}>Funding</span>
            <span style={{ fontWeight: 700, color: progress > 0 ? "#1B3A2D" : "#999" }}>{progress}%</span>
          </div>
          <div style={{ width: "100%", height: 6, borderRadius: 100, background: "#EDEAE4", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 100, background: "linear-gradient(90deg,#1B3A2D,#3D7A5A)", transition: "width 0.6s ease", width: `${progress}%` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#aaa" }}>
            <span>{fmtAmt(campaign.fundingRaised)}</span>
            <span>of {campaign.fundingGoal > 0 ? fmtAmt(campaign.fundingGoal) : "—"}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="cf-stats-row">
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500 }}>Required</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap" }}>{campaign.fundingGoal > 0 ? fmtAmt(campaign.fundingGoal) : "0 PHP"}</span>
          </div>
          <div style={{ width: 1, background: "#EDEAE4", alignSelf: "stretch" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500 }}>Est. Return</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#15803D", whiteSpace: "nowrap" }}>{campaign.estReturn}</span>
          </div>
          <div style={{ width: 1, background: "#EDEAE4", alignSelf: "stretch" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500 }}>Duration</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap" }}>{campaign.duration}</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="cf-card-footer">
        {eligible ? (
          <button onClick={() => onViewDetails(campaign.id)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 13, border: "none", borderRadius: 12, background: "linear-gradient(135deg,#1B3A2D,#2D5A3F)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 2px 8px rgba(27,58,45,0.2)" }}>
            View Details {Ic.chevR()}
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 0 2px", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#999" }}>
              {Ic.lock()}<span style={{ fontSize: 13, fontWeight: 500 }}>Not eligible for your Risk Profile</span>
            </div>
            <span style={{ fontSize: 11, color: "#bbb" }}>Your profile: {investorProfile} · Required: {campaign.riskLevel}</span>
          </div>
        )}
      </div>
    </div>
  );
}



// ═══════════════════════════════════════════
// FILTER PANEL
// ═══════════════════════════════════════════

function FilterPanel({ filters, onChange, onReset, onClose }) {
  const toggle = (key, val) => {
    const cur = filters[key] || [];
    onChange({ ...filters, [key]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] });
  };
  const CB = ({ checked, label, onToggle }) => (
    <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#555", cursor: "pointer", padding: "6px 0", userSelect: "none" }} onClick={onToggle}>
      <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${checked ? "#1B3A2D" : "#D4D0C8"}`, background: checked ? "#1B3A2D" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
        {checked && <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>}
      </div>
      <span>{label}</span>
    </label>
  );

  return (
    <div className="cf-filter-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 600, color: "#1B3A2D" }}>Filters</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#999", display: "flex", padding: 4 }}>{Ic.x()}</button>
      </div>
      <div className="cf-filter-grid">
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: "#1B3A2D", margin: "0 0 12px" }}>Risk Level:</h4>
          {["Low","Medium","High"].map(r => <CB key={r} label={RISK_META[r].label} checked={(filters.risk||[]).includes(r)} onToggle={() => toggle("risk",r)} />)}
        </div>
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: "#1B3A2D", margin: "0 0 12px" }}>Project Type:</h4>
          {PROJECT_TYPES.map(t => <CB key={t} label={t} checked={(filters.projectType||[]).includes(t)} onToggle={() => toggle("projectType",t)} />)}
        </div>
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: "#1B3A2D", margin: "0 0 12px" }}>Industry:</h4>
          {INDUSTRIES.map(ind => <CB key={ind} label={ind} checked={(filters.industry||[]).includes(ind)} onToggle={() => toggle("industry",ind)} />)}
        </div>
      </div>
      <div className="cf-filter-footer">
        <button onClick={onReset} style={{ background: "none", border: "none", fontSize: 14, fontWeight: 500, color: "#999", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", textDecoration: "underline", textUnderlineOffset: 3 }}>Reset Filters</button>
        <button onClick={onClose} style={{ padding: "10px 28px", border: "none", borderRadius: 10, background: "#1B3A2D", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Apply</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════

export default function CampaignFeed({
  investor = SAMPLE_INVESTOR,
  campaigns = SAMPLE_CAMPAIGNS,
  onViewDetails,
}) {
  const [tab, setTab] = useState("for-you");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ risk: [], projectType: [], industry: [] });

  const handleView = useCallback((id) => { if (onViewDetails) onViewDetails(id); }, [onViewDetails]);
  const hasActive = useMemo(() => Object.values(filters).some(a => a.length > 0), [filters]);

  const displayed = useMemo(() => {
    let list = campaigns;
    if (tab === "for-you") list = list.filter(c => isEligible(investor.riskProfile, c.riskLevel));
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.company.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q)); }
    if (filters.risk.length) list = list.filter(c => filters.risk.includes(c.riskLevel));
    if (filters.projectType.length) list = list.filter(c => filters.projectType.includes(c.projectType));
    if (filters.industry.length) list = list.filter(c => filters.industry.includes(c.industry));
    return list;
  }, [campaigns, tab, search, filters, investor.riskProfile]);

  const forYouCount = useMemo(() => campaigns.filter(c => isEligible(investor.riskProfile, c.riskLevel)).length, [campaigns, investor.riskProfile]);
  const profile = PROFILE_META[investor.riskProfile] || PROFILE_META.Moderate;

  const TabBtn = ({ id, label, count, icon }) => (
    <button onClick={() => setTab(id)} className="cf-tab-btn" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", border: "none", borderRadius: 11, background: tab === id ? "#fff" : "transparent", fontSize: 14, fontWeight: tab === id ? 600 : 500, color: tab === id ? "#1B3A2D" : "#6B6B6B", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap", boxShadow: tab === id ? "0 1px 4px rgba(0,0,0,0.06)" : "none" }}>
      {icon} {label}
      <span style={{ fontSize: 11, fontWeight: 700, background: tab === id ? "#1B3A2D" : "#E8E4DD", color: tab === id ? "#fff" : "#888", borderRadius: 100, padding: "2px 8px", minWidth: 20, textAlign: "center" }}>{count}</span>
    </button>
  );

  return (
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
            <div className="cf-profile-card">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                {Ic.shield()}<span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Your Risk Profile</span>
              </div>
              <span style={{ display: "inline-block", fontSize: 13, fontWeight: 700, padding: "5px 16px", borderRadius: 100, background: profile.bg, color: profile.color, border: `1px solid ${profile.border}` }}>
                {investor.riskProfile}
              </span>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", margin: "8px 0 0", lineHeight: 1.4 }}>{profile.desc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TOOLBAR ═══ */}
      <div className="cf-wrap">
        <div className="cf-toolbar">
          <div className="cf-tab-group">
            <TabBtn id="for-you" label="For You" count={forYouCount} icon={Ic.sparkle()} />
            <TabBtn id="all" label="All Campaigns" count={campaigns.length} icon={null} />
          </div>
          <div className="cf-controls">
            <div className="cf-search">
              <span style={{ color: "#999" }}>{Ic.search()}</span>
              <input type="text" placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#999", display: "flex" }}>{Ic.x()}</button>}
            </div>
            <button className="cf-filter-btn" onClick={() => setShowFilters(!showFilters)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", border: `1px solid ${hasActive ? "#1B3A2D" : "#E8E4DD"}`, borderRadius: 12, background: "#fff", fontSize: 14, fontWeight: hasActive ? 600 : 500, color: hasActive ? "#1B3A2D" : "#555", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", position: "relative", whiteSpace: "nowrap" }}>
              {Ic.filter()}<span>Filters</span>
              {hasActive && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#DC2626", position: "absolute", top: 8, right: 8 }} />}
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && <FilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters({ risk: [], projectType: [], industry: [] })} onClose={() => setShowFilters(false)} />}

        {/* For You banner */}
        {tab === "for-you" && (
          <div className="cf-banner">
            <div className="cf-banner-inner">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: profile.bg, display: "flex", alignItems: "center", justifyContent: "center", color: profile.color, border: `1px solid ${profile.border}`, flexShrink: 0 }}>{Ic.sparkle()}</div>
              <div>
                <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#1B3A2D" }}>Showing campaigns that match your <strong style={{ color: profile.color }}>{investor.riskProfile}</strong> risk profile</span>
                <span style={{ display: "block", fontSize: 12, color: "#888", marginTop: 2 }}>{profile.desc}</span>
              </div>
            </div>
          </div>
        )}

        {/* All tab risk legend */}
        {tab === "all" && (
          <div className="cf-legend">
            <span style={{ fontSize: 13, color: "#888", fontWeight: 500, marginRight: 4 }}>Risk levels:</span>
            {["Low","Medium","High"].map(r => {
              const m = RISK_META[r]; const ok = isEligible(investor.riskProfile, r);
              return <span key={r} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 100, background: m.bg, color: m.color, border: `1px solid ${m.border}`, opacity: ok ? 1 : 0.5 }}>{m.icon} {m.label} {ok ? "✓" : "✗"}</span>;
            })}
          </div>
        )}
      </div>

      {/* ═══ CARDS ═══ */}
      <div className="cf-wrap" style={{ paddingTop: 24, paddingBottom: 60 }}>
        {displayed.length > 0 ? (
          <div className="cf-grid">
            {displayed.map((c, i) => (
              <CampaignCard key={c.id} campaign={c} index={i} eligible={isEligible(investor.riskProfile, c.riskLevel)} investorProfile={investor.riskProfile} onViewDetails={handleView} />
            ))}
          </div>
        ) : (
          <div className="cf-empty">
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 600, color: "#1B3A2D", marginBottom: 8 }}>No campaigns found</h3>
            <p style={{ fontSize: 14, color: "#888", lineHeight: 1.5 }}>
              {tab === "for-you" ? "No campaigns match your risk profile right now. Check back later or view all campaigns." : "Try adjusting your search or filters."}
            </p>
            {tab === "for-you" && <button onClick={() => setTab("all")} style={{ padding: "10px 28px", border: "none", borderRadius: 10, background: "#1B3A2D", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", marginTop: 16 }}>View All Campaigns</button>}
          </div>
        )}
        {displayed.length > 0 && (
          <div className="cf-summary">
            Showing {displayed.length} of {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
            {tab === "for-you" && <span> · Matching your <strong>{investor.riskProfile}</strong> profile</span>}
          </div>
        )}
      </div>
    </div>
  );
}
