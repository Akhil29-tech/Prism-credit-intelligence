import { useState, useEffect } from "react";

const NAV = [
  { id:"dashboard",  icon:"🏠", label:"Executive Dashboard" },
  { id:"eda",        icon:"🔍", label:"Smart EDA" },
  { id:"arena",      icon:"🤖", label:"Model Arena" },
  { id:"predictor",  icon:"🎯", label:"Risk Predictor" },
  { id:"whatif",     icon:"💡", label:"What-If Simulator" },
  { id:"biasscan",   icon:"⚖️", label:"BiasScan" },
];

export default function Sidebar({ page, setPage, stats }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button onClick={() => setMenuOpen(!menuOpen)} style={{
        display:"none", position:"fixed", top:16, left:16, zIndex:200,
        background:"var(--navy-900)", border:"none", borderRadius:8,
        padding:"8px 10px", cursor:"pointer", fontSize:18, color:"var(--gold-400)",
      }} className="hamburger">☰</button>

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🔷</div>
          <div className="sidebar-logo-name gold-shimmer">PRISM</div>
          <div className="sidebar-logo-sub">Credit Intelligence</div>
          <div className="sidebar-badge">EU AI Act 2024 Compliant</div>
        </div>

        {/* Nav */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Navigation</div>
          {NAV.map(({ id, icon, label }) => (
            <button key={id} onClick={() => { setPage(id); setMenuOpen(false); }}
              className={`nav-item ${page === id ? "active" : ""}`}>
              <span className="nav-item-icon">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Stats */}
        {stats && (
          <div className="sidebar-stats">
            <div className="sidebar-section-label" style={{ marginBottom:10 }}>Portfolio</div>
            {[
              ["Applicants", stats.total?.toLocaleString()],
              ["Default Rate", `${stats.default_rate}%`],
              ["Best Model", stats.best_model],
              ["Best AUC", stats.best_auc],
            ].map(([label, value]) => (
              <div key={label} className="sidebar-stat-row">
                <span className="sidebar-stat-label">{label}</span>
                <span className="sidebar-stat-value">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Author */}
        <div className="sidebar-author">
          <div className="sidebar-author-name">Akhil Baiju</div>
          <div className="sidebar-author-role">MCA · AI/ML Engineer</div>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .hamburger { display: block !important; }
        }
      `}</style>
    </>
  );
}
