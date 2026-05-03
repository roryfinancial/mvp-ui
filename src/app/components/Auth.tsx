import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Mail, Lock, ArrowLeft, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { validateEmail, validatePassword } from "../../lib/security";

interface AuthProps {
  onBack?: () => void;
  onAuthComplete?: (userType: "creator" | "supporter") => void;
}

export default function Auth({ onBack, onAuthComplete }: AuthProps) {
  const { login, signUp, signInWithProvider } = useAuth();
  const [activeTab, setActiveTab] = useState<"creator" | "fan">("creator");
  const [isLogin, setIsLogin] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setInfo(null);

    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); return; }
    const passErr = validatePassword(password);
    if (passErr) { setError(passErr); return; }

    setLoading(true);

    if (isLogin) {
      const result = await login(email, password);
      setLoading(false);
      if (!result.ok) { setError(result.error); return; }
      onAuthComplete?.(result.user.role === "creator" ? "creator" : "supporter");
    } else {
      const role = activeTab === "creator" ? "creator" as const : "supporter" as const;
      const result = await signUp(email, password, role);
      setLoading(false);
      if (!result.ok) { setError(result.error); return; }
      if (result.confirmEmail) {
        setInfo("Check your email for a confirmation link to complete sign-up.");
        return;
      }
      onAuthComplete?.(result.user.role === "creator" ? "creator" : "supporter");
    }
  }

  async function handleSocialLogin(provider: "google" | "twitch" | "twitter") {
    setError(null);
    setLoading(true);
    try {
      await signInWithProvider(provider);
      // OAuth redirects — loading state stays until redirect completes.
    } catch (err: unknown) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "OAuth sign-in failed.");
    }
  }

  const inputBase =
    "w-full pr-4 py-4 border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-foreground placeholder-subtle transition-all text-sm";

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      {onBack && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={onBack}
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
        {/* Left — Branding */}
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
              Your wishlist,
              <br />
              <span style={{ color: "oklch(65.6% 0.241 354.308)" }}>funded.</span>
            </h2>
            <p className="text-lg text-white/60 max-w-md mx-auto leading-relaxed">
              Get exactly what you want from your supporters. Zero fees, ever.
            </p>
            <div className="mt-12 space-y-3">
              {["Trusted by 10,000+ creators", "100% free for creators", "No platform fees, ever"].map((line) => (
                <div key={line} className="flex items-center gap-3 text-white/50 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right — Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-background"
        >
          <h1 className="text-3xl font-black text-foreground mb-8 tracking-tight">
            {isLogin ? "Welcome back." : "Join TipFlow."}
          </h1>

          {/* Creator / Supporter Toggle */}
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex mb-8 border border-border overflow-hidden"
            >
              {(["creator", "fan"] as const).map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setError(null); setInfo(null); }}
                  className={`flex-1 text-center py-3 px-4 text-sm font-bold uppercase tracking-wide transition-colors ${
                    i > 0 ? "border-l border-border" : ""
                  } ${activeTab === tab ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
                >
                  {tab === "creator" ? "Creator" : "Supporter"}
                </button>
              ))}
            </motion.div>
          )}

          {/* Social Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="space-y-3 mb-6"
          >
            {[
              { label: "Continue with Google", provider: "google" as const, icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.24 10.29v3.1h5.21c-.22 1.4-1.12 3.12-3.83 3.12-2.3 0-4.18-1.9-4.18-4.25s1.88-4.25 4.18-4.25c1.19 0 2.08.51 2.57 1.05l2.76-2.67C19.22 4.19 16.22 3 12.24 3 7.37 3 3.4 6.7 3.4 12c0 5.3 3.97 9 8.84 9 4.88 0 8.35-3.59 8.35-8.61 0-.61-.06-1.19-.16-1.74h-8.2z" /></svg> },
              { label: "Continue with Twitch", provider: "twitch" as const, icon: <svg className="w-5 h-5 text-[#9146FF]" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 5.094h1.714v4.714H11.571zm4.714 0h1.714v4.714H16.285zM8.571 0L3 5.571V19.8h4.714v4.714h4.714L19.8 19.8V0zm8.229 14.571h-2.857v2.857H13.44l-2.857 2.857v-2.857H6.285V3.857h10.515z" /></svg> },
              { label: "Continue with X", provider: "twitter" as const, icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.144h3.68l-8.157 9.066L24 22.846h-7.406l-5.698-6.321-6.191 6.321H0l8.665-9.617L.027 1.144h8.324l5.069 5.867L18.901 1.144Zm-.439 2.37L7.493 21.43h2.396l10.969-18.916h-2.396Z" /></svg> },
            ].map(({ label, provider, icon }) => (
              <motion.button
                key={label}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSocialLogin(provider)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 border border-border bg-background hover:bg-muted transition-colors text-foreground font-medium text-sm card-game disabled:opacity-50"
              >
                {icon}
                {label}
              </motion.button>
            ))}
          </motion.div>

          {/* Divider */}
          <div className="flex items-center mb-6">
            <hr className="flex-grow border-border" />
            <span className="px-4 text-subtle text-xs uppercase tracking-widest font-bold">or</span>
            <hr className="flex-grow border-border" />
          </div>

          {/* Email + Password */}
          <div className="space-y-3 mb-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); setInfo(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className={`${inputBase} pl-11`}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); setInfo(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className={`${inputBase} pl-11`}
              />
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2 mb-4 px-4 py-3 border border-red-500/30 bg-red-500/5 text-red-500 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info (e.g., confirm email) */}
          <AnimatePresence>
            {info && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2 mb-4 px-4 py-3 border border-emerald-500/30 bg-emerald-500/5 text-emerald-600 text-sm"
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {info}
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <motion.button
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.99 }}
            onClick={handleSubmit}
            disabled={loading}
            className="w-full btn-cta text-white py-4 font-black text-sm uppercase tracking-widest mb-6 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? (isLogin ? "Signing in…" : "Creating account…") : isLogin ? "Sign in" : "Create account"}
          </motion.button>

          {/* Footer */}
          <p className="text-xs text-subtle text-center mb-4">
            By continuing, you agree to TipFlow's{" "}
            <a href="#" className="hover:underline font-medium text-accent">Terms</a>{" "}
            and{" "}
            <a href="#" className="hover:underline font-medium text-accent">Privacy Policy</a>.
          </p>
          <p className="text-sm text-muted-foreground text-center">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(null); setInfo(null); }}
              className="font-bold hover:underline transition-colors text-accent"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
