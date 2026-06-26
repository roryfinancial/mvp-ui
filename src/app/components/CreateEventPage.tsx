import { motion } from "motion/react";
import { useState, useRef } from "react";
import { Calendar, Clock, MapPin, Loader2, Upload, X, ImageIcon } from "lucide-react";
import { eventApi } from "../../lib/api";
import { fileToCompressedDataUrl } from "../../lib/image-upload";

interface CreateEventPageProps {
  onBack?: () => void;
  onComplete?: () => void;
}

export default function CreateEventPage({ onBack, onComplete }: CreateEventPageProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = title.trim() && eventDate;

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImageUrl(await fileToCompressedDataUrl(file));
    } catch {
      setError("Could not read that image. Try a different file.");
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await eventApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        eventDate,
        eventTime: eventTime || undefined,
        location: location.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        isPublic,
      });

      if (!res.success) {
        setError(res.error?.message ?? "Failed to create event");
        setSubmitting(false);
        return;
      }

      onComplete?.();
    } catch {
      setError("Network error — please check your connection and try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
      <section className="w-full py-12 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12"
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-subtle mb-2">New Event</div>
            <h1 className="text-5xl font-black text-foreground mb-3 tracking-tight">Create an Event</h1>
            <p className="text-lg text-muted-foreground">
              Add an upcoming event to your profile so your supporters know where to find you.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-6"
          >
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Event Title <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Live Stream Meetup, Album Release Party"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3.5 border border-border bg-background text-foreground placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Description <span className="text-subtle font-normal normal-case tracking-normal">optional</span>
              </label>
              <textarea
                placeholder="Tell your supporters what this event is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3.5 border border-border bg-background text-foreground placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none text-sm"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  <Calendar className="w-3 h-3 inline mr-1.5" />
                  Date <span className="text-accent">*</span>
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-3.5 border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  <Clock className="w-3 h-3 inline mr-1.5" />
                  Time <span className="text-subtle font-normal normal-case tracking-normal">optional</span>
                </label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full px-4 py-3.5 border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                <MapPin className="w-3 h-3 inline mr-1.5" />
                Location <span className="text-subtle font-normal normal-case tracking-normal">optional</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Los Angeles, CA or Online / Twitch"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3.5 border border-border bg-background text-foreground placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-sm"
              />
            </div>

            {/* Event Image */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Event Image <span className="text-subtle font-normal normal-case tracking-normal">optional</span>
              </label>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <motion.div
                whileHover={{ scale: 1.005 }}
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full h-44 overflow-hidden cursor-pointer border-2 border-dashed border-border hover:border-accent transition-colors group bg-muted"
              >
                {imageUrl ? (
                  <>
                    <img src={imageUrl} alt="Event preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Upload className="w-4 h-4" />
                        Change Image
                      </div>
                    </div>
                    <button type="button" onClick={removeImage} className="absolute top-3 right-3 w-7 h-7 bg-background border border-border flex items-center justify-center text-foreground hover:bg-red-50 hover:text-red-500 transition-colors z-10">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-11 h-11 border border-border bg-background flex items-center justify-center group-hover:border-accent transition-colors">
                      <ImageIcon className="w-5 h-5 text-subtle" />
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground font-bold text-sm">Upload Event Image</p>
                      <p className="text-subtle text-xs mt-0.5">Click or drag to upload · PNG, JPG, GIF</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Public toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`relative w-10 h-5 rounded-full transition-colors ${isPublic ? "bg-accent" : "bg-secondary"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? "translate-x-5" : ""}`}
                />
              </button>
              <span className="text-sm text-foreground font-medium">Show on public profile</span>
            </div>

            {/* Preview */}
            {title.trim() && eventDate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 border border-border bg-muted/50 space-y-2"
              >
                <div className="text-[10px] font-black uppercase tracking-widest text-subtle">Preview</div>
                <h3 className="text-lg font-black text-foreground">{title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    {new Date(eventDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  {eventTime && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      {eventTime}
                    </span>
                  )}
                  {location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-accent" />
                      {location}
                    </span>
                  )}
                </div>
                {description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>}
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 border border-red-300 bg-red-50 text-red-700 text-sm">{error}</div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onBack}
                disabled={submitting}
                className="px-8 py-3 border border-border text-foreground font-bold text-sm uppercase tracking-wide hover:bg-muted transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSubmit}
                disabled={!isValid || submitting}
                className="px-8 py-3 bg-accent hover:bg-[#c9164f] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Creating..." : "Create Event"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-10 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto text-center text-subtle text-sm">
          <p>&copy; 2026 Rory. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
