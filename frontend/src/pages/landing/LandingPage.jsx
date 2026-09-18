import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DnaModel3D } from "../../components/3d/DnaModel3D";

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setW(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return w;
}

const C = {
  bg: "#08080F", bgCard: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.07)",
  border2: "rgba(255,255,255,0.12)", text: "#FFFFFF", textSub: "#A1A1C0",
  textMuted: "#64647A", purple: "#8B5CF6", violet: "#6D28D9", indigo: "#4F46E5",
  mint: "#10B981", cyan: "#06B6D4", rose: "#F43F5E", amber: "#F59E0B",
  gradH: "linear-gradient(135deg,#8B5CF6 0%,#4F46E5 50%,#06B6D4 100%)",
};

const glass = (extra = {}) => ({
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
  backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: 20, ...extra,
});

const pill = (color, bg) => ({
  display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px",
  borderRadius: 9999, background: bg || `${color}18`, border: `1px solid ${color}40`,
  color, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em",
});

function FCard({ icon, title, body, accent }) {
  const [h, setH] = useState(false);
  const a = accent || C.purple;
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ ...glass({ borderRadius: 24, padding: "28px 26px" }), border: `1px solid ${h ? a + "50" : "rgba(255,255,255,0.08)"}`, boxShadow: h ? `0 0 32px ${a}20` : "0 4px 24px rgba(0,0,0,0.3)", transform: h ? "translateY(-5px)" : "translateY(0)", transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)", cursor: "default" }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: `${a}20`, border: `1px solid ${a}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", marginBottom: 16, boxShadow: h ? `0 0 22px ${a}40` : "none", transition: "box-shadow 0.3s" }}>{icon}</div>
      <div style={{ fontSize: "1.05rem", fontWeight: 800, color: C.text, marginBottom: 8, fontFamily: "'Outfit',sans-serif" }}>{title}</div>
      <div style={{ fontSize: "0.88rem", color: C.textSub, lineHeight: 1.65 }}>{body}</div>
    </div>
  );
}

function Stat({ value, label, color }) {
  return (
    <div style={{ textAlign: "center", padding: "0 24px" }}>
      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(1.8rem,3vw,2.7rem)", fontWeight: 900, lineHeight: 1, color: color || C.purple, marginBottom: 6, textShadow: `0 0 28px ${color || C.purple}70` }}>{value}</div>
      <div style={{ fontSize: "0.74rem", color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    </div>
  );
}

function SHead({ eyebrow, title, sub }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 52 }}>
      {eyebrow && <div style={{ ...pill(C.purple), display: "inline-flex", marginBottom: 18 }}>{eyebrow}</div>}
      <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(2rem,3.8vw,3rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1, color: C.text, margin: "0 0 16px" }}>{title}</h2>
      {sub && <p style={{ fontSize: "1.02rem", color: C.textSub, maxWidth: 580, margin: "0 auto", lineHeight: 1.65 }}>{sub}</p>}
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const w = useWindowWidth();
  const isMobile = w < 768;
  const isTablet = w < 1100;
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { if (!isMobile) setMenuOpen(false); }, [isMobile]);

  const px = isMobile ? 20 : isTablet ? 36 : 72;
  const NAV = ["Features", "How it Works", "Enterprise", "Pricing"];

  const FEATURES = [
    { icon: "⚡", title: "Real-Time Interaction Radar", body: "Scans polypharmacy combinations against 2.1M+ drug pairs from FDA, DrugBank and WHO in under 50ms.", accent: C.purple },
    { icon: "🧠", title: "AI Clinical Intelligence", body: "Gemini-powered reasoning surfaces context-aware contraindications, dosage alerts, and pharmacokinetic red flags instantly.", accent: C.cyan },
    { icon: "💊", title: "Smart Adherence Tracking", body: "Dose ring visualisations, streak tracking, meal-time reminders, and personalised AI nudges keep patients on schedule.", accent: C.mint },
    { icon: "🩺", title: "Clinician Command Console", body: "Multi-patient cohort monitoring, NPI-verified prescriber workflows, and one-click EHR-connected digital Rx authoring.", accent: C.indigo },
    { icon: "🔗", title: "FHIR Interoperability", body: "Native HL7 FHIR R4 connects to Epic, Cerner, and Allscripts with zero-config API bridges.", accent: C.amber },
    { icon: "🛡", title: "Enterprise Security", body: "End-to-end AES-256 encryption, HIPAA BAA coverage, SOC-2 Type II audited, zero-trust access controls.", accent: C.rose },
  ];

  const hoverBtn = (e) => { e.currentTarget.style.transform = "translateY(-2px)"; };
  const unHoverBtn = (e) => { e.currentTarget.style.transform = "translateY(0)"; };

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'Plus Jakarta Sans',sans-serif", minHeight: "100vh", overflowX: "hidden", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:#08080F;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-track{background:#0D0D1A;}
        ::-webkit-scrollbar-thumb{background:#6D28D9;border-radius:3px;}
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.55;transform:scale(1.35)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        .luminous-grad-text{
          background: linear-gradient(120deg, #FFFFFF 0%, #A78BFA 28%, #38BDF8 65%, #34D399 100%);
          background-size: 200% auto;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          animation: gradShift 6s linear infinite;
          display: inline-block;
        }
      `}</style>

      {/* Ambient bg */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -200, right: -150, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.20) 0%,transparent 70%)", filter: "blur(90px)" }} />
        <div style={{ position: "absolute", bottom: -200, left: -100, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(6,182,212,0.14) 0%,transparent 70%)", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", top: "38%", left: "50%", transform: "translate(-50%,-50%)", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,70,229,0.10) 0%,transparent 70%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px)", backgroundSize: "60px 60px", maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%,black 20%,transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%,black 20%,transparent 100%)" }} />
      </div>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", background: scrolled ? "rgba(8,8,15,0.92)" : "rgba(8,8,15,0.55)", borderBottom: `1px solid ${scrolled ? C.border2 : "transparent"}`, transition: "all 0.3s ease" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: `14px ${px}px`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: C.gradH, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(139,92,246,0.55)", fontSize: "1.1rem", flexShrink: 0 }}>⚕</div>
            <div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.04em", color: C.text, lineHeight: 1.1 }}>HELIO</div>
              <div style={{ fontSize: "0.56rem", color: C.textMuted, letterSpacing: "0.11em", textTransform: "uppercase" }}>Medication Intelligence</div>
            </div>
          </button>
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
              {NAV.map((l) => (
                <button key={l} style={{ background: "none", border: "none", color: C.textSub, fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "inherit", transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = C.textSub)}
                >{l}</button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {!isMobile && (
              <button onClick={() => navigate("/login")} style={{ background: "none", border: `1px solid ${C.border2}`, color: C.textSub, padding: "8px 18px", borderRadius: 9999, fontSize: "0.86rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.purple; e.currentTarget.style.color = C.text; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.textSub; }}
              >Sign In</button>
            )}
            <button onClick={() => navigate("/login")} style={{ background: C.gradH, border: "none", color: "#FFF", padding: "9px 20px", borderRadius: 9999, fontSize: "0.86rem", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(139,92,246,0.42)", transition: "all 0.25s" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(139,92,246,0.62)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(139,92,246,0.42)"; }}
            >Get Started →</button>
            {isMobile && (
              <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: `1px solid ${C.border2}`, borderRadius: 10, padding: "7px 9px", cursor: "pointer", color: C.textSub, fontSize: "1rem", lineHeight: 1 }}>
                {menuOpen ? "✕" : "☰"}
              </button>
            )}
          </div>
        </div>
        {isMobile && menuOpen && (
          <div style={{ background: "rgba(8,8,15,0.98)", borderTop: `1px solid ${C.border}`, padding: "16px 20px 24px", display: "flex", flexDirection: "column" }}>
            {NAV.map((l) => (
              <button key={l} onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", borderBottom: `1px solid ${C.border}`, color: C.textSub, fontSize: "1rem", fontWeight: 600, cursor: "pointer", padding: "12px 0", textAlign: "left", fontFamily: "inherit" }}>{l}</button>
            ))}
            <button onClick={() => { setMenuOpen(false); navigate("/login"); }} style={{ marginTop: 14, background: C.gradH, border: "none", color: "#FFF", padding: "13px", borderRadius: 12, fontSize: "0.96rem", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Get Started Free →</button>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", zIndex: 10, minHeight: isMobile ? "auto" : "780px", display: "flex", alignItems: "center", padding: `${isMobile ? 42 : 56}px ${px}px ${isMobile ? 36 : 46}px`, overflow: "hidden" }}>
        {/* 3D DNA Double Helix Model running in the background behind the content */}
        <DnaModel3D style={{ opacity: 0.88 }} />

        {/* Ambient radial scrim behind text for 100% legibility over 3D strands */}
        <div style={{ position: "absolute", top: "20%", left: isMobile ? "50%" : "25%", transform: "translate(-50%,-20%)", width: isMobile ? 360 : 640, height: isMobile ? 360 : 540, borderRadius: "50%", background: "radial-gradient(circle, rgba(8,8,15,0.85) 0%, rgba(8,8,15,0.45) 60%, transparent 100%)", filter: "blur(30px)", pointerEvents: "none", zIndex: 1 }} />

        {/* Hero Foreground Dynamic Content Layer */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: 1320, width: "100%", margin: "0 auto" }}>
          <div style={{ maxWidth: isMobile ? "100%" : "720px", textAlign: isMobile ? "center" : "left" }}>
            
            {/* User-Friendly Eyebrow Badge */}
            <div style={{ marginBottom: 20, animation: "fadeUp 0.7s ease both", display: "inline-block" }}>
              <div style={{ ...pill(C.cyan, "rgba(6,182,212,0.12)"), display: "inline-flex", boxShadow: "0 0 24px rgba(6,182,212,0.25)", border: "1px solid rgba(6,182,212,0.35)", padding: "7px 16px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.cyan, boxShadow: `0 0 10px ${C.cyan}`, animation: "pulse 1.8s infinite", flexShrink: 0 }} />
                ✨ Smart, Safe Medication Guidance · Always On
              </div>
            </div>

            {/* High-Contrast Luminous Headline */}
            <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: isMobile ? "clamp(2.4rem,8vw,3.2rem)" : "clamp(3.2rem,4.8vw,4.75rem)", fontWeight: 900, letterSpacing: "-0.045em", lineHeight: 1.05, margin: "0 0 22px", animation: "fadeUp 0.8s 0.1s ease both" }}>
              <span style={{ color: "#FFFFFF", display: "block", textShadow: "0 4px 32px rgba(0,0,0,0.9)" }}>Safe Medication,</span>
              <span className="luminous-grad-text">
                Simplified for Everyday Life.
              </span>
            </h1>

            {/* Friendly, Clear, Relatable Subtitle */}
            <p style={{ fontSize: isMobile ? "1.02rem" : "1.16rem", color: "#F1F5F9", lineHeight: 1.72, maxWidth: 570, margin: isMobile ? "0 auto 32px" : "0 0 34px", animation: "fadeUp 0.8s 0.2s ease both", textShadow: "0 2px 18px rgba(0,0,0,0.95)", fontWeight: 400 }}>
              Instantly spot harmful pill clashes, receive gentle reminders for every dose, and get clear answers about side effects whenever you need them — zero confusion, just complete peace of mind.
            </p>

            {/* Simplified Action Area */}
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "center" : "flex-start", gap: 14, marginBottom: 32, animation: "fadeUp 0.8s 0.3s ease both" }}>
              <button
                onClick={() => navigate("/login")}
                style={{
                  background: C.gradH,
                  border: "none",
                  color: "#FFFFFF",
                  padding: isMobile ? "14px 28px" : "16px 36px",
                  borderRadius: 16,
                  fontSize: isMobile ? "0.98rem" : "1.05rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 8px 32px rgba(139,92,246,0.48), 0 0 20px rgba(6,182,212,0.22)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transition: "all 0.25s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 14px 44px rgba(139,92,246,0.65), 0 0 28px rgba(6,182,212,0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(139,92,246,0.48), 0 0 20px rgba(6,182,212,0.22)";
                }}
              >
                <span>Get Started</span>
                <span style={{ fontSize: "1.15rem" }}>→</span>
              </button>

              <button
                onClick={() => navigate("/login?role=patient")}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${C.border2}`,
                  color: "#FFFFFF",
                  padding: isMobile ? "13px 24px" : "15px 28px",
                  borderRadius: 16,
                  fontSize: isMobile ? "0.92rem" : "0.98rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.25s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.purple;
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.background = "rgba(139,92,246,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border2;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
              >
                <span>Explore Patient Portal</span>
              </button>
            </div>

            {/* User-Friendly Benefit Badges */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 560, animation: "fadeUp 0.8s 0.4s ease both" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: isMobile ? "center" : "flex-start" }}>
                {[
                  { icon: "🛡️", title: "Pill Clash Protection", desc: "Instant checks for harmful drug interactions", accent: C.purple },
                  { icon: "⏰", title: "Smart Dose Reminders", desc: "Never miss or double a scheduled time", accent: C.cyan },
                  { icon: "💬", title: "24/7 AI Health Companion", desc: "Plain-language answers to your questions", accent: C.mint },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 15px",
                      borderRadius: 14,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      backdropFilter: "blur(14px)",
                      WebkitBackdropFilter: "blur(14px)",
                      fontSize: "0.84rem",
                      color: "#E2E8F0",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                    }}
                  >
                    <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                    <span style={{ fontWeight: 700, color: "#FFFFFF" }}>{item.title}</span>
                    {!isMobile && <span style={{ color: "#94A3B8", fontSize: "0.78rem" }}>· {item.desc}</span>}
                  </div>
                ))}
              </div>

              {/* Friendly Trust Reassurance */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: isMobile ? "center" : "flex-start", gap: 14, marginTop: 8, flexWrap: "wrap", fontSize: "0.8rem", color: "#94A3B8" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#CBD5E1", fontWeight: 600 }}>
                  <span style={{ color: C.mint, fontWeight: 900 }}>✓</span> 100% Free for Patients
                </span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#CBD5E1", fontWeight: 600 }}>
                  <span style={{ color: C.cyan, fontWeight: 900 }}>✓</span> Private & Secure
                </span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#CBD5E1", fontWeight: 600 }}>
                  <span style={{ color: C.purple, fontWeight: 900 }}>✓</span> Doctor & Pharmacist Backed
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* DYNAMIC NUMERICAL STATS (Seamlessly blended with background, completely transparent at back) */}
      <section style={{ position: "relative", zIndex: 10, maxWidth: 1320, margin: "10px auto 60px", padding: `0 ${px}px` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: isMobile ? "center" : "space-between", flexWrap: "wrap", gap: isMobile ? 18 : 20 }}>
          {[
            { value: "2.1M+", label: "Prescriptions Checked", sub: "Safe combination checks", color: C.purple, icon: "🧬" },
            { value: "99.4%", label: "Safety Match Accuracy", sub: "Verified clinical guidelines", color: C.mint, icon: "⚡" },
            { value: "<1 Sec", label: "Instant Guidance", sub: "Real-time peace of mind", color: C.cyan, icon: "⏱" },
            { value: "850K+", label: "Patients Supported", sub: "Daily routine adherence", color: C.amber, icon: "🌱" },
            { value: "140+", label: "Healthcare Partners", sub: "Clinics & care providers", color: C.rose, icon: "🩺" },
          ].map((stat, idx) => (
            <div
              key={idx}
              style={{
                flex: isMobile ? "1 1 calc(50% - 14px)" : "1 1 180px",
                padding: isMobile ? "12px 10px" : "14px 16px",
                background: "transparent",
                border: "none",
                borderRadius: 16,
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                cursor: "default",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: "1.2rem" }}>{stat.icon}</span>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: stat.color, boxShadow: `0 0 8px ${stat.color}` }} />
              </div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: isMobile ? "1.75rem" : "2.35rem", fontWeight: 900, lineHeight: 1.05, color: stat.color, marginBottom: 6, textShadow: `0 0 28px ${stat.color}75` }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em", marginBottom: 2 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: "0.74rem", color: C.textMuted }}>
                {stat.sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ position: "relative", zIndex: 10, maxWidth: 1400, margin: "0 auto", padding: `${isMobile ? 70 : 100}px ${px}px` }}>
        <SHead
          eyebrow="✦ Platform Features"
          title={<>Everything to <span style={{ background: C.gradH, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>protect patients.</span></>}
          sub="A unified intelligence layer across every medication touchpoint — from prescription to adherence to contraindication detection."
        />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1fr 1fr 1fr", gap: 18 }}>
          {FEATURES.map((f, i) => <FCard key={i} {...f} />)}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ position: "relative", zIndex: 10, background: "rgba(255,255,255,0.018)", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: `${isMobile ? 70 : 100}px ${px}px` }}>
          <SHead eyebrow="✦ How It Works" title="Three steps to clinical safety." sub="From onboarding to live protection — HELIO is live in minutes, not months." />
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: isMobile ? 32 : 48, position: "relative" }}>
            {!isMobile && <div style={{ position: "absolute", top: 46, left: "17%", right: "17%", height: 1, background: `linear-gradient(90deg,${C.purple},${C.cyan},${C.mint})`, opacity: 0.28 }} />}
            {[
              { step: "01", icon: "👤", title: "Connect Your Patients", body: "Import medication lists via manual entry, EHR sync, or pharmacy data — HELIO auto-populates drug profiles.", color: C.purple },
              { step: "02", icon: "⚙", title: "AI Runs the Analysis", body: "Clinical AI cross-references every drug pair, dose, and condition against global pharmacovigilance databases.", color: C.cyan },
              { step: "03", icon: "🛡", title: "Receive Live Alerts", body: "Clinicians and patients get instant severity-tiered alerts with evidence-backed resolution directives.", color: C.mint },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center", position: "relative" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: `${s.color}16`, border: `1.5px solid ${s.color}45`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px", fontSize: "1.75rem", boxShadow: `0 0 28px ${s.color}28`, position: "relative", zIndex: 1 }}>{s.icon}</div>
                <div style={{ ...pill(s.color, `${s.color}10`), display: "inline-flex", marginBottom: 12 }}>Step {s.step}</div>
                <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: "1.12rem", fontWeight: 800, color: C.text, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: "0.9rem", color: C.textSub, lineHeight: 1.65, maxWidth: 270, margin: "0 auto" }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PERSONA CARDS */}
      <section style={{ position: "relative", zIndex: 10, maxWidth: 1400, margin: "0 auto", padding: `${isMobile ? 70 : 100}px ${px}px` }}>
        <SHead eyebrow="✦ Built For Everyone" title="One platform. Two powerful views." sub="HELIO serves both sides of the care equation with purpose-built workspaces." />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 18 }}>
          <div style={{ ...glass({ borderRadius: 28, padding: isMobile ? "28px" : "40px", border: "1px solid rgba(16,185,129,0.22)" }), boxShadow: "0 0 40px rgba(16,185,129,0.07)" }}>
            <div style={{ ...pill(C.mint, "rgba(16,185,129,0.12)"), marginBottom: 20 }}>🌱 Patient Workspace</div>
            <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: isMobile ? "1.5rem" : "1.85rem", fontWeight: 900, color: C.text, marginBottom: 12, letterSpacing: "-0.03em" }}>Your personal medication OS.</h3>
            <p style={{ color: C.textSub, fontSize: "0.93rem", lineHeight: 1.65, marginBottom: 24 }}>Track doses, get AI-powered meal-timing guidance, and access your entire medication history in one intuitive interface.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {["Real-time adherence ring & streak tracking","Meal-timing smart reminders","24/7 Helio AI medication assistant","Personal care team portal"].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.87rem", color: C.textSub }}><span style={{ color: C.mint, fontWeight: 900 }}>✓</span> {f}</div>
              ))}
            </div>
            <button onClick={() => navigate("/login?role=patient")} style={{ background: "linear-gradient(135deg,#059669,#10B981)", border: "none", color: "#FFF", padding: "13px 26px", borderRadius: 12, fontSize: "0.94rem", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 24px rgba(16,185,129,0.38)", transition: "all 0.25s" }}
              onMouseEnter={hoverBtn} onMouseLeave={unHoverBtn}
            >Enter Patient Portal →</button>
          </div>
          <div style={{ ...glass({ borderRadius: 28, padding: isMobile ? "28px" : "40px", border: "1px solid rgba(79,70,229,0.28)" }), boxShadow: "0 0 40px rgba(79,70,229,0.09)" }}>
            <div style={{ ...pill(C.indigo, "rgba(79,70,229,0.12)"), marginBottom: 20 }}>🩺 Clinician Console</div>
            <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: isMobile ? "1.5rem" : "1.85rem", fontWeight: 900, color: C.text, marginBottom: 12, letterSpacing: "-0.03em" }}>High-velocity pharmacovigilance.</h3>
            <p style={{ color: C.textSub, fontSize: "0.93rem", lineHeight: 1.65, marginBottom: 24 }}>Monitor entire patient cohorts, intercept contraindications before adverse events, and author digital Rx connected to live FDA data.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {["Multi-patient cohort dashboard","Severity-tiered interaction alerts","NPI-verified digital Rx authoring","HL7 FHIR EHR integration"].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.87rem", color: C.textSub }}><span style={{ color: C.indigo, fontWeight: 900 }}>✓</span> {f}</div>
              ))}
            </div>
            <button onClick={() => navigate("/login?role=doctor")} style={{ background: "linear-gradient(135deg,#4F46E5,#6D28D9)", border: "none", color: "#FFF", padding: "13px 26px", borderRadius: 12, fontSize: "0.94rem", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 24px rgba(79,70,229,0.38)", transition: "all 0.25s" }}
              onMouseEnter={hoverBtn} onMouseLeave={unHoverBtn}
            >Enter Clinician Console →</button>
          </div>
        </div>
      </section>

      {/* BENTO */}
      <section style={{ position: "relative", zIndex: 10, background: "rgba(255,255,255,0.015)", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: `${isMobile ? 70 : 100}px ${px}px` }}>
          <SHead eyebrow="✦ Enterprise Grade" title="Built for the world's most critical workflows." sub="HELIO integrates directly into clinical infrastructure and patient care pathways at scale." />
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 16 }}>
            <div style={{ ...glass({ borderRadius: 24, padding: "30px", border: "1px solid rgba(6,182,212,0.2)" }), gridColumn: isMobile ? "1" : "span 2", boxShadow: "0 0 30px rgba(6,182,212,0.06)" }}>
              <div style={{ ...pill(C.cyan, "rgba(6,182,212,0.12)"), marginBottom: 14 }}>⚡ Sub-50ms Response</div>
              <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: "1.35rem", fontWeight: 800, color: C.text, marginBottom: 8 }}>Real-time at clinical scale.</h3>
              <p style={{ color: C.textSub, fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 18 }}>Distributed inference processes 10,000+ concurrent interaction checks per second with P99 latency under 50ms.</p>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, background: "rgba(6,182,212,0.05)", borderRadius: 12, padding: "14px 18px", border: "1px solid rgba(6,182,212,0.14)" }}>
                {["Patient EHR","→","AI Engine","→","Drug DB","→","Alert"].map((s, i) => (
                  <div key={i} style={{ fontSize: s === "→" ? "0.9rem" : "0.78rem", color: s === "→" ? C.border2 : C.textSub, fontWeight: s === "→" ? 400 : 700, padding: s === "→" ? "0 2px" : "5px 11px", background: s === "→" ? "none" : "rgba(255,255,255,0.04)", borderRadius: s === "→" ? 0 : 7, border: s === "→" ? "none" : `1px solid ${C.border}` }}>{s}</div>
                ))}
              </div>
            </div>
            <div style={{ ...glass({ borderRadius: 24, padding: "28px", border: "1px solid rgba(245,158,11,0.2)" }), boxShadow: "0 0 28px rgba(245,158,11,0.06)", gridRow: isMobile ? "auto" : "span 2" }}>
              <div style={{ ...pill(C.amber, "rgba(245,158,11,0.12)"), marginBottom: 14 }}>🔬 FDA Intelligence</div>
              <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: "1.15rem", fontWeight: 800, color: C.text, marginBottom: 8 }}>Live drug database.</h3>
              <p style={{ color: C.textSub, fontSize: "0.86rem", lineHeight: 1.58, marginBottom: 18 }}>Continuous sync with FDA Orange Book, DailyMed, and OpenFDA adverse event reporting.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {[["FDA Orange Book","↑ 47K entries",C.amber],["DailyMed Labels","2.1M+ labels",C.purple],["Adverse Events","18M reports",C.rose],["Last Sync","< 2 min ago",C.mint]].map(([l,v,c],i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 13px", background: "rgba(255,255,255,0.028)", borderRadius: 10, border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: "0.78rem", color: C.textSub, fontWeight: 600 }}>{l}</span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 800, color: c }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...glass({ borderRadius: 24, padding: "26px", border: "1px solid rgba(244,63,94,0.2)" }), boxShadow: "0 0 24px rgba(244,63,94,0.06)" }}>
              <div style={{ ...pill(C.rose, "rgba(244,63,94,0.12)"), marginBottom: 14 }}>🛡 Zero-Trust Security</div>
              <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: "1.05rem", fontWeight: 800, color: C.text, marginBottom: 12 }}>Enterprise-hardened.</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {["HIPAA BAA","SOC-2 Type II","AES-256","GDPR","HL7 FHIR","OAuth 2.0"].map((b, i) => (
                  <span key={i} style={{ padding: "4px 11px", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 9999, fontSize: "0.7rem", fontWeight: 700, color: C.rose }}>{b}</span>
                ))}
              </div>
            </div>
            <div style={{ ...glass({ borderRadius: 24, padding: "26px", border: "1px solid rgba(139,92,246,0.2)" }), boxShadow: "0 0 24px rgba(139,92,246,0.06)" }}>
              <div style={{ ...pill(C.purple, "rgba(139,92,246,0.12)"), marginBottom: 14 }}>🔗 EHR Integrations</div>
              <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: "1.05rem", fontWeight: 800, color: C.text, marginBottom: 12 }}>Connects to your stack.</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {["Epic","Cerner","Allscripts","Athena","DrFirst","Surescripts"].map((b, i) => (
                  <span key={i} style={{ padding: "4px 11px", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 9999, fontSize: "0.7rem", fontWeight: 700, color: C.purple }}>{b}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: "relative", zIndex: 10, maxWidth: 1400, margin: "0 auto", padding: `${isMobile ? 44 : 76}px ${px}px` }}>
        <div style={{ borderRadius: 32, overflow: "hidden", position: "relative", background: "linear-gradient(135deg,rgba(139,92,246,0.16) 0%,rgba(79,70,229,0.10) 50%,rgba(6,182,212,0.10) 100%)", border: "1px solid rgba(139,92,246,0.22)", padding: isMobile ? "48px 24px" : "70px 64px", textAlign: "center", boxShadow: "0 0 80px rgba(139,92,246,0.10)" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 460, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.16) 0%,transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ ...pill(C.purple), marginBottom: 18, display: "inline-flex" }}>🚀 No Credit Card Required</div>
            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: isMobile ? "clamp(1.9rem,8vw,2.6rem)" : "clamp(2.3rem,4vw,3.3rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1, color: C.text, margin: "0 auto 16px", maxWidth: 660 }}>Ready to protect your patients?</h2>
            <p style={{ fontSize: "1.02rem", color: C.textSub, lineHeight: 1.65, maxWidth: 500, margin: "0 auto 38px" }}>Join 850,000+ patients and 148+ healthcare organizations already preventing medication errors with HELIO.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
              <button onClick={() => navigate("/login")} style={{ background: C.gradH, border: "none", color: "#FFF", padding: "15px 38px", borderRadius: 14, fontSize: "1.02rem", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 32px rgba(139,92,246,0.50)", transition: "all 0.25s" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 44px rgba(139,92,246,0.66)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(139,92,246,0.50)"; }}
              >Get Started Free →</button>
              <button onClick={() => navigate("/login?role=doctor")} style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border2}`, color: C.text, padding: "15px 38px", borderRadius: 14, fontSize: "1.02rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", backdropFilter: "blur(10px)", transition: "all 0.25s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.purple; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.transform = "translateY(0)"; }}
              >Enterprise Demo</button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ position: "relative", zIndex: 10, borderTop: `1px solid ${C.border}`, background: "rgba(255,255,255,0.012)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: `52px ${px}px 30px` }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr 1fr", gap: isMobile ? 32 : 64, marginBottom: 44 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: C.gradH, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", boxShadow: "0 0 16px rgba(139,92,246,0.42)", flexShrink: 0 }}>⚕</div>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: "1.3rem", fontWeight: 900, color: C.text, letterSpacing: "-0.04em" }}>HELIO</span>
              </div>
              <p style={{ color: C.textMuted, fontSize: "0.86rem", lineHeight: 1.65, maxWidth: 270, marginBottom: 16 }}>AI-powered medication intelligence for enterprise healthcare. Protecting patients at every dose.</p>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.76rem", color: C.textMuted }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.mint, boxShadow: `0 0 6px ${C.mint}`, flexShrink: 0, animation: "pulse 2s infinite" }} />
                All systems operational
              </div>
            </div>
            {[
              { title: "Product", links: ["Features","How It Works","Pricing","Enterprise","Security"] },
              { title: "Company", links: ["About","Blog","Careers","Press","Contact"] },
              { title: "Legal", links: ["Privacy Policy","Terms","HIPAA","Cookie Policy"] },
            ].map((col) => (
              <div key={col.title}>
                <div style={{ fontSize: "0.74rem", fontWeight: 800, color: C.text, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>{col.title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map((l) => (
                    <button key={l} style={{ background: "none", border: "none", color: C.textMuted, fontSize: "0.86rem", cursor: "pointer", padding: 0, textAlign: "left", fontFamily: "inherit", transition: "color 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = C.textMuted)}
                    >{l}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, fontSize: "0.76rem", color: C.textMuted }}>
            <span>© 2026 HELIO Health, Inc. All rights reserved.</span>
            <span>HIPAA Compliant · SOC-2 Type II · Built with ♥ for safer healthcare</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
