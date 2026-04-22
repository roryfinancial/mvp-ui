import { motion } from "motion/react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Gift, ShoppingBag, Heart } from "lucide-react";

interface HomeProps {
  onNavigateToAuth: () => void;
}

export default function Home({ onNavigateToAuth }: HomeProps) {
  return (
    <div className="min-h-screen bg-white text-[#111111]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#111111] border-b-2 border-[#e8185d]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-black text-white tracking-tight">TipFlow</div>
          <div className="flex items-center gap-8">
            <a href="#" className="text-white/60 hover:text-white transition-colors text-sm font-medium tracking-wide">Features</a>
            <a href="#" className="text-white/60 hover:text-white transition-colors text-sm font-medium tracking-wide">Pricing</a>
            <a href="#" className="text-white/60 hover:text-white transition-colors text-sm font-medium tracking-wide">Creators</a>
            <button
              onClick={onNavigateToAuth}
              className="px-5 py-2 bg-[#e8185d] hover:bg-[#c9164f] text-white text-sm font-bold uppercase tracking-widest transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ opacity: { duration: 0.5, delay: 0.2 }, scale: { duration: 0.5, delay: 0.2 } }}
              className="inline-block mb-8"
            >
              <div className="px-4 py-1.5 border border-[#e8185d] text-[#e8185d] text-xs font-bold uppercase tracking-widest">
                Fan Gifts. Zero Fees.
              </div>
            </motion.div>

            <h1 className="text-7xl md:text-8xl font-black mb-8 leading-none tracking-tight text-[#111111]">
              Your wishlist,
              <br />
              <span className="text-[#e8185d]">funded.</span>
            </h1>

            <p className="text-xl text-[#6b6b6b] mb-12 max-w-2xl mx-auto leading-relaxed">
              Share your list. Your fans buy the gifts. You keep 100%. No platform cut, ever.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.button
                onClick={onNavigateToAuth}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-10 py-4 bg-[#111111] hover:bg-[#e8185d] text-white text-lg font-bold uppercase tracking-widest transition-colors"
              >
                Start Your Wishlist
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-10 py-4 border-2 border-[#111111] text-[#111111] text-lg font-bold uppercase tracking-widest hover:bg-[#111111] hover:text-white transition-colors"
              >
                How It Works
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="bg-[#111111] py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-12">
          {[
            { stat: "10,000+", label: "Creators" },
            { stat: "$0", label: "Platform Fees" },
            { stat: "2 min", label: "Setup Time" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-3xl font-black text-white">{item.stat}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-white/40 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Section 1 - Wishlists */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-20 items-center"
          >
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="flex items-center gap-2 mb-6">
                <Gift className="w-4 h-4 text-[#e8185d]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#e8185d]">Wishlists</span>
              </div>
              <h2 className="text-5xl font-black mb-6 leading-tight text-[#111111] tracking-tight">
                Get exactly
                <br />
                what you want.
              </h2>
              <p className="text-lg text-[#6b6b6b] mb-10 leading-relaxed">
                Add any item from any store. Fans browse, choose what to gift, and it ships straight to you — your address never shared.
              </p>
              <div className="space-y-5">
                {[
                  { title: "Any store, any item", desc: "Amazon, Etsy, Target — add anything with a link." },
                  { title: "Privacy-first", desc: "Your address is never visible to supporters." },
                  { title: "Zero platform fees", desc: "Keep every dollar your fans contribute." },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#e8185d] mt-2.5 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-[#111111] mb-0.5">{item.title}</div>
                      <div className="text-[#6b6b6b] text-sm">{item.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="border border-[#e0e0e0] overflow-hidden shadow-sm">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwbW9kZSUyMGFuYWx5dGljcyUyMGRhc2hib2FyZCUyMHVpfGVufDF8fHx8MTc3NjA2MzE2Nnww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Wishlist Dashboard"
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature Section 2 */}
      <section className="py-32 px-6 bg-[#f5f5f5]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-20 items-center"
          >
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-2 md:order-1 border border-[#e0e0e0] bg-white p-8"
            >
              <div className="space-y-4">
                {[
                  { name: "boogerbill01", amount: "$4,699", rank: 1 },
                  { name: "TheBull963", amount: "$3,710", rank: 2 },
                  { name: "Maxroberts99", amount: "$2,905", rank: 3 },
                ].map((entry) => (
                  <div key={entry.rank} className="flex items-center gap-4 p-4 border border-[#e0e0e0]">
                    <div className="w-8 h-8 bg-[#111111] text-white flex items-center justify-center text-xs font-black">
                      #{entry.rank}
                    </div>
                    <div className="w-10 h-10 bg-[#f5f5f5] border border-[#e0e0e0] flex items-center justify-center text-xs font-bold text-[#6b6b6b]">
                      {entry.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm font-bold text-[#111111]">{entry.name}</span>
                    <span className="text-[#e8185d] font-black text-sm">{entry.amount}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-1 md:order-2"
            >
              <div className="flex items-center gap-2 mb-6">
                <Heart className="w-4 h-4 text-[#e8185d]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#e8185d]">Community</span>
              </div>
              <h2 className="text-5xl font-black mb-6 leading-tight text-[#111111] tracking-tight">
                Your fans
                <br />
                compete to gift you.
              </h2>
              <p className="text-lg text-[#6b6b6b] leading-relaxed">
                Public leaderboards turn gifting into a community moment. Your most dedicated supporters get recognized — and they love it.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-40 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="text-xs font-bold uppercase tracking-widest text-[#999999] mb-6">Ready?</div>
            <h2 className="text-7xl md:text-8xl font-black mb-8 leading-none tracking-tight text-[#111111]">
              Start your
              <br />
              <span className="text-[#e8185d]">wishlist.</span>
            </h2>
            <p className="text-xl text-[#6b6b6b] mb-12 max-w-xl mx-auto">
              Join 10,000+ creators getting gifted exactly what they want.
            </p>
            <motion.button
              onClick={onNavigateToAuth}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-12 py-5 bg-[#e8185d] hover:bg-[#c9164f] text-white text-xl font-black uppercase tracking-widest transition-colors"
            >
              Create Your Wishlist
            </motion.button>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-10 text-sm text-[#999999]">
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
      <footer className="border-t border-[#e0e0e0] py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="text-xl font-black text-[#111111] mb-4">TipFlow</div>
              <p className="text-[#6b6b6b] mb-6 max-w-xs text-sm leading-relaxed">
                The wishlist platform for creators. Get gifted what you actually want. Zero fees, ever.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#999999] mb-4">Product</h3>
              <ul className="space-y-3 text-sm text-[#6b6b6b]">
                <li><a href="#" className="hover:text-[#111111] transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-[#111111] transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-[#111111] transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#999999] mb-4">Resources</h3>
              <ul className="space-y-3 text-sm text-[#6b6b6b]">
                <li><a href="#" className="hover:text-[#111111] transition-colors">Creator Stories</a></li>
                <li><a href="#" className="hover:text-[#111111] transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-[#111111] transition-colors">Help Center</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#999999] mb-4">Company</h3>
              <ul className="space-y-3 text-sm text-[#6b6b6b]">
                <li><a href="#" className="hover:text-[#111111] transition-colors">About</a></li>
                <li><a href="#" className="hover:text-[#111111] transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-[#111111] transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-[#e0e0e0] flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#999999]">
            <p>© 2026 TipFlow. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-[#111111] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#111111] transition-colors">Terms</a>
              <a href="#" className="hover:text-[#111111] transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
