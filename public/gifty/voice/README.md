# Gifty voice-over clips

Charming, silly mascot VO for in-app moments. Generated with **ElevenLabs**.

- **Voice:** `Gifty1` — `L7p5lrWm6hEO6wZhjrKZ` (pre-existing on the account; the
  on-brand Gifty voice). Listen and confirm the direction before deeper use.
- **Model:** `eleven_flash_v2_5` (cheapest; ~330 chars for all 6).
- **Settings:** stability `0.4`, style `0.55` (lively, expressive).
- API key lives in `mvp-rust/.elevenlabs.env` (`ELEVENLABS_API_KEY`) — not in this repo.

## Clips → app moment

| File | Moment | Line |
|---|---|---|
| `01_welcome.mp3`   | first load / onboarding | "Heyyy, you made it! I'm Gifty — let's get this party started!" |
| `02_goal_set.mp3`  | creator sets a goal | "Ooh, a brand new goal? I LOVE where this is going!" |
| `03_gift_in.mp3`   | gift received | "Ka-ching! Somebody just sent you a gift — eee!" |
| `04_milestone.mp3` | milestone unlocked | "You did it! Milestone unlocked — I'm doing a little happy dance!" |
| `05_empty.mp3`     | empty state | "It's a little quiet in here... let's go make some magic!" |
| `06_lowfees.mp3`   | tagline / marketing | "Fan gifts, teeny-tiny fees. That's the Rory way, baby!" |
| `all-catchphrases.mp3` | all six back-to-back (review montage) | — |

## Notes
- Not yet wired into the app — these are assets for review. Wire later behind a
  user sound toggle (respect `prefers-reduced-motion` / a mute setting; never
  autoplay audio without consent).
- To re-render or push the voice a direction (squeakier / cozier / more mischief /
  a calmer "narrator Gifty" for long copy), regenerate against `Gifty1` with
  adjusted stability/style, or design a custom voice on a paid tier.
