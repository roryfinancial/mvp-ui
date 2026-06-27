# Gifty — Character Design Guide

> The mascot for Rory. This guide exists so anyone (or any AI image tool) can
> produce **on-model, consistent** Gifty art — and so the *look* drives the
> *voice*. Read §8 before writing a single line of Gifty's dialogue.

---

## ✅ LOCKED DIRECTION (v2 — canonical)

> Canonical hero render: **`docs/design/gifty/gifty-hero.png`**. Where the
> sections below differ from this, **this wins** (the design evolved during
> generation):
>
> - **Style:** clean **flat vector** cartoon (Duolingo-ish) — bold shapes, crisp
>   linework, smooth flat-with-soft-gradient shading. *Not* hyperreal 3D vinyl
>   (that read uncanny and was too detailed to animate cheaply).
> - **Body:** **vibrant blue** (bright enough to pop on the dark navy UI — solves
>   the contrast problem). Not deep-navy.
> - **Ribbon + bow:** **pink** with a **gold** center knot + gold trim → full
>   blue + pink + gold brand palette. *Not* a big frilly glossy pink bow (read
>   girly/Barbie).
> - **Limbs:** **longer arms with real little hands** that hold/present a gift,
>   sturdy short legs. *Not* tiny useless stubs.
> - **Read:** confident, warm, eager, **he / gender-neutral**, big personality.
>   *Not* cute-girly, *not* smug/sly, *not* goofy-generic.
> - **Pipeline used:** Bing "Versatile expression" (image-input edits to iterate).
>   For the pose set, feed `gifty-hero.png` back as the reference.

---

## 1. Essence (one line)

**Gifty is a chunky little gift box whose whole purpose is to give away what's
inside.** It's not about Gifty — it's about *you* and the creators you support.
Generous, earnest, easily delighted, a tiny showman. The opposite of a slick
casino chip: humble cardboard with a heart of confetti.

Three words: **generous · earnest · playful.**

---

## 2. Silhouette & form principles

Gifty must read instantly at **24px** (top-bar/nav) and hold up at **240px+**
(empty states, onboarding, gift-success). So:

- **One dominant shape:** a rounded cube (the box) topped by a bow. If you
  squint and see only the silhouette, you should still know it's a present.
- **No fiddly detail.** Cuteness comes from proportion, not ornament.
- **Everything rounded.** Soft corners on the box, pillowy bow — matches the new
  rounded/chunky UI. Zero sharp edges (Gifty would never live in the old
  brutalist square world).
- **Front-facing, slightly 3/4** by default so both eyes and a bit of the box
  top read.

---

## 3. Anatomy

```
        ╭──╮   ╭──╮         ← BOW (pink, glossy) = doubles as eyebrows
         ╰╮ ╲ ╱ ╭╯              tilts/droops/perks to emote
          ╰──┬──╯
        ╭────┴─────╮  ← LID (separate piece; pops up for confetti moment)
       ╱            ╲     inside-lid glows warm gold
      │   ◍      ◍   │  ← EYES: big, round, white, navy pupil, bright catchlight
      │      ‿       │  ← MOUTH: simple, expressive
      │   ·       ·  │  ← CHEEKS: soft pink blush
       ╲___________╱
        │ │     │ │   ← ARMS/HANDS: tiny stubby nubs (mitten hands, no fingers)
        ╰─╯     ╰─╯   ← FEET: little nubs, OR Gifty floats/hovers slightly
   ──────────────────── ← GOLD ribbon cross wraps the box (vertical + horizontal)
```

Named parts (these are the **rig points** for animation later):
- **Bow** — primary emoter (eyebrow surrogate). Perks (happy), droops (sad),
  cocks to one side (cheeky/thinking), spins (excited).
- **Lid** — pops open on gift-success → gold light + coins/confetti spill out.
- **Eyes** — big, wet-look, single bright catchlight. Blink, widen, squint,
  star-shaped on big wins, spiral on dizzy/error.
- **Mouth** — small, simple, high range (open grin, soft smile, "o" surprise,
  wavy worry).
- **Arms** — tiny, for waving, fist-pump, holding a coin/gift.
- **Ribbon cross** — gold; structural, mostly static.

---

## 4. Proportions (the cuteness math)

Baby-schema cuteness = **big eyes, big head-mass, tiny limbs.**

- Box (head+body fused) = **~70%** of total height.
- Bow = **~45–55%** of box width, sits like a proud little crown.
- Eyes = **each ~25–30%** of the box's front face; spaced wide; low-ish on the
  face (lower = cuter/younger).
- Arms/feet = deliberately **too small** — endearing, slightly underdog.
- Overall bounding box ~**1:1 to 1:1.15** (almost square, very stable, huggable).

---

## 5. Color & material

Gifty literally **wears the brand palette** — it's a walking color-key:

| Part | Color | Token |
|---|---|---|
| Box body | deep navy, lighter on the top face | `--surface` / `--surface-2` |
| Bow | **brand pink** | `--accent` |
| Ribbon cross | gold | `--gold` |
| Inside-lid glow / spill | warm gold | `--gold` |
| Eyes | white + navy pupil + white catchlight | `--text` / `--bg` |
| Cheeks | soft pink blush | `--accent` @ ~25% |
| Rim light | subtle pink/blue neon edge (pops on dark bg) | accent + info |

**Material/finish:** soft-matte box with a **gentle glossy highlight** and a
single top light — that dimensional, slightly glossy Rainbet feel, *not* flat.
Soft contact shadow under it. A faint pink rim-light so Gifty separates from the
navy UI. Think "premium vinyl toy," not "flat sticker," not "realistic cardboard."

---

## 6. Expression system

Two emoters do 90% of the work: **the bow (eyebrows)** and **the eyes/mouth.**
Map states → faces (this is also the animation state list):

| State | Bow | Eyes | Mouth | Reads as |
|---|---|---|---|---|
| **idle** | gentle bob | blink occasionally | soft smile | content, present |
| **pop / celebrate** | flung up, spinning | star-shaped/wide | open grin | pure joy |
| **proud / league-up** | perked, tiny gold crown above | confident, half-closed | smug-happy | "we did it" |
| **wave / onboarding** | tilted friendly | warm, one wink | open smile | welcoming |
| **hint / thinking** | cocked to one side | looking up | small "hmm" | helpful, curious |
| **gentle / error** | drooped | soft, worried | wavy line | "it's okay, retry" |
| **sad / empty** | flat/drooped | big, glossy | tiny frown | endearing, not depressing |
| **sleep / loading** | flopped | closed (z z z) | tiny "o" | calm waiting |

Rule: **even "sad" stays cute and warm — never genuinely upset or guilt-tripping.**

---

## 7. Pose/state set the app needs (art deliverables)

Minimum viable set, transparent PNG (and/or Rive-rigged):
`idle`, `pop`, `proud`, `wave`, `hint`, `gentle`, `sad`, `sleep`.
Nice-to-have: `holding-coin`, `holding-gift`, `peek` (half in from a corner),
`thumbs-up`, `dizzy`.

---

## 8. ⭐ Personality derived from form (look → voice)

**This is the bridge. Gifty sounds the way it looks.**

| Visual choice | Therefore the voice is… |
|---|---|
| **It's a box that gives away its contents** | generous, selfless — hypes *you* and the creator, never itself |
| **Big earnest open eyes** | sincere, excitable, emotionally transparent — *not* sarcastic-cool or deadpan |
| **The bow = a little flourish/showmanship** | playful, mild theatrical wink ("*tips hat*", "*confetti everywhere*") |
| **Humble cardboard everyman** | down-to-earth, never corporate, never above you — beside you |
| **Tiny underdog limbs, tries hard** | encouraging, warm, *never* condescending or naggy |
| **Bouncy squash-and-stretch energy** | upbeat, exclamation-friendly — but brief (1–2 lines), never manic |

**Voice in one sentence:** *an earnest, generous hype-buddy who celebrates your
generosity with little theatrical flourishes — and knows when to be quiet.*

What it is **not** (because of the look): not snarky, not a guilt-trip (looking
at you, Duo), not slick/salesy, not pushy about money. A box can't pressure you
to spend — it just gets happy when good things happen.

Quick voice check — if a line sounds like a **casino upsell** or a **passive-
aggressive streak threat**, it's off-model. Rewrite warmer.

---

## 9. Do / Don't (keep it on-model)

**Do:** rounded, chunky, big-eyed, glossy-soft, navy+pink+gold, one clear
silhouette, expressive bow, warm even when sad.

**Don't:** sharp corners, creepy, off-palette/neon-overload, human-like proportions, drop-shadow
text.

---

## 10. Technical art specs

- **Transparent PNG** + ideally **SVG/vector** (Recraft) for crisp scaling.
- Export at **24, 48, 96, 192, 512px**; verify the silhouette still reads at 24.
- Single top light source; soft contact shadow baked separately (so the UI can
  drop it on light vs dark).
- Consistent style across all poses (same line treatment, same shading, same
  palette) — consistency matters more than any single render's polish.
- Keep a **safe margin** (~8%) so the bow/limbs never clip in a circular avatar
  frame.

---

## 11. AI generation prompts

**Pipeline:** Midjourney v7 for the hero + poses (character-locked via `--cref`)
→ knock out background / vectorize in **Recraft V3** (transparent, scalable) →
optionally train a **Scenario.gg** model on the best renders for unlimited
on-model poses → rig in **Rive** for animation.

**Midjourney v7 — hero:**
```
chibi app mascot, a cute chunky gift-box character, soft rounded navy-blue box
body, big glossy pink ribbon bow on top, gold ribbon cross wrapping the box,
huge expressive round eyes with bright white catchlights, soft pink cheek blush,
tiny stubby mitten arms, happy friendly expression, smooth modern vector
illustration with soft 3D shading and glossy highlights, subtle pink rim light,
premium vinyl-toy look, centered, plain light-grey background, clean app mascot,
playful and trustworthy --style raw --ar 1:1 --v 7
--no text, watermark, realistic, photoreal, scary, sharp edges, clutter, busy
details, human proportions,
```

**Poses (after picking a hero):** reuse the hero as a character reference and
swap only the action/expression:
```
[same description] , <ACTION>, <EXPRESSION from §6> --cref <hero_image_url>
--cw 100 --style raw --ar 1:1 --v 7
```
e.g. ACTION = "lid popped open, gold confetti and coins bursting out, arms up";
EXPRESSION = "star-shaped eyes, open grin, bow flung upward."

**Recraft V3:** import hero → "make vector, transparent background, consistent
flat-with-soft-gradient style" → export SVG + PNGs at the spec sizes.

**Scenario.gg (for scale/consistency):** train a model on 10–20 best on-model
renders, then prompt each pose from §7 — yields a coherent set without re-rolling
the look every time.

---

## 12. Animation hooks (Rive, later)

Rig as a **state machine** with inputs that map 1:1 to app events:
- Inputs: `idle` (default loop: gentle bob + occasional blink), `pop` (trigger),
  `proud`, `wave`, `hint`, `gentle`, `sad`, `sleep`.
- Moving parts: **lid** (hinge, for pop), **bow** (the emoter), **eyes** (blink,
  widen, star), **mouth** (morph), **body** (squash/stretch bounce), **arms**
  (wave/pump). Confetti + coins are a particle burst layered on `pop`.
- Keep the runtime tiny; Gifty should idle at near-zero cost and only spend on
  triggered moments. Respect `prefers-reduced-motion` → fall back to a static
  pose per state.

---

## 13. TL;DR for the artist / generator

A huggable navy gift box with a big glossy **pink** bow, **gold** ribbon, and
giant earnest eyes. Chunky, rounded, premium-vinyl-toy finish on a dark UI. It
**pops open into confetti** when you gift. Because it's a humble box that exists
to give, it *talks* generous, earnest, and playful — celebrating you, never
pressuring you.
