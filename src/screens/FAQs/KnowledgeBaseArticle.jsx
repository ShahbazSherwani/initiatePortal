import { useState, useEffect, useRef, useCallback } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import articlesData from "./articles.json";

const Link = ({ href, ...props }) => <RouterLink to={href} {...props} />;

// ─── Icons ───
const Icons = {
  arrowLeft: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  calendar: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  chevronRight: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  lightbulb: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  thumbsUp: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  ),
  thumbsDown: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  ),
  copy: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  doc: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
};

// ─── Content Block Renderer ───
function ContentBlock({ block }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  switch (block.type) {
    case "paragraph":
      return <p className="kb-body-p">{block.content}</p>;

    case "heading":
      return (
        <h2 className="kb-body-h2" id={slugify(block.content)}>
          <span className="kb-heading-anchor">#</span>
          {block.content}
        </h2>
      );

    case "callout": {
      const variantMap = {
        info: { icon: Icons.info, cls: "callout-info" },
        tip: { icon: Icons.lightbulb, cls: "callout-tip" },
        warning: { icon: Icons.warning, cls: "callout-warning" },
      };
      const v = variantMap[block.variant] || variantMap.info;
      return (
        <div className={`kb-callout ${v.cls}`}>
          <span className="kb-callout-icon">{v.icon}</span>
          <div className="kb-callout-text">
            <span className="kb-callout-label">
              {block.variant === "tip"
                ? "Tip"
                : block.variant === "warning"
                ? "Warning"
                : "Note"}
            </span>
            {block.content}
          </div>
        </div>
      );
    }

    case "ordered_list":
      return (
        <ol className="kb-ol">
          {block.items.map((item, i) => (
            <li key={i} className="kb-ol-li">
              <span className="kb-ol-num">{i + 1}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      );

    case "unordered_list":
      return (
        <ul className="kb-ul">
          {block.items.map((item, i) => (
            <li key={i} className="kb-ul-li">
              {item}
            </li>
          ))}
        </ul>
      );

    case "image":
      return (
        <figure className="kb-figure">
          <img src={block.src} alt={block.alt} className="kb-img" />
          {block.caption && (
            <figcaption className="kb-caption">{block.caption}</figcaption>
          )}
        </figure>
      );

    case "code":
      return (
        <div className="kb-code-wrap">
          <div className="kb-code-header">
            <span className="kb-code-lang">{block.language || "code"}</span>
            <button
              className="kb-code-copy"
              onClick={() => handleCopy(block.content)}
            >
              {copied ? Icons.check : Icons.copy}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="kb-code-pre">
            <code>{block.content}</code>
          </pre>
        </div>
      );

    default:
      return null;
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────
// Update these route patterns to match your app
// ─────────────────────────────────────────────
const ROUTES = {
  home: "/",
  knowledgeBase: "/knowledge-base",
  // Category archive route is currently collapsed to the base knowledge page.
  category: () => "/knowledge-base",
  // Single article: /knowledge-base/articles/[slug]
  article: (slug) => `/knowledge-base/articles/${slug}`,
};

// ─── Main Single Article Component ───
// Accepts an optional `slug` prop. If omitted, loads the first article in the JSON.
export default function KnowledgeBaseArticle({ slug }) {
  const params = useParams();
  const resolvedSlug = slug ?? params.slug;
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    try {
      const list = Array.isArray(articlesData) ? articlesData : articlesData.articles ?? [];
      const found = resolvedSlug
        ? list.find((a) => a.slug === resolvedSlug)
        : list[0]; // default to first article when no slug is provided
      if (!found) throw new Error(`Article "${resolvedSlug}" not found.`);
      setArticle(found);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [resolvedSlug]);

  // Reading progress
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const rect = contentRef.current.getBoundingClientRect();
      const total = contentRef.current.scrollHeight - window.innerHeight;
      const scrolled = -rect.top;
      setProgress(Math.min(100, Math.max(0, (scrolled / total) * 100)));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f8f3", fontFamily: "'DM Sans', sans-serif", color: "#4a5e4a", gap: 12 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8FB200" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 0.9s linear infinite" }}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Loading article…
      </div>
    );
  }

  if (error || !article) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f7f8f3", fontFamily: "'DM Sans', sans-serif", color: "#4a5e4a", gap: 8 }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p style={{ fontWeight: 600, fontSize: 16 }}>Failed to load article</p>
        <p style={{ fontSize: 13, color: "#7a8e7a" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="kb-single-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Space+Mono:wght@400;700&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --primary: #0C4B20;
          --primary-light: #0e5a27;
          --primary-dark: #093a19;
          --secondary: #8FB200;
          --secondary-light: #a3cc00;
          --bg: #f7f8f3;
          --card-bg: #ffffff;
          --text-primary: #1a2e1a;
          --text-secondary: #4a5e4a;
          --text-muted: #7a8e7a;
          --border: #dfe6d8;
        }

        .kb-single-page {
          min-height: 100vh;
          background: var(--bg);
          font-family: 'DM Sans', sans-serif;
          color: var(--text-primary);
        }

        /* ── Progress bar ── */
        .kb-progress-bar {
          position: fixed;
          top: 0;
          left: 0;
          height: 3px;
          background: var(--secondary);
          z-index: 100;
          transition: width 0.15s ease-out;
        }

        /* ── Top nav ── */
        .kb-topnav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          padding: 0 24px;
        }
        .kb-topnav-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 56px;
          gap: 16px;
        }
        .kb-back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: var(--primary);
          text-decoration: none;
          padding: 6px 12px 6px 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .kb-back-link:hover { background: rgba(12, 75, 32, 0.06); }

        /* ── Breadcrumbs ── */
        .kb-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-muted);
          overflow: hidden;
        }
        .kb-breadcrumbs a {
          color: var(--text-muted);
          text-decoration: none;
          white-space: nowrap;
          transition: color 0.2s;
        }
        .kb-breadcrumbs a:hover { color: var(--primary); }
        .kb-breadcrumbs .kb-bc-current {
          color: var(--text-secondary);
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 280px;
        }

        /* ── Article header ── */
        .kb-article-header {
          background: linear-gradient(170deg, #0C4B20 0%, #0e5a27 40%, #0a3d1a 100%);
          padding: 48px 24px 44px;
          position: relative;
          overflow: hidden;
        }
        .kb-article-header::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0.04;
          background-image:
            radial-gradient(circle at 25% 40%, var(--secondary) 1px, transparent 1px),
            radial-gradient(circle at 75% 60%, var(--secondary) 1px, transparent 1px);
          background-size: 50px 50px, 70px 70px;
        }
        .kb-header-inner {
          max-width: 1100px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .kb-category-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #8FB200;
          border: 1px solid rgba(143, 178, 0, 0.3);
          border-radius: 100px;
          padding: 5px 14px;
          margin-bottom: 16px;
        }
        .kb-article-title {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(24px, 4vw, 36px);
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin: 0 0 16px;
          max-width: 720px;
        }
        .kb-article-meta {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .kb-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: rgba(255,255,255,0.55);
        }

        /* ── Two-column layout: left sidebar + content ── */
        .kb-layout {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 0;
          padding: 0 24px;
          position: relative;
        }
        @media (max-width: 860px) {
          .kb-layout { grid-template-columns: 1fr; }
          .kb-sidebar-left { display: none; }
          .kb-sidebar-left.mobile-open {
            display: block;
            position: fixed;
            top: 56px; left: 0; bottom: 0;
            width: 300px;
            z-index: 40;
            background: var(--card-bg);
            border-right: 1px solid var(--border);
            padding: 24px;
            overflow-y: auto;
            box-shadow: 8px 0 32px rgba(0,0,0,0.08);
          }
        }

        /* ── Left sidebar — Related Articles ── */
        .kb-sidebar-left {
          padding: 32px 24px 32px 0;
          border-right: 1px solid var(--border);
          position: sticky;
          top: 60px;
          align-self: start;
          max-height: calc(100vh - 60px);
          overflow-y: auto;
        }
        .kb-sidebar-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 16px;
        }
        .kb-related-side-card {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 12px;
          font-size: 13.5px;
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: 10px;
          line-height: 1.45;
          transition: all 0.2s ease;
          margin-bottom: 4px;
          border: 1.5px solid transparent;
        }
        .kb-related-side-card:hover {
          background: rgba(143, 178, 0, 0.06);
          border-color: var(--border);
          color: var(--primary);
        }
        .kb-related-side-card:hover .kb-rsc-arrow { opacity: 1; }
        .kb-rsc-icon {
          flex-shrink: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: rgba(12, 75, 32, 0.05);
          color: var(--primary);
          margin-top: 1px;
        }
        .kb-rsc-text {
          flex: 1;
          min-width: 0;
        }
        .kb-rsc-title {
          font-weight: 500;
          display: block;
          margin-bottom: 2px;
        }
        .kb-rsc-cat {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 0.04em;
        }
        .kb-rsc-arrow {
          flex-shrink: 0;
          color: var(--text-muted);
          opacity: 0;
          transition: opacity 0.2s;
          margin-top: 6px;
        }

        /* ── Main content ── */
        .kb-content-area {
          padding: 40px 0 80px 48px;
          min-width: 0;
        }
        @media (max-width: 860px) {
          .kb-content-area { padding: 32px 0 64px; }
        }

        /* ── Body styles ── */
        .kb-body-p {
          font-size: 15.5px;
          line-height: 1.75;
          color: var(--text-secondary);
          margin-bottom: 20px;
        }
        .kb-body-h2 {
          font-family: 'DM Sans', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 36px 0 16px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
          line-height: 1.35;
          position: relative;
          scroll-margin-top: 80px;
        }
        .kb-heading-anchor {
          position: absolute;
          left: -24px;
          color: var(--secondary);
          opacity: 0;
          font-weight: 400;
          transition: opacity 0.2s;
        }
        .kb-body-h2:hover .kb-heading-anchor { opacity: 0.6; }

        /* ── Callouts ── */
        .kb-callout {
          display: flex;
          gap: 14px;
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          border-left: 3px solid;
        }
        .callout-info {
          background: rgba(12, 75, 32, 0.04);
          border-left-color: var(--primary);
        }
        .callout-tip {
          background: rgba(143, 178, 0, 0.08);
          border-left-color: var(--secondary);
        }
        .callout-warning {
          background: rgba(200, 120, 0, 0.06);
          border-left-color: #c87800;
        }
        .kb-callout-icon {
          flex-shrink: 0;
          margin-top: 1px;
          color: var(--primary);
        }
        .callout-tip .kb-callout-icon { color: #6a8500; }
        .callout-warning .kb-callout-icon { color: #c87800; }
        .kb-callout-text {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-secondary);
        }
        .kb-callout-label {
          display: block;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--primary);
          margin-bottom: 4px;
        }
        .callout-tip .kb-callout-label { color: #6a8500; }
        .callout-warning .kb-callout-label { color: #c87800; }

        /* ── Ordered list ── */
        .kb-ol {
          list-style: none;
          padding: 0;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .kb-ol-li {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          font-size: 15px;
          line-height: 1.65;
          color: var(--text-secondary);
        }
        .kb-ol-num {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: var(--primary);
          color: #fff;
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          margin-top: 1px;
        }

        /* ── Unordered list ── */
        .kb-ul {
          list-style: none;
          padding: 0;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .kb-ul-li {
          font-size: 15px;
          line-height: 1.65;
          color: var(--text-secondary);
          padding-left: 20px;
          position: relative;
        }
        .kb-ul-li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 10px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--secondary);
        }

        /* ── Images ── */
        .kb-figure { margin: 24px 0; }
        .kb-img {
          width: 100%;
          border-radius: 12px;
          border: 1px solid var(--border);
          display: block;
        }
        .kb-caption {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 10px;
          text-align: center;
          font-style: italic;
        }

        /* ── Code block ── */
        .kb-code-wrap {
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 20px;
          border: 1px solid #2a3a2a;
        }
        .kb-code-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          background: #1e2e1e;
        }
        .kb-code-lang {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: #8FB200;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .kb-code-copy {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .kb-code-copy:hover { color: #fff; background: rgba(255,255,255,0.08); }
        .kb-code-pre {
          background: #152015;
          padding: 20px;
          overflow-x: auto;
          margin: 0;
        }
        .kb-code-pre code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13.5px;
          line-height: 1.65;
          color: #d4e8c4;
        }

        /* ── Feedback ── */
        .kb-feedback {
          margin-top: 48px;
          padding: 28px;
          background: var(--card-bg);
          border: 1.5px solid var(--border);
          border-radius: 14px;
          text-align: center;
        }
        .kb-feedback-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .kb-feedback-sub {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 16px;
        }
        .kb-feedback-btns {
          display: flex;
          justify-content: center;
          gap: 12px;
        }
        .kb-fb-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          border: 1.5px solid var(--border);
          border-radius: 10px;
          background: var(--card-bg);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .kb-fb-btn:hover {
          border-color: var(--secondary);
          color: var(--primary);
        }
        .kb-fb-thanks {
          font-size: 14px;
          color: var(--primary);
          font-weight: 500;
        }

        /* ── Mobile sidebar toggle ── */
        .kb-mobile-menu-btn {
          display: none;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--card-bg);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: var(--text-secondary);
          cursor: pointer;
        }
        @media (max-width: 860px) {
          .kb-mobile-menu-btn { display: inline-flex; }
        }

        /* ── Animations ── */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .kb-animate-in {
          animation: fadeInUp 0.45s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
        }

        .kb-mobile-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.3);
          z-index: 35;
        }
        @media (max-width: 860px) {
          .kb-mobile-overlay.visible { display: block; }
        }
      `}</style>

      {/* ── Reading Progress ── */}
      <div className="kb-progress-bar" style={{ width: `${progress}%` }} />

      {/* ── Top Navigation ── */}
      <nav className="kb-topnav">
        <div className="kb-topnav-inner">
          <Link href={ROUTES.knowledgeBase} className="kb-back-link">
            {Icons.arrowLeft}
            Knowledge Base
          </Link>
          <div className="kb-breadcrumbs">
            <Link href={ROUTES.home}>Home</Link>
            {Icons.chevronRight}
            <Link href={ROUTES.knowledgeBase}>Knowledge Base</Link>
            {Icons.chevronRight}
            <Link href={ROUTES.category(article.categorySlug)}>
              {article.category}
            </Link>
            {Icons.chevronRight}
            <span className="kb-bc-current">{article.title}</span>
          </div>
          <button
            className="kb-mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            Menu
          </button>
        </div>
      </nav>

      {/* ── Article Header ── */}
      <header className="kb-article-header">
        <div className="kb-header-inner">
          <div
            className={mounted ? "kb-animate-in" : ""}
            style={{ animationDelay: "0.05s" }}
          >
            <span className="kb-category-badge">{article.category}</span>
          </div>
          <h1
            className={`kb-article-title ${mounted ? "kb-animate-in" : ""}`}
            style={{ animationDelay: "0.15s" }}
          >
            {article.title}
          </h1>
          <div
            className={`kb-article-meta ${mounted ? "kb-animate-in" : ""}`}
            style={{ animationDelay: "0.25s" }}
          >
            <span className="kb-meta-item">
              {Icons.calendar}
              Updated {formatDate(article.updatedAt)}
            </span>
            <span className="kb-meta-item">
              {Icons.clock}
              {article.readTime} min read
            </span>
          </div>
        </div>
      </header>

      {/* ── Mobile overlay ── */}
      <div
        className={`kb-mobile-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Two-column layout ── */}
      <div className="kb-layout" ref={contentRef}>
        {/* ── Left sidebar — Related Articles ── */}
        <aside
          className={`kb-sidebar-left ${sidebarOpen ? "mobile-open" : ""}`}
        >
          <div className="kb-sidebar-label">Related Articles</div>
          {article.relatedArticles?.map((rel) => (
            <Link
              key={rel.slug}
              href={ROUTES.article(rel.slug)}
              className="kb-related-side-card"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="kb-rsc-icon">{Icons.doc}</span>
              <span className="kb-rsc-text">
                <span className="kb-rsc-title">{rel.title}</span>
                {rel.category && (
                  <span className="kb-rsc-cat">{rel.category}</span>
                )}
              </span>
              <span className="kb-rsc-arrow">{Icons.chevronRight}</span>
            </Link>
          ))}
        </aside>

        {/* ── Main content ── */}
        <article className="kb-content-area">
          {article.body.map((block, i) => (
            <ContentBlock key={i} block={block} />
          ))}

          {/* Feedback widget */}
          <div className="kb-feedback">
            {feedback === null ? (
              <>
                <div className="kb-feedback-title">
                  Was this article helpful?
                </div>
                <div className="kb-feedback-sub">
                  Let us know so we can improve our documentation.
                </div>
                <div className="kb-feedback-btns">
                  <button
                    className="kb-fb-btn"
                    onClick={() => setFeedback("yes")}
                  >
                    {Icons.thumbsUp} Yes, helpful
                  </button>
                  <button
                    className="kb-fb-btn"
                    onClick={() => setFeedback("no")}
                  >
                    {Icons.thumbsDown} Not really
                  </button>
                </div>
              </>
            ) : (
              <div className="kb-fb-thanks">
                Thanks for your feedback!{" "}
                {feedback === "yes"
                  ? "Glad it helped."
                  : "We'll work on improving this."}
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
