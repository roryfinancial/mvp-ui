<!--
  PASTE-READY image prompts for generating Gifty. This is the AI-facing sister of
  gifty-character-guide.md (which is the human/spec reference — don't paste that
  one into an image tool; it renders the doc as a poster).

  HOW TO USE: copy ONE block below (between the lines), paste into the tool, go.
  Don't paste this comment or the headings.
-->

# Gifty — paste-ready image prompts

## ▶ Block A — for chat tools (ChatGPT, Gemini, Copilot)

Copy everything between the lines:

---
Generate an original cartoon mascot character (not a poster, no text anywhere in the image):

A cool, charismatic **gift-box** character with a big, confident personality — reads as a *he* or a gender-neutral buddy, NOT a girly/cute toy. The box body is a rounded cube in **vibrant blue**, bright enough to pop against a dark navy background. On top is a **small, bold, jaunty ribbon knot in gold with a pink accent** — chunky and characterful, not a big frilly bow. A **gold** ribbon wraps around the box in a cross. Big, highly **expressive eyes** with bold catchlights and a confident, friendly look. He has **longer poseable arms with little rounded hands** that can actually hold things — show him holding out a small wrapped present — and little feet.

Style: smooth, polished modern **3D cartoon** — soft shading, gentle glossy highlights, a premium collectible-vinyl-toy finish, strong rim light so he separates from a dark background. Energetic and fun, like a mascot for a mobile game or a sleek app. Centered, full body, plain light background.

Important: VIBRANT BLUE box (not navy-dark, not pink), small gold+pink ribbon knot (not a big pink bow), GOLD ribbon. No text, letters, words, titles, or labels anywhere. Not girly/Barbie, not vintage/retro, not realistic.
---

Then iterate by chatting, e.g.: *"keep this exact character, give it a transparent background"* … *"now the same character with its lid popped open and gold confetti + coins bursting out, eyes wide with joy"* … *"now looking a little sad next to an empty open box."*

---

## ▶ Block B — for prompt-box tools (Midjourney, Bing Image Creator, Leonardo, Recraft)

Copy this single line:

---
cool charismatic gift-box mascot with big personality, a vibrant blue gift-box body bright enough to pop against a dark navy background, a small bold jaunty gold-and-pink ribbon knot on top (not a big frilly bow), gold ribbon wrapping the box, big highly expressive eyes with bold catchlights and a confident friendly look, longer poseable arms with little rounded hands holding out a small wrapped present, little feet, smooth modern 3D cartoon, soft shading and glossy highlights, premium vinyl-toy finish, strong rim light, energetic and fun, gender-neutral, centered full body, plain light background
---

If the tool has a **negative / "avoid"** field, paste this:

---
big frilly bow, barbie, girly, overly feminine, pink box, heavy blush, text, letters, words, watermark, poster, vintage, retro, rubber-hose, realistic, photo, dull, low contrast, tiny useless stub arms, sharp edges
---

Midjourney users: add `--style raw --ar 1:1 --v 7` to the end of the line, and once you pick a favorite, lock the character on later poses with `--cref <image-url> --cw 100`.

---

## ▶ Pose set (run after you have a hero you like)

Reuse the **same character**, change only the action + expression:

- **idle:** "standing, gentle happy smile, bow perky" — the default.
- **pop / celebrate:** "lid popped open, gold confetti and coins bursting out, arms thrown up, eyes star-shaped with joy."
- **proud / level-up:** "confident smug-happy smile, a tiny gold crown floating above the bow."
- **wave / hello:** "one arm waving, warm smile, a friendly wink."
- **hint / thinking:** "bow cocked to one side, looking up, small 'hmm' mouth."
- **gentle / oops:** "bow drooped, soft worried eyes, wavy mouth — apologetic but still cute."
- **sad / empty:** "standing next to an empty open box, big glossy eyes, tiny frown — endearing, not depressing."
- **sleep / loading:** "eyes closed, tiny 'z z z', bow flopped, peaceful."

---

## ▶ Getting a transparent PNG

Most tools generate on a background. To cut it out for the app:
- Easiest free: generate on a **plain** background, then run it through **remove.bg** (free) → transparent PNG.
- Cleaner: do the final pass in **Recraft** ("vectorize, transparent background") → crisp SVG/PNG that scales.
- ChatGPT/Gemini: just ask *"give me this on a transparent background, PNG."*

---

## ▶ If the colors keep coming out wrong

Front-load and repeat the palette — say **"navy blue box, bright pink bow, gold ribbon"** at the *start* of the prompt and again at the end, and add the orange/yellow/mustard words to the negative field. Image models weight the first words most.
