# Gifty sprite engine

Turns Ludo sprite-pack zips into an animated, reactive mascot that transitions
between states without jump-cuts.

## Pipeline

```
public/gifty/*.zip                      ← raw Ludo packs (source of truth)
   │  node scripts/gifty/build-clips.mjs
   ▼
public/gifty/clips/<name>.png + clips.json   ← aligned 128px clip sheets + pose graph
   │  src/app/components/shared/gifty/
   ▼
<Gifty state="idle|wave|think|sleep|…" />     ← runtime component
```

### `build-clips.mjs`
Unzips each pack → extracts frames → **aligns** them (trim to alpha bbox, scale
to common height, center on 128px) → builds an **arm-weighted pose graph** →
designates the **idle hub** and each clip's **doorway frame** (the frame closest
to idle's rest pose) → bakes one horizontal sprite strip per clip + `clips.json`.

Alignment is the key step: raw packs are framed/scaled differently, so without it
no two clips share a neutral. Aligning collapses that and makes clean doorways
exist. The arm region is weighted 3× in the pose signature so the doorway picker
won't mistake a mid-wave frame for "neutral".

Config (clip names + idle hub) is at the top of the script — the idle hub is a
**manual creative call** (the auto-picker wrongly favors a calm-but-waving frame).

Re-run any time the source packs change. Requires `sharp` (devDependency) and
`unzip`.

### `build-bridges-rife.mjs` (phase 2 stub)
Will bake neural in-between frames (RIFE) for each clip↔idle doorway so the
engine can use `bridge="rife"` instead of `crossfade`, replacing the ghost
dissolve with real interpolated motion. See the file header for setup. Until
then the engine ships with crossfade.

## Runtime

- **`engine.ts`** — framework-agnostic clip player. Loops the current clip; on a
  state change routes through the idle hub (`current → idle → target`) so there's
  no jump-cut. Bridge strategy is pluggable (`crossfade` | `rife` | `cut`).
- **`Gifty.tsx`** — `<Gifty state size bridge />`. Renders frames via
  `background-position`, crossfades two layers during transitions, and honors
  `prefers-reduced-motion` (static idle rest pose).

Try it at **`/gifty-demo`**.

## Clip inventory

| clip | source | role |
|---|---|---|
| `idle` | 25f | hub — arm-down neutral |
| `wave`, `wave_hd`, `wave_hd2`, `cheer_hd` | 16–36f | greetings / cheer |
| `think` | 25f | hint / thinking |
| `sleep` | 36f | loading / idle-too-long |

Missing emotional states (`sad`, `celebrate`, `present`) need new packs — mint
via a hosted image-to-video API (fal.ai / Replicate, cheapest) or Ludo, then
drop the zip in `public/gifty/` and re-run `build-clips.mjs`.
