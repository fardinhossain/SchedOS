/**
 * Process colour assignment.
 *
 * Ten hues drawn from the lab palette, all warm/earth/green — no blue-primary,
 * no purple. Colour is assigned by the process's position in the table so it
 * stays stable across the Gantt chart, ready queue, metrics table and charts.
 *
 * Colour is never the ONLY carrier of meaning: every process chip also shows
 * its PID, and state is additionally encoded by icon, border and label
 * (spec §27).
 */
export const PROCESS_COLORS = [
  '#58C472', // CRT green
  '#FF7043', // signal orange
  '#E5B93F', // machine yellow
  '#39A0A8', // electric teal
  '#C0563C', // brick
  '#7E9B3D', // olive
  '#D9962B', // amber
  '#2F7D6B', // pine
  '#A8663A', // bronze
  '#94A66B', // sage
] as const;

export function colorForIndex(index: number): string {
  return PROCESS_COLORS[index % PROCESS_COLORS.length];
}

/** Builds a stable pid -> colour map from the ordered process id list. */
export function buildColorMap(ids: string[]): Record<string, string> {
  return ids.reduce<Record<string, string>>((acc, id, i) => {
    acc[id] = colorForIndex(i);
    return acc;
  }, {});
}

/**
 * Chooses black or white text for a given background, using perceived
 * luminance so labels stay legible on every palette entry.
 */
export function textOn(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#171717' : '#F3F0E7';
}
