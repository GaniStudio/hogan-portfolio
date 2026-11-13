import { RING_RADIUS, RING_PERIOD_MS } from './agent-intro-timing.mjs';

// The arrow tip, not the bounding-box corner, lands on each target.
export function cursorHotspot(width = 20) {
  return { x: width * 66 / 360, y: width * 43 / 360 };
}

// Minimum-jerk easing: a hand starts slowly, speeds up, and settles without a hard stop.
export function minJerk(u) {
  const t = Math.max(0, Math.min(1, u));
  return t * t * t * (10 + t * (-15 + 6 * t));
}

// A slightly curved, eased approach. `u` is linear time; the position is eased.
export function approachPoints(from, to, bend = 60, samples = 14) {
  const dx = to.x - from.x, dy = to.y - from.y, len = Math.hypot(dx, dy) || 1;
  const ctrl = { x: (from.x + to.x) / 2 - dy / len * bend, y: (from.y + to.y) / 2 + dx / len * bend };
  return Array.from({ length: samples + 1 }, (_, k) => {
    const u = k / samples, s = minJerk(u), inv = 1 - s;
    return {
      u,
      x: inv * inv * from.x + 2 * inv * s * ctrl.x + s * s * to.x,
      y: inv * inv * from.y + 2 * inv * s * ctrl.y + s * s * to.y
    };
  });
}

// Slot on the closing orbit. All agents share one angular velocity, evenly spaced.
export function ringPoint(center, index, count, ms, radius = RING_RADIUS, period = RING_PERIOD_MS) {
  const angle = index * Math.PI * 2 / count + ms / period * Math.PI * 2;
  return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
}