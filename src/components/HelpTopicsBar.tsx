import React from 'react';
import { useNavigate } from 'react-router-dom';

// ── Categories (mirror KnowledgeBase.jsx) ─────────────────────────────────────
const TOPICS: { label: string; icon: React.ReactNode }[] = [
  { label: 'Getting Started', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg> },
  { label: 'Account Set-up and Verification', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 0 0-16 0" /></svg> },
  { label: 'For Investors', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
  { label: 'For Issuers', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg> },
  { label: 'Fees, Escrow, and Payments', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg> },
  { label: 'Privacy, Security and Compliance', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> },
  { label: 'Support, Complaints, and Disputes', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> },
  { label: 'Platform Rules and User Conduct', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg> },
  { label: 'Reporting, Dashboards, and Transparency', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> },
  { label: 'Business Continuity and Platform Closure', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
];

export const HelpTopicsBar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section
      style={{
        marginTop: 48,
        padding: '32px 0 16px',
        borderTop: '1px solid #E8E4DD',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1B3A2D', margin: 0 }}>
            Help &amp; Knowledge Base
          </h3>
          <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>
            Browse topics or visit our full knowledge base for answers
          </p>
        </div>
        <button
          onClick={() => navigate('/knowledge-base')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', border: '1px solid #E8E4DD', borderRadius: 10,
            background: '#fff', fontSize: 13, fontWeight: 600, color: '#1B3A2D',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          View All
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      {/* Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {TOPICS.map(({ label, icon }) => (
          <button
            key={label}
            onClick={() => navigate(`/knowledge-base?category=${encodeURIComponent(label)}`)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', border: '1px solid #E8E4DD', borderRadius: 100,
              background: '#fff', fontSize: 13, fontWeight: 500, color: '#444',
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1B3A2D'; e.currentTarget.style.color = '#1B3A2D'; e.currentTarget.style.background = '#F0FDF4'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E4DD'; e.currentTarget.style.color = '#444'; e.currentTarget.style.background = '#fff'; }}
          >
            <span style={{ display: 'flex', alignItems: 'center', color: 'inherit' }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </section>
  );
};
