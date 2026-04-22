import { motion } from "motion/react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Gift, ShoppingBag, Heart, Sparkles } from "lucide-react";

interface HomeProps {
  onNavigateToAuth: () => void;
}

export default function Home({ onNavigateToAuth }: HomeProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            TipFlow
          </div>
          <div className="flex items-center gap-10">
            <a href="#" className="text-gray-300 hover:text-white transition-colors font-medium">Features</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors font-medium">Pricing</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors font-medium">Creators</a>
            <button
              onClick={onNavigateToAuth}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-semibold transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-5xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: [0, -5, 0]
              }}
              transition={{
                opacity: { duration: 0.5, delay: 0.2 },
                scale: { duration: 0.5, delay: 0.2 },
                y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
              className="inline-block mb-6"
            >
              <div className="px-5 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-full text-sm font-medium">
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Wishlists + Tips. Zero Fees.
                </span>
              </div>
            </motion.div>

            <h1 className="text-7xl md:text-8xl font-bold mb-8 leading-none">
              <span className="bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent">
                Your wishlist,
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                funded
              </span>
            </h1>

            <p className="text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Share your wishlist. Your fans buy you gifts. You get exactly what you want with zero fees.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.button
                onClick={onNavigateToAuth}
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(168, 85, 247, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl text-xl font-bold transition-all shadow-lg shadow-purple-500/25"
              >
                Create Your Wishlist
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 backdrop-blur-sm border border-white/10 rounded-2xl text-xl font-bold transition-all"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
              >
                See How It Works
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature Section 1 - Wishlists */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
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
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-purple-600/10 border border-purple-500/30 rounded-full mb-8"
              >
                <Gift className="w-5 h-5 text-purple-400" />
                <span className="font-semibold text-purple-400">Wishlists</span>
              </motion.div>
              <h2 className="text-6xl font-bold mb-6 leading-tight">
                Get the gifts
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  you actually want
                </span>
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Add anything from any store to your wishlist. Your fans browse, pick what they want to gift, and you receive exactly what you need.
              </p>
              <div className="space-y-4">
                {[
                  { title: "Add from any store", desc: "Amazon, Etsy, Target, anywhere online", delay: 0.1 },
                  { title: "Privacy-first", desc: "Your address stays hidden from supporters", delay: 0.2 },
                  { title: "Zero fees", desc: "Keep 100% of tips and cash gifts", delay: 0.3 }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: item.delay }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1">{item.title}</div>
                      <div className="text-gray-400">{item.desc}</div>
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
              className="relative"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="absolute -top-4 -right-4 w-full h-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-3xl blur-xl"
              ></motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="relative bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 overflow-hidden"
              >
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwbW9kZSUyMGFuYWx5dGljcyUyMGRhc2hib2FyZCUyMHVpfGVufDF8fHx8MTc3NjA2MzE2Nnww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Wishlist Dashboard"
                  className="w-full h-auto rounded-2xl"
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-40 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="text-7xl md:text-8xl font-bold mb-8 leading-none">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Start your
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                wishlist
              </span>
            </h2>
            <p className="text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join thousands of creators getting gifted exactly what they want
            </p>
            <motion.button
              onClick={onNavigateToAuth}
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(168, 85, 247, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl text-2xl font-bold transition-all shadow-lg shadow-purple-500/25"
            >
              Create Your Wishlist
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-400"
            >
              {[
                { text: "100% free for creators", delay: 0.5 },
                { text: "Set up in 2 minutes", delay: 0.6 },
                { text: "No credit card needed", delay: 0.7 }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: item.delay }}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: item.delay + 0.2, type: "spring", stiffness: 200 }}
                    className="w-2 h-2 rounded-full bg-green-500"
                  ></motion.div>
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                TipFlow
              </div>
              <p className="text-gray-400 mb-6 max-w-xs">
                The wishlist platform for creators. Get gifted what you actually want. Zero fees, ever.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Product</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Resources</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Creator Stories</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Company</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>© 2026 TipFlow. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
