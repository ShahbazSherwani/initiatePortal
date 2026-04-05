import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import articlesData from "./articles.json";

// ─── Category icon mapping ───
const CATEGORY_ICONS = {
  "Getting Started": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  "Account Set-up and Verification": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  ),
  "For Investors": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  "For Issuers": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  "Fees, Escrow, and Payments": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  "Privacy, Security and Compliance": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  "Support, Complaints, and Disputes": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  "Platform Rules and User Conduct": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  "Reporting, Dashboards, and Transparency": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  "Business Continuity and Platform Closure": (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

const DEFAULT_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

// ─── Main Component ───
export default function KnowledgeBase() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      // Support both { articles: [...] } shape and a bare array
      const list = Array.isArray(articlesData) ? articlesData : articlesData.articles ?? [];
      setArticles(list);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  // Read ?category= param from URL (set by HelpTopicsBar on dashboards)
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setActiveCategory(cat);
  }, [searchParams]);

  const categories = useMemo(() => {
    const cats = [...new Set(articles.map((a) => a.category))];
    return ["All", ...cats];
  }, [articles]);

  const grouped = useMemo(() => {
    let filtered = articles;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      );
    }
    if (activeCategory !== "All") {
      filtered = filtered.filter((a) => a.category === activeCategory);
    }
    const groups = {};
    filtered.forEach((a) => {
      if (!groups[a.category]) groups[a.category] = [];
      groups[a.category].push(a);
    });
    return groups;
  }, [articles, search, activeCategory]);

  const totalResults = Object.values(grouped).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f8f3", fontFamily: "'DM Sans', sans-serif", color: "#4a5e4a", gap: 12 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8FB200" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 0.9s linear infinite" }}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Loading articles…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f7f8f3", fontFamily: "'DM Sans', sans-serif", color: "#4a5e4a", gap: 8 }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p style={{ fontWeight: 600, fontSize: 16 }}>Failed to load articles</p>
        <p style={{ fontSize: 13, color: "#7a8e7a" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Space+Mono:wght@400;700&display=swap');

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
          --border-hover: #8FB200;
        }

        .kb-search-input {
          width: 100%;
          padding: 16px 20px 16px 52px;
          border: 2px solid var(--border);
          border-radius: 14px;
          font-size: 16px;
          font-family: 'DM Sans', sans-serif;
          color: var(--text-primary);
          background: var(--card-bg);
          outline: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .kb-search-input::placeholder { color: var(--text-muted); }
        .kb-search-input:focus {
          border-color: var(--secondary);
          box-shadow: 0 0 0 4px rgba(143, 178, 0, 0.12);
        }

        .kb-cat-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          border: 1.5px solid var(--border);
          background: var(--card-bg);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          user-select: none;
        }
        .kb-cat-pill:hover {
          border-color: var(--secondary);
          color: var(--primary);
          background: #f2f7e0;
        }
        .kb-cat-pill.active {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
        }

        .kb-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px 24px;
          background: var(--card-bg);
          border: 1.5px solid var(--border);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          position: relative;
          overflow: hidden;
        }
        .kb-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 0;
          background: var(--secondary);
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 14px 0 0 14px;
        }
        .kb-card:hover {
          border-color: var(--secondary);
          box-shadow: 0 8px 32px rgba(12, 75, 32, 0.08);
          transform: translateY(-2px);
        }
        .kb-card:hover::before { width: 4px; }

        .kb-section-title {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--primary);
          padding: 6px 14px;
          background: rgba(12, 75, 32, 0.06);
          border-radius: 8px;
        }

        .kb-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: transparent;
          transition: all 0.25s ease;
          flex-shrink: 0;
          margin-left: auto;
        }
        .kb-card:hover .kb-arrow {
          background: rgba(143, 178, 0, 0.1);
          color: var(--primary);
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .kb-animate {
          animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
        }

        .kb-hero-pattern {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          opacity: 0.04;
          background-image: 
            radial-gradient(circle at 20% 50%, var(--secondary) 1px, transparent 1px),
            radial-gradient(circle at 80% 20%, var(--secondary) 1px, transparent 1px),
            radial-gradient(circle at 60% 80%, var(--secondary) 1px, transparent 1px);
          background-size: 60px 60px, 80px 80px, 70px 70px;
        }

        .kb-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 6px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.04em;
          color: var(--primary);
          background: rgba(143, 178, 0, 0.12);
        }

        .kb-empty-state {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-muted);
          font-family: 'DM Sans', sans-serif;
        }
        .kb-empty-state svg {
          opacity: 0.3;
          margin-bottom: 16px;
        }
      `}</style>

      {/* ── Hero Section ── */}
      <header style={styles.hero}>
        <div className="kb-hero-pattern" />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 680,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <div
            className={mounted ? "kb-animate" : ""}
            style={{ animationDelay: "0.05s" }}
          >
            <span style={styles.heroBadge}>Knowledge Base</span>
          </div>
          <h1
            className={mounted ? "kb-animate" : ""}
            style={{ ...styles.heroTitle, animationDelay: "0.15s" }}
          >
            How can we help?
          </h1>
          <p
            className={mounted ? "kb-animate" : ""}
            style={{ ...styles.heroSub, animationDelay: "0.25s" }}
          >
            Browse our guides, tutorials, and troubleshooting articles
          </p>
          <div
            className={mounted ? "kb-animate" : ""}
            style={{ ...styles.searchWrap, animationDelay: "0.35s" }}
          >
            <svg
              style={styles.searchIcon}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7a8e7a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="kb-search-input"
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={styles.clearBtn}
                aria-label="Clear search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Category Pills ── */}
      <nav style={styles.pillsNav}>
        <div style={styles.pillsScroll}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`kb-cat-pill ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat !== "All" && (
                <span style={{ display: "flex", alignItems: "center" }}>
                  {CATEGORY_ICONS[cat] || DEFAULT_ICON}
                </span>
              )}
              {cat}
              {cat === "All" && (
                <span style={styles.pillCount}>{articles.length}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Results count ── */}
      {search && (
        <div style={styles.resultsBar}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13 }}>
            {totalResults} result{totalResults !== 1 ? "s" : ""} for "
            <strong>{search}</strong>"
          </span>
        </div>
      )}

      {/* ── Article Sections ── */}
      <main style={styles.main}>
        {Object.keys(grouped).length === 0 ? (
          <div className="kb-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <p style={{ fontSize: 18, fontWeight: 500, marginBottom: 6 }}>
              No articles found
            </p>
            <p style={{ fontSize: 14 }}>
              Try adjusting your search or changing the category filter.
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([category, articles], gi) => (
            <section
              key={category}
              className={mounted ? "kb-animate" : ""}
              style={{ ...styles.section, animationDelay: `${0.1 + gi * 0.08}s` }}
            >
              <div className="kb-section-title">
                {CATEGORY_ICONS[category] || DEFAULT_ICON}
                {category}
                <span className="kb-badge">{articles.length}</span>
              </div>
              <div style={styles.cardGrid}>
                {articles.map((article, i) => (
                  <a
                    key={i}
                    className="kb-card"
                    href={`/knowledge-base/articles/${article.slug}`}
                    onMouseEnter={() => setHoveredCard(`${gi}-${i}`)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 15,
                          fontWeight: 500,
                          color: "var(--text-primary)",
                          lineHeight: 1.5,
                        }}
                      >
                        {article.title}
                      </div>
                    </div>
                    <div className="kb-arrow">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={
                          hoveredCard === `${gi}-${i}`
                            ? "var(--primary)"
                            : "var(--text-muted)"
                        }
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <p style={{ margin: 0, fontWeight: 500 }}>
            Can't find what you're looking for?
          </p>
          <a href="#" style={styles.footerLink}>
            Contact Support
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}

// ─── Styles ───
const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--bg, #f7f8f3)",
    fontFamily: "'DM Sans', sans-serif",
    color: "var(--text-primary)",
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(170deg, #0C4B20 0%, #0e5a27 40%, #0a3d1a 100%)",
    padding: "72px 24px 56px",
  },
  heroBadge: {
    display: "inline-block",
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#8FB200",
    border: "1px solid rgba(143, 178, 0, 0.3)",
    borderRadius: 100,
    padding: "5px 16px",
    marginBottom: 20,
  },
  heroTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "clamp(28px, 5vw, 44px)",
    fontWeight: 700,
    color: "#fff",
    margin: "0 0 12px",
    lineHeight: 1.15,
    letterSpacing: "-0.02em",
  },
  heroSub: {
    fontSize: 16,
    color: "rgba(255,255,255,0.65)",
    margin: "0 0 32px",
    lineHeight: 1.5,
  },
  searchWrap: {
    position: "relative",
    maxWidth: 520,
    margin: "0 auto",
  },
  searchIcon: {
    position: "absolute",
    left: 18,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 2,
    pointerEvents: "none",
  },
  clearBtn: {
    position: "absolute",
    right: 14,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#7a8e7a",
    display: "flex",
    alignItems: "center",
    padding: 4,
    borderRadius: 6,
  },
  pillsNav: {
    padding: "24px 24px 0",
    maxWidth: 960,
    margin: "0 auto",
  },
  pillsScroll: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  pillCount: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    fontWeight: 700,
    background: "rgba(255,255,255,0.2)",
    borderRadius: 100,
    padding: "1px 8px",
    marginLeft: 2,
  },
  resultsBar: {
    maxWidth: 960,
    margin: "16px auto 0",
    padding: "0 24px",
    color: "var(--text-muted)",
  },
  main: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "32px 24px 64px",
    display: "flex",
    flexDirection: "column",
    gap: 40,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 380px), 1fr))",
    gap: 12,
  },
  footer: {
    borderTop: "1px solid var(--border)",
    background: "var(--card-bg, #fff)",
    padding: "32px 24px",
  },
  footerInner: {
    maxWidth: 960,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: "var(--text-secondary)",
  },
  footerLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "#0C4B20",
    fontWeight: 600,
    textDecoration: "none",
    fontSize: 15,
  },
};
