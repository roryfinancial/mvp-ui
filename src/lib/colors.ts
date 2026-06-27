// Colors referenced from JS / inline styles, where a Tailwind utility class
// can't be used (e.g. array-indexed rank colors). Values are CSS custom-property
// references, so src/styles/theme.css stays the single source of truth — these
// resolve to --medal-gold / --medal-silver / --medal-bronze at render time.
export const RANK_COLORS = [
  "var(--medal-gold)",
  "var(--medal-silver)",
  "var(--medal-bronze)",
] as const;

/** Rank (1-based) → medal color var, or null past 3rd place. */
export function rankColor(rank: number): string | null {
  return rank >= 1 && rank <= 3 ? RANK_COLORS[rank - 1] : null;
}
