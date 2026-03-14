import Header from "../components/Header.jsx";
import { useEffect, useRef, useState } from "react";

export default function Home({ goLogin }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeModule, setActiveModule] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const handleMouse = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  const parallaxX = (mousePos.x - window.innerWidth / 2) * 0.015;
  const parallaxY = (mousePos.y - window.innerHeight / 2) * 0.015;

  const modules = [
    {
      icon: "👥", title: "Employee Management",
      desc: "Centralize employee data, org charts, and lifecycle management with smart automation.",
      color: "#2563eb", accent: "rgba(37,99,235,0.15)", border: "rgba(37,99,235,0.3)",
      tag: "Core", stats: [{ val: "120+", label: "Fields" }, { val: "Multi-level", label: "Hierarchy" }],
    },
    {
      icon: "🕒", title: "Attendance & Leave",
      desc: "Automated attendance tracking with biometric & geo-fencing support across all locations.",
      color: "#7c3aed", accent: "rgba(124,58,237,0.15)", border: "rgba(124,58,237,0.3)",
      tag: "Popular", stats: [{ val: "Real-time", label: "Tracking" }, { val: "Geo-fence", label: "Support" }],
    },
    {
      icon: "💰", title: "Payroll Processing",
      desc: "One-click payroll with tax compliance and multi-currency support for global teams.",
      color: "#0891b2", accent: "rgba(8,145,178,0.15)", border: "rgba(8,145,178,0.3)",
      tag: "Automated", stats: [{ val: "40+", label: "Currencies" }, { val: "Auto Tax", label: "Compliance" }],
    },
    {
      icon: "📈", title: "Performance System",
      desc: "360° reviews, KPIs, OKRs and continuous feedback loops to drive team excellence.",
      color: "#059669", accent: "rgba(5,150,105,0.15)", border: "rgba(5,150,105,0.3)",
      tag: "Analytics", stats: [{ val: "360°", label: "Reviews" }, { val: "OKR", label: "Tracking" }],
    },
    {
      icon: "💻", title: "Asset Management",
      desc: "Track company assets end-to-end with automated assignment and lifecycle visibility.",
      color: "#d97706", accent: "rgba(217,119,6,0.15)", border: "rgba(217,119,6,0.3)",
      tag: "Tracking", stats: [{ val: "Full", label: "Lifecycle" }, { val: "Auto", label: "Assignment" }],
    },
    {
      icon: "🧾", title: "Expenses",
      desc: "OCR-powered expense capture with real-time approval flows and policy enforcement.",
      color: "#dc2626", accent: "rgba(220,38,38,0.15)", border: "rgba(220,38,38,0.3)",
      tag: "Smart", stats: [{ val: "OCR", label: "Capture" }, { val: "Real-time", label: "Approvals" }],
    },
  ];

  const active = modules[activeModule];

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes orb1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-40px) scale(1.1)} 66%{transform:translate(-30px,30px) scale(0.9)} }
        @keyframes orb2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,30px) scale(0.9)} 66%{transform:translate(40px,-50px) scale(1.1)} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 30px rgba(99,102,241,.3),0 20px 60px rgba(37,99,235,.2)} 50%{box-shadow:0 0 60px rgba(99,102,241,.6),0 30px 80px rgba(37,99,235,.4)} }
        @keyframes scanLine { 0%{transform:translateY(-100%);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translateY(400%);opacity:0} }
        @keyframes gradientShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes glowDrift { 0%,100%{opacity:.4;transform:translate(0,0)} 50%{opacity:.7;transform:translate(20px,-10px)} }
        @keyframes cardReveal { from{opacity:0;transform:translateY(30px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes spotlightIn { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulseRing { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.8);opacity:0} }

        .hero-title{animation:slideUp .8s .15s cubic-bezier(.22,1,.36,1) both}
        .hero-sub{animation:slideUp .8s .25s cubic-bezier(.22,1,.36,1) both}
        .hero-btns{animation:slideUp .8s .35s cubic-bezier(.22,1,.36,1) both}
        .hero-stats{animation:slideUp .8s .45s cubic-bezier(.22,1,.36,1) both}
        .dashboard-mock{animation:float 6s ease-in-out infinite,glowPulse 4s ease-in-out infinite}
        .gradient-text{background:linear-gradient(135deg,#60a5fa,#818cf8,#a78bfa,#60a5fa);background-size:300% 300%;animation:gradientShift 4s ease infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .orb1{animation:orb1 12s ease-in-out infinite}
        .orb2{animation:orb2 15s ease-in-out infinite}
        .orb3{animation:orb1 10s 3s ease-in-out infinite}
        .scan-line{animation:scanLine 3s ease-in-out infinite}
        .noise-overlay::after{content:'';position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");pointer-events:none;z-index:1}
        .grid-bg{background-image:linear-gradient(rgba(99,102,241,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.06) 1px,transparent 1px);background-size:60px 60px}
        .primary-btn{position:relative;overflow:hidden;transition:all .3s cubic-bezier(.22,1,.36,1)}
        .primary-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);transform:translateX(-100%);transition:transform .5s}
        .primary-btn:hover::before{transform:translateX(100%)}
        .primary-btn:hover{transform:translateY(-2px);box-shadow:0 20px 50px rgba(37,99,235,.5)!important}
        .secondary-btn{transition:all .3s cubic-bezier(.22,1,.36,1)}
        .secondary-btn:hover{background:rgba(255,255,255,.12)!important;border-color:rgba(255,255,255,.5)!important;transform:translateY(-2px)}

        /* ── MODULE ROW ITEMS ── */
        .mod-row-item{
          display:flex;align-items:center;gap:16px;padding:18px 24px;border-radius:14px;
          cursor:pointer;transition:all .35s cubic-bezier(.22,1,.36,1);
          border:1px solid transparent;position:relative;overflow:hidden;
        }
        .mod-row-item::before{
          content:'';position:absolute;left:0;top:0;bottom:0;width:3px;border-radius:0 2px 2px 0;
          background:var(--item-color,#6366f1);transform:scaleY(0);
          transition:transform .3s cubic-bezier(.22,1,.36,1);transform-origin:center;
        }
        .mod-row-item.active::before{transform:scaleY(1)}
        .mod-row-item:hover .mod-row-arrow,.mod-row-item.active .mod-row-arrow{opacity:1;transform:translateX(0)}
        .mod-row-item.active .mod-row-num{opacity:1;color:var(--item-color,#6366f1)!important}
        .mod-row-item:hover .mod-row-num{opacity:1}
        .mod-row-arrow{margin-left:auto;font-size:14px;color:#6366f1;font-weight:700;opacity:0;transform:translateX(-6px);transition:all .3s cubic-bezier(.22,1,.36,1)}
        .mod-row-num{font-size:10px;font-weight:800;color:#334155;letter-spacing:.1em;opacity:.4;transition:all .3s;flex-shrink:0;width:20px}
        .mod-icon-sm{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;transition:transform .3s cubic-bezier(.22,1,.36,1)}
        .mod-row-item:hover .mod-icon-sm,.mod-row-item.active .mod-icon-sm{transform:scale(1.1)}
        .spotlight-panel{animation:spotlightIn .45s cubic-bezier(.22,1,.36,1) both}

        /* ── FEAT ITEMS ── */
        .feat-item{position:relative;padding:44px 44px;cursor:pointer;border:1px solid rgba(99,102,241,.08);transition:all .4s cubic-bezier(.22,1,.36,1);overflow:hidden;background:rgba(8,10,30,.6)}
        .feat-item::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 30% 50%,rgba(99,102,241,.13) 0%,transparent 70%);opacity:0;transition:opacity .4s}
        .feat-item:hover::before{opacity:1}
        .feat-item:hover{background:rgba(15,17,50,.9);border-color:rgba(99,102,241,.3)!important}
        .feat-item:hover .feat-num-label{background:linear-gradient(135deg,#6366f1,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .feat-item:hover .feat-title-text{color:#fff}
        .feat-item:hover .feat-arrow-icon{opacity:1;transform:translateX(0)}
        .feat-item:hover .feat-bottom-line{width:calc(100% - 88px)}
        .feat-num-label{font-size:11px;font-weight:800;letter-spacing:.14em;color:rgba(99,102,241,.4);text-transform:uppercase;margin-bottom:20px;display:block;transition:all .3s}
        .feat-title-text{font-size:18px;font-weight:700;color:#e2e8f0;letter-spacing:-.02em;margin-bottom:10px;transition:color .3s;line-height:1.3}
        .feat-desc-text{font-size:14px;color:#475569;line-height:1.7;max-width:320px;margin-bottom:20px}
        .feat-bottom-line{height:1px;background:linear-gradient(90deg,#6366f1,#818cf8,transparent);width:0;transition:width .6s cubic-bezier(.22,1,.36,1);position:absolute;bottom:0;left:44px}
        .feat-arrow-icon{position:absolute;bottom:40px;right:40px;font-size:16px;color:#6366f1;font-weight:700;opacity:0;transform:translateX(-8px);transition:all .35s cubic-bezier(.22,1,.36,1)}
        .feat-icon-box{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:22px;transition:transform .4s}
        .feat-item:hover .feat-icon-box{transform:scale(1.08)}

        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:#0a0a1a}
        ::-webkit-scrollbar-thumb{background:linear-gradient(#2563eb,#7c3aed);border-radius:3px}
      `}</style>

      <Header goLogin={goLogin} />

      {/* ── HERO ── */}
      <section style={styles.hero} className="noise-overlay grid-bg" ref={heroRef}>
        <div className="orb1" style={styles.orb1} />
        <div className="orb2" style={styles.orb2} />
        <div className="orb3" style={styles.orb3} />
        <div style={styles.heroGlow} />

        <div style={styles.heroLeft}>
          <h1 className="hero-title" style={styles.title}>
            Manage Your<br />Workforce<br />
            <span className="gradient-text">With DIGIHR</span>
          </h1>
          <p className="hero-sub" style={styles.subtitle}>
            Complete cloud-based HRMS platform designed for startups, SMEs and enterprises to automate HR operations with powerful analytics and automation.
          </p>
          <div className="hero-btns" style={styles.buttonGroup}>
            <button className="primary-btn" style={styles.primaryBtn} onClick={goLogin}>
              <span style={{ position: "relative", zIndex: 1 }}>Login to DIGIHR</span>
              <span style={styles.btnArrow}>→</span>
            </button>
            <button className="secondary-btn" style={styles.secondaryBtn}>Request Demo</button>
          </div>
          <div className="hero-stats" style={styles.heroStats}>
            {[{ val: "12K+", label: "Companies" }, { val: "99.9%", label: "Uptime SLA" }, { val: "4.9★", label: "Rating" }].map((s, i) => (
              <div key={i} style={styles.statItem}>
                <span style={styles.statVal}>{s.val}</span>
                <span style={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.heroRight}>
          <div className="dashboard-mock" style={{ ...styles.dashboardMock, transform: `translate(${parallaxX}px, ${parallaxY}px)` }}>
            <div className="scan-line" style={styles.scanLine} />
            <div style={styles.mockTopBar}>
              <div style={styles.mockDots}>
                <span style={{ ...styles.dot, background: "#ff5f57" }} />
                <span style={{ ...styles.dot, background: "#febc2e" }} />
                <span style={{ ...styles.dot, background: "#28c840" }} />
              </div>
              <span style={styles.mockTitle}>DIGIHR Dashboard</span>
              <span style={styles.mockLive}>● LIVE</span>
            </div>
            <div style={styles.mockMetrics}>
              {[
                { icon: "👥", label: "Employees", val: "120", change: "+4" },
                { icon: "📊", label: "Attendance", val: "96%", change: "+2%" },
                { icon: "💰", label: "Payroll", val: "Ready", change: "On-time" },
              ].map((m, i) => (
                <div key={i} style={styles.metricCard}>
                  <span style={styles.metricIcon}>{m.icon}</span>
                  <span style={styles.metricLabel}>{m.label}</span>
                  <span style={styles.metricVal}>{m.val}</span>
                  <span style={{ ...styles.metricChange, color: "#34d399" }}>↑ {m.change}</span>
                </div>
              ))}
            </div>
            <div style={styles.mockChart}>
              <span style={styles.chartLabel}>Headcount Trend</span>
              <svg width="100%" height="56" viewBox="0 0 300 56" style={{ marginTop: 8 }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,45 C40,40 60,30 90,25 S150,10 180,8 S240,15 270,12 S290,10 300,8" fill="none" stroke="#6366f1" strokeWidth="2" />
                <path d="M0,45 C40,40 60,30 90,25 S150,10 180,8 S240,15 270,12 S290,10 300,8 L300,56 L0,56 Z" fill="url(#chartGrad)" />
                {[0,60,120,180,240,300].map((x,i) => (
                  <circle key={i} cx={x===300?298:x} cy={[45,35,25,8,12,8][i]} r="3" fill="#818cf8" />
                ))}
              </svg>
            </div>
            <div style={styles.mockStatus}>
              {["Payroll ✓","Leave ✓","Assets ✓"].map((s, i) => (
                <span key={i} style={styles.statusChip}>{s}</span>
              ))}
            </div>
          </div>
          <div style={{ ...styles.floatBadge, top: "12%", right: "-18px" }}><span style={styles.fbIcon}>🔒</span> SOC 2 Compliant</div>
          <div style={{ ...styles.floatBadge, bottom: "18%", right: "-24px" }}><span style={styles.fbIcon}>⚡</span> Real-time Sync</div>
          <div style={{ ...styles.floatBadge, bottom: "36%", left: "-24px" }}><span style={styles.fbIcon}>🌐</span> 40+ Countries</div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          ── MODULES — SPOTLIGHT LAYOUT NEW ──
      ══════════════════════════════════════ */}
      <section style={styles.modulesSection}>
        {/* Dynamic ambient glow that follows active module color */}
        <div style={{
          position: "absolute", width: 500, height: 500, borderRadius: "50%",
          background: `radial-gradient(circle, ${active.accent} 0%, transparent 70%)`,
          top: "20%", left: "5%", filter: "blur(60px)",
          transition: "background 0.6s ease", pointerEvents: "none", zIndex: 0,
        }} />
        <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)", bottom: "10%", right: "10%", filter: "blur(50px)", pointerEvents: "none", zIndex: 0 }} />

        <div style={styles.modSectionHead}>
          <div style={styles.modEyebrowRow}>
            <span style={styles.modEyebrowLine} />
            <span style={styles.sectionEyebrow}>Core Modules</span>
            <span style={styles.modEyebrowLine} />
          </div>
          <h2 style={styles.sectionTitle}>Powerful HR Modules</h2>
          <p style={styles.sectionDesc}>Everything you need to run a modern, data-driven HR department in one place.</p>
        </div>

        <div style={styles.modLayout}>
          {/* LEFT — Sticky spotlight card */}
          <div style={styles.modSpotlight}>
            <div
              key={activeModule}
              className="spotlight-panel"
              style={{
                ...styles.spotlightCard,
                borderColor: active.border,
                boxShadow: `0 0 0 1px ${active.border}, 0 40px 80px ${active.accent}, inset 0 1px 0 rgba(255,255,255,0.05)`,
              }}
            >
              {/* Top shimmer line */}
              <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "60%", height: 1, background: `linear-gradient(90deg, transparent, ${active.color}, transparent)`, zIndex: 1 }} />

              {/* Pulsing icon */}
              <div style={{ position: "relative", width: 72, height: 72, marginBottom: 28 }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${active.color}`, animation: "pulseRing 2.5s ease-out infinite", opacity: 0.4 }} />
                <div style={{ position: "absolute", inset: 4, borderRadius: "50%", border: `1px solid ${active.color}`, animation: "pulseRing 2.5s .8s ease-out infinite", opacity: 0.25 }} />
                <div style={{ width: 72, height: 72, borderRadius: 20, background: active.accent, border: `1px solid ${active.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, position: "relative", zIndex: 1 }}>
                  {active.icon}
                </div>
              </div>

              <span style={{ ...styles.spotTag, background: active.accent, color: active.color, border: `1px solid ${active.border}` }}>
                {active.tag}
              </span>

              <h3 style={styles.spotTitle}>{active.title}</h3>
              <p style={styles.spotDesc}>{active.desc}</p>

              <div style={styles.spotStats}>
                {active.stats.map((s, i) => (
                  <div key={i} style={{ ...styles.spotStatChip, borderColor: active.border }}>
                    <span style={{ ...styles.spotStatVal, color: active.color }}>{s.val}</span>
                    <span style={styles.spotStatLabel}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg, ${active.color}, transparent)`, width: `${((activeModule + 1) / modules.length) * 100}%`, transition: "width 0.5s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#334155", fontSize: 11 }}>{activeModule + 1} of {modules.length}</span>
                <span style={{ color: active.color, fontSize: 11, fontWeight: 700 }}>{active.title.split(" ")[0]}</span>
              </div>

              {/* Decorative corner glow */}
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 120, height: 120, background: `radial-gradient(circle at bottom right, ${active.accent}, transparent)`, borderRadius: "0 0 24px 0", pointerEvents: "none" }} />
            </div>
          </div>

          {/* RIGHT — Interactive list */}
          <div style={styles.modList}>
            {modules.map((m, i) => (
              <div
                key={i}
                className={`mod-row-item${activeModule === i ? " active" : ""}`}
                style={{
                  "--item-color": m.color,
                  background: activeModule === i ? m.accent : "transparent",
                  borderColor: activeModule === i ? m.border : "transparent",
                  paddingLeft: activeModule === i ? 28 : 24,
                }}
                onMouseEnter={() => setActiveModule(i)}
              >
                <span className="mod-row-num">{String(i + 1).padStart(2, "0")}</span>
                <div className="mod-icon-sm" style={{
                  background: activeModule === i ? m.accent : "rgba(255,255,255,0.04)",
                  border: activeModule === i ? `1px solid ${m.border}` : "1px solid rgba(255,255,255,0.07)",
                }}>
                  {m.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: activeModule === i ? "#f1f5f9" : "#94a3b8", letterSpacing: "-0.01em", marginBottom: 3, transition: "color 0.3s" }}>
                    {m.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.5 }}>{m.tag} module</div>
                </div>
                {activeModule === i && (
                  <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                    {[0,1,2].map(j => (
                      <span key={j} style={{ width: 4, height: 4, borderRadius: "50%", background: m.color, opacity: 1 - j * 0.3 }} />
                    ))}
                  </div>
                )}
                <span className="mod-row-arrow" style={{ color: m.color }}>→</span>
              </div>
            ))}
            <div style={styles.modListCta}>
              <span style={{ fontSize: 13, color: "#334155" }}>6 modules · All included</span>
              <button className="primary-btn" style={{ ...styles.primaryBtn, padding: "10px 20px", fontSize: 13 }}>
                View All <span style={styles.btnArrow}>→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES (BENTO) ── */}
      <section style={styles.sectionDark} className="grid-bg">
        <div style={{ position: "absolute", width: 600, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(99,102,241,.09) 0%,transparent 70%)", top: -80, right: -100, pointerEvents: "none", animation: "glowDrift 14s ease-in-out infinite" }} />

        <div style={{ ...styles.sectionHead, position: "relative", zIndex: 2 }}>
          <div style={styles.modEyebrowRow}>
            <span style={styles.modEyebrowLine} />
            <span style={{ ...styles.sectionEyebrow, color: "#818cf8", margin: 0 }}>Platform Features</span>
            <span style={styles.modEyebrowLine} />
          </div>
          <h2 style={{ ...styles.sectionTitle, color: "#fff", marginTop: 14 }}>Built for Scale</h2>
          <p style={{ ...styles.sectionDesc, color: "#475569" }}>Every feature designed with enterprise-grade security and performance.</p>
        </div>

        <div style={styles.bentoGrid}>
          <div className="feat-item" style={{ ...styles.bentoCell, borderRight: "1px solid rgba(99,102,241,.1)", borderBottom: "1px solid rgba(99,102,241,.1)" }}>
            <span className="feat-num-label">01 — Security</span>
            <div className="feat-icon-box" style={{ background: "rgba(234,179,8,.08)", border: "1px solid rgba(234,179,8,.2)" }}><span style={{ fontSize: 24 }}>🔐</span></div>
            <div className="feat-title-text">Admin & Client Login</div>
            <div className="feat-desc-text">Multi-tenant secure authentication with SSO & MFA.</div>
            <div style={styles.tagRow}>
              {["SSO","MFA","Multi-tenant"].map(t => <span key={t} style={{ ...styles.featTag, background: "rgba(234,179,8,.08)", color: "rgba(234,179,8,.8)", border: "1px solid rgba(234,179,8,.18)" }}>{t}</span>)}
            </div>
            <div className="feat-bottom-line" /><div className="feat-arrow-icon">→</div>
          </div>

          <div className="feat-item" style={{ ...styles.bentoCell, borderBottom: "1px solid rgba(99,102,241,.1)" }}>
            <span className="feat-num-label">02 — Access</span>
            <div className="feat-icon-box" style={{ background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.2)" }}><span style={{ fontSize: 24 }}>🛡️</span></div>
            <div className="feat-title-text">Role Based Access Control</div>
            <div className="feat-desc-text">Granular permission engine across all modules.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[["#6366f1","Super Admin"],["#60a5fa","HR Manager"],["#34d399","Employee"]].map(([c,l]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#64748b" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: c, flexShrink: 0 }} />{l}
                </div>
              ))}
            </div>
            <div className="feat-bottom-line" /><div className="feat-arrow-icon">→</div>
          </div>

          <div className="feat-item" style={{ ...styles.bentoCellWide, borderBottom: "1px solid rgba(99,102,241,.1)", display: "flex", alignItems: "center", gap: 60, padding: "50px 60px" }}>
            <div style={{ flex: 1 }}>
              <span className="feat-num-label">03 — Intelligence</span>
              <div className="feat-icon-box" style={{ background: "rgba(56,189,248,.08)", border: "1px solid rgba(56,189,248,.2)" }}><span style={{ fontSize: 24 }}>📊</span></div>
              <div className="feat-title-text" style={{ fontSize: 22 }}>Analytics Dashboard</div>
              <div className="feat-desc-text" style={{ fontSize: 15, maxWidth: 460 }}>Real-time workforce insights with a custom report builder. Drill down from company-wide trends to individual data in seconds.</div>
              <div style={{ display: "flex", gap: 16 }}>
                <span style={{ fontSize: 11, color: "#38bdf8", fontWeight: 600 }}>↑ Live data</span>
                <span style={{ fontSize: 11, color: "#475569" }}>Custom reports</span>
                <span style={{ fontSize: 11, color: "#475569" }}>Exportable</span>
              </div>
            </div>
            <div style={{ flexShrink: 0, width: 220, borderRadius: 14, background: "rgba(56,189,248,.04)", border: "1px solid rgba(56,189,248,.12)", padding: "18px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#64748b", marginBottom: 12 }}>Workforce Overview</div>
              <svg width="100%" height="70" viewBox="0 0 188 70">
                <defs><linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" /><stop offset="100%" stopColor="#6366f1" stopOpacity="0" /></linearGradient></defs>
                <path d="M0,60 C20,55 40,40 70,30 S110,15 140,12 S170,14 188,10" fill="none" stroke="#6366f1" strokeWidth="2" />
                <path d="M0,60 C20,55 40,40 70,30 S110,15 140,12 S170,14 188,10 L188,70 L0,70Z" fill="url(#ag1)" />
                <circle cx="188" cy="10" r="3" fill="#818cf8" />
              </svg>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                {[["120","Employees","#f1f5f9"],["96%","Attendance","#34d399"],["4.9","Score","#60a5fa"]].map(([v,l,c]) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: c }}>{v}</div>
                    <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: ".07em" }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="feat-bottom-line" /><div className="feat-arrow-icon">→</div>
          </div>

          <div className="feat-item" style={{ ...styles.bentoCell, borderRight: "1px solid rgba(99,102,241,.1)", borderBottom: "1px solid rgba(99,102,241,.1)" }}>
            <span className="feat-num-label">04 — Payroll</span>
            <div className="feat-icon-box" style={{ background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.2)" }}><span style={{ fontSize: 24 }}>📄</span></div>
            <div className="feat-title-text">Payslip Generation</div>
            <div className="feat-desc-text">Branded, automated payslips delivered instantly to every employee's inbox.</div>
            <div style={{ padding: "12px 14px", background: "rgba(52,211,153,.05)", border: "1px solid rgba(52,211,153,.12)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>✓</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#34d399" }}>March 2026 — Processed</div>
                <div style={{ fontSize: 11, color: "#475569" }}>Sent to 120 employees · On-time</div>
              </div>
            </div>
            <div className="feat-bottom-line" /><div className="feat-arrow-icon">→</div>
          </div>

          <div className="feat-item" style={{ ...styles.bentoCell, borderBottom: "1px solid rgba(99,102,241,.1)" }}>
            <span className="feat-num-label">05 — Documents</span>
            <div className="feat-icon-box" style={{ background: "rgba(249,115,22,.08)", border: "1px solid rgba(249,115,22,.2)" }}><span style={{ fontSize: 24 }}>📁</span></div>
            <div className="feat-title-text">Document Management</div>
            <div className="feat-desc-text">Encrypted vault with e-signature and version control for all company files.</div>
            <div style={styles.tagRow}>
              {["AES-256","E-Sign","Versioning"].map(t => <span key={t} style={{ ...styles.featTag, background: "rgba(249,115,22,.07)", color: "rgba(249,115,22,.8)", border: "1px solid rgba(249,115,22,.15)" }}>{t}</span>)}
            </div>
            <div className="feat-bottom-line" /><div className="feat-arrow-icon">→</div>
          </div>

          <div className="feat-item" style={{ ...styles.bentoCellWide, display: "flex", alignItems: "flex-start", gap: 48, padding: "50px 60px" }}>
            <div style={{ flex: 1 }}>
              <span className="feat-num-label">06 — Communication</span>
              <div className="feat-icon-box" style={{ background: "rgba(236,72,153,.08)", border: "1px solid rgba(236,72,153,.2)" }}><span style={{ fontSize: 24 }}>📢</span></div>
              <div className="feat-title-text" style={{ fontSize: 22 }}>Work Announcements</div>
              <div className="feat-desc-text" style={{ fontSize: 15, maxWidth: 460 }}>Targeted broadcasts with read-receipts and scheduling. Reach your whole team or just a department — with full delivery tracking.</div>
            </div>
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { val: "98%", label: "Read Rate", grad: "linear-gradient(135deg,#f472b6,#ec4899)", bg: "rgba(236,72,153,.05)", bdr: "rgba(236,72,153,.1)" },
                { val: "4s", label: "Avg Delivery", grad: "linear-gradient(135deg,#818cf8,#6366f1)", bg: "rgba(99,102,241,.05)", bdr: "rgba(99,102,241,.1)" },
              ].map(s => (
                <div key={s.label} style={{ padding: "18px 24px", background: s.bg, border: `1px solid ${s.bdr}`, borderRadius: 12, textAlign: "center", minWidth: 130 }}>
                  <div style={{ fontSize: 32, fontWeight: 900, background: s.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1, letterSpacing: "-.04em" }}>{s.val}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b", marginTop: 6 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div className="feat-bottom-line" /><div className="feat-arrow-icon">→</div>
          </div>
        </div>

        <div style={styles.featTrustStrip}>
          <div style={{ fontSize: 14, color: "#64748b", maxWidth: 420, lineHeight: 1.65 }}>
            All features are <strong style={{ color: "#94a3b8" }}>SOC 2 Type II certified</strong>, GDPR-compliant, hosted on a <strong style={{ color: "#94a3b8" }}>99.97% uptime SLA</strong>.
          </div>
          <button className="primary-btn" style={{ ...styles.primaryBtn, flexShrink: 0 }}>
            Explore All Features <span style={styles.btnArrow}>→</span>
          </button>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section style={styles.proofSection}>
        <div style={styles.sectionHead}>
          <span style={styles.sectionEyebrow}>Trusted Globally</span>
          <h2 style={styles.sectionTitle}>Numbers That Speak</h2>
        </div>
        <div style={styles.proofGrid}>
          {[
            { val: "12,000+", label: "Companies Onboarded", icon: "🏢" },
            { val: "2.4M+", label: "Employees Managed", icon: "👤" },
            { val: "₹48B+", label: "Payroll Processed", icon: "💸" },
            { val: "99.97%", label: "Platform Uptime", icon: "⚡" },
          ].map((p, i) => (
            <div key={i} style={styles.proofCard}>
              <span style={styles.proofIcon}>{p.icon}</span>
              <span style={styles.proofVal}>{p.val}</span>
              <span style={styles.proofLabel}>{p.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaInner}>
          <div style={styles.ctaOrb1} /><div style={styles.ctaOrb2} />
          <span style={{ ...styles.sectionEyebrow, color: "#a5b4fc" }}>Get Started Today</span>
          <h2 style={styles.ctaTitle}>Transform Your HR<br />Operations Today</h2>
          <p style={styles.ctaDesc}>Join 12,000+ companies already running smarter HR with DIGIHR.</p>
          <div style={styles.ctaBtns}>
            <button className="primary-btn" style={{ ...styles.primaryBtn, background: "#fff", color: "#1e1b4b" }}>
              Get Started with DIGIHR <span style={{ ...styles.btnArrow, color: "#4f46e5" }}>→</span>
            </button>
            <button className="secondary-btn" style={styles.secondaryBtn}>Schedule a Demo</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={styles.footer}>
        <div style={styles.footerTop}>
          <div>
            <span style={styles.footerLogo}>DIGI<span style={{ color: "#6366f1" }}>HR</span></span>
            <p style={styles.footerTagline}>Smart HR Management Platform</p>
          </div>
          <div style={styles.footerLinks}>
            {["Product","Pricing","Docs","Blog","Careers","Privacy"].map(l => (
              <span key={l} style={styles.footerLink}>{l}</span>
            ))}
          </div>
        </div>
        <div style={styles.footerBottom}>
          <span>© 2026 DIGIHR — All rights reserved.</span>
          <span style={styles.footerBadge}>SOC2 · ISO 27001 · GDPR</span>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  page: { fontFamily: "Inter, sans-serif", background: "#06061a", color: "#f1f5f9", overflowX: "hidden" },

  /* HERO */
  hero: { position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "140px 8% 120px", minHeight: "100vh", overflow: "hidden", gap: 60 },
  heroGlow: { position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 800, height: 600, background: "radial-gradient(ellipse at center,rgba(99,102,241,.12) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 },
  orb1: { position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,.18) 0%,transparent 70%)", top: "-10%", left: "-8%", filter: "blur(40px)", zIndex: 0 },
  orb2: { position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,.15) 0%,transparent 70%)", bottom: "-5%", right: "5%", filter: "blur(50px)", zIndex: 0 },
  orb3: { position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(6,182,212,.1) 0%,transparent 70%)", top: "30%", right: "25%", filter: "blur(60px)", zIndex: 0 },
  heroLeft: { flex: 1, position: "relative", zIndex: 2 },
  title: { fontSize: "clamp(44px,5.5vw,72px)", fontWeight: 800, lineHeight: 1.06, marginBottom: 24, color: "#f8fafc", letterSpacing: "-0.03em" },
  subtitle: { fontSize: 17, color: "#94a3b8", maxWidth: 480, marginBottom: 40, lineHeight: 1.7, fontWeight: 400 },
  buttonGroup: { display: "flex", gap: 14, marginBottom: 56, flexWrap: "wrap" },
  primaryBtn: { display: "inline-flex", alignItems: "center", gap: 10, padding: "15px 30px", background: "linear-gradient(135deg,#2563eb,#6366f1)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 0 30px rgba(99,102,241,.35),0 10px 40px rgba(37,99,235,.25)", letterSpacing: "-0.01em" },
  btnArrow: { fontSize: 18, transition: "transform 0.3s" },
  secondaryBtn: { padding: "15px 28px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 12, color: "#e2e8f0", fontWeight: 600, fontSize: 15, cursor: "pointer", backdropFilter: "blur(10px)" },
  heroStats: { display: "flex", gap: 40 },
  statItem: { display: "flex", flexDirection: "column", gap: 4 },
  statVal: { fontSize: 24, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.03em" },
  statLabel: { fontSize: 12, color: "#64748b", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" },
  heroRight: { flex: 1, position: "relative", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2 },
  dashboardMock: { width: 420, borderRadius: 20, background: "rgba(15,17,40,.85)", border: "1px solid rgba(99,102,241,.25)", backdropFilter: "blur(20px)", overflow: "hidden", position: "relative", flexShrink: 0 },
  scanLine: { position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,rgba(99,102,241,.6),transparent)", zIndex: 10, pointerEvents: "none" },
  mockTopBar: { display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid rgba(99,102,241,.15)", background: "rgba(30,27,75,.5)" },
  mockDots: { display: "flex", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: "50%", display: "block" },
  mockTitle: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: 600, color: "#94a3b8" },
  mockLive: { fontSize: 11, fontWeight: 700, color: "#34d399", letterSpacing: "0.05em" },
  mockMetrics: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", padding: "16px", gap: 10 },
  metricCard: { background: "rgba(30,27,75,.5)", border: "1px solid rgba(99,102,241,.15)", borderRadius: 12, padding: "12px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  metricIcon: { fontSize: 20 },
  metricLabel: { fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" },
  metricVal: { fontSize: 18, fontWeight: 800, color: "#f1f5f9" },
  metricChange: { fontSize: 10, fontWeight: 600 },
  mockChart: { padding: "0 16px 12px" },
  chartLabel: { fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" },
  mockStatus: { display: "flex", gap: 8, padding: "12px 16px 16px" },
  statusChip: { fontSize: 11, fontWeight: 700, color: "#34d399", background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.25)", borderRadius: 6, padding: "4px 10px" },
  floatBadge: { position: "absolute", display: "flex", alignItems: "center", gap: 7, background: "rgba(15,17,40,.9)", border: "1px solid rgba(99,102,241,.25)", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "#c7d2fe", backdropFilter: "blur(12px)", whiteSpace: "nowrap", boxShadow: "0 8px 30px rgba(0,0,0,.3)", zIndex: 3 },
  fbIcon: { fontSize: 14 },

  /* ══ MODULES NEW ══ */
  modulesSection: { padding: "130px 8%", background: "#06061a", position: "relative", overflow: "hidden" },
  modSectionHead: { textAlign: "center", marginBottom: 72, position: "relative", zIndex: 2 },
  modEyebrowRow: { display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 14 },
  modEyebrowLine: { width: 28, height: 1, background: "rgba(99,102,241,.4)", display: "inline-block" },
  sectionHead: { textAlign: "center", marginBottom: 70 },
  sectionEyebrow: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#6366f1", display: "block", marginBottom: 14 },
  sectionTitle: { fontSize: "clamp(32px,4vw,48px)", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.03em", marginBottom: 16 },
  sectionDesc: { fontSize: 16, color: "#64748b", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 },

  modLayout: { display: "grid", gridTemplateColumns: "420px 1fr", gap: 40, position: "relative", zIndex: 2 },
  modSpotlight: { position: "sticky", top: 100, height: "fit-content" },
  spotlightCard: { borderRadius: 24, border: "1px solid", padding: "44px 40px", position: "relative", overflow: "hidden", background: "linear-gradient(145deg,rgba(10,12,35,.95),rgba(8,10,28,.98))", transition: "border-color .5s ease,box-shadow .5s ease" },
  spotTag: { display: "inline-block", fontSize: 10, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", padding: "5px 12px", borderRadius: 6, marginBottom: 20 },
  spotTitle: { fontSize: 26, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.03em", marginBottom: 14, lineHeight: 1.2 },
  spotDesc: { fontSize: 15, color: "#64748b", lineHeight: 1.75, marginBottom: 32 },
  spotStats: { display: "flex", gap: 12, marginBottom: 32 },
  spotStatChip: { flex: 1, padding: "14px 16px", background: "rgba(255,255,255,.03)", border: "1px solid", borderRadius: 12, textAlign: "center" },
  spotStatVal: { display: "block", fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 },
  spotStatLabel: { fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "#475569" },

  modList: { display: "flex", flexDirection: "column", gap: 4, justifyContent: "center" },
  modListCta: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 20, borderTop: "1px solid rgba(99,102,241,.1)" },

  /* FEATURES */
  sectionDark: { padding: "120px 8% 100px", background: "#020212", position: "relative", overflow: "hidden" },
  bentoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid rgba(99,102,241,.1)", borderRadius: 24, overflow: "hidden", position: "relative", zIndex: 2 },
  bentoCell: { padding: "44px 44px", minHeight: 280 },
  bentoCellWide: { gridColumn: "1 / -1" },
  tagRow: { display: "flex", gap: 7, flexWrap: "wrap" },
  featTag: { fontSize: 10, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 6 },
  featTrustStrip: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 40, padding: "28px 40px", border: "1px solid rgba(99,102,241,.1)", borderRadius: 16, background: "rgba(8,10,30,.5)", flexWrap: "wrap", gap: 24, position: "relative", zIndex: 2 },

  /* PROOF */
  proofSection: { padding: "100px 8%", background: "#06061a", borderTop: "1px solid rgba(99,102,241,.1)", borderBottom: "1px solid rgba(99,102,241,.1)" },
  proofGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24 },
  proofCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "36px 20px", background: "rgba(15,17,40,.6)", border: "1px solid rgba(99,102,241,.12)", borderRadius: 18, textAlign: "center" },
  proofIcon: { fontSize: 30 },
  proofVal: { fontSize: 36, fontWeight: 900, background: "linear-gradient(135deg,#60a5fa,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "-0.04em" },
  proofLabel: { fontSize: 13, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" },

  /* CTA */
  ctaSection: { padding: "140px 8%", position: "relative", overflow: "hidden", background: "linear-gradient(135deg,#1e1b4b,#0f0f2d,#1e1b4b)", textAlign: "center" },
  ctaInner: { position: "relative", zIndex: 2 },
  ctaOrb1: { position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.2) 0%,transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", filter: "blur(30px)" },
  ctaOrb2: { position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,.15) 0%,transparent 70%)", top: "10%", right: "10%", filter: "blur(40px)" },
  ctaTitle: { fontSize: "clamp(36px,5vw,60px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", marginBottom: 20, lineHeight: 1.05 },
  ctaDesc: { fontSize: 17, color: "#a5b4fc", marginBottom: 44, fontWeight: 400 },
  ctaBtns: { display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" },

  /* FOOTER */
  footer: { background: "#020212", borderTop: "1px solid rgba(99,102,241,.12)", padding: "50px 8% 30px" },
  footerTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, flexWrap: "wrap", gap: 24 },
  footerLogo: { fontSize: 26, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.04em", display: "block", marginBottom: 6 },
  footerTagline: { fontSize: 13, color: "#475569", fontWeight: 500 },
  footerLinks: { display: "flex", gap: 28, flexWrap: "wrap" },
  footerLink: { fontSize: 14, color: "#64748b", fontWeight: 500, cursor: "pointer" },
  footerBottom: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(99,102,241,.08)", paddingTop: 24, fontSize: 13, color: "#475569", flexWrap: "wrap", gap: 12 },
  footerBadge: { fontSize: 11, fontWeight: 700, color: "#6366f1", background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.2)", borderRadius: 6, padding: "4px 12px", letterSpacing: "0.05em" },
};