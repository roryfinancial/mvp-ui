import { motion } from "motion/react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Gift, Heart, Zap, Shield, Trophy } from "lucide-react";

interface HomeProps {
  onNavigateToAuth: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToSignUp?: () => void;
}

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"] as const;

export default function Home({ onNavigateToAuth, onNavigateToLogin, onNavigateToSignUp }: HomeProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0e0e0e] border-b border-accent/40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-black text-white tracking-tight">TipFlow</div>
          <div className="flex items-center gap-8">
            <a href="#features" className="text-white/50 hover:text-white transition-colors text-sm font-medium">Features</a>
            <a href="#pricing" className="text-white/50 hover:text-white transition-colors text-sm font-medium">Pricing</a>
            <a href="#creators" className="text-white/50 hover:text-white transition-colors text-sm font-medium">Creators</a>
            <a href="/leaderboard" className="text-white/50 hover:text-white transition-colors text-sm font-medium">Leaderboard</a>
            <button
              onClick={onNavigateToLogin ?? onNavigateToAuth}
              className="px-5 py-2 border border-white/20 text-white text-sm font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
            >
              Log In
            </button>
            <button
              onClick={onNavigateToSignUp ?? onNavigateToAuth}
              className="px-5 py-2 btn-cta text-white text-sm font-bold uppercase tracking-widest"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero — dark panel for gaming impact */}
      <section className="pt-0 pb-0 bg-[#0e0e0e] relative overflow-hidden">
        {/* Subtle radial glow behind heading */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{}}
        />
        <div className="max-w-7xl mx-auto px-6 pt-40 pb-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="inline-block mb-8"
            >
              <div
                className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white/90 border"
                style={{
                  borderColor: "oklch(65.6% 0.241 354.308 / 0.5)",
                  background: "oklch(65.6% 0.241 354.308 / 0.12)",
                }}
              >
                New — Fan Gifts with Zero Fees
              </div>
            </motion.div>

            <h1 className="text-7xl md:text-8xl font-black mb-8 leading-none tracking-tight text-white">
              Your project,
              <br />
              <span style={{ color: "oklch(65.6% 0.241 354.308)" }}>funded.</span>
            </h1>

            <p className="text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
              Share your list. Your fans buy the gifts. You keep 100%. No platform cut, ever.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.button
                onClick={onNavigateToSignUp ?? onNavigateToAuth}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-10 py-4 btn-cta text-white text-lg font-black uppercase tracking-widest"
              >
                Start Your Project
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-10 py-4 border border-white/20 text-white/70 text-lg font-bold uppercase tracking-widest hover:border-white/40 hover:text-white transition-colors"
              >
                How It Works
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="bg-foreground py-8 px-6 border-y border-background/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-16">
          {[
            { stat: "10,000+", label: "Creators" },
            { stat: "$0", label: "Platform Fees" },
            { stat: "2 min", label: "Setup Time" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center"
            >
              <div
                className="text-4xl font-black mb-1"
                style={{ color: "oklch(65.6% 0.241 354.308)" }}
              >
                {item.stat}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-background/40">{item.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Feature Section 1 — Projects */}
      <section id="features" className="py-28 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-20 items-center"
          >
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div className="flex items-center gap-2 mb-6">
                <Gift className="w-4 h-4" style={{ color: "oklch(65.6% 0.241 354.308)" }} />
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "oklch(65.6% 0.241 354.308)" }}
                >
                  Projects
                </span>
              </div>
              <h2 className="text-5xl font-black mb-6 leading-tight text-foreground tracking-tight">
                Get exactly
                <br />
                what you want.
              </h2>
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                Add any item from any store. Fans browse, choose what to gift, and it ships straight to you — your address never shared.
              </p>
              <div className="space-y-4">
                {[
                  { icon: <Zap className="w-4 h-4" />, title: "Any store, any item", desc: "Amazon, Etsy, Target — add anything with a link." },
                  { icon: <Shield className="w-4 h-4" />, title: "Privacy-first", desc: "Your address is never visible to supporters." },
                  { icon: <Gift className="w-4 h-4" />, title: "Zero platform fees", desc: "Keep every dollar your fans contribute." },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="flex items-start gap-4 p-4 border border-border bg-background card-game"
                  >
                    <div
                      className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-white"
                      style={{ background: "oklch(65.6% 0.241 354.308)" }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-bold text-foreground mb-0.5">{item.title}</div>
                      <div className="text-muted-foreground text-sm">{item.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div className="overflow-hidden shadow-xl border border-border">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwbW9kZSUyMGFuYWx5dGljcyUyMGRhc2hib2FyZCUyMHVpfGVufDF8fHx8MTc3NjA2MzE2Nnww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Project Dashboard"
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature Section 2 — Leaderboard */}
      <section className="py-28 px-6 bg-muted">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-20 items-center"
          >
            {/* Leaderboard demo card */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="order-2 md:order-1"
            >
              <div className="overflow-hidden border border-border bg-background card-game">
                {/* Card header */}
                <div className="bg-[#0e0e0e] px-6 py-4 flex items-center gap-3">
                  <Trophy className="w-5 h-5" style={{ color: RANK_COLORS[0] }} />
                  <span className="text-white font-black text-sm uppercase tracking-widest">Top Gifters</span>
                </div>
                <div className="p-4 space-y-2">
                  {[
                    { name: "boogerbill01", amount: "$4,699", rank: 1 },
                    { name: "TheBull963",   amount: "$3,710", rank: 2 },
                    { name: "Maxroberts99", amount: "$2,905", rank: 3 },
                  ].map((entry, i) => (
                    <motion.div
                      key={entry.rank}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}
                      className="flex items-center gap-3 p-4 border border-border bg-background card-game cursor-pointer"
                    >
                      <div
                        className="w-8 h-8 flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                        style={{ background: RANK_COLORS[i] }}
                      >
                        #{entry.rank}
                      </div>
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                        style={{ background: "oklch(65.6% 0.241 354.308)" }}
                      >
                        {entry.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="flex-1 text-sm font-bold text-foreground">{entry.name}</span>
                      <span className="font-black text-sm" style={{ color: RANK_COLORS[i] }}>{entry.amount}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="order-1 md:order-2"
            >
              <div className="flex items-center gap-2 mb-6">
                <Heart className="w-4 h-4" style={{ color: "oklch(65.6% 0.241 354.308)" }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "oklch(65.6% 0.241 354.308)" }}>Community</span>
              </div>
              <h2 className="text-5xl font-black mb-6 leading-tight text-foreground tracking-tight">
                Your fans
                <br />
                compete to gift you.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Public leaderboards turn gifting into a community moment. Your most dedicated supporters get recognized — and they love it.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 px-6 bg-[#0e0e0e] relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{}}
        />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-6">Ready?</div>
            <h2 className="text-7xl md:text-8xl font-black mb-8 leading-none tracking-tight text-white">
              Start your
              <br />
              <span style={{ color: "oklch(65.6% 0.241 354.308)" }}>project.</span>
            </h2>
            <p className="text-xl text-white/50 mb-12 max-w-xl mx-auto">
              Join 10,000+ creators getting gifted exactly what they want.
            </p>
            <motion.button
              onClick={onNavigateToSignUp ?? onNavigateToAuth}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-12 py-5 btn-cta text-white text-xl font-black uppercase tracking-widest"
            >
              Create Your Project
            </motion.button>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-10 text-sm text-white/30">
              {["100% free for creators", "Set up in 2 minutes", "No credit card needed"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 px-6 bg-[#0e0e0e]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="text-xl font-black text-white mb-4">TipFlow</div>
              <p className="text-white/40 mb-6 max-w-xs text-sm leading-relaxed">
                The funding platform for creators. Get exactly what you need. Zero fees, ever.
              </p>
            </div>
            {[
              { heading: "Product", links: ["Features", "Pricing", "Security"] },
              { heading: "Resources", links: ["Creator Stories", "Blog", "Help Center"] },
              { heading: "Company", links: ["About", "Careers", "Contact"] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">{heading}</h3>
                <ul className="space-y-3 text-sm text-white/50">
                  {links.map((l) => (
                    <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/30">
            <p>© 2026 TipFlow. All rights reserved.</p>
            <div className="flex gap-6">
              {["Privacy", "Terms", "Cookies"].map((l) => (
                <a key={l} href="#" className="hover:text-white/60 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
