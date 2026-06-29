# Gifty voice-over clips

Charming, silly mascot VO for in-app moments. Generated with **ElevenLabs**.

- **Voice:** `Gifty1` — `L7p5lrWm6hEO6wZhjrKZ` (pre-existing on the account; the
  on-brand Gifty voice). Listen and confirm the direction before deeper use.
- **Model:** `eleven_flash_v2_5` (cheapest).
- **Settings (LOCKED v2):** stability `0.5`, style `0.4` — the **A+D cadence**:
  A's punchy "Hey..." beat + D's breathy, casual, less-manic delivery. Pacing is
  controlled by punctuation in the line text (`...` = pause, `—` = short catch,
  `.` = full stop), not just settings.
- API key lives in `mvp-rust/.elevenlabs.env` (`ELEVENLABS_API_KEY`) — not in this repo.

## Clips → app moment  (current = v2, A+D cadence)

| File | Moment | Line |
|---|---|---|
| `01_welcome.mp3`   | first load / onboarding | "Hey... oh — hi! I'm Gifty. So... let's get this party started, yeah?" |
| `02_goal_set.mp3`  | creator sets a goal | "Ooh... a brand new goal? Heh — I love where this is going!" |
| `03_gift_in.mp3`   | gift received | "Wait... ka-ching! Somebody just sent you a gift. Eee!" |
| `04_milestone.mp3` | milestone unlocked | "Whoa... you did it! Milestone unlocked. I'm — I'm doing a happy dance, okay?" |
| `05_empty.mp3`     | empty state | "Hmm... it's a little quiet in here. So... let's go make some magic, yeah?" |
| `06_lowfees.mp3`   | tagline / marketing | "Fan gifts... teeny-tiny fees. That's the Rory way, baby!" |
| `all-catchphrases.mp3` | all six with spoken labels (review montage) | — |

## Notes
- Not yet wired into the app — these are assets for review. Wire later behind a
  user sound toggle (respect `prefers-reduced-motion` / a mute setting; never
  autoplay audio without consent).
- To re-render or push the voice a direction (squeakier / cozier / more mischief /
  a calmer "narrator Gifty" for long copy), regenerate against `Gifty1` with
  adjusted stability/style, or design a custom voice on a paid tier.
