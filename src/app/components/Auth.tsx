import { motion } from "motion/react";
import { useState } from "react";
import { Mail, Heart, ArrowLeft } from "lucide-react";

interface AuthProps {
  onBack?: () => void;
  onAuthComplete?: (userType: "creator" | "supporter") => void;
}

export default function Auth({ onBack, onAuthComplete }: AuthProps) {
  const [activeTab, setActiveTab] = useState<"creator" | "fan">("creator");
  const [isLogin, setIsLogin] = useState(false);

  const handleAuthComplete = () => {
    if (!isLogin && onAuthComplete) {
      // Convert "fan" to "supporter" for consistency
      onAuthComplete(activeTab === "creator" ? "creator" : "supporter");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Back Button */}
      {onBack && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={onBack}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </motion.button>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row w-full max-w-5xl mx-auto bg-[#1a1a1a] rounded-3xl overflow-hidden shadow-2xl border border-white/10"
      >
        {/* Left Side - Graphic/Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative w-full md:w-1/2 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 p-12 flex flex-col justify-center items-center text-center overflow-hidden"
        >
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
                Your wishlist,
                <br />
                funded
              </h2>
              <p className="text-xl text-white/90 max-w-md mx-auto leading-relaxed">
                Join TipFlow and get exactly what you want from your supporters. Zero fees, ever.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-12 flex flex-col gap-4 items-center"
            >
              <div className="flex items-center gap-2 text-white/80">
                <Heart className="w-5 h-5 fill-white/80" />
                <span className="text-sm">Trusted by 10,000+ creators</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm">100% free for creators</span>
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
            className="text-3xl font-bold text-white mb-8 text-center"
          >
            {isLogin ? "Welcome Back" : "Join TipFlow"}
          </motion.h1>

          {/* Creator/Fan Toggle */}
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-[#0a0a0a] rounded-full p-1 flex mb-8 border border-white/10"
            >
              <button
                onClick={() => setActiveTab("creator")}
                className={`flex-1 text-center py-3 px-4 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeTab === "creator"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                I'm a Creator
              </button>
              <button
                onClick={() => setActiveTab("fan")}
                className={`flex-1 text-center py-3 px-4 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeTab === "fan"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                I'm a Supporter
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAuthComplete}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.29v3.1h5.21c-.22 1.4-1.12 3.12-3.83 3.12-2.3 0-4.18-1.9-4.18-4.25s1.88-4.25 4.18-4.25c1.19 0 2.08.51 2.57 1.05l2.76-2.67C19.22 4.19 16.22 3 12.24 3 7.37 3 3.4 6.7 3.4 12c0 5.3 3.97 9 8.84 9 4.88 0 8.35-3.59 8.35-8.61 0-.61-.06-1.19-.16-1.74h-8.2z"/>
              </svg>
              Continue with Google
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAuthComplete}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl border border-white/10 bg-[#9146FF]/20 hover:bg-[#9146FF]/30 transition-all text-white font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.571 5.094h1.714v4.714H11.571zm4.714 0h1.714v4.714H16.285zM8.571 0L3 5.571V19.8h4.714v4.714h4.714L19.8 19.8V0zm8.229 14.571h-2.857v2.857H13.44l-2.857 2.857v-2.857H6.285V3.857h10.515z"/>
              </svg>
              Continue with Twitch
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAuthComplete}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl border border-white/10 bg-black/40 hover:bg-black/60 transition-all text-white font-medium"
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
            <hr className="flex-grow border-white/10" />
            <span className="px-4 text-gray-500 text-sm">or</span>
            <hr className="flex-grow border-white/10" />
          </motion.div>

          {/* Email Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mb-6"
          >
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#0a0a0a] border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
              />
            </div>
          </motion.div>

          {/* Continue Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(168, 85, 247, 0.4)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAuthComplete}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-4 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-purple-500/25 mb-6"
          >
            Continue
          </motion.button>

          {/* Terms and Toggle Login/Signup */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            <p className="text-xs text-gray-500 text-center mb-4">
              By continuing, you agree to TipFlow's{" "}
              <a href="#" className="text-purple-400 hover:underline">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="text-purple-400 hover:underline">
                Privacy Policy
              </a>
              .
            </p>
            <p className="text-sm text-gray-400 text-center">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-purple-400 hover:text-purple-300 font-semibold hover:underline transition-colors"
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
