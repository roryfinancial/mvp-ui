import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Mail, Lock, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { validateEmail } from "../../lib/security";
import { DEMO_CREDENTIALS } from "../../lib/store";
import type { UserRole } from "../../lib/types";

type Step = "entry" | "password";
type AuthMode = "login" | "signup";

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

  function done(user: { role: string; isProfileComplete?: boolean }) {
    if (user.isProfileComplete === false) {
      // New user — needs to complete profile first (handled by onboarding redirect)
      onAuthComplete?.(user.role === "creator" ? "creator" : "supporter");
    } else {
      onAuthComplete?.(user.role === "creator" ? "creator" : "supporter");
    }
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
    try {
      if (mode === "signup") {
        const res = await signUp(identifier, password, role);
        setLoading(false);
        if (!res.ok) { setError(res.error); return; }
        if (res.confirmEmail) { setError("Check your email to confirm your account."); return; }
        done(res.user);
      } else {
        const res = await login(identifier, password);
        setLoading(false);
        if (!res.ok) { setError(res.error); return; }
        done(res.user);
      }
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  }

  const inputBase =
    "w-full py-4 border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-subtle transition-all text-sm";

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
              Your project,<br />
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

          {/* Demo banner — login only */}
          {mode === "login" && (
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
                  setPassword(DEMO_CREDENTIALS.creator.password);
                  setError(null);
                  setStep("password");
                }}
                className="text-xs font-black uppercase tracking-widest text-accent hover:underline transition-colors"
              >
                Autofill &amp; sign in →
              </button>
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
                  {mode === "signup" ? "Sign up to get started with TipFlow." : "Sign in to your TipFlow account."}
                </p>

                {mode === "signup" && (
                  <div className="flex mb-6 border border-border overflow-hidden">
                    {(["creator", "supporter"] as UserRole[]).map((r, i) => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={`flex-1 py-3 px-4 text-sm font-bold uppercase tracking-wide transition-colors ${i > 0 ? "border-l border-border" : ""} ${role === r ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
                      >
                        {r === "creator" ? "I'm a Creator" : "I'm a Supporter"}
                      </button>
                    ))}
                  </div>
                )}

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
                  onClick={handleEntry}
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
                    { label: "Google", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.24 10.29v3.1h5.21c-.22 1.4-1.12 3.12-3.83 3.12-2.3 0-4.18-1.9-4.18-4.25s1.88-4.25 4.18-4.25c1.19 0 2.08.51 2.57 1.05l2.76-2.67C19.22 4.19 16.22 3 12.24 3 7.37 3 3.4 6.7 3.4 12c0 5.3 3.97 9 8.84 9 4.88 0 8.35-3.59 8.35-8.61 0-.61-.06-1.19-.16-1.74h-8.2z" /></svg> },
                    { label: "Twitch", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 5.094h1.714v4.714H11.571zm4.714 0h1.714v4.714H16.285zM8.571 0L3 5.571V19.8h4.714v4.714h4.714L19.8 19.8V0zm8.229 14.571h-2.857v2.857H13.44l-2.857 2.857v-2.857H6.285V3.857h10.515z" /></svg> },
                    { label: "X", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.144h3.68l-8.157 9.066L24 22.846h-7.406l-5.698-6.321-6.191 6.321H0l8.665-9.617L.027 1.144h8.324l5.069 5.867L18.901 1.144Zm-.439 2.37L7.493 21.43h2.396l10.969-18.916h-2.396Z" /></svg> },
                  ]).map(({ label, icon }) => (
                    <button
                      key={label}
                      disabled
                      className="w-full flex items-center justify-center gap-3 px-5 py-3.5 border border-border bg-muted text-muted-foreground font-medium text-sm cursor-not-allowed opacity-50"
                    >
                      {icon}
                      <span>{label}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest ml-1">— Coming soon</span>
                    </button>
                  ))}
                </div>

                <p className="text-xs text-subtle text-center mt-6">
                  By continuing, you agree to TipFlow's{" "}
                  <a href="#" className="hover:underline font-medium text-accent">Terms</a>{" "}and{" "}
                  <a href="#" className="hover:underline font-medium text-accent">Privacy Policy</a>.
                </p>

                {onSwitchMode && (
                  <p className="text-sm text-subtle text-center mt-4">
                    {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
                    <button onClick={onSwitchMode} className="text-accent font-medium hover:underline">
                      {mode === "signup" ? "Log in" : "Sign up"}
                    </button>
                  </p>
                )}
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
                <p className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3">
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
                  onClick={handlePassword}
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
