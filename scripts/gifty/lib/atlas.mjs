// Pure geometry helpers for the rig compressor — no I/O, no sharp.

/** Convert a pixel bbox {x,y,w,h} to 0..1 fractions of a square `canvas`. */
export function placeBox(bbox, canvas) {
  return {
    x: bbox.x / canvas,
    y: bbox.y / canvas,
    w: bbox.w / canvas,
    h: bbox.h / canvas,
  };
}

/**
 * Shelf/row pack items into an atlas.
 * items: [{ name, w, h }] in pixels. Returns { width, height, placements }.
 * placements: [{ name, sx, sy, sw, sh }].
 */
export function shelfPack(items, opts = {}) {
  const padding = opts.padding ?? 2;
  const maxWidth = opts.maxWidth ?? 2048;
  const sorted = [...items].sort((a, b) => b.h - a.h);
  const placements = [];
  let shelfX = 0;
  let shelfY = 0;
  let shelfH = 0;
  let width = 0;
  for (const it of sorted) {
    if (shelfX > 0 && shelfX + it.w > maxWidth) {
      // wrap to a new shelf
      shelfY += shelfH + padding;
      shelfX = 0;
      shelfH = 0;
    }
    placements.push({ name: it.name, sx: shelfX, sy: shelfY, sw: it.w, sh: it.h });
    shelfX += it.w + padding;
    shelfH = Math.max(shelfH, it.h);
    width = Math.max(width, shelfX - padding);
  }
  return { width, height: shelfY + shelfH, placements };
}
