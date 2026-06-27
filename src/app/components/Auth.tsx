import { motion, AnimatePresence } from "motion/react";
import { SectionLabel } from "./shared/SectionLabel";
import { useState, useRef, useEffect } from "react";
import { Mail, Lock, ArrowLeft, AlertCircle, Loader2, Pencil, Zap } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { validateEmail } from "../../lib/security";
import { DEMO_CREDENTIALS } from "../../lib/store";
import { Sounds } from "../../lib/sounds";
import type { UserRole } from "../../lib/types";

type Step = "entry" | "password" | "code";
type AuthMode = "login" | "signup";
type Channel = "email" | "phone";

interface AuthProps {
  mode?: AuthMode;
  onBack?: () => void;
  onAuthComplete?: (userType: "creator" | "supporter") => void;
  onSwitchMode?: () => void;
}

export default function Auth({ mode = "login", onBack, onAuthComplete, onSwitchMode }: AuthProps) {
  const { login, signUp } = useAuth();
  const [step, setStep] = useState<Step>("entry");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>("creator");
  const [emailSent, setEmailSent] = useState(false);
  const [channel, setChannel] = useState<Channel>("email");
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const N = 6;
  const [digits, setDigits] = useState<string[]>(Array(N).fill(""));
  const codeInputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  function done(user: { role: string }) {
    onAuthComplete?.(user.role === "creator" ? "creator" : "supporter");
  }

  function goBack() {
    setStep("entry");
    setError(null);
    setPassword("");
  }

  // ── Entry: validate and proceed to password ────────────────────────────────

  function handleEntry() {
    setError(null);
    const err = validateEmail(identifier);
    if (err) { setError(err); return; }
    setStep("password");
  }

  // ── Password: sign in or sign up ───────────────────────────────────────────

  async function handlePassword() {
    setError(null);
    setLoading(true);
    if (mode === "signup") {
      const res = await signUp(identifier, password, role);
      setLoading(false);
      if (!res.ok) { setError(res.error); return; }
      if (res.confirmEmail) { setEmailSent(true); return; }
      done(res.user);
    } else {
      const res = await login(identifier, password);
      setLoading(false);
      if (!res.ok) { setError(res.error); return; }
      done(res.user);
    }
  }

  // ── Switch method (password → code) ─────────────────────────────────────────

  async function switchToCode() {
    setError(null);
    // OTP via Supabase has been removed — this flow is not currently supported
    setError("One-time code login is not currently available. Please use password.");
  }

  // ── Social ───────────────────────────────────────────────────────────────────

  async function handleSocial(provider: "google" | "twitch" | "twitter") {
    setLoading(true);
    try {
      // Social login is handled by Better Auth — redirect to provider
      window.location.href = `/api/auth/${provider}`;
    } catch { setError("Social login failed"); setLoading(false); }
  }

  // ── OTC verify + resend ──────────────────────────────────────────────────────

  async function handleCode() {
    setError(null);
    const code = digits.join("");
    if (code.length < N) return;
    setLoading(false);
    setError("One-time code verification is not currently available.");
  }

  async function handleResend() {
    setError(null);
    setError("One-time code login is not currently available.");
  }

  // ── OTC digit inputs ─────────────────────────────────────────────────────────

  function onDigit(i: number, val: string) {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...digits]; next[i] = d; setDigits(next);
    if (d && i < N - 1) codeInputs.current[i + 1]?.focus();
  }

  function onDigitKey(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[i] && i > 0) codeInputs.current[i - 1]?.focus();
  }

  function onPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, N);
    const next = Array(N).fill("");
    for (let i = 0; i < p.length; i++) next[i] = p[i];
    setDigits(next);
    codeInputs.current[Math.min(p.length, N - 1)]?.focus();
  }

  const inputBase =
    "w-full py-4 border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-subtle transition-all text-sm";

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      {(onBack || step !== "entry") && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => { Sounds.softClick(); if (step !== "entry") goBack(); else onBack?.(); }}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 border border-border bg-background text-foreground hover:bg-muted transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </motion.button>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row w-full max-w-5xl mx-auto bg-background overflow-hidden shadow-2xl border border-border"
      >
        {/* ── Left: branding ── */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative w-full md:w-1/2 bg-nav p-12 flex flex-col justify-center items-center text-center overflow-hidden border-r-2 border-accent/50"
        >
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 70% 60% at 50% 70%, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 70%)" }}
          />
          <div className="relative z-10">
            <img src="/rory-word.svg" alt="Rory" className="h-8 mb-8 mx-auto" />
            <h2 className="text-5xl font-black text-white mb-6 leading-tight tracking-tight">
              Your project,<br />
              <span className="text-accent">funded.</span>
            </h2>
            <p className="text-lg text-white/60 max-w-md mx-auto leading-relaxed">
              Set goals for your project. Fans donate to help you achieve them.
            </p>
            <div className="mt-12 space-y-3">
              {["Trusted by 10,000+ creators", "Built for creators", "Low platform fees, always"].map(line => (
                <div key={line} className="flex items-center gap-3 text-white/50 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Right: form ── */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-background overflow-hidden">

          {/* Founder-to-founder demo block — always visible at entry */}
          {step === "entry" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mb-8"
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-3.5 h-3.5 text-accent" />
                <span className="text-[10px] font-black uppercase tracking-widest text-accent">Founder Demo</span>
                <span className="text-[10px] text-subtle">— try it instantly</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Creator demo */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    Sounds.click();
                    setIdentifier(DEMO_CREDENTIALS.creator.email);
                    setChannel("email");
                    setPassword(DEMO_CREDENTIALS.creator.password);
                    setError(null);
                    setStep("password");
                  }}
                  className="flex flex-col items-start gap-2 p-3 border border-accent/30 bg-accent/5 hover:border-accent/60 hover:bg-accent/10 transition-all text-left group"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Pencil className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-xs font-black text-foreground uppercase tracking-wide">Creator</span>
                    <span className="ml-auto text-[10px] text-accent opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                  <p className="text-[10px] text-subtle font-medium leading-relaxed">See the creator workspace — wishlists, analytics, gifter leaderboard</p>
                  <span className="text-[10px] font-mono text-subtle/70">{DEMO_CREDENTIALS.creator.email}</span>
                </motion.button>

                {/* Fan/supporter demo */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    Sounds.click();
                    setIdentifier(DEMO_CREDENTIALS.fan.email);
                    setChannel("email");
                    setPassword(DEMO_CREDENTIALS.fan.password);
                    setError(null);
                    setStep("password");
                  }}
                  className="flex flex-col items-start gap-2 p-3 border border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all text-left group"
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-base leading-none">💎</span>
                    <span className="text-xs font-black text-foreground uppercase tracking-wide">Fan Hub</span>
                    <span className="ml-auto text-[10px] text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                  <p className="text-[10px] text-subtle font-medium leading-relaxed">Community — top supporters, leaderboard, and creator activity feed</p>
                  <span className="text-[10px] font-mono text-subtle/70">{DEMO_CREDENTIALS.fan.email}</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step content */}
          <AnimatePresence mode="wait">

            {/* ── Entry ── */}
            {step === "entry" && (
              <motion.div
                key="entry"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
              >
                <h1 className="text-3xl font-black text-foreground mb-2 tracking-tight">
                  {mode === "signup" ? "Create your account." : "Welcome back."}
                </h1>
                <p className="text-sm text-subtle mb-8">
                  {mode === "signup" ? "Sign up to get started with Rory." : "Sign in to your Rory account."}
                </p>

                {/* Email-only for now — phone login disabled */}

                <div className="relative mb-6">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={identifier}
                    autoFocus
                    onChange={e => { setIdentifier(e.target.value); setError(null); }}
                    onKeyDown={e => e.key === "Enter" && handleEntry()}
                    className={`${inputBase} pl-11`}
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="flex items-center gap-2 mb-4 px-4 py-3 border border-red-500/30 bg-red-500/5 text-red-500 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />{error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.99 }}
                  onClick={() => { Sounds.click(); handleEntry(); }}
                  disabled={loading}
                  className="w-full btn-cta text-white py-4 font-black text-sm uppercase tracking-widest mb-6 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  Continue
                </motion.button>

                <div className="flex items-center mb-6">
                  <hr className="flex-grow border-border" />
                  <span className="px-4 text-subtle text-xs uppercase tracking-widest font-bold">or</span>
                  <hr className="flex-grow border-border" />
                </div>

                <div className="space-y-3">
                  {([
                    { label: "Continue with Google", provider: "google" as const, icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.24 10.29v3.1h5.21c-.22 1.4-1.12 3.12-3.83 3.12-2.3 0-4.18-1.9-4.18-4.25s1.88-4.25 4.18-4.25c1.19 0 2.08.51 2.57 1.05l2.76-2.67C19.22 4.19 16.22 3 12.24 3 7.37 3 3.4 6.7 3.4 12c0 5.3 3.97 9 8.84 9 4.88 0 8.35-3.59 8.35-8.61 0-.61-.06-1.19-.16-1.74h-8.2z" /></svg> },
                    { label: "Continue with Twitch", provider: "twitch" as const, icon: <svg className="w-5 h-5 text-[#9146FF]" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 5.094h1.714v4.714H11.571zm4.714 0h1.714v4.714H16.285zM8.571 0L3 5.571V19.8h4.714v4.714h4.714L19.8 19.8V0zm8.229 14.571h-2.857v2.857H13.44l-2.857 2.857v-2.857H6.285V3.857h10.515z" /></svg> },
                    { label: "Continue with X", provider: "twitter" as const, icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.144h3.68l-8.157 9.066L24 22.846h-7.406l-5.698-6.321-6.191 6.321H0l8.665-9.617L.027 1.144h8.324l5.069 5.867L18.901 1.144Zm-.439 2.37L7.493 21.43h2.396l10.969-18.916h-2.396Z" /></svg> },
                  ] as const).map(({ label, provider, icon }) => (
                    <motion.button
                      key={provider}
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={() => { Sounds.click(); handleSocial(provider); }}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-3 px-5 py-3.5 border border-border bg-background hover:bg-muted transition-colors text-foreground font-medium text-sm card-game disabled:opacity-50"
                    >
                      {icon}
                      <span>{label}</span>
                    </motion.button>
                  ))}
                </div>

                <p className="text-xs text-subtle text-center mt-6">
                  By continuing, you agree to Rory's{" "}
                  <a href="#" className="hover:underline font-medium text-accent">Terms</a>{" "}and{" "}
                  <a href="#" className="hover:underline font-medium text-accent">Privacy Policy</a>.
                </p>

                {onSwitchMode && (
                  <p className="text-sm text-subtle text-center mt-4">
                    {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
                    <button onClick={() => { Sounds.softClick(); onSwitchMode?.(); }} className="text-accent font-medium hover:underline">
                      {mode === "signup" ? "Log in" : "Sign up"}
                    </button>
                  </p>
                )}
              </motion.div>
            )}

            {/* ── Code (OTC) ── */}
            {step === "code" && (
              <motion.div
                key="code"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
              >
                <SectionLabel>Verification</SectionLabel>
                <h1 className="text-3xl font-black text-foreground mb-2 tracking-tight">
                  {channel === "email" ? "Check your email." : "Check your phone."}
                </h1>
                <p className="text-sm text-subtle mb-8">
                  We sent a 6-digit code to{" "}
                  <span className="text-foreground font-medium">{identifier}</span>.
                </p>

                <div className="flex gap-2 mb-6" onPaste={onPaste}>
                  {Array.from({ length: N }).map((_, i) => (
                    <input
                      key={i}
                      ref={el => { codeInputs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={digits[i]}
                      onChange={e => onDigit(i, e.target.value)}
                      onKeyDown={e => onDigitKey(i, e)}
                      className={`flex-1 h-14 border text-center text-xl font-mono font-bold bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all ${digits[i] ? "border-accent/60" : "border-border"} ${i === 2 ? "mr-2" : ""}`}
                    />
                  ))}
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="flex items-center gap-2 mb-4 px-4 py-3 border border-red-500/30 bg-red-500/5 text-red-500 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />{error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.99 }}
                  onClick={() => { Sounds.click(); handleCode(); }}
                  disabled={loading || digits.some(d => !d)}
                  className="w-full btn-cta text-white py-4 font-black text-sm uppercase tracking-widest mb-5 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Verifying…" : "Verify code"}
                </motion.button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    onClick={handleResend}
                    disabled={countdown > 0}
                    className="text-accent font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                  </button>
                  {channel === "email" && (
                    <button
                      onClick={() => { setStep("password"); setError(null); }}
                      className="text-subtle hover:text-foreground transition-colors"
                    >
                      Use password instead →
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Password ── */}
            {step === "password" && emailSent && (
              <motion.div
                key="emailsent"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
              >
                <SectionLabel>Almost there</SectionLabel>
                <h1 className="text-3xl font-black text-foreground mb-2 tracking-tight">Check your email.</h1>
                <p className="text-sm text-subtle mb-8">
                  We sent a confirmation link to{" "}
                  <span className="text-foreground font-medium">{identifier}</span>.
                  Click it to activate your account.
                </p>
                <button
                  onClick={() => { setEmailSent(false); setError(null); }}
                  className="text-sm text-accent hover:underline"
                >
                  Use a different email →
                </button>
              </motion.div>
            )}

            {step === "password" && !emailSent && (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
              >
                <p className="eyebrow mb-3">
                  {mode === "signup" ? "Create Account" : "Password"}
                </p>
                <h1 className="text-3xl font-black text-foreground mb-2 tracking-tight">
                  {mode === "signup" ? "Choose a password." : "Enter password."}
                </h1>
                <p className="text-sm text-subtle mb-8">
                  {mode === "signup" ? "Creating account for" : "Signing in as"}{" "}
                  <span className="text-foreground font-medium">{identifier}</span>.
                </p>

                <div className="relative mb-6">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    autoFocus
                    onChange={e => { setPassword(e.target.value); setError(null); }}
                    onKeyDown={e => e.key === "Enter" && handlePassword()}
                    className={`${inputBase} pl-11`}
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="flex items-center gap-2 mb-4 px-4 py-3 border border-red-500/30 bg-red-500/5 text-red-500 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />{error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.99 }}
                  onClick={() => { Sounds.click(); handlePassword(); }}
                  disabled={loading}
                  className="w-full btn-cta text-white py-4 font-black text-sm uppercase tracking-widest mb-5 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading
                    ? (mode === "signup" ? "Creating account…" : "Signing in…")
                    : (mode === "signup" ? "Create account" : "Sign in")}
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
