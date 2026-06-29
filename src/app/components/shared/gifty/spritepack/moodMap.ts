/** Maps a mood to the baked face frame keys (eyes + resting mouth).
 *  Keys must exist in the pack: eyes ∈ {normal,smug,happy}; mouths ∈ {smile,shy,proud,hmm,talk_*}. */
export type Face = { eyes: string; mouth: string };

const TABLE: Record<string, Face> = {
  normal:   { eyes: "normal", mouth: "smile" },
  happy:    { eyes: "happy",  mouth: "smile" },
  smug:     { eyes: "smug",   mouth: "hmm" },
  proud:    { eyes: "normal", mouth: "proud" },
  shy:      { eyes: "normal", mouth: "shy" },
  thinking: { eyes: "normal", mouth: "hmm" },
  puppy:    { eyes: "happy",  mouth: "shy" },
};

export function moodToFace(mood: string): Face {
  return TABLE[mood] ?? { eyes: "normal", mouth: "smile" };
}
