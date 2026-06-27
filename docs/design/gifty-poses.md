<!--
  Paste-ready POSE prompts for building Gifty's consistent pose library.
  WORKFLOW:
   1. In Gemini, ATTACH docs/design/gifty/gifty-hero.png every time.
   2. Paste ONE numbered prompt below, generate. (One pose per generation =
      best consistency; a multi-pose sheet drifts more — sheet prompt is at the
      bottom if you want it anyway.)
   3. Drop each result into Recraft → "vectorize, transparent background, keep
      flat-vector style" → export SVG + PNG (24/48/96/192/512px).
   4. Name files by state so they map to <Gifty state="..."> — see §Naming.
-->

# Gifty — pose library prompts

**Each prompt already includes the consistency lock.** Attach the hero image,
paste one, go.

---

**1 — idle** (default)
> Same character as the attached image — keep Gifty's exact design (vibrant-blue box, pink + gold ribbon and bow, big friendly eyes, clean flat-vector style) identical; change ONLY the pose. Full body, centered, plain light-grey background, no text. Pose: standing relaxed and content, arms at his sides, a warm gentle smile.

**2 — wave** (onboarding / hello)
> Same character as the attached image — keep his exact design, colors, and flat-vector style identical; change only the pose. Full body, centered, plain light-grey background, no text. Pose: waving one hand hello, warm welcoming smile, a friendly little head tilt.

**3 — present-gift** (the signature)
> Same character as the attached image — identical design, colors, flat-vector style. Full body, centered, plain light-grey background, no text. Pose: leaning slightly forward, holding out a small wrapped present in both hands toward the viewer, eyes bright and eager, big warm "here — this is for you!" smile.

**4 — pop / celebrate** (gift sent)
> Same character as the attached image — identical design, colors, flat-vector style. Full body, centered, plain light-grey background, no text. Pose: pure joy — his lid popped open with gold confetti and gold coins bursting out of the top, both arms thrown up, eyes wide and sparkling, biggest happy open grin.

**5 — proud / level-up**
> Same character as the attached image — identical design, colors, flat-vector style. Full body, centered, plain light-grey background, no text. Pose: confident and proud, one fist raised, a small gold crown floating just above his bow, a pleased smug-happy smile.

**6 — thumbs-up / cheer**
> Same character as the attached image — identical design, colors, flat-vector style. Full body, centered, plain light-grey background, no text. Pose: giving an enthusiastic thumbs-up with one hand, big encouraging grin, bright eyes.

**7 — thinking / hint**
> Same character as the attached image — identical design, colors, flat-vector style. Full body, centered, plain light-grey background, no text. Pose: curious and helpful — head tilted, one hand up near his chin, looking up with a small thoughtful "hmm" mouth, a tiny glowing lightbulb floating above his bow.

**8 — oops / gentle** (errors)
> Same character as the attached image — identical design, colors, flat-vector style. Full body, centered, plain light-grey background, no text. Pose: sheepish and apologetic, one hand rubbing the back of his head, a small awkward smile, his bow drooped just a little — "my bad, let's try again."

**9 — sad / empty** (empty states)
> Same character as the attached image — identical design, colors, flat-vector style. Full body, centered, plain light-grey background, no text. Pose: standing next to a small empty open gift box, big glossy eyes and a tiny frown — endearing and cute, not depressing.

**10 — sleep / loading**
> Same character as the attached image — identical design, colors, flat-vector style. Full body, centered, plain light-grey background, no text. Pose: peaceful, eyes closed, a small tilt, with tiny "z z z" letters floating above him — calmly waiting.

---

## Bonus — "holding different stuff" variants

**11 — holding a coin** (wallet / deposit / reward)
> Same character as the attached image — identical design, colors, flat-vector style. Full body, centered, plain light-grey background, no text. Pose: holding up a single big shiny gold coin in one hand, presenting it with a happy smile.

**12 — holding a trophy** (leaderboard / rank)
> Same character as the attached image — identical design, colors, flat-vector style. Full body, centered, plain light-grey background, no text. Pose: holding up a small gold trophy with both hands, proud and celebrating.

> Swap the held object freely with the same template: "holding up a [gold star /
> flame streak icon / heart / envelope / shopping bag]…"

---

## Optional — single sprite-sheet prompt (lower consistency per cell)

> Same character as the attached image — identical design, colors, and flat-vector style. Create a clean 3x3 grid sheet of Gifty in nine poses on a plain light-grey background, no text: 1 idle, 2 waving, 3 presenting a gift, 4 lid popped with confetti, 5 proud with a small gold crown, 6 thumbs-up, 7 thinking with a lightbulb, 8 sad beside an empty box, 9 sleeping with "z z z". Keep him perfectly consistent across all nine.

(Do individual prompts if you can — each cell is higher-res and stays more
on-model. The sheet is just for a quick overview.)

---

## Recraft step

For each generated pose: upload → **"vectorize, transparent background, keep the
flat-vector cartoon style, clean shapes"** → export **SVG** (master) + **PNG** at
24, 48, 96, 192, 512px. Check the silhouette still reads at 24px.

## Naming (maps to `<Gifty state="..." />`)

```
gifty-idle      gifty-wave      gifty-present   gifty-pop
gifty-proud     gifty-thumbsup  gifty-hint      gifty-oops
gifty-sad       gifty-sleep     gifty-coin      gifty-trophy
```
Drop them in `src/app/components/shared/gifty/` (or `public/gifty/`) when we
wire the component.
