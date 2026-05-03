import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { Mail, Phone, Lock, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { validateEmail } from "../../lib/security";
import { DEMO_CREDENTIALS } from "../../lib/store";
import { AuthService } from "../../lib/auth";

type Step = "entry" | "code" | "password";
type Channel = "email" | "phone";

const N = 6;

interface AuthProps {
  onBack?: () => void;
  onAuthComplete?: (userType: "creator" | "supporter") => void;
}

export default function Auth({ onBack, onAuthComplete }: AuthProps) {
  const { login } = useAuth();
  const [step, setStep] = useState<Step>("entry");
  const [channel, setChannel] = useState<Channel>("email");
  const [identifier, setIdentifier] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(N).fill(""));
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
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
    setDigits(Array(N).fill(""));
    setPassword("");
  }

  // ── Entry: send OTP ──────────────────────────────────────────────────────────

  async function handleEntry() {
    setError(null);
    if (channel === "email") {
      const err = validateEmail(identifier);
      if (err) { setError(err); return; }
    } else {
      if (!/^\+?[\d\s\-()‪‬]{7,}$/.test(identifier)) {
        setError("Enter a valid phone number with country code");
        return;
      }
    }
    setLoading(true);
    const res = channel === "email"
      ? await AuthService.sendOtp(identifier)
      : await AuthService.sendPhoneOtp(identifier);
    setLoading(false);
    if (!res.ok) { setError(res.error ?? "Failed to send code"); return; }
    setCodeSent(true);
    setCountdown(30);
    setStep("code");
    requestAnimationFrame(() => codeInputs.current[0]?.focus());
  }

  // ── Code: verify OTP ─────────────────────────────────────────────────────────

  async function handleCode() {
    const token = digits.join("");
    if (token.length < N) { setError("Enter the full 6-digit code"); return; }
    setError(null);
    setLoading(true);
    const res = channel === "email"
      ? await AuthService.verifyEmailOtp(identifier, token)
      : await AuthService.verifyPhoneOtp(identifier, token);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      setDigits(Array(N).fill(""));
      codeInputs.current[0]?.focus();
      return;
    }
    done(res.user);
  }

  async function handleResend() {
    setCountdown(30);
    if (channel === "email") await AuthService.sendOtp(identifier);
    else await AuthService.sendPhoneOtp(identifier);
  }

  // ── Password: sign in ────────────────────────────────────────────────────────

  async function handlePassword() {
    setError(null);
    setLoading(true);
    const res = await login(identifier, password);
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    done(res.user);
  }

  // ── Switch method (password → code) ─────────────────────────────────────────

  async function switchToCode() {
    setError(null);
    if (!codeSent) {
      setLoading(true);
      const res = channel === "email"
        ? await AuthService.sendOtp(identifier)
        : await AuthService.sendPhoneOtp(identifier);
      setLoading(false);
      if (!res.ok) { setError(res.error ?? "Failed to send code"); return; }
      setCodeSent(true);
      setCountdown(30);
    }
    setDigits(Array(N).fill(""));
    setStep("code");
    requestAnimationFrame(() => codeInputs.current[0]?.focus());
  }

  // ── Social ───────────────────────────────────────────────────────────────────

  async function handleSocial(provider: "google" | "twitch" | "twitter") {
    setLoading(true);
    try { await AuthService.signInWithProvider(provider); }
    catch { setError("Social login failed"); setLoading(false); }
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

  const backLabel = step === "code"
    ? `Change ${channel}`
    : "Back";

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      {(onBack || step !== "entry") && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={step !== "entry" ? goBack : onBack}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 border border-border bg-background text-foreground hover:bg-muted transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">{backLabel}</span>
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
          className="relative w-full md:w-1/2 bg-[#0e0e0e] p-12 flex flex-col justify-center items-center text-center overflow-hidden"
          style={{ borderRight: "2px solid oklch(65.6% 0.241 354.308 / 0.5)" }}
        >
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 70% 60% at 50% 70%, oklch(65.6% 0.241 354.308 / 0.1) 0%, transparent 70%)" }}
          />
          <div className="relative z-10">
            <div className="text-2xl font-black text-white mb-8 tracking-tight">TipFlow</div>
            <h2 className="text-5xl font-black text-white mb-6 leading-tight tracking-tight">
              Your wishlist,<br />
              <span style={{ color: "oklch(65.6% 0.241 354.308)" }}>funded.</span>
            </h2>
            <p className="text-lg text-white/60 max-w-md mx-auto leading-relaxed">
              Get exactly what you want from your supporters. Zero fees, ever.
            </p>
            <div className="mt-12 space-y-3">
              {["Trusted by 10,000+ creators", "100% free for creators", "No platform fees, ever"].map(line => (
                <div key={line} className="flex items-center gap-3 text-white/50 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Right: form ── */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-background overflow-hidden">

          {/* Demo banner */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="mb-8 p-4 border border-accent/30 bg-accent/5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-accent">Demo Account</span>
              <span className="text-[10px] text-subtle uppercase tracking-widest">Investor preview</span>
            </div>
            <div className="space-y-1 mb-3 font-mono text-sm">
              <div className="flex items-center gap-2">
                <span className="text-subtle text-xs w-16">Email</span>
                <span className="text-foreground">{DEMO_CREDENTIALS.creator.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-subtle text-xs w-16">Password</span>
                <span className="text-foreground">{DEMO_CREDENTIALS.creator.password}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setIdentifier(DEMO_CREDENTIALS.creator.email);
                setChannel("email");
                setPassword(DEMO_CREDENTIALS.creator.password);
                setError(null);
                setStep("password");
              }}
              className="text-xs font-black uppercase tracking-widest text-accent hover:underline transition-colors"
            >
              Autofill &amp; sign in →
            </button>
          </motion.div>

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
                <h1 className="text-3xl font-black text-foreground mb-8 tracking-tight">Welcome.</h1>

                <div className="flex mb-6 border border-border overflow-hidden">
                  {(["email", "phone"] as Channel[]).map((ch, i) => (
                    <button
                      key={ch}
                      onClick={() => { setChannel(ch); setError(null); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold uppercase tracking-wide transition-colors ${i > 0 ? "border-l border-border" : ""} ${channel === ch ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      {ch === "email" ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                      {ch === "email" ? "Email" : "Phone"}
                    </button>
                  ))}
                </div>

                <div className="relative mb-6">
                  {channel === "email"
                    ? <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                    : <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
                  }
                  <input
                    type={channel === "email" ? "email" : "tel"}
                    placeholder={channel === "email" ? "Email address" : "+1 555 000 0000"}
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
                  onClick={handleEntry}
                  disabled={loading}
                  className="w-full btn-cta text-white py-4 font-black text-sm uppercase tracking-widest mb-6 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Sending code…" : "Continue"}
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
                      onClick={() => handleSocial(provider)}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-3 px-5 py-3.5 border border-border bg-background hover:bg-muted transition-colors text-foreground font-medium text-sm card-game disabled:opacity-50"
                    >
                      {icon}{label}
                    </motion.button>
                  ))}
                </div>

                <p className="text-xs text-subtle text-center mt-6">
                  By continuing, you agree to TipFlow's{" "}
                  <a href="#" className="hover:underline font-medium text-accent">Terms</a>{" "}and{" "}
                  <a href="#" className="hover:underline font-medium text-accent">Privacy Policy</a>.
                </p>
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
                <p className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3">Verification</p>
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
                  onClick={handleCode}
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
            {step === "password" && (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3">Password</p>
                <h1 className="text-3xl font-black text-foreground mb-2 tracking-tight">Enter password.</h1>
                <p className="text-sm text-subtle mb-8">
                  Signing in as{" "}
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
                  onClick={handlePassword}
                  disabled={loading}
                  className="w-full btn-cta text-white py-4 font-black text-sm uppercase tracking-widest mb-5 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Signing in…" : "Sign in"}
                </motion.button>

                <button
                  onClick={switchToCode}
                  disabled={loading}
                  className="w-full text-center text-sm text-subtle hover:text-foreground transition-colors disabled:opacity-40"
                >
                  {loading ? "Sending code…" : "Get a code instead →"}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
