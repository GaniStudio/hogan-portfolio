// v114: cursors go straight to work so the name is readable within a second.
// The orbit no longer opens the intro; it closes it, circling the visitor's pointer.
export const DRAG_MS = 380;
// After the box is drawn, the arrow glides to where typing starts instead of jumping there.
export const GLIDE_MS = 150;
export const HOLD_MS = 140;
export const TRAVEL_TO_RING_MS = 520;
export const ORBIT_END_MS = 3000;
export const EXIT_MS = 360;
export const RING_RADIUS = 46;
export const RING_PERIOD_MS = 1600;

// Reading order: label, name, headline, two paragraphs, "해온 일", three roles, next link.
// Right-column agents start alongside the left column, so several parts build at once.
const offsets = [0, 70, 160, 250, 340, 110, 200, 290, 380, 500];

export function agentTiming(index) {
  const offset = offsets[index % offsets.length];
  const box = 300 + offset;
  const cursor = Math.max(0, box - 420);
  return { cursor, box, reveal: box + DRAG_MS, offset };
}

export function typingStep(count) {
  return count > 1 ? Math.min(65, 900 / (count - 1)) : 0;
}

export function typingEnd(index, count) {
  const t = agentTiming(index);
  return t.reveal + (count > 1 ? (count - 1) * typingStep(count) : 0);
}

export function introEnd() {
  return ORBIT_END_MS + EXIT_MS;
}