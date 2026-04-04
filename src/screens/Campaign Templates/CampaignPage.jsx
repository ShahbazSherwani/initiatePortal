import { useState, useEffect, useMemo, useCallback } from "react";

// ═══════════════════════════════════════════
// SAMPLE DATA — replace with your API data
// See INTEGRATION.md for full documentation
// ═══════════════════════════════════════════

const SAMPLE_DATA = {
  campaign: {
    title: "Solar Installer",
    status: "Pending",
    description: "test",
    riskLevel: "Medium",
    requiredFunding: "0 PHP",
    estReturn: "4%",
    duration: "May 30, 2026",
    minInvestment: 100,
    retailLimit: "₱500,001,100,000",
    used: "₱0",
    remainingCapacity: "₱500,001,100,000",
  },
  company: {
    name: "Solar Installer PH",
    registeredName: "Solar Installer Philippines Inc.",
    industry: "Renewable Energy — Solar Installation",
    city: "Makati City",
    yearFounded: 2019,
    secRegistration: "CS202301234",
    description: "Solar Installer PH is a leading solar energy solutions provider in the Philippines, specializing in residential and commercial photovoltaic installations. The company has completed over 1,200 projects across Luzon and Visayas since its founding.",
    teamSize: "50–100 employees",
    website: "solarinstaller.ph",
    logoUrl: null,
  },
  escrowSteps: [
    { label: "Pending", done: true, active: true },
    { label: "Funds Received", done: false, active: false },
    { label: "Escrow Secured", done: false, active: false },
    { label: "Released to Issuer", done: false, active: false },
  ],
  gallery: [
    { id: 1, url: null, caption: "Rooftop installation in Makati" },
    { id: 2, url: null, caption: "Commercial solar array — BGC" },
    { id: 3, url: null, caption: "Residential project in Quezon City" },
    { id: 4, url: null, caption: "Team on-site inspection" },
    { id: 5, url: null, caption: "Warehouse & panel inventory" },
    { id: 6, url: null, caption: "Completed farm installation — Laguna" },
  ],
  keyPeople: [
    { name: "Giovanni Santos", role: "Chief Executive Officer" },
    { name: "Maria Cruz", role: "Chief Financial Officer" },
    { name: "Rafael Lim", role: "Chief Technology Officer" },
  ],
  directors: [
    { name: "Giovanni Santos", position: "Chairman / CEO", type: "Director" },
    { name: "Maria Cruz", position: "Treasurer / CFO", type: "Director" },
    { name: "Rafael Lim", position: "Corporate Secretary / CTO", type: "Director" },
    { name: "Ana Reyes", position: "Independent Director", type: "Director" },
    { name: "Carlos Tan", position: "VP of Operations", type: "Management" },
    { name: "Sofia Garcia", position: "VP of Sales & Marketing", type: "Management" },
    { name: "Miguel Torres", position: "Head of Engineering", type: "Management" },
  ],
  financials: [
    { year: "2024", grossRevenue: 85400000, netIncome: 12300000, totalAssets: 142000000, totalLiabilities: 58700000 },
    { year: "2023", grossRevenue: 62100000, netIncome: 8750000, totalAssets: 118500000, totalLiabilities: 49200000 },
    { year: "2022", grossRevenue: 41800000, netIncome: -2150000, totalAssets: 95300000, totalLiabilities: 52100000 },
  ],
  documents: [
    { name: "Annual Report 2025", type: "PDF", size: "2.4 MB", category: "Financial", url: "#" },
    { name: "Company Profile", type: "PDF", size: "1.1 MB", category: "General", url: "#" },
    { name: "SEC Registration Certificate", type: "PDF", size: "540 KB", category: "Legal", url: "#" },
    { name: "Audited Financial Statements 2024", type: "PDF", size: "3.8 MB", category: "Financial", url: "#" },
    { name: "Business Permit & Licenses", type: "PDF", size: "780 KB", category: "Legal", url: "#" },
    { name: "Project Portfolio", type: "PDF", size: "5.2 MB", category: "General", url: "#" },
  ],
};

// ═══════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════

const getInitials = (name) => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

const formatPHP = (n) => {
  const abs = Math.abs(n);
  const f = abs >= 1e6 ? `₱${(abs / 1e6).toFixed(2)}M` : `₱${abs.toLocaleString()}`;
  return n < 0 ? `(${f})` : f;
};

const pctChange = (curr, prev) => prev ? (((curr - prev) / Math.abs(prev)) * 100).toFixed(1) : null;

const RISK = {
  Low:    { color: "#15803D", bg: "#F0FDF4", border: "#86EFAC", barW: "33%",  grad: "#22C55E" },
  Medium: { color: "#CA8A04", bg: "#FEFCE8", border: "#FDE047", barW: "66%",  grad: "linear-gradient(90deg,#22C55E,#EAB308)" },
  High:   { color: "#DC2626", bg: "#FEF2F2", border: "#FCA5A5", barW: "100%", grad: "linear-gradient(90deg,#22C55E,#EAB308,#EF4444)" },
};

const CAT_COLORS = {
  Financial: { bg: "#FFF7ED", text: "#C2410C", border: "#FDBA74" },
  Legal:     { bg: "#EFF6FF", text: "#1D4ED8", border: "#93C5FD" },
  General:   { bg: "#F0FDF4", text: "#15803D", border: "#86EFAC" },
};

const PALETTES = [["#1B3A2D","#3D7A5A","#6BC5A0"],["#2D5A3F","#5FA37A","#A8E6C3"],["#1A3C34","#4D8B6F","#8FCFAB"],["#274D3A","#6BAF8D","#B5E8D0"],["#1F4B3A","#4A9A70","#7DDBA8"],["#2A5C48","#5DB88A","#9EEAC5"]];

// ═══════════════════════════════════════════
// ICONS (shared SVG factory)
// ═══════════════════════════════════════════

const I = (d, size = 16, sw = 1.5) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" d={p} />)}
  </svg>
);

const Icon = {
  building: () => I(["M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"], 18),
  map: () => I(["M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z", "M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"]),
  calendar: () => I(["M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"]),
  users: () => I(["M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"]),
  globe: () => I(["M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.467.73-3.56"]),
  shield: () => I("M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"),
  doc: () => I("M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z", 20),
  download: () => I("M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3", 16, 1.8),
  check: () => I("m4.5 12.75 6 6 9-13.5", 14, 2.5),
  sun: () => I("M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"),
  close: () => I("M6 18 18 6M6 6l12 12", 24, 2),
  chevL: () => I("M15.75 19.5 8.25 12l7.5-7.5", 28, 2),
  chevR: () => I("m8.25 4.5 7.5 7.5-7.5 7.5", 28, 2),
  camera: () => I(["M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z", "M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"]),
  expand: () => I("M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15", 16, 1.8),
  alert: () => I("M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z", 18),
  chart: () => I("M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z", 18),
  trendUp: () => I("M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941", 16, 1.8),
  trendDown: () => I("M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 5.834 5.418l2.74 1.22m0 0-5.94 2.281m5.94-2.28-2.28-5.941", 16, 1.8),
};

// ═══════════════════════════════════════════
// REUSABLE SUB-COMPONENTS
// ═══════════════════════════════════════════

/** Renders a real image or a gradient placeholder */
const CampaignImage = ({ url, index = 0, caption = "", style = {} }) => {
  if (url) return <img src={url} alt={caption} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...style }} />;
  const p = PALETTES[index % PALETTES.length];
  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", ...style }}>
      <svg width="100%" height="100%" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id={`g${index}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={p[0]} /><stop offset="50%" stopColor={p[1]} /><stop offset="100%" stopColor={p[2]} /></linearGradient></defs>
        <rect width="600" height="400" fill={`url(#g${index})`} />
        <circle cx="300" cy="160" r="28" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
        <rect x="240" y="210" width="120" height="75" rx="3" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
        {caption && <text x="300" y="345" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="13" fontFamily="DM Sans,sans-serif">{caption}</text>}
      </svg>
    </div>
  );
};

/** Card wrapper */
const Card = ({ children, style = {} }) => <section style={{ ...$.card, ...style }}>{children}</section>;

/** Section title */
const Title = ({ children, style = {} }) => <h3 style={{ ...$.cardTitle, ...style }}>{children}</h3>;

/** Toggle pill group */
const PillToggle = ({ options, active, onChange, labelMap = {} }) => (
  <div style={{ display: "flex", gap: 4, background: "#EDEAE4", borderRadius: 10, padding: 3 }}>
    {options.map(o => (
      <button key={o} onClick={() => onChange(o)} style={{ ...$.pill, ...(active === o ? $.pillActive : {}) }}>
        {labelMap[o] || o}
      </button>
    ))}
  </div>
);

/** Avatar circle with auto-initials */
const Avatar = ({ name, size = 44, style = {} }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg,#1B3A2D,#3D7A5A)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 700, flexShrink: 0, ...style }}>
    {getInitials(name)}
  </div>
);

/** Badge */
const Badge = ({ children, bg, color, border }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: bg, color, border: `1px solid ${border}`, borderRadius: 100, padding: "4px 12px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
    {children}
  </span>
);

// ═══════════════════════════════════════════
// RESPONSIVE CSS
// ═══════════════════════════════════════════

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap');
*{box-sizing:border-box}
.cp-page{font-family:'DM Sans',sans-serif;background:#F8F6F2;min-height:100vh;color:#1a1a1a}
.cp-header{background:linear-gradient(135deg,#1B3A2D 0%,#2D5A3F 50%,#1B3A2D 100%);padding:32px 40px 24px}
.cp-header-inner{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.cp-header-left{display:flex;align-items:center;gap:16px}
.cp-gallery-wrap{max-width:1200px;margin:0 auto;padding:24px 40px 0}
.cp-gallery-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;border-radius:16px;overflow:hidden}
.cp-thumb-grid{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:6px}
.cp-main{display:grid;grid-template-columns:1fr 360px;gap:28px;max-width:1200px;margin:0 auto;padding:28px 40px 60px;align-items:start}
.cp-sidebar{display:flex;flex-direction:column;gap:20px;position:sticky;top:24px;align-self:start}
.cp-g3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.cp-g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.cp-escrow{display:flex;align-items:flex-start;justify-content:space-between;position:relative}
.cp-photo-strip{display:flex;justify-content:space-between;align-items:center;margin-top:12px}
.cp-filter-row{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}
.cp-doc-item{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:12px;background:#FAFAF7;border:1px solid #EDEAE4}
.cp-investor-inner{display:flex;align-items:center;gap:12px;flex-wrap:wrap}

@media(max-width:1024px){
  .cp-header{padding:24px 24px 20px}
  .cp-gallery-wrap{padding:20px 24px 0}
  .cp-main{grid-template-columns:1fr;padding:24px 24px 48px}
  .cp-sidebar{position:static;order:-1}
}
@media(max-width:640px){
  .cp-header{padding:20px 16px 16px}
  .cp-header-inner{flex-direction:column;align-items:flex-start;gap:12px}
  .cp-gallery-wrap{padding:16px 16px 0}
  .cp-gallery-grid{grid-template-columns:1fr;border-radius:12px}
  .cp-thumb-grid{grid-template-columns:1fr 1fr;grid-template-rows:auto}
  .cp-thumb-grid>*:nth-child(n+3){display:none}
  .cp-main{grid-template-columns:1fr;padding:20px 16px 40px;gap:20px}
  .cp-sidebar{position:static;order:-1}
  .cp-g3{grid-template-columns:1fr}
  .cp-g2{grid-template-columns:1fr}
  .cp-escrow{flex-wrap:wrap;gap:8px;justify-content:center}
  .cp-escrow .cp-eline{display:none}
  .cp-doc-item{flex-wrap:wrap;gap:10px}
}
.cp-lb{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.88);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:24px}
@media(max-width:640px){.cp-lb{padding:12px}}
`;

// ═══════════════════════════════════════════
// LIGHTBOX
// ═══════════════════════════════════════════

function Lightbox({ images, idx, onClose, onPrev, onNext }) {
  useEffect(() => {
    if (idx < 0) return;
    const h = (e) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowLeft") onPrev(); if (e.key === "ArrowRight") onNext(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [idx, onClose, onPrev, onNext]);

  if (idx < 0) return null;
  const img = images[idx];
  const navBtn = (side, action, icon) => (
    <button onClick={action} style={{ position: "absolute", top: "50%", [side]: 12, transform: "translateY(-60%)", zIndex: 10, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}>{icon}</button>
  );

  return (
    <div className="cp-lb" onClick={onClose}>
      <div style={{ position: "relative", maxWidth: 860, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: -52, right: 0, zIndex: 10, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}>{Icon.close()}</button>
        {idx > 0 && navBtn("left", onPrev, Icon.chevL())}
        {idx < images.length - 1 && navBtn("right", onNext, Icon.chevR())}
        <div style={{ width: "100%", aspectRatio: "16/10", borderRadius: 12, overflow: "hidden", background: "#111" }}>
          <CampaignImage url={img.url} index={idx} caption={img.caption} style={{ borderRadius: 12 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: 14, padding: "0 4px" }}>
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>{img.caption}</span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 500 }}>{idx + 1} / {images.length}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB PANELS
// ═══════════════════════════════════════════

function OverviewTab({ campaign, escrowSteps }) {
  const risk = RISK[campaign.riskLevel] || RISK.Medium;
  return (
    <div>
      <Card>
        <Title>Campaign Details</Title>
        <p style={$.desc}>{campaign.description}</p>
        {/* Escrow */}
        <div style={$.escrowBox}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Escrow Status</span>
            <Badge bg="#FFF7ED" color="#C2410C" border="#FDBA74">{campaign.status}</Badge>
          </div>
          <div className="cp-escrow">
            {escrowSteps.map((step, i) => (
              <div key={i} style={$.escrowStep}>
                <div style={{ ...$.escrowDot, ...(step.active ? $.escrowDotOn : {}), ...(step.done && !step.active ? $.escrowDotDone : {}) }}>
                  {step.done && Icon.check()}
                </div>
                <span style={{ ...$.escrowLabel, ...(step.active ? { color: "#1a1a1a", fontWeight: 600 } : {}) }}>{step.label}</span>
                {i < escrowSteps.length - 1 && <div className="cp-eline" style={{ ...$.escrowLine, ...(step.done ? { background: "#5F7161" } : {}) }} />}
              </div>
            ))}
          </div>
        </div>
        {/* Metrics */}
        <div className="cp-g3">
          {[["Required Funding", campaign.requiredFunding, false], ["Est. Return", campaign.estReturn, true], ["Duration", campaign.duration, false]].map(([label, val, green], i) => (
            <div key={i} style={$.metricCard}>
              <span style={$.metricLabel}>{label}</span>
              <span style={{ ...$.metricVal, ...(green ? { color: "#15803D" } : {}) }}>{val}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Risk */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Title style={{ margin: 0 }}>Risk Assessment</Title>
          <Badge bg={risk.bg} color={risk.color} border={risk.border}>{Icon.alert()} {campaign.riskLevel} Risk</Badge>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ width: "100%", height: 8, borderRadius: 100, background: "#EDEAE4", overflow: "hidden", marginBottom: 8 }}>
            <div style={{ height: "100%", borderRadius: 100, width: risk.barW, background: risk.grad, transition: "width 0.4s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {["Low", "Medium", "High"].map(l => (
              <span key={l} style={{ fontSize: 11, color: campaign.riskLevel === l ? risk.color : "#bbb", fontWeight: campaign.riskLevel === l ? 600 : 400 }}>{l}</span>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 13, color: "#777", lineHeight: 1.6, margin: 0 }}>
          This risk level is determined based on the issuer's financial health, industry volatility, and campaign structure. Review company profile and financial statements for details.
        </p>
      </Card>

      <Card style={{ padding: "20px 28px", marginBottom: 0 }}>
        <div className="cp-investor-inner">
          <Badge bg="#EFF6FF" color="#1D4ED8" border="#BFDBFE">Retail Investor — 10% limit</Badge>
          <span style={{ fontSize: 13, color: "#888" }}>Remaining capacity: {campaign.remainingCapacity}</span>
        </div>
      </Card>
    </div>
  );
}

function CompanyTab({ company, keyPeople, directors, financials }) {
  const [dmFilter, setDmFilter] = useState("All");
  const [fy, setFy] = useState(financials[0]?.year || "");

  const filteredDM = useMemo(() => dmFilter === "All" ? directors : directors.filter(d => d.type === dmFilter), [directors, dmFilter]);
  const currentFY = useMemo(() => financials.find(f => f.year === fy), [financials, fy]);
  const prevFY = useMemo(() => financials.find(f => parseInt(f.year) === parseInt(fy) - 1), [financials, fy]);

  const details = [
    [Icon.sun(), "Industry", company.industry],
    [Icon.map(), "City", company.city],
    [Icon.calendar(), "Year Founded", company.yearFounded],
    [Icon.users(), "Team Size", company.teamSize],
    [Icon.shield(), "SEC Registration", company.secRegistration],
    [Icon.globe(), "Website", company.website, true],
  ];

  return (
    <div>
      {/* Profile */}
      <Card>
        <div style={$.companyHead}>
          <div style={$.companyLogo}>
            {company.logoUrl ? <img src={company.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 12 }} /> : <span style={{ color: "#5F7161" }}>{Icon.sun()}</span>}
          </div>
          <div>
            <h3 style={{ ...$.cardTitle, margin: 0, fontSize: 20 }}>{company.name}</h3>
            <p style={{ fontSize: 13, color: "#888", margin: "2px 0 0" }}>{company.registeredName}</p>
          </div>
        </div>
        <p style={$.desc}>{company.description}</p>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {details.map(([icon, label, value, isLink], i) => (
            <div key={i} style={$.detailRow}>
              <span style={$.detailIcon}>{icon}</span>
              <div>
                <span style={$.detailLabel}>{label}</span>
                <span style={{ ...$.detailValue, ...(isLink ? { color: "#2563EB", textDecoration: "underline", cursor: "pointer" } : {}) }}>{value}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Key People */}
      {keyPeople.length > 0 && (
        <Card>
          <Title>Key People</Title>
          <div className="cp-g3">
            {keyPeople.map((m, i) => (
              <div key={i} style={$.teamCard}>
                <Avatar name={m.name} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{m.name}</span>
                <span style={{ fontSize: 11, color: "#888" }}>{m.role}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Directors & Management */}
      {directors.length > 0 && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <Title style={{ margin: 0 }}>Directors & Management</Title>
            <PillToggle options={["All", "Director", "Management"]} active={dmFilter} onChange={setDmFilter} labelMap={{ Director: "Directors", Management: "Management" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredDM.map((p, i) => (
              <div key={i} style={$.detailRow}>
                <Avatar name={p.name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>{p.name}</span>
                  <span style={{ display: "block", fontSize: 12, color: "#888", marginTop: 1 }}>{p.position}</span>
                </div>
                <Badge bg={p.type === "Director" ? "#EFF6FF" : "#F0FDF4"} color={p.type === "Director" ? "#1D4ED8" : "#15803D"} border={p.type === "Director" ? "#BFDBFE" : "#86EFAC"}>{p.type}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Financial Statements */}
      {financials.length > 0 && currentFY && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB" }}>{Icon.chart()}</div>
              <Title style={{ margin: 0 }}>Financial Statements</Title>
            </div>
            <PillToggle options={financials.map(f => f.year)} active={fy} onChange={setFy} labelMap={Object.fromEntries(financials.map(f => [f.year, `FY ${f.year}`]))} />
          </div>
          <div className="cp-g2">
            {[
              ["Gross Revenue", currentFY.grossRevenue, prevFY?.grossRevenue, false],
              ["Net Income / (Loss) After Tax", currentFY.netIncome, prevFY?.netIncome, false],
              ["Total Assets", currentFY.totalAssets, prevFY?.totalAssets, false],
              ["Total Liabilities", currentFY.totalLiabilities, prevFY?.totalLiabilities, true],
            ].map(([label, val, prev, invertColor], i) => {
              const change = pctChange(val, prev);
              const isPos = change && parseFloat(change) > 0;
              const changeColor = invertColor ? (isPos ? "#DC2626" : "#15803D") : (isPos ? "#15803D" : "#DC2626");
              return (
                <div key={i} style={$.finCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={$.metricLabel}>{label}</span>
                    {change && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 600, color: changeColor }}>{isPos ? Icon.trendUp() : Icon.trendDown()} {isPos ? "+" : ""}{change}%</span>}
                  </div>
                  <span style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: val < 0 ? "#DC2626" : "#1a1a1a" }}>{formatPHP(val)}</span>
                  {prev != null && <span style={{ fontSize: 11, color: "#aaa" }}>vs {formatPHP(prev)} in FY {parseInt(fy) - 1}</span>}
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 12, color: "#aaa", margin: "16px 0 0", lineHeight: 1.5 }}>Figures based on audited financial statements. See Documents tab for full reports.</p>
        </Card>
      )}
    </div>
  );
}

function DocumentsTab({ documents }) {
  const [filter, setFilter] = useState("All");
  const categories = useMemo(() => ["All", ...new Set(documents.map(d => d.category))], [documents]);
  const filtered = useMemo(() => filter === "All" ? documents : documents.filter(d => d.category === filter), [documents, filter]);

  return (
    <Card>
      <Title>Company Documents & Reports</Title>
      <p style={$.desc}>Review the campaign creator's official filings, financial reports, and company documents before investing.</p>
      <div className="cp-filter-row">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{ ...$.pill, borderRadius: 100, padding: "7px 16px", fontSize: 13, ...(filter === cat ? { background: "#1B3A2D", color: "#fff", borderColor: "#1B3A2D" } : { border: "1px solid #E8E4DD" }) }}>{cat}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((doc, i) => {
          const cc = CAT_COLORS[doc.category] || CAT_COLORS.General;
          return (
            <div key={i} className="cp-doc-item">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#FEF2F2", color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{Icon.doc()}</div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</span>
                <span style={{ fontSize: 12, color: "#999" }}>{doc.type} · {doc.size}</span>
              </div>
              <Badge bg={cc.bg} color={cc.text} border={cc.border}>{doc.category}</Badge>
              <a href={doc.url || "#"} download style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #E8E4DD", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#555", flexShrink: 0, textDecoration: "none" }}>{Icon.download()}</a>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════

export default function CampaignPage({
  campaign   = SAMPLE_DATA.campaign,
  company    = SAMPLE_DATA.company,
  escrowSteps = SAMPLE_DATA.escrowSteps,
  gallery    = SAMPLE_DATA.gallery,
  keyPeople  = SAMPLE_DATA.keyPeople,
  directors  = SAMPLE_DATA.directors,
  financials = SAMPLE_DATA.financials,
  documents  = SAMPLE_DATA.documents,
  onInvest,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [amount, setAmount] = useState("");
  const [lbIdx, setLbIdx] = useState(-1);

  const handleInvest = useCallback(() => {
    if (onInvest) onInvest(parseFloat(amount) || 0);
  }, [amount, onInvest]);

  const risk = RISK[campaign.riskLevel] || RISK.Medium;

  return (
    <div className="cp-page">
      <style>{CSS}</style>
      <Lightbox images={gallery} idx={lbIdx} onClose={() => setLbIdx(-1)} onPrev={() => setLbIdx(i => Math.max(0, i - 1))} onNext={() => setLbIdx(i => Math.min(gallery.length - 1, i + 1))} />

      {/* HEADER */}
      <header className="cp-header">
        <div className="cp-header-inner">
          <div className="cp-header-left">
            <div style={$.logoMark}><svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg></div>
            <div>
              <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>{campaign.title}</h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", margin: "2px 0 0" }}>by {company.name}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 100, padding: "8px 18px", fontSize: 13, fontWeight: 600, color: "#F9DC5C", whiteSpace: "nowrap" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F9DC5C" }} />{campaign.status}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(249,220,92,0.1)", border: "1px solid rgba(249,220,92,0.25)", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#F9DC5C" }}>
          {Icon.shield()}<span>This campaign is published on the platform but remains subject to verification.</span>
        </div>
      </header>

      {/* GALLERY */}
      {gallery.length > 0 && (
        <div className="cp-gallery-wrap">
          <div className="cp-gallery-grid">
            <div style={{ position: "relative", cursor: "pointer", aspectRatio: "16/11", background: "#1B3A2D", overflow: "hidden" }} onClick={() => setLbIdx(0)}>
              <CampaignImage url={gallery[0]?.url} index={0} style={{ width: "100%", height: "100%" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 60%)", padding: "28px 20px 16px", display: "flex", alignItems: "flex-end" }}>
                <Badge bg="rgba(255,255,255,0.15)" color="#fff" border="rgba(255,255,255,0.2)">{Icon.camera()} Featured Image</Badge>
              </div>
              <button style={{ position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}>{Icon.expand()}</button>
            </div>
            <div className="cp-thumb-grid">
              {gallery.slice(1, 5).map((img, i) => (
                <div key={img.id} style={{ position: "relative", overflow: "hidden", cursor: "pointer", background: "#1B3A2D", ...(i === 1 ? { borderTopRightRadius: 16 } : {}), ...(i === 3 ? { borderBottomRightRadius: 16 } : {}) }} onClick={() => setLbIdx(i + 1)}>
                  <CampaignImage url={img.url} index={i + 1} style={{ width: "100%", height: "100%" }} />
                  {i === 3 && gallery.length > 5 && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}><span style={{ color: "#fff", fontSize: 17, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>+{gallery.length - 5} more</span></div>}
                </div>
              ))}
            </div>
          </div>
          <div className="cp-photo-strip">
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#888", fontWeight: 500 }}>{Icon.camera()} {gallery.length} photos</span>
            <button onClick={() => setLbIdx(0)} style={{ background: "none", border: "none", fontSize: 13, fontWeight: 600, color: "#1B3A2D", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", textDecoration: "underline", textUnderlineOffset: 3 }}>View all photos</button>
          </div>
        </div>
      )}

      {/* MAIN */}
      <div className="cp-main">
        <div>
          {/* Tab nav */}
          <nav style={{ display: "flex", gap: 4, background: "#EDEAE4", borderRadius: 14, padding: 4, marginBottom: 24 }}>
            {["overview", "company", "documents"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ ...$.pill, flex: 1, padding: "10px 16px", borderRadius: 11, fontSize: 14, ...(activeTab === tab ? $.pillActive : {}) }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
          {activeTab === "overview"  && <OverviewTab campaign={campaign} escrowSteps={escrowSteps} />}
          {activeTab === "company"   && <CompanyTab company={company} keyPeople={keyPeople} directors={directors} financials={financials} />}
          {activeTab === "documents" && <DocumentsTab documents={documents} />}
        </div>

        {/* SIDEBAR */}
        <aside className="cp-sidebar">
          <div style={$.sideCard}>
            <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 600, color: "#1B3A2D", margin: "0 0 20px" }}>Invest in this Campaign</h3>
            {/* Risk mini-badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: risk.bg, border: `1px solid ${risk.border}`, marginBottom: 20 }}>
              {Icon.alert()}
              <div style={{ flex: 1 }}>
                <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: risk.color }}>{campaign.riskLevel} Risk</span>
                <span style={{ display: "block", fontSize: 11, color: "#999", marginTop: 1 }}>Review risk details in Overview</span>
              </div>
            </div>
            {/* Meta */}
            <div style={{ display: "flex", flexDirection: "column", marginBottom: 24, borderRadius: 12, border: "1px solid #EDEAE4", overflow: "hidden" }}>
              {[["Min. Investment", `₱${campaign.minInvestment}`], ["Retail Limit", campaign.retailLimit], ["Used", campaign.used]].map(([l, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #F3F1EC" }}>
                  <span style={{ fontSize: 13, color: "#888" }}>{l}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>How much would you like to invest?</label>
            <div style={{ display: "flex", alignItems: "center", border: "2px solid #E8E4DD", borderRadius: 12, padding: "0 16px", marginBottom: 16, background: "#FAFAF7" }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: "#888", marginRight: 8 }}>₱</span>
              <input type="number" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} style={{ flex: 1, padding: "14px 0", border: "none", outline: "none", fontSize: 16, fontFamily: "'DM Sans',sans-serif", background: "transparent", width: "100%" }} />
            </div>
            <button onClick={handleInvest} style={{ width: "100%", padding: 14, border: "none", borderRadius: 12, background: "linear-gradient(135deg,#1B3A2D,#2D5A3F)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 2px 8px rgba(27,58,45,0.25)" }}>Continue</button>
            <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", margin: "14px 0 0", lineHeight: 1.5 }}>By continuing, you acknowledge that you have read the campaign details, company profile, and associated documents.</p>
          </div>

          {/* Sidebar company snapshot */}
          <div style={$.sideCard}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #F3F1EC" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F0F5F1", display: "flex", alignItems: "center", justifyContent: "center", color: "#5F7161", border: "1px solid #D4DDD6", flexShrink: 0 }}>{Icon.building()}</div>
              <div><p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{company.name}</p><p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>{company.city}</p></div>
            </div>
            {[["Industry", company.industry.split("—")[0].trim()], ["Founded", company.yearFounded], ["Team Size", company.teamSize]].map(([l, v], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F3F1EC" }}>
                <span style={{ fontSize: 12, color: "#999" }}>{l}</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <button onClick={() => setActiveTab("company")} style={{ width: "100%", padding: 10, border: "1px solid #1B3A2D", borderRadius: 10, background: "transparent", color: "#1B3A2D", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 16, fontFamily: "'DM Sans',sans-serif" }}>View Full Profile →</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// SHARED STYLES
// ═══════════════════════════════════════════

const $ = {
  card: { background: "#fff", borderRadius: 16, padding: 28, marginBottom: 20, border: "1px solid #E8E4DD" },
  sideCard: { background: "#fff", borderRadius: 16, padding: 28, border: "1px solid #E8E4DD" },
  cardTitle: { fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 600, color: "#1B3A2D", margin: "0 0 16px" },
  desc: { fontSize: 14, color: "#555", lineHeight: 1.6, margin: "0 0 24px" },
  pill: { padding: "6px 14px", borderRadius: 8, border: "none", background: "transparent", fontSize: 12, fontWeight: 500, color: "#6B6B6B", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" },
  pillActive: { background: "#fff", color: "#1B3A2D", fontWeight: 600, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  logoMark: { width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" },
  escrowBox: { background: "#FAFAF7", borderRadius: 12, padding: 20, marginBottom: 24, border: "1px solid #EDEAE4" },
  escrowStep: { display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative" },
  escrowDot: { width: 28, height: 28, borderRadius: "50%", background: "#E8E4DD", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, color: "#fff", position: "relative", zIndex: 2 },
  escrowDotOn: { background: "#1B3A2D", boxShadow: "0 0 0 4px rgba(27,58,45,0.15)" },
  escrowDotDone: { background: "#5F7161" },
  escrowLabel: { fontSize: 11, color: "#999", textAlign: "center", maxWidth: 80, lineHeight: 1.3 },
  escrowLine: { position: "absolute", top: 14, left: "calc(50% + 18px)", right: "calc(-50% + 18px)", height: 2, background: "#E8E4DD", zIndex: 1 },
  metricCard: { background: "#FAFAF7", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 4, border: "1px solid #EDEAE4" },
  metricLabel: { fontSize: 12, color: "#888", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em", lineHeight: 1.3 },
  metricVal: { fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: "#1a1a1a" },
  companyHead: { display: "flex", alignItems: "center", gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #EDEAE4" },
  companyLogo: { width: 56, height: 56, borderRadius: 14, background: "#F0F5F1", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #D4DDD6", flexShrink: 0, overflow: "hidden" },
  detailRow: { display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "1px solid #F3F1EC" },
  detailIcon: { width: 36, height: 36, borderRadius: 10, background: "#F0F5F1", display: "flex", alignItems: "center", justifyContent: "center", color: "#5F7161", flexShrink: 0 },
  detailLabel: { display: "block", fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 1, fontWeight: 500 },
  detailValue: { display: "block", fontSize: 14, color: "#1a1a1a", fontWeight: 500 },
  teamCard: { background: "#FAFAF7", borderRadius: 14, padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, border: "1px solid #EDEAE4", textAlign: "center" },
  finCard: { background: "#FAFAF7", borderRadius: 14, padding: 18, border: "1px solid #EDEAE4", display: "flex", flexDirection: "column", gap: 4 },
};
