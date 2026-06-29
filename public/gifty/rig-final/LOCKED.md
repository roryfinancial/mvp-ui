# 🔒 rig-final — LOCKED canonical Gifty parts

This is the **source of truth** for the layered Gifty rig. The runtime loads from
here and `npm run rig:compress` bakes the web atlas from here.

**DO NOT let automated tools overwrite these files.** Specifically:
- `bake-rig.mjs` is disabled and must never write here.
- Seasonal items / costumes must go in `public/gifty/rig-overlays/<theme>/` and be
  composed ON TOP at runtime — never edited into these base parts.
- Hand cleanup/touch-ups go through the parts clipper (`scripts/gifty/part-editor/`),
  which writes here intentionally and backs up first.

Confirmed/finished as of this commit. Edit deliberately, never by pipeline default.
