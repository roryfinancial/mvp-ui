import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Link2, Loader2, Check, Youtube, Play, Eye, Heart } from "lucide-react";
import { feedApi, projectApi } from "../../lib/api";
import type { ProjectResponse, PostMetadataPreview, FeedPostResponse } from "../../lib/api";

interface AddPostDialogProps {
  open: boolean;
  onClose: () => void;
  onPostCreated?: (post: FeedPostResponse) => void;
  preselectedProjectId?: string;
  projects?: ProjectResponse[];
}

const platformColors: Record<string, string> = {
  YOUTUBE: "#FF0000",
  TWITCH: "#9146FF",
  TWITTER: "#000000",
  INSTAGRAM: "#E4405F",
  TIKTOK: "#00f2ea",
};

export default function AddPostDialog({ open, onClose, onPostCreated, preselectedProjectId, projects: externalProjects }: AddPostDialogProps) {
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<PostMetadataPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(preselectedProjectId || "");
  const [projects, setProjects] = useState<ProjectResponse[]>(externalProjects || []);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  // Load projects on first open if not provided externally
  async function loadProjects() {
    if (projects.length > 0 || loadingProjects) return;
    setLoadingProjects(true);
    const res = await projectApi.getMyProjects();
    if (res.success && res.data) setProjects(res.data);
    setLoadingProjects(false);
  }

  async function handleUrlChange(value: string) {
    setUrl(value);
    setPreviewError("");
    setPreview(null);
    setSuccess(false);
    setSubmitError("");
  }

  async function handleFetchPreview() {
    if (!url.trim()) return;
    setLoadingPreview(true);
    setPreviewError("");

    const res = await feedApi.previewUrl(url.trim());
    if (res.success && res.data) {
      setPreview(res.data);
      loadProjects();
    } else {
      setPreviewError(res.error?.message || "Could not recognize this URL. Try a YouTube, Twitter, Instagram, TikTok, or Twitch link.");
    }
    setLoadingPreview(false);
  }

  async function handleSubmit() {
    if (!url.trim()) return;
    setSubmitting(true);
    setSubmitError("");

    const res = await feedApi.createPost({
      url: url.trim(),
      linkedProjectId: selectedProjectId || undefined,
    });

    if (res.success && res.data) {
      setSuccess(true);
      onPostCreated?.(res.data);
      setTimeout(() => {
        setUrl("");
        setPreview(null);
        setSuccess(false);
        setSelectedProjectId(preselectedProjectId || "");
        onClose();
      }, 800);
    } else {
      setSubmitError(res.error?.message || "Failed to add post");
    }
    setSubmitting(false);
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-background border border-border shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Add Post</h2>
            <button onClick={onClose} className="p-1 text-subtle hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* URL Input */}
            <div>
              <label className="block text-xs font-bold text-subtle uppercase tracking-wider mb-1.5">
                Social Media URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste a YouTube, Twitter, Instagram, TikTok, or Twitch link"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleFetchPreview(); }}
                  onBlur={() => { if (url.trim() && !preview) handleFetchPreview(); }}
                  className="flex-1 px-3 py-2.5 text-sm border border-border bg-muted text-foreground placeholder:text-subtle focus:outline-none focus:border-accent"
                />
                <button
                  onClick={handleFetchPreview}
                  disabled={loadingPreview || !url.trim()}
                  className="px-3 py-2.5 bg-accent text-white text-xs font-bold uppercase hover:bg-[#c9164f] transition-colors disabled:opacity-50"
                >
                  {loadingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                </button>
              </div>
              {previewError && <p className="text-xs text-destructive mt-1">{previewError}</p>}
            </div>

            {/* Preview Card */}
            {preview && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-border overflow-hidden"
              >
                <div className="relative h-32 bg-muted flex items-center justify-center">
                  {preview.thumbnailUrl ? (
                    <img src={preview.thumbnailUrl} alt={preview.title || ""} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
                      <Play className="w-8 h-8 text-subtle" />
                    </div>
                  )}
                  <div
                    className="absolute top-2 left-2 px-2 py-0.5 text-white text-[9px] font-black uppercase"
                    style={{ backgroundColor: platformColors[preview.platform] || "#333" }}
                  >
                    {preview.platform}
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-[9px] font-bold uppercase">
                    {preview.contentType}
                  </div>
                </div>
                {preview.title && (
                  <div className="px-3 py-2 border-t border-border">
                    <p className="text-xs font-medium text-foreground line-clamp-2">{preview.title}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Project Selector */}
            {preview && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <label className="block text-xs font-bold text-subtle uppercase tracking-wider mb-1.5">
                  Link to Project (optional)
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-border bg-muted text-foreground focus:outline-none focus:border-accent appearance-none"
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </motion.div>
            )}

            {/* Submit */}
            {preview && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {submitError && <p className="text-xs text-destructive mb-2">{submitError}</p>}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || success}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                    success
                      ? "bg-green-600 text-white"
                      : "bg-accent text-white hover:bg-[#c9164f]"
                  } disabled:opacity-70`}
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {success && <Check className="w-4 h-4" />}
                  {success ? "Added!" : "Add Post"}
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
