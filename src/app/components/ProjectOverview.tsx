import { motion } from "motion/react";

import { User } from "lucide-react";

interface Supporter {
  name: string;
  amount: string;
  initials: string;
}

interface ProjectOverviewProps {
  projectTitle?: string;
  projectName?: string;
  creatorName?: string;
  description?: string;
  supporters?: Supporter[];
  projectId?: number;
  onBack?: () => void;
  onBackToProject?: (projectId: number) => void;
  onViewCreator?: () => void;
}

export default function ProjectOverview({
  projectTitle = "Your Project",
  projectName = "Creator Essentials",
  creatorName = "Creator Name",
  description = "Describe your project here — what you're building, your roadmap, and how support will be used. A clear description helps supporters understand your goals and decide to contribute.",
  supporters = [
    { name: "Supporter Name 1", amount: "$100", initials: "S1" },
    { name: "Supporter Name 2", amount: "$75", initials: "S2" },
    { name: "Supporter Name 3", amount: "$50", initials: "S3" },
    { name: "Supporter Name 4", amount: "$30", initials: "S4" },
  ],
  projectId = 1,
  onBack,
  onBackToProject,
  onViewCreator,
}: ProjectOverviewProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Content */}
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8 text-sm">
            <button onClick={onBack} className="text-subtle hover:text-foreground transition-colors font-medium">My Projects</button>
            <span className="text-subtle">/</span>
            <button onClick={() => onBackToProject?.(projectId)} className="text-subtle hover:text-foreground transition-colors font-medium">{projectName}</button>
            <span className="text-subtle">/</span>
            <span className="text-foreground font-bold truncate max-w-[200px]">{projectTitle}</span>
          </div>

          {/* Project Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-start gap-8 mb-16 pb-16 border-b border-border"
          >
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-muted border border-border flex items-center justify-center flex-shrink-0">
              <User className="w-16 h-16 text-subtle" />
            </div>

            <div className="flex-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-2">{projectName}</div>
              <h1 className="text-5xl font-black text-foreground mb-4 tracking-tight">{projectTitle}</h1>
              <button
                onClick={onViewCreator}
                className="inline-block px-3 py-1.5 border border-border bg-muted text-muted-foreground text-sm font-bold hover:border-accent hover:text-accent transition-colors"
              >
                by {creatorName}
              </button>
            </div>
          </motion.div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {/* Description */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-3 h-5 bg-accent" />
                  <h2 className="text-xl font-black text-foreground tracking-tight">About This Project</h2>
                </div>
                <div className="p-6 border border-border bg-muted text-muted-foreground leading-relaxed text-sm">
                  {description}
                </div>
              </div>

            </motion.div>

            {/* Right Column: Supporters */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-3 h-5 bg-foreground" />
                <h2 className="text-xl font-black text-foreground tracking-tight">Top Supporters</h2>
              </div>
              <div className="space-y-2">
                {supporters.map((supporter, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="p-4 border border-border bg-background flex items-center gap-4 cursor-pointer hover:shadow-sm transition-shadow"
                  >
                    <div className="w-4 text-center text-xs font-black text-subtle">
                      {index + 1}
                    </div>
                    <div className="w-10 h-10 bg-muted border border-border flex items-center justify-center flex-shrink-0 font-bold text-xs text-muted-foreground">
                      {supporter.initials}
                    </div>
                    <span className="text-foreground font-bold flex-1 text-sm">{supporter.name}</span>
                    <span className="text-accent font-black text-sm">{supporter.amount}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <footer className="py-10 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto text-center text-subtle text-sm">
          <p>© 2026 Rory. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
