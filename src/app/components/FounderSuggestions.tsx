import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { domToCanvas } from "modern-screenshot";
import { Lightbulb, X, Camera, Pencil, Square, Trash2, Send, Loader2, GripVertical, Image as ImageIcon, Archive, ArchiveRestore } from "lucide-react";
import { founderSuggestionsApi, type FounderSuggestion } from "../../lib/api";

// ─── Temporary cofounder feedback widget ─────────────────────────────────────
// A draggable, closable popup. Cofounders sign as Logan / Kayden / Annabella,
// leave UI/layout suggestions, optionally attach a screenshot of their current
// view marked up with a red pen and a resizable translucent-yellow highlight
// box, then save to the DB (screenshot stored as compressed base64 JPEG).

const AUTHORS = ["Logan", "Kayden", "Annabella"] as const;
type Author = (typeof AUTHORS)[number];

const PANEL_W = 360;
const CAPTURE_MAX_W = 1100; // downscale ceiling for the screenshot
const JPEG_QUALITY = 0.55;

type Tool = "pen" | "box";
type Box = { x: number; y: number; w: number; h: number }; // internal-canvas coords
type Stroke = { x: number; y: number }[]; // internal-canvas coords

export default function FounderSuggestions() {
  const [open, setOpen] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("founder") === "open"
  );
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 24, y: 96 });
  const [tab, setTab] = useState<"new" | "list">("new");

  // form
  const [author, setAuthor] = useState<Author | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // list
  const [items, setItems] = useState<FounderSuggestion[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // screenshot + markup
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [tool, setTool] = useState<Tool>("pen");
  const [box, setBox] = useState<Box | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // ── Position: start near the bottom-right on mount ─────────────────────────
  useEffect(() => {
    setPos({ x: Math.max(16, window.innerWidth - PANEL_W - 24), y: Math.max(80, window.innerHeight - 600) });
  }, []);

  // ── Dragging the panel by its header ───────────────────────────────────────
  const dragState = useRef<{ dx: number; dy: number } | null>(null);
  const onHeaderPointerDown = (e: React.PointerEvent) => {
    dragState.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onHeaderPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    const x = Math.min(Math.max(0, e.clientX - dragState.current.dx), window.innerWidth - 64);
    const y = Math.min(Math.max(0, e.clientY - dragState.current.dy), window.innerHeight - 48);
    setPos({ x, y });
  };
  const onHeaderPointerUp = (e: React.PointerEvent) => {
    dragState.current = null;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
  };

  // ── Load list when opening the All tab ─────────────────────────────────────
  const loadList = useCallback(async () => {
    setLoadingList(true);
    const res = await founderSuggestionsApi.list(showArchived);
    if (res.success && res.data) setItems(res.data);
    setLoadingList(false);
  }, [showArchived]);
  useEffect(() => {
    if (open && tab === "list") loadList();
  }, [open, tab, loadList]);

  // ── Canvas redraw (base image + red strokes; box rendered as overlay) ──────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = Math.max(2, canvas.width / 320);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of strokesRef.current) {
      if (stroke.length < 1) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (const p of stroke) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }, [baseImage]);

  useEffect(() => { redraw(); }, [redraw]);

  // ── Capture the current page view (excluding this widget) ──────────────────
  const capture = async () => {
    setError(null);
    setCapturing(true);
    try {
      const full = await domToCanvas(document.body, {
        filter: (node) =>
          !(node instanceof HTMLElement && node.dataset?.founderWidget === "true"),
        backgroundColor: getComputedStyle(document.body).backgroundColor || "#0b0b0c",
      });
      // Downscale for size, then make an <img> for the markup canvas.
      const scale = Math.min(1, CAPTURE_MAX_W / full.width);
      const w = Math.round(full.width * scale);
      const h = Math.round(full.height * scale);
      const small = document.createElement("canvas");
      small.width = w;
      small.height = h;
      small.getContext("2d")!.drawImage(full, 0, 0, w, h);
      const dataUrl = small.toDataURL("image/jpeg", JPEG_QUALITY);
      const img = new Image();
      img.onload = () => {
        strokesRef.current = [];
        setBox(null);
        setBaseImage(img);
      };
      img.src = dataUrl;
    } catch (e) {
      console.error(e);
      setError("Couldn't capture the screen. You can still send a text suggestion.");
    } finally {
      setCapturing(false);
    }
  };

  // ── Pointer → internal canvas coords ───────────────────────────────────────
  const toCanvasCoords = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy, sx, sy };
  };

  const drawing = useRef(false);
  const onCanvasPointerDown = (e: React.PointerEvent) => {
    if (tool !== "pen") return;
    drawing.current = true;
    const { x, y } = toCanvasCoords(e);
    strokesRef.current.push([{ x, y }]);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onCanvasPointerMove = (e: React.PointerEvent) => {
    if (!drawing.current || tool !== "pen") return;
    const { x, y } = toCanvasCoords(e);
    strokesRef.current[strokesRef.current.length - 1].push({ x, y });
    redraw();
  };
  const onCanvasPointerUp = () => { drawing.current = false; };

  // ── Yellow box: create / move / resize (in internal coords) ────────────────
  const addBox = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width * 0.4;
    const h = canvas.height * 0.18;
    setBox({ x: (canvas.width - w) / 2, y: (canvas.height - h) / 2, w, h });
    setTool("box");
  };

  const boxDrag = useRef<{ mode: "move" | "resize"; startX: number; startY: number; orig: Box } | null>(null);
  const onBoxPointerDown = (mode: "move" | "resize") => (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!box) return;
    boxDrag.current = { mode, startX: e.clientX, startY: e.clientY, orig: { ...box } };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onBoxPointerMove = (e: React.PointerEvent) => {
    if (!boxDrag.current || !box || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const dx = (e.clientX - boxDrag.current.startX) * sx;
    const dy = (e.clientY - boxDrag.current.startY) * sy;
    const o = boxDrag.current.orig;
    if (boxDrag.current.mode === "move") {
      setBox({
        x: Math.min(Math.max(0, o.x + dx), canvas.width - o.w),
        y: Math.min(Math.max(0, o.y + dy), canvas.height - o.h),
        w: o.w, h: o.h,
      });
    } else {
      setBox({
        x: o.x, y: o.y,
        w: Math.min(Math.max(24, o.w + dx), canvas.width - o.x),
        h: Math.min(Math.max(16, o.h + dy), canvas.height - o.y),
      });
    }
  };
  const onBoxPointerUp = (e: React.PointerEvent) => {
    boxDrag.current = null;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
  };

  const clearMarkup = () => {
    strokesRef.current = [];
    setBox(null);
    redraw();
  };
  const discardScreenshot = () => {
    strokesRef.current = [];
    setBox(null);
    setBaseImage(null);
  };

  // ── Compose the final screenshot (base + strokes + translucent box) ────────
  const composeScreenshot = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImage) return null;
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    const ctx = out.getContext("2d")!;
    ctx.drawImage(canvas, 0, 0); // base image + red strokes already rendered
    if (box) {
      ctx.fillStyle = "rgba(250, 204, 21, 0.30)"; // translucent yellow — text shows through
      ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.strokeStyle = "rgba(234, 179, 8, 0.9)";
      ctx.lineWidth = Math.max(2, canvas.width / 320);
      ctx.strokeRect(box.x, box.y, box.w, box.h);
    }
    return out.toDataURL("image/jpeg", JPEG_QUALITY);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submit = async () => {
    setError(null);
    if (!author) { setError("Pick a name to sign with."); return; }
    if (!comment.trim()) { setError("Write a suggestion first."); return; }
    setSubmitting(true);
    const screenshot = baseImage ? composeScreenshot() : null;
    const res = await founderSuggestionsApi.create({
      author,
      comment: comment.trim(),
      pageUrl: window.location.pathname + window.location.search,
      screenshot,
    });
    setSubmitting(false);
    if (!res.success) {
      setError(res.error?.message ?? "Failed to save. Try again.");
      return;
    }
    setComment("");
    discardScreenshot();
    setTab("list");
    loadList();
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await founderSuggestionsApi.remove(id);
  };

  // Archive (or restore) — drops the row from the current view since each view
  // shows one side of the archived flag.
  const setArchived = async (id: string, archived: boolean) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await founderSuggestionsApi.setArchived(id, archived);
  };

  // ── Box overlay geometry in CSS space ──────────────────────────────────────
  const boxOverlayStyle = (): React.CSSProperties | null => {
    const canvas = canvasRef.current;
    if (!canvas || !box) return null;
    const rect = canvas.getBoundingClientRect();
    const sx = rect.width / canvas.width;
    const sy = rect.height / canvas.height;
    return {
      position: "absolute",
      left: box.x * sx,
      top: box.y * sy,
      width: box.w * sx,
      height: box.h * sy,
    };
  };

  const widget = (
    <div ref={rootRef} data-founder-widget="true">
      {/* Launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[9998] flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-amber-500/30 transition hover:bg-amber-300"
          title="Founder Suggestions"
        >
          <Lightbulb className="h-4 w-4" />
          Founder Suggestions
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className="fixed z-[9999] flex flex-col overflow-hidden rounded-xl border border-white/10 bg-neutral-900 text-neutral-100 shadow-2xl"
          style={{ left: pos.x, top: pos.y, width: PANEL_W, maxHeight: "82vh" }}
        >
          {/* Header (drag handle) */}
          <div
            onPointerDown={onHeaderPointerDown}
            onPointerMove={onHeaderPointerMove}
            onPointerUp={onHeaderPointerUp}
            className="flex cursor-grab items-center gap-2 border-b border-white/10 bg-gradient-to-r from-amber-500/20 to-transparent px-3 py-2.5 active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-amber-300/70" />
            <Lightbulb className="h-4 w-4 text-amber-300" />
            <span className="select-none text-xs font-bold uppercase tracking-wider text-amber-200">
              Founder Suggestions
            </span>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto rounded p-1 text-neutral-400 transition hover:bg-white/10 hover:text-white"
              title="Close (shoo away)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 text-xs font-medium">
            <button
              onClick={() => setTab("new")}
              className={`flex-1 px-3 py-2 transition ${tab === "new" ? "bg-white/5 text-amber-200" : "text-neutral-400 hover:text-neutral-200"}`}
            >
              New suggestion
            </button>
            <button
              onClick={() => setTab("list")}
              className={`flex-1 px-3 py-2 transition ${tab === "list" ? "bg-white/5 text-amber-200" : "text-neutral-400 hover:text-neutral-200"}`}
            >
              All suggestions
            </button>
          </div>

          <div className="overflow-y-auto p-3">
            {tab === "new" ? (
              <div className="flex flex-col gap-3">
                {/* Sign as */}
                <div>
                  <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-neutral-400">Sign as</label>
                  <div className="flex gap-1.5">
                    {AUTHORS.map((name) => (
                      <button
                        key={name}
                        onClick={() => setAuthor(name)}
                        className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-semibold transition ${
                          author === name
                            ? "border-amber-400 bg-amber-400 text-black"
                            : "border-white/10 bg-white/5 text-neutral-300 hover:border-white/20"
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-neutral-400">Idea</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="What would improve this view / layout?"
                    className="w-full resize-none rounded-md border border-white/10 bg-black/30 px-2.5 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-amber-400/60 focus:outline-none"
                  />
                </div>

                {/* Screenshot */}
                {!baseImage ? (
                  <button
                    onClick={capture}
                    disabled={capturing}
                    className="flex items-center justify-center gap-2 rounded-md border border-dashed border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-neutral-300 transition hover:border-amber-400/50 hover:text-amber-200 disabled:opacity-60"
                  >
                    {capturing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    {capturing ? "Capturing view…" : "Attach screenshot of this view (optional)"}
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* Markup toolbar */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setTool("pen")}
                        className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition ${tool === "pen" ? "bg-red-500/20 text-red-300" : "bg-white/5 text-neutral-300 hover:bg-white/10"}`}
                        title="Red pen"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Pen
                      </button>
                      <button
                        onClick={box ? () => setTool("box") : addBox}
                        className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition ${tool === "box" && box ? "bg-amber-400/20 text-amber-200" : "bg-white/5 text-neutral-300 hover:bg-white/10"}`}
                        title="Highlight box"
                      >
                        <Square className="h-3.5 w-3.5" /> {box ? "Box" : "Add box"}
                      </button>
                      <button
                        onClick={clearMarkup}
                        className="ml-auto flex items-center gap-1 rounded px-2 py-1 text-xs text-neutral-400 transition hover:bg-white/10 hover:text-white"
                        title="Clear markup"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Clear
                      </button>
                      <button
                        onClick={discardScreenshot}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-neutral-400 transition hover:bg-white/10 hover:text-white"
                        title="Remove screenshot"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Canvas + box overlay */}
                    <div className="relative overflow-hidden rounded-md border border-white/10" style={{ touchAction: "none" }}>
                      <canvas
                        ref={canvasRef}
                        width={baseImage.width}
                        height={baseImage.height}
                        onPointerDown={onCanvasPointerDown}
                        onPointerMove={onCanvasPointerMove}
                        onPointerUp={onCanvasPointerUp}
                        className="block w-full"
                        style={{ cursor: tool === "pen" ? "crosshair" : "default" }}
                      />
                      {box && (() => {
                        const s = boxOverlayStyle();
                        if (!s) return null;
                        return (
                          <div
                            style={{ ...s, background: "rgba(250,204,21,0.28)", border: "2px solid rgba(234,179,8,0.9)", touchAction: "none" }}
                            onPointerDown={onBoxPointerDown("move")}
                            onPointerMove={onBoxPointerMove}
                            onPointerUp={onBoxPointerUp}
                            className="cursor-move"
                          >
                            <div
                              onPointerDown={onBoxPointerDown("resize")}
                              onPointerMove={onBoxPointerMove}
                              onPointerUp={onBoxPointerUp}
                              className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 cursor-se-resize rounded-sm border border-black/40 bg-amber-400"
                            />
                          </div>
                        );
                      })()}
                    </div>
                    <p className="text-[10px] leading-tight text-neutral-500">
                      Draw with the red pen; the yellow box is translucent so text stays readable underneath. Drag it to move, pull the corner to resize.
                    </p>
                  </div>
                )}

                {error && <p className="text-xs text-red-400">{error}</p>}

                <button
                  onClick={submit}
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 rounded-md bg-amber-400 px-3 py-2 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Save suggestion
                </button>
              </div>
            ) : (
              // ── List tab ──
              <div className="flex flex-col gap-2">
                {/* Active / Archived switch */}
                <div className="flex items-center gap-1 rounded-lg bg-white/5 p-0.5 text-[11px] font-bold">
                  <button
                    onClick={() => setShowArchived(false)}
                    className={`flex-1 rounded px-2 py-1 transition ${!showArchived ? "bg-amber-400/20 text-amber-200" : "text-neutral-400 hover:text-neutral-200"}`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setShowArchived(true)}
                    className={`flex-1 rounded px-2 py-1 transition ${showArchived ? "bg-amber-400/20 text-amber-200" : "text-neutral-400 hover:text-neutral-200"}`}
                  >
                    Archived
                  </button>
                </div>
                {loadingList ? (
                  <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-amber-300" /></div>
                ) : items.length === 0 ? (
                  <p className="py-6 text-center text-xs text-neutral-500">{showArchived ? "Nothing archived." : "No suggestions yet."}</p>
                ) : (
                  items.map((it) => (
                    <div key={it.id} className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">{it.author}</span>
                        <span className="text-[10px] text-neutral-500">{new Date(it.createdAt).toLocaleString()}</span>
                        <button
                          onClick={() => setArchived(it.id, !it.archived)}
                          className="ml-auto rounded p-0.5 text-neutral-500 transition hover:bg-white/10 hover:text-amber-300"
                          title={it.archived ? "Restore" : "Archive"}
                        >
                          {it.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => remove(it.id)} className="rounded p-0.5 text-neutral-500 transition hover:bg-white/10 hover:text-red-400" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-neutral-200">{it.comment}</p>
                      <div className="mt-1 truncate text-[10px] text-neutral-500">{it.pageUrl}</div>
                      {it.screenshot && (
                        <button onClick={() => setPreview(it.screenshot)} className="mt-2 flex items-center gap-1 text-[11px] text-amber-300/80 hover:text-amber-200">
                          <ImageIcon className="h-3.5 w-3.5" /> View screenshot
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screenshot lightbox */}
      {preview && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-6"
          onClick={() => setPreview(null)}
        >
          <img src={preview} alt="suggestion screenshot" className="max-h-full max-w-full rounded-lg border border-white/20" />
        </div>
      )}
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(widget, document.body);
}
