import { motion } from "motion/react";
import { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";

interface AuthProps {
  onBack?: () => void;
  onAuthComplete?: (userType: "creator" | "supporter") => void;
}

export default function Auth({ onBack, onAuthComplete }: AuthProps) {
  const [activeTab, setActiveTab] = useState<"creator" | "fan">("creator");
  const [isLogin, setIsLogin] = useState(false);

  const handleAuthComplete = () => {
    if (!isLogin && onAuthComplete) {
      onAuthComplete(activeTab === "creator" ? "creator" : "supporter");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
      {onBack && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={onBack}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 border border-[#e0e0e0] bg-white text-[#111111] hover:bg-[#f5f5f5] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </motion.button>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row w-full max-w-5xl mx-auto bg-white overflow-hidden shadow-sm border border-[#e0e0e0]"
      >
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative w-full md:w-1/2 bg-[#111111] p-12 flex flex-col justify-center items-center text-center border-b-4 border-[#e8185d] md:border-b-0 md:border-r-4"
        >
          <div className="relative z-10">
            <div className="text-2xl font-black text-white mb-8 tracking-tight">TipFlow</div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-5xl font-black text-white mb-6 leading-tight tracking-tight">
                Your wishlist,
                <br />
                <span className="text-[#e8185d]">funded.</span>
              </h2>
              <p className="text-lg text-white/70 max-w-md mx-auto leading-relaxed">
                Get exactly what you want from your supporters. Zero fees, ever.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-12 space-y-3"
            >
              <div className="flex items-center gap-3 text-white/60 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                <span>Trusted by 10,000+ creators</span>
              </div>
              <div className="flex items-center gap-3 text-white/60 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                <span>100% free for creators</span>
              </div>
              <div className="flex items-center gap-3 text-white/60 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                <span>No platform fees, ever</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center"
        >
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-3xl font-black text-[#111111] mb-8 tracking-tight"
          >
            {isLogin ? "Welcome back." : "Join TipFlow."}
          </motion.h1>

          {/* Creator/Supporter Toggle */}
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex mb-8 border border-[#e0e0e0]"
            >
              <button
                onClick={() => setActiveTab("creator")}
                className={`flex-1 text-center py-3 px-4 text-sm font-bold uppercase tracking-wide transition-colors ${
                  activeTab === "creator"
                    ? "bg-[#111111] text-white"
                    : "text-[#6b6b6b] hover:bg-[#f5f5f5]"
                }`}
              >
                Creator
              </button>
              <button
                onClick={() => setActiveTab("fan")}
                className={`flex-1 text-center py-3 px-4 text-sm font-bold uppercase tracking-wide transition-colors border-l border-[#e0e0e0] ${
                  activeTab === "fan"
                    ? "bg-[#111111] text-white"
                    : "text-[#6b6b6b] hover:bg-[#f5f5f5]"
                }`}
              >
                Supporter
              </button>
            </motion.div>
          )}

          {/* Social Login Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="space-y-3 mb-6"
          >
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleAuthComplete}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 border border-[#e0e0e0] bg-white hover:bg-[#f5f5f5] transition-colors text-[#111111] font-medium text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.29v3.1h5.21c-.22 1.4-1.12 3.12-3.83 3.12-2.3 0-4.18-1.9-4.18-4.25s1.88-4.25 4.18-4.25c1.19 0 2.08.51 2.57 1.05l2.76-2.67C19.22 4.19 16.22 3 12.24 3 7.37 3 3.4 6.7 3.4 12c0 5.3 3.97 9 8.84 9 4.88 0 8.35-3.59 8.35-8.61 0-.61-.06-1.19-.16-1.74h-8.2z"/>
              </svg>
              Continue with Google
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleAuthComplete}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 border border-[#e0e0e0] bg-white hover:bg-[#f5f5f5] transition-colors text-[#111111] font-medium text-sm"
            >
              <svg className="w-5 h-5 text-[#9146FF]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.571 5.094h1.714v4.714H11.571zm4.714 0h1.714v4.714H16.285zM8.571 0L3 5.571V19.8h4.714v4.714h4.714L19.8 19.8V0zm8.229 14.571h-2.857v2.857H13.44l-2.857 2.857v-2.857H6.285V3.857h10.515z"/>
              </svg>
              Continue with Twitch
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleAuthComplete}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 border border-[#e0e0e0] bg-white hover:bg-[#f5f5f5] transition-colors text-[#111111] font-medium text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.901 1.144h3.68l-8.157 9.066L24 22.846h-7.406l-5.698-6.321-6.191 6.321H0l8.665-9.617L.027 1.144h8.324l5.069 5.867L18.901 1.144Zm-.439 2.37L7.493 21.43h2.396l10.969-18.916h-2.396Z"/>
              </svg>
              Continue with X
            </motion.button>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex items-center mb-6"
          >
            <hr className="flex-grow border-[#e0e0e0]" />
            <span className="px-4 text-[#999999] text-xs uppercase tracking-widest font-bold">or</span>
            <hr className="flex-grow border-[#e0e0e0]" />
          </motion.div>

          {/* Email Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mb-6"
          >
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full pl-11 pr-4 py-4 border border-[#e0e0e0] bg-white focus:outline-none focus:ring-2 focus:ring-[#e8185d] focus:border-transparent text-[#111111] placeholder-[#999999] transition-all text-sm"
              />
            </div>
          </motion.div>

          {/* Continue Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleAuthComplete}
            className="w-full bg-[#e8185d] hover:bg-[#c9164f] text-white py-4 font-black text-sm uppercase tracking-widest transition-colors mb-6"
          >
            Continue
          </motion.button>

          {/* Terms and Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            <p className="text-xs text-[#999999] text-center mb-4">
              By continuing, you agree to TipFlow's{" "}
              <a href="#" className="text-[#e8185d] hover:underline font-medium">Terms</a>{" "}
              and{" "}
              <a href="#" className="text-[#e8185d] hover:underline font-medium">Privacy Policy</a>.
            </p>
            <p className="text-sm text-[#6b6b6b] text-center">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#e8185d] font-bold hover:underline transition-colors"
              >
                {isLogin ? "Sign up" : "Log in"}
              </button>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
