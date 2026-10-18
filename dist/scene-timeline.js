export const CHAPTERS = 4;
export const clamp = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
export function frameAt(value) {
  const progress = clamp(value);
  const index = Math.min(CHAPTERS - 1, Math.floor(progress * CHAPTERS));
  const local = clamp(progress * CHAPTERS - index);
  const t = clamp(local / 0.18);
  const blend = index === 0 ? 1 : t * t * (3 - 2 * t);
  return { index, local, blend, textIndex: index > 0 && blend < 0.5 ? index - 1 : index };
}
export function chapterPosition(index) {
  return index <= 0 ? 0 : Math.min(0.98, index / CHAPTERS + 0.055);
}
