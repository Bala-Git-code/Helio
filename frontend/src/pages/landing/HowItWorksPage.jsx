import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HelioLogo } from "../../components/common/HelioLogo";

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
  bg: "#08080F",
  bgCard: "rgba(255, 255, 255, 0.035)",
  bgCardHover: "rgba(255, 255, 255, 0.06)",
  border: "rgba(255, 255, 255, 0.08)",
  border2: "rgba(255, 255, 255, 0.14)",
  text: "#FFFFFF",
  textSub: "#94A3B8",
  textMuted: "#64748B",
  purple: "#8B5CF6",
  violet: "#6D28D9",
  indigo: "#4F46E5",
  mint: "#10B981",
  cyan: "#06B6D4",
  rose: "#F43F5E",
  amber: "#F59E0B",
  gradH: "linear-gradient(135deg, #8B5CF6 0%, #4F46E5 50%, #06B6D4 100%)",
  gradCyan: "linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)",
  gradEmerald: "linear-gradient(135deg, #10B981 0%, #06B6D4 100%)",
  gradAmber: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
};

const SIMULATION_PAIRS = [
  {
    id: "statin-grapefruit",
    name1: "Atorvastatin (Lipitor 20mg)",
    name2: "Grapefruit Bioflavonoids",
    status: "Severe Risk Detected",
    level: "danger",
    mechanism: "Intestinal CYP3A4 Enzyme Inhibition",
    details: "Grapefruit suppresses gut CYP3A4, causing systemic atorvastatin bioavailability to increase by up to 330%, raising risk of rhabdomyolysis and acute myopathy.",
    solution: "HELIO automatically flags this food-drug conflict and suggests substituting with Rosuvastatin (CYP2C9 pathway) or separating consumption by 24h.",
  },
  {
    id: "ace-potassium",
    name1: "Lisinopril (Zestril 10mg)",
    name2: "Potassium Chloride (K-Dur 20mEq)",
    status: "Moderate Alert",
    level: "warning",
    mechanism: "Pharmacodynamic Aldosterone Blunting",
    details: "ACE inhibitors reduce aldosterone secretion, impairing renal potassium excretion. Concurrent high potassium supplementation risks cardiac hyperkalemia.",
    solution: "HELIO alerts prescribing doctor to monitor serum potassium and adjust daily supplementation limits.",
  },
  {
    id: "amox-tylenol",
    name1: "Amoxicillin (500mg)",
    name2: "Acetaminophen (500mg)",
    status: "Safe & Compatible",
    level: "safe",
    mechanism: "Orthogonal Clearance Pathways",
    details: "Amoxicillin undergoes renal tubular filtration while Acetaminophen undergoes hepatic glucuronidation. No metabolic clashes or absorption interference.",
    solution: "HELIO confirms safe co-administration and schedules optimal dose timing alongside meals.",
  },
];

export function HowItWorksPage() {
  const navigate = useNavigate();
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width < 1024;
  const px = isMobile ? 20 : isTablet ? 36 : 64;

  const [activeSimulation, setActiveSimulation] = useState(SIMULATION_PAIRS[0]);
  const [activeTab, setActiveTab] = useState("ingest");

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes pulseSlow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.06); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1000%); }
        }
        .glow-hover:hover {
          border-color: rgba(139, 92, 246, 0.45) !important;
          box-shadow: 0 12px 36px rgba(139, 92, 246, 0.18) !important;
        }
      `}</style>

      {/* Ambient Cosmic Radial Backdrops */}
      <div
        style={{
          position: "fixed",
          top: -120,
          left: "20%",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 70%)",
          filter: "blur(90px)",
          pointerEvents: "none",
          zIndex: 0,
          animation: "pulseSlow 8s infinite ease-in-out",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "40%",
          right: -100,
          width: 550,
          height: 550,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.14) 0%, rgba(16, 185, 129, 0.06) 60%, transparent 70%)",
          filter: "blur(100px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* STICKY GLASS NAVIGATION BAR */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(8, 8, 15, 0.82)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${C.border}`,
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            maxWidth: 1360,
            margin: "0 auto",
            padding: `14px ${px}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Official Brand Lockup */}
          <div
            onClick={() => navigate("/")}
            style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
          >
            <HelioLogo
              variant="badge"
              size={36}
              badgeGradient={C.gradH}
              badgeRadius={11}
              badgeShadow="0 0 20px rgba(139,92,246,0.45)"
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "1.34rem",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: "#FFFFFF",
                  lineHeight: 1.1,
                }}
              >
                HELIO
              </span>
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: "#94A3B8",
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                }}
              >
                Architecture & Workflow
              </span>
            </div>
          </div>

          {/* Quick Anchor Links (Desktop) */}
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: "0.88rem", fontWeight: 600 }}>
              <a href="#pipeline" style={{ color: C.textSub, textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = C.text} onMouseLeave={(e) => e.currentTarget.style.color = C.textSub}>
                The Pipeline
              </a>
              <a href="#radar" style={{ color: C.textSub, textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = C.text} onMouseLeave={(e) => e.currentTarget.style.color = C.textSub}>
                Molecular Radar
              </a>
              <a href="#simulator" style={{ color: C.textSub, textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = C.text} onMouseLeave={(e) => e.currentTarget.style.color = C.textSub}>
                Live Clash Simulator
              </a>
              <a href="#compliance" style={{ color: C.textSub, textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = C.text} onMouseLeave={(e) => e.currentTarget.style.color = C.textSub}>
                Clinical Security
              </a>
            </div>
          )}

          {/* Action CTAs */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${C.border2}`,
                color: "#FFFFFF",
                padding: isMobile ? "7px 14px" : "8px 18px",
                borderRadius: 12,
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.purple;
                e.currentTarget.style.background = "rgba(139,92,246,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border2;
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
            >
              ← Home
            </button>

            <button
              onClick={() => navigate("/login")}
              style={{
                background: C.gradH,
                border: "none",
                color: "#FFFFFF",
                padding: isMobile ? "8px 16px" : "8px 22px",
                borderRadius: 12,
                fontSize: "0.86rem",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(139,92,246,0.45)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 8px 28px rgba(139,92,246,0.65)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(139,92,246,0.45)";
              }}
            >
              Get Started →
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section
        style={{
          position: "relative",
          zIndex: 10,
          padding: `${isMobile ? 54 : 84}px ${px}px ${isMobile ? 40 : 64}px`,
          maxWidth: 1320,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        {/* Eyebrow badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 16px",
            borderRadius: 9999,
            background: "rgba(139, 92, 246, 0.12)",
            border: "1px solid rgba(139, 92, 246, 0.32)",
            color: "#C4B5FD",
            fontSize: "0.78rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: C.cyan,
              boxShadow: `0 0 8px ${C.cyan}`,
            }}
          />
          The HELIO Clinical Architecture · How It Works
        </div>

        {/* Hero Title */}
        <h1
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "clamp(2.2rem, 4.8vw, 3.8rem)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1.12,
            margin: "0 auto 22px",
            maxWidth: 960,
            background: "linear-gradient(180deg, #FFFFFF 20%, #CBD5E1 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Zero Harm, Zero Guesswork.
          <br />
          <span
            style={{
              background: C.gradH,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            How HELIO Protects Every Single Dose
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p
          style={{
            fontSize: isMobile ? "1.04rem" : "1.2rem",
            color: C.textSub,
            lineHeight: 1.7,
            maxWidth: 760,
            margin: "0 auto 42px",
            fontWeight: 400,
          }}
        >
          From computer-vision prescription scanning to CYP450 biophysical enzyme collision
          modeling and circadian chronotherapy, explore the complete technology stack designed
          to prevent adverse drug events before they ever reach your bloodstream.
        </p>

        {/* High-Level Metric Stat Bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: 16,
            background: "rgba(255, 255, 255, 0.025)",
            border: `1px solid ${C.border}`,
            borderRadius: 22,
            padding: "24px 20px",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            maxWidth: 1080,
            margin: "0 auto",
          }}
        >
          {[
            { val: "42,000+", label: "Molecular Monographs", col: C.purple },
            { val: "<18ms", label: "Real-Time Inference", col: C.cyan },
            { val: "99.4%", label: "Adverse Clash Detection", col: C.mint },
            { val: "100%", label: "HIPAA & FDA Part 11", col: "#CBD5E1" },
          ].map((s, idx) => (
            <div
              key={idx}
              style={{
                textAlign: "center",
                borderRight: !isMobile && idx < 3 ? `1px solid ${C.border}` : "none",
                padding: "8px 12px",
              }}
            >
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "clamp(1.6rem, 2.6vw, 2.2rem)",
                  fontWeight: 900,
                  color: s.col,
                  letterSpacing: "-0.03em",
                  marginBottom: 4,
                  textShadow: `0 0 24px ${s.col}40`,
                }}
              >
                {s.val}
              </div>
              <div
                style={{
                  fontSize: "0.74rem",
                  color: C.textMuted,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PIPELINE STAGES (USING THE 3 AI GENERATED IMAGES) */}
      <section
        id="pipeline"
        style={{
          position: "relative",
          zIndex: 10,
          padding: `40px ${px}px 80px`,
          maxWidth: 1320,
          margin: "0 auto",
        }}
      >
        {/* SECTION HEADER */}
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 14px",
              borderRadius: 9999,
              background: "rgba(6, 182, 212, 0.12)",
              border: "1px solid rgba(6, 182, 212, 0.30)",
              color: C.cyan,
              fontSize: "0.74rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 16,
            }}
          >
            The 3-Phase Engine
          </div>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "clamp(2rem, 3.4vw, 2.8rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              margin: "0 0 16px",
            }}
          >
            How HELIO Analyzes Your Meds In Three Steps
          </h2>
          <p style={{ fontSize: "1.05rem", color: C.textSub, maxWidth: 640, margin: "0 auto" }}>
            Every prescription passes through optical parsing, biophysical interaction
            radar, and circadian dosage optimization.
          </p>
        </div>

        {/* STEP 1: RX INGESTION & PARSING (AI Image 1) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isTablet ? "1fr" : "1.1fr 1fr",
            gap: isMobile ? 32 : 54,
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.025)",
            border: `1px solid ${C.border}`,
            borderRadius: 28,
            padding: isMobile ? "24px 20px" : "44px 40px",
            marginBottom: 48,
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          }}
          className="glow-hover"
        >
          {/* Visual AI Generated Preview */}
          <div
            style={{
              position: "relative",
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid rgba(6, 182, 212, 0.25)",
              boxShadow: "0 16px 48px rgba(0, 0, 0, 0.6), 0 0 32px rgba(6, 182, 212, 0.15)",
            }}
          >
            <img
              src="/images/rx-analysis-protocol.jpg"
              alt="Futuristic clinical HUD scanning medication capsules with molecular breakdown"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                objectFit: "cover",
                transform: "scale(1.01)",
              }}
            />
            {/* Live Holographic Badge Overlay */}
            <div
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                background: "rgba(8, 8, 15, 0.82)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(6, 182, 212, 0.35)",
                borderRadius: 10,
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.74rem",
                fontWeight: 700,
                color: C.cyan,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.cyan, boxShadow: `0 0 8px ${C.cyan}` }} />
              AI Protocol: Optical Neural OCR · Live Ingestion
            </div>
          </div>

          {/* Explanation Text */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: C.cyan,
                fontSize: "0.78rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Phase 01 · Ingestion & Normalization
            </div>
            <h3
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: isMobile ? "1.6rem" : "2.1rem",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                margin: "0 0 16px",
                lineHeight: 1.2,
              }}
            >
              Instant Multimodal Prescription Scanning
            </h3>
            <p style={{ color: C.textSub, fontSize: "0.98rem", lineHeight: 1.7, marginBottom: 24 }}>
              Whether you upload a physical photo of a pharmacy pill bottle, scan an NDC barcode, or link directly via Epic / Cerner FHIR API, HELIO's neural optical recognition identifies:
            </p>

            {/* Checklist of features */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
              {[
                { title: "Active Pharmaceutical Ingredients (APIs)", desc: "Separates brand marketing names (e.g., Lipitor) into active chemical molecular structures (Atorvastatin Calcium)." },
                { title: "Formulation & Kinetics (IR, ER, XR)", desc: "Detects extended release vs. immediate release mechanisms to compute exact bio-absorption curves." },
                { title: "Daily Dose & Frequency Normalization", desc: "Translates doctor shorthand ('1 tab PO QHS') into unified chronotherapy timing schedules." },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "rgba(6, 182, 212, 0.15)",
                      border: "1px solid rgba(6, 182, 212, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: C.cyan,
                      fontSize: "0.78rem",
                      fontWeight: 900,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    ✓
                  </div>
                  <div>
                    <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#FFFFFF", marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: "0.82rem", color: C.textSub, lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                background: "rgba(6, 182, 212, 0.08)",
                border: "1px solid rgba(6, 182, 212, 0.2)",
                borderRadius: 14,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>🔬</span>
              <span style={{ fontSize: "0.84rem", color: "#E2E8F0" }}>
                <strong>RxNorm Cross-Reference:</strong> Every active molecule is mapped directly to authoritative NIH U.S. National Library of Medicine identifiers.
              </span>
            </div>
          </div>
        </div>

        {/* STEP 2: MOLECULAR RADAR & CYP450 CLASH ANALYSIS (AI Image 2) */}
        <div
          id="radar"
          style={{
            display: "grid",
            gridTemplateColumns: isTablet ? "1fr" : "1fr 1.1fr",
            gap: isMobile ? 32 : 54,
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.025)",
            border: `1px solid ${C.border}`,
            borderRadius: 28,
            padding: isMobile ? "24px 20px" : "44px 40px",
            marginBottom: 48,
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          }}
          className="glow-hover"
        >
          {/* Explanation Text */}
          <div style={{ order: isTablet ? 2 : 1 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: C.purple,
                fontSize: "0.78rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Phase 02 · The Biophysical Engine
            </div>
            <h3
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: isMobile ? "1.6rem" : "2.1rem",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                margin: "0 0 16px",
                lineHeight: 1.2,
              }}
            >
              3D Molecular Interaction & CYP450 Radar
            </h3>
            <p style={{ color: C.textSub, fontSize: "0.98rem", lineHeight: 1.7, marginBottom: 24 }}>
              Most pharmacy apps only check basic pair lookups. HELIO goes deeper by mapping enzymatic metabolic clearance across liver cytochrome P450 isoenzymes:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
              {[
                { title: "CYP3A4, CYP2C19 & CYP2D6 Collision Mapping", desc: "Detects competitive inhibition where one pill blocks the metabolic clearance of another, causing toxic plasma build-up." },
                { title: "QTc Prolongation & Arrhythmia Guard", desc: "Flags additive cardiac risks when multiple antiarrhythmics, antibiotics, or antidepressants are combined." },
                { title: "Dietary Bioflavonoid & Supplement Filters", desc: "Scans for over-the-counter herbals (St. John's Wort, Ginkgo) and food interactions (Grapefruit, High Calcium, High Vitamin K)." },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "rgba(139, 92, 246, 0.15)",
                      border: "1px solid rgba(139, 92, 246, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: C.purple,
                      fontSize: "0.78rem",
                      fontWeight: 900,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    ✓
                  </div>
                  <div>
                    <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#FFFFFF", marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: "0.82rem", color: C.textSub, lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                background: "rgba(139, 92, 246, 0.08)",
                border: "1px solid rgba(139, 92, 246, 0.2)",
                borderRadius: 14,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>🛡️</span>
              <span style={{ fontSize: "0.84rem", color: "#E2E8F0" }}>
                <strong>Zero Alert Fatigue:</strong> Clear, actionable clinical guidance with tailored clinician substitution recommendations, not noisy false alarms.
              </span>
            </div>
          </div>

          {/* Visual AI Generated Preview */}
          <div
            style={{
              order: isTablet ? 1 : 2,
              position: "relative",
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid rgba(139, 92, 246, 0.25)",
              boxShadow: "0 16px 48px rgba(0, 0, 0, 0.6), 0 0 32px rgba(139, 92, 246, 0.15)",
            }}
          >
            <img
              src="/images/molecular-interaction-radar.jpg"
              alt="Holographic molecular interaction radar detecting drug clashes"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                objectFit: "cover",
                transform: "scale(1.01)",
              }}
            />
            {/* Live Holographic Badge Overlay */}
            <div
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "rgba(8, 8, 15, 0.82)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(139, 92, 246, 0.35)",
                borderRadius: 10,
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.74rem",
                fontWeight: 700,
                color: "#C4B5FD",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.purple, boxShadow: `0 0 8px ${C.purple}` }} />
              Biophysical Radar · 42,000+ Compounds Evaluated
            </div>
          </div>
        </div>

        {/* STEP 3: PERSONALIZED CHRONOTHERAPY & ADHERENCE (AI Image 3) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isTablet ? "1fr" : "1.1fr 1fr",
            gap: isMobile ? 32 : 54,
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.025)",
            border: `1px solid ${C.border}`,
            borderRadius: 28,
            padding: isMobile ? "24px 20px" : "44px 40px",
            marginBottom: 48,
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          }}
          className="glow-hover"
        >
          {/* Visual AI Generated Preview */}
          <div
            style={{
              position: "relative",
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              boxShadow: "0 16px 48px rgba(0, 0, 0, 0.6), 0 0 32px rgba(16, 185, 129, 0.15)",
            }}
          >
            <img
              src="/images/patient-routine-telemetry.jpg"
              alt="Futuristic patient clinical routine telemetry dashboard with adherence rings"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                objectFit: "cover",
                transform: "scale(1.01)",
              }}
            />
            {/* Live Holographic Badge Overlay */}
            <div
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                background: "rgba(8, 8, 15, 0.82)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                borderRadius: 10,
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.74rem",
                fontWeight: 700,
                color: C.mint,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.mint, boxShadow: `0 0 8px ${C.mint}` }} />
              Chronotherapy Monitor · Circadian Dose Telemetry
            </div>
          </div>

          {/* Explanation Text */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: C.mint,
                fontSize: "0.78rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Phase 03 · Circadian Chronotherapy
            </div>
            <h3
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: isMobile ? "1.6rem" : "2.1rem",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                margin: "0 0 16px",
                lineHeight: 1.2,
              }}
            >
              Intelligent Timing & Patient Routine Telemetry
            </h3>
            <p style={{ color: C.textSub, fontSize: "0.98rem", lineHeight: 1.7, marginBottom: 24 }}>
              Medication efficacy depends heavily on <em>when</em> you take it. HELIO builds a personalized daily intake routine that optimizes physiological absorption:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
              {[
                { title: "Peak Biological Synthesis Windows", desc: "Schedules cholesterol-lowering statins at bedtime when hepatic HMG-CoA reductase enzyme activity peaks." },
                { title: "GI Buffer & Spacing Protections", desc: "Enforces mandatory 4-hour spacing between thyroid hormones (Levothyroxine) and calcium/iron supplements." },
                { title: "One-Tap Adherence Telemetry", desc: "Patients record taken doses with micro-confirmations, syncing live biometric adherence rings to their clinical care team." },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "rgba(16, 185, 129, 0.15)",
                      border: "1px solid rgba(16, 185, 129, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: C.mint,
                      fontSize: "0.78rem",
                      fontWeight: 900,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    ✓
                  </div>
                  <div>
                    <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#FFFFFF", marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: "0.82rem", color: C.textSub, lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                borderRadius: 14,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>🔔</span>
              <span style={{ fontSize: "0.84rem", color: "#E2E8F0" }}>
                <strong>Empathetic Push Reminders:</strong> Never feel scolded. Intelligent reminders adapt around sleep schedules, meal times, and time zone changes.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE FEATURE: LIVE DRUG CLASH SIMULATOR */}
      <section
        id="simulator"
        style={{
          position: "relative",
          zIndex: 10,
          padding: `40px ${px}px 80px`,
          maxWidth: 1180,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.04) 50%, rgba(8, 8, 15, 0.8) 100%)",
            border: `1px solid ${C.border2}`,
            borderRadius: 32,
            padding: isMobile ? "28px 20px" : "48px 48px",
            boxShadow: "0 24px 64px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 14px",
                borderRadius: 9999,
                background: "rgba(139, 92, 246, 0.15)",
                border: "1px solid rgba(139, 92, 246, 0.35)",
                color: "#C4B5FD",
                fontSize: "0.74rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 14,
              }}
            >
              Interactive Experience
            </div>
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: isMobile ? "1.8rem" : "2.5rem",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                margin: "0 0 12px",
              }}
            >
              Test the HELIO Interaction Simulator
            </h2>
            <p style={{ color: C.textSub, fontSize: "0.96rem", maxWidth: 600, margin: "0 auto" }}>
              Select a scenario below to observe how the HELIO engine evaluates molecular collisions, flags clinical risks, and generates safe solutions.
            </p>
          </div>

          {/* Scenario Selector Pills */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 32,
            }}
          >
            {SIMULATION_PAIRS.map((pair) => {
              const isSelected = activeSimulation.id === pair.id;
              return (
                <button
                  key={pair.id}
                  onClick={() => setActiveSimulation(pair)}
                  style={{
                    background: isSelected ? "rgba(139, 92, 246, 0.22)" : "rgba(255, 255, 255, 0.04)",
                    border: isSelected ? `1px solid ${C.purple}` : `1px solid ${C.border}`,
                    color: isSelected ? "#FFFFFF" : C.textSub,
                    padding: "10px 18px",
                    borderRadius: 14,
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: isSelected ? "0 4px 20px rgba(139,92,246,0.3)" : "none",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: pair.level === "danger" ? C.rose : pair.level === "warning" ? C.amber : C.mint,
                    }}
                  />
                  <span>{pair.name1.split(" ")[0]} + {pair.name2.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Active Simulation Result Display Card */}
          <div
            style={{
              background: "rgba(8, 8, 15, 0.75)",
              border: `1px solid ${
                activeSimulation.level === "danger"
                  ? "rgba(244, 63, 94, 0.4)"
                  : activeSimulation.level === "warning"
                  ? "rgba(245, 158, 11, 0.4)"
                  : "rgba(16, 185, 129, 0.4)"
              }`,
              borderRadius: 24,
              padding: isMobile ? "24px 18px" : "36px 36px",
              boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
              position: "relative",
            }}
          >
            {/* Top Status Header */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                borderBottom: `1px solid ${C.border}`,
                paddingBottom: 20,
                marginBottom: 24,
              }}
            >
              <div>
                <div style={{ fontSize: "0.75rem", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 4 }}>
                  Evaluating Regimen Collision
                </div>
                <div style={{ fontSize: isMobile ? "1.1rem" : "1.3rem", fontWeight: 800, color: "#FFFFFF" }}>
                  {activeSimulation.name1} &nbsp;+&nbsp; {activeSimulation.name2}
                </div>
              </div>

              {/* Status Badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  borderRadius: 9999,
                  background:
                    activeSimulation.level === "danger"
                      ? "rgba(244, 63, 94, 0.15)"
                      : activeSimulation.level === "warning"
                      ? "rgba(245, 158, 11, 0.15)"
                      : "rgba(16, 185, 129, 0.15)",
                  border: `1px solid ${
                    activeSimulation.level === "danger"
                      ? C.rose
                      : activeSimulation.level === "warning"
                      ? C.amber
                      : C.mint
                  }`,
                  color:
                    activeSimulation.level === "danger"
                      ? "#FDA4AF"
                      : activeSimulation.level === "warning"
                      ? "#FDE68A"
                      : "#6EE7B7",
                  fontWeight: 800,
                  fontSize: "0.88rem",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background:
                      activeSimulation.level === "danger"
                        ? C.rose
                        : activeSimulation.level === "warning"
                        ? C.amber
                        : C.mint,
                    boxShadow: `0 0 10px ${
                      activeSimulation.level === "danger"
                        ? C.rose
                        : activeSimulation.level === "warning"
                        ? C.amber
                        : C.mint
                    }`,
                  }}
                />
                {activeSimulation.status}
              </div>
            </div>

            {/* Content Details Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isTablet ? "1fr" : "1fr 1fr",
                gap: 24,
              }}
            >
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: C.cyan, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  Pharmacological Mechanism
                </div>
                <div style={{ fontSize: "1.02rem", fontWeight: 700, color: "#FFFFFF", marginBottom: 8 }}>
                  {activeSimulation.mechanism}
                </div>
                <p style={{ fontSize: "0.88rem", color: C.textSub, lineHeight: 1.6, margin: 0 }}>
                  {activeSimulation.details}
                </p>
              </div>

              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: "18px 20px",
                }}
              >
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: C.mint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  HELIO Clinical Action Protocol
                </div>
                <p style={{ fontSize: "0.88rem", color: "#E2E8F0", lineHeight: 1.6, margin: 0 }}>
                  {activeSimulation.solution}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REGULATORY COMPLIANCE & CLINICAL GRADE SAFETY */}
      <section
        id="compliance"
        style={{
          position: "relative",
          zIndex: 10,
          padding: `20px ${px}px 80px`,
          maxWidth: 1320,
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 14px",
              borderRadius: 9999,
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.30)",
              color: C.mint,
              fontSize: "0.74rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 16,
            }}
          >
            Clinical Security
          </div>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "clamp(1.9rem, 3.2vw, 2.6rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              margin: "0 0 14px",
            }}
          >
            Enterprise Security & Trust Standards
          </h2>
          <p style={{ color: C.textSub, fontSize: "0.98rem", maxWidth: 640, margin: "0 auto" }}>
            Engineered from ground zero for hospital networks, clinical trials, and patient data confidentiality.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: 20,
          }}
        >
          {[
            {
              icon: "🔒",
              title: "HIPAA Compliant",
              desc: "Complete end-to-end encryption with AES-256 at rest and TLS 1.3 in transit.",
            },
            {
              icon: "📜",
              title: "FDA 21 CFR Part 11",
              desc: "Tamper-evident audit trails and digital signatures for all clinician prescription overrides.",
            },
            {
              icon: "⚡",
              title: "FHIR & HL7 Ready",
              desc: "Seamless synchronization with Epic Systems, Cerner Millennium, and AthenaHealth.",
            },
            {
              icon: "🛡️",
              title: "SOC-2 Type II Certified",
              desc: "Independently audited operational security, infrastructure resilience, and continuous testing.",
            },
          ].map((card, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: `1px solid ${C.border}`,
                borderRadius: 20,
                padding: "24px 22px",
                transition: "all 0.25s ease",
              }}
              className="glow-hover"
            >
              <div style={{ fontSize: "1.8rem", marginBottom: 14 }}>{card.icon}</div>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#FFFFFF", marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
                {card.title}
              </div>
              <div style={{ fontSize: "0.86rem", color: C.textSub, lineHeight: 1.6 }}>
                {card.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CALL TO ACTION */}
      <section
        style={{
          position: "relative",
          zIndex: 10,
          padding: `40px ${px}px 90px`,
          maxWidth: 1100,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)",
            borderRadius: 30,
            padding: "1px",
            boxShadow: "0 20px 60px rgba(139, 92, 246, 0.25)",
          }}
        >
          <div
            style={{
              background: "#0C0C16",
              borderRadius: 29,
              padding: isMobile ? "36px 20px" : "56px 40px",
            }}
          >
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: isMobile ? "1.9rem" : "2.7rem",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                margin: "0 0 16px",
              }}
            >
              Ready to Experience Safer Medication Management?
            </h2>
            <p
              style={{
                fontSize: "1.05rem",
                color: C.textSub,
                maxWidth: 580,
                margin: "0 auto 36px",
                lineHeight: 1.65,
              }}
            >
              Join thousands of patients and clinicians who trust HELIO to safeguard every dose. Zero friction setup, immediate clinical peace of mind.
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <button
                onClick={() => navigate("/login")}
                style={{
                  height: 52,
                  minHeight: 52,
                  background: C.gradH,
                  border: "none",
                  color: "#FFFFFF",
                  padding: "0 34px",
                  borderRadius: 16,
                  fontSize: "1.02rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 8px 32px rgba(139,92,246,0.5), 0 0 20px rgba(6,182,212,0.25)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  width: isMobile ? "100%" : "auto",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 14px 44px rgba(139,92,246,0.7), 0 0 28px rgba(6,182,212,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(139,92,246,0.5), 0 0 20px rgba(6,182,212,0.25)";
                }}
              >
                <span>Get Started Free</span>
                <span style={{ fontSize: "1.15rem" }}>→</span>
              </button>

              <button
                onClick={() => navigate("/")}
                style={{
                  height: 52,
                  minHeight: 52,
                  background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${C.border2}`,
                  color: "#FFFFFF",
                  padding: "0 28px",
                  borderRadius: 16,
                  fontSize: "1.02rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  backdropFilter: "blur(16px)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  width: isMobile ? "100%" : "auto",
                  transition: "all 0.25s ease",
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
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: `1px solid ${C.border}`,
          background: "rgba(5, 5, 10, 0.95)",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: `48px ${px}px 28px` }}>
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "flex-start" : "center",
              justifyContent: "space-between",
              gap: 24,
              marginBottom: 32,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <HelioLogo
                variant="badge"
                size={34}
                badgeGradient={C.gradH}
                badgeRadius={10}
                badgeShadow="0 0 16px rgba(139,92,246,0.42)"
              />
              <div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: "1.24rem", fontWeight: 900, color: C.text }}>
                  HELIO
                </div>
                <div style={{ fontSize: "0.72rem", color: C.textMuted }}>
                  Zero-Harm Medication Intelligence Platform
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: "0.84rem", color: C.textSub }}>
              <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>Home</span>
              <span style={{ cursor: "pointer" }} onClick={() => navigate("/login")}>Sign In</span>
              <span style={{ cursor: "pointer" }} onClick={() => navigate("/login")}>Register Free</span>
            </div>
          </div>

          <div
            style={{
              borderTop: `1px solid ${C.border}`,
              paddingTop: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              fontSize: "0.76rem",
              color: C.textMuted,
            }}
          >
            <span>© 2026 HELIO Health, Inc. All rights reserved.</span>
            <span>HIPAA Compliant · SOC-2 Type II · Built for safer healthcare</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HowItWorksPage;
