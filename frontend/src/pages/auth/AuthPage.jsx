import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Sparkles,
  Stethoscope,
  User,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Shield,
  Zap,
  Activity,
  HeartPulse,
  ChevronRight,
  Clock,
  TrendingUp,
  Bot,
  X,
  ScanLine,
} from "lucide-react";
import { theme } from "../../theme/theme";
import { HelioLogo } from "../../components/common/HelioLogo";
import "./AuthPage.css";

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, login, isLoading } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const initialRole = searchParams.get("role") === "doctor" ? "doctor" : "patient";

  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [email, setEmail] = useState(
    initialRole === "doctor" ? "dr.vance@heliohealth.io" : "elena.rostova@heliohealth.io"
  );
  const [password, setPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [authStep, setAuthStep] = useState("idle");

  useEffect(() => {
    setTimeout(() => setMounted(true), 60);
  }, []);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setEmail(role === "doctor" ? "dr.vance@heliohealth.io" : "elena.rostova@heliohealth.io");
  };

  const handleQuickProfileSelect = async (role) => {
    handleRoleChange(role);
    const targetEmail =
      role === "doctor" ? "dr.vance@heliohealth.io" : "elena.rostova@heliohealth.io";
    const result = await login(targetEmail, "helio-secure-token", role);
    if (result.success) redirectUser(role);
  };

  const handleStartGoogleOAuth = () => {
    setAuthStep("idle");
    setShowGoogleModal(true);
  };

  const handleGoogleAccountConfirm = async (chosenRole) => {
    setAuthStep("authenticating");
    setTimeout(async () => {
      setAuthStep("authorizing");
      setTimeout(async () => {
        setAuthStep("success");
        const result = await loginWithGoogle(chosenRole);
        setTimeout(() => {
          setShowGoogleModal(false);
          if (result.success) redirectUser(chosenRole);
        }, 600);
      }, 700);
    }, 700);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password, selectedRole);
    if (result.success) redirectUser(selectedRole);
  };

  const redirectUser = (role) => {
    const from = location.state?.from?.pathname;
    if (from && from !== "/login" && from !== "/auth") {
      navigate(from, { replace: true });
    } else {
      navigate(role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard", {
        replace: true,
      });
    }
  };

  const isDoctor = selectedRole === "doctor";

  const patientStats = [
    { icon: <HeartPulse size={14} />, label: "Adherence", value: "94%", color: "#059669" },
    { icon: <Zap size={14} />, label: "Streak", value: "14 days", color: "#D97706" },
    { icon: <Clock size={14} />, label: "Next Dose", value: "6:00 PM", color: "#0284C7" },
    { icon: <Bot size={14} />, label: "AI Insights", value: "3 new", color: "#7C3AED" },
  ];

  const doctorStats = [
    { icon: <Activity size={14} />, label: "Patients", value: "148", color: "#0284C7" },
    { icon: <Shield size={14} />, label: "Alerts", value: "3 crit", color: "#E11D48" },
    { icon: <TrendingUp size={14} />, label: "Rx Today", value: "22", color: "#059669" },
    { icon: <ScanLine size={14} />, label: "AI Scans", value: "41", color: "#7C3AED" },
  ];

  const stats = isDoctor ? doctorStats : patientStats;

  return (
    <div className="auth-root">
      <div
        className={`auth-orb auth-orb--primary ${
          isDoctor ? "auth-orb--blue" : "auth-orb--green"
        }`}
      />
      <div className="auth-orb auth-orb--secondary" />
      <div className="auth-orb auth-orb--accent" />
      <div className="auth-grid-mesh" />

      <div className={`auth-card ${mounted ? "auth-card--visible" : ""}`}>

        {/* LEFT PANEL */}
        <div
          className={`auth-panel auth-panel--left ${
            isDoctor ? "auth-panel--doctor" : "auth-panel--patient"
          }`}
        >
          <button className="auth-back-link" onClick={() => navigate("/")}>
            <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} />
            <span>Back to HELIO</span>
          </button>

          <div className="auth-brand">
            <div className="auth-brand__icon">
              <img src="/helio-logo-symbol-white.png" alt="HELIO Logo" style={{ width: 24, height: 24, objectFit: "contain" }} />
            </div>
            <div>
              <span className="auth-brand__wordmark">HELIO</span>
              <span className="auth-brand__badge">Auth Enclave</span>
            </div>
          </div>

          <div
            className={`auth-mission-tag ${
              isDoctor ? "auth-mission-tag--doctor" : "auth-mission-tag--patient"
            }`}
          >
            {isDoctor ? <Stethoscope size={13} /> : <Activity size={13} />}
            <span>{isDoctor ? "Clinical Command Access" : "Patient Vitality OS Access"}</span>
          </div>

          <h2 className="auth-display-headline">
            {isDoctor ? (
              <>
                High-Velocity
                <br />
                <span
                  className={`auth-gradient-text ${isDoctor ? "auth-gradient-text--blue" : ""}`}
                >
                  Pharmacovigilance.
                </span>
              </>
            ) : (
              <>
                Master Your
                <br />
                <span className="auth-gradient-text">Medication Regimen.</span>
              </>
            )}
          </h2>

          <p className="auth-display-sub">
            {isDoctor
              ? "Instant contraindication interception, multi-patient cohort monitoring, and Rx authoring connected to live FDA databases."
              : "Real-time adherence rings, smart mealtime dosage reminders, and 24/7 access to your personal Helio AI assistant."}
          </p>

          <div
            className={`auth-telemetry-card ${
              isDoctor ? "auth-telemetry-card--doctor" : "auth-telemetry-card--patient"
            }`}
          >
            <div className="auth-telemetry-card__header">
              <div className="auth-telemetry-card__header-left">
                <span className="auth-status-dot" />
                <span className="auth-telemetry-card__session-label">
                  {isDoctor ? "Licensed Physician Session" : "Active Patient Profile"}
                </span>
              </div>
              <span
                className={`auth-telemetry-card__badge ${
                  isDoctor
                    ? "auth-telemetry-card__badge--doctor"
                    : "auth-telemetry-card__badge--patient"
                }`}
              >
                {isDoctor ? "NPI Verified" : "Adherence: 94%"}
              </span>
            </div>

            <div className="auth-telemetry-profile">
              <img
                src={
                  isDoctor
                    ? "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80"
                    : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                }
                alt="Profile"
                className={`auth-telemetry-profile__avatar ${
                  isDoctor
                    ? "auth-telemetry-profile__avatar--doctor"
                    : "auth-telemetry-profile__avatar--patient"
                }`}
              />
              <div>
                <div className="auth-telemetry-profile__name">
                  {isDoctor ? "Dr. Julian Vance, MD" : "Elena Rostova"}
                </div>
                <div className="auth-telemetry-profile__role">
                  {isDoctor
                    ? "Lead Pharmacotherapy & Cardiology"
                    : "Type 2 Diabetes & Hypertension"}
                </div>
              </div>
            </div>

            <div className="auth-mini-stats">
              {stats.map((s, i) => (
                <div key={i} className="auth-mini-stat">
                  <span style={{ color: s.color }}>{s.icon}</span>
                  <div>
                    <div className="auth-mini-stat__value" style={{ color: s.color }}>
                      {s.value}
                    </div>
                    <div className="auth-mini-stat__label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="auth-compliance-strip">
            <ShieldCheck size={15} color="#059669" />
            <span>256-Bit Hardware Enclave · HIPAA / SOC-2 Type II Certified</span>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-panel auth-panel--right">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Sign in to HELIO</h1>
            <p className="auth-form-sub">
              Select your workspace and authenticate your session
            </p>
          </div>

          <div className="auth-role-selector">
            <button
              type="button"
              onClick={() => handleRoleChange("patient")}
              className={`auth-role-btn ${!isDoctor ? "auth-role-btn--patient-active" : ""}`}
            >
              <User size={15} />
              <span>Patient Portal</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange("doctor")}
              className={`auth-role-btn ${isDoctor ? "auth-role-btn--doctor-active" : ""}`}
            >
              <Stethoscope size={15} />
              <span>Doctor / Clinician</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleStartGoogleOAuth}
            disabled={isLoading}
            className="auth-google-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google Workspace</span>
            <ArrowRight size={17} className="auth-google-btn__arrow" />
          </button>

          <div className="auth-fast-pass">
            <div className="auth-fast-pass__label">
              <Zap size={12} style={{ color: "#D97706" }} />
              <span>Instant Demo Fast-Pass (1-click sign-in)</span>
            </div>
            <div className="auth-fast-pass__grid">
              <button
                type="button"
                onClick={() => handleQuickProfileSelect("patient")}
                className={`auth-fast-pass-btn ${
                  !isDoctor ? "auth-fast-pass-btn--active-patient" : ""
                }`}
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                  alt="Elena"
                  className="auth-fast-pass-btn__avatar"
                />
                <div className="auth-fast-pass-btn__text">
                  <div className="auth-fast-pass-btn__name">Elena Rostova</div>
                  <div className="auth-fast-pass-btn__role" style={{ color: "#059669" }}>
                    Patient Demo
                  </div>
                </div>
                <ArrowRight size={13} color="#059669" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickProfileSelect("doctor")}
                className={`auth-fast-pass-btn ${
                  isDoctor ? "auth-fast-pass-btn--active-doctor" : ""
                }`}
              >
                <img
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=80&auto=format&fit=crop&q=80"
                  alt="Dr Vance"
                  className="auth-fast-pass-btn__avatar"
                />
                <div className="auth-fast-pass-btn__text">
                  <div className="auth-fast-pass-btn__name">Dr. Vance, MD</div>
                  <div className="auth-fast-pass-btn__role" style={{ color: "#2563EB" }}>
                    Clinician Demo
                  </div>
                </div>
                <ArrowRight size={13} color="#2563EB" />
              </button>
            </div>
          </div>

          <div className="auth-divider">
            <div className="auth-divider__line" />
            <span className="auth-divider__label">or sign in with clinical token</span>
            <div className="auth-divider__line" />
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-field__label" htmlFor="auth-email">
                Account Email
              </label>
              <div className={`auth-input-wrap ${isDoctor ? "auth-input-wrap--doctor" : ""}`}>
                <Mail size={17} color="#94A3B8" className="auth-input-wrap__icon" />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@heliohealth.io"
                  className="auth-input"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-field__header">
                <label className="auth-field__label" htmlFor="auth-pass">
                  Security Token / Password
                </label>
                <button
                  type="button"
                  className="auth-forgot-link"
                  style={{ color: isDoctor ? "#2563EB" : "#059669" }}
                  onClick={() =>
                    alert("Demo Mode: Use Google OAuth or the demo fast-pass above.")
                  }
                >
                  Forgot token?
                </button>
              </div>
              <div className={`auth-input-wrap ${isDoctor ? "auth-input-wrap--doctor" : ""}`}>
                <Lock size={17} color="#94A3B8" className="auth-input-wrap__icon" />
                <input
                  id="auth-pass"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="auth-input"
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <label className="auth-remember">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="auth-remember__checkbox"
                style={{ accentColor: isDoctor ? "#2563EB" : "#059669" }}
              />
              <span className="auth-remember__text">Remember this secure workstation</span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className={`auth-submit-btn ${
                isDoctor ? "auth-submit-btn--doctor" : "auth-submit-btn--patient"
              }`}
            >
              {isLoading ? (
                <span className="auth-spinner" />
              ) : (
                <>
                  <span>
                    Enter {isDoctor ? "Clinician Command Console" : "Patient Workspace"}
                  </span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <p className="auth-form-footer">
            By signing in, you agree to HELIO&apos;s{" "}
            <span className="auth-form-footer__link">Terms of Service</span> and{" "}
            <span className="auth-form-footer__link">HIPAA Privacy Policy</span>.
          </p>
        </div>
      </div>

      {/* GOOGLE OAUTH MODAL */}
      {showGoogleModal && (
        <div
          className="oauth-overlay"
          onClick={() => {
            setShowGoogleModal(false);
            setAuthStep("idle");
          }}
        >
          <div className="oauth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="oauth-modal__header">
              <div className="oauth-modal__brand">
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="oauth-modal__title">Sign in with Google</span>
              </div>
              <button
                className="oauth-modal__close"
                onClick={() => {
                  setShowGoogleModal(false);
                  setAuthStep("idle");
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p className="oauth-modal__sub">
              Choose an authorized account to continue to{" "}
              <strong style={{ color: "#FFFFFF" }}>HELIO Health</strong>
            </p>

            {authStep === "idle" ? (
              <>
                <div className="oauth-accounts">
                  <button
                    className="oauth-account-row"
                    onClick={() => handleGoogleAccountConfirm("patient")}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                      alt="Elena Rostova"
                      className="oauth-account-row__avatar"
                    />
                    <div className="oauth-account-row__info">
                      <div className="oauth-account-row__name">Elena Rostova</div>
                      <div className="oauth-account-row__email">
                        elena.rostova@heliohealth.io
                      </div>
                    </div>
                    <span className="oauth-account-row__role oauth-account-row__role--patient">
                      Patient
                    </span>
                    <ChevronRight
                      size={16}
                      color="#94A3B8"
                      className="oauth-account-row__chevron"
                    />
                  </button>

                  <button
                    className="oauth-account-row"
                    onClick={() => handleGoogleAccountConfirm("doctor")}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80"
                      alt="Dr. Julian Vance"
                      className="oauth-account-row__avatar"
                    />
                    <div className="oauth-account-row__info">
                      <div className="oauth-account-row__name">Dr. Julian Vance, MD</div>
                      <div className="oauth-account-row__email">
                        dr.vance@heliohealth.io
                      </div>
                    </div>
                    <span className="oauth-account-row__role oauth-account-row__role--doctor">
                      Clinician
                    </span>
                    <ChevronRight
                      size={16}
                      color="#94A3B8"
                      className="oauth-account-row__chevron"
                    />
                  </button>

                  <button className="oauth-account-row oauth-account-row--add">
                    <div className="oauth-account-row__add-icon">+</div>
                    <div className="oauth-account-row__info">
                      <div
                        className="oauth-account-row__name"
                        style={{ color: "#475569" }}
                      >
                        Use another account
                      </div>
                    </div>
                  </button>
                </div>

                <p className="oauth-modal__legal">
                  To continue, Google will share your name, email address, and profile
                  picture with HELIO Health in accordance with HIPAA BAA provisions and
                  Google&apos;s{" "}
                  <span className="oauth-modal__legal-link">Privacy Policy</span>.
                </p>
              </>
            ) : (
              <div className="oauth-progress">
                <div
                  className={`oauth-progress__ring ${
                    authStep === "success" ? "oauth-progress__ring--success" : ""
                  }`}
                >
                  {authStep === "success" ? (
                    <CheckCircle2 size={26} color="#059669" />
                  ) : (
                    <div className="oauth-spinner" />
                  )}
                </div>
                <div className="oauth-progress__status">
                  {authStep === "authenticating" &&
                    "Authenticating with Google Identity..."}
                  {authStep === "authorizing" &&
                    "Validating Healthcare Role Authorization..."}
                  {authStep === "success" &&
                    "Credential Verified! Redirecting to HELIO..."}
                </div>
                <div className="oauth-progress__sub">
                  {authStep !== "success"
                    ? "Establishing 256-bit HIPAA-compliant session token"
                    : "Routing to your personalized workspace"}
                </div>

                <div className="oauth-step-track">
                  {["Authenticate", "Authorize", "Secure"].map((step, i) => (
                    <React.Fragment key={i}>
                      <div
                        className={`oauth-step ${
                          (authStep === "authenticating" && i === 0) ||
                          (authStep === "authorizing" && i <= 1) ||
                          authStep === "success"
                            ? "oauth-step--active"
                            : ""
                        }`}
                      >
                        <div className="oauth-step__dot" />
                        <div className="oauth-step__label">{step}</div>
                      </div>
                      {i < 2 && (
                        <div
                          className={`oauth-step-line ${
                            (authStep === "authorizing" && i === 0) ||
                            authStep === "success"
                              ? "oauth-step-line--active"
                              : ""
                          }`}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AuthPage;
