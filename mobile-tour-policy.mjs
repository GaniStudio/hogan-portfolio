// Compact screens use native page panning. Distances are CSS pixels, not time.
export function mobileTourPolicy(service, width, height, coarse = false) {
  if (width >= 1100 && !coarse) return null;
  const unit = Math.max(260, Math.min(360, height * .38));
  const profiles = {
    words: {steps:[0, .20, .50, .85], range:unit * 4},
    'student-db': {steps:[0, .10, .23, .41, .59, .77, .91], range:unit * 7},
    lms: {steps:[0, .12, .24, .64, .80, .91], range:unit * 8}
  };
  const value = profiles[service];
  return value ? {...value, range:Math.round(value.range)} : null;
}

export function tourPosition(progress, steps) {
  const p = Math.max(0, Math.min(1, progress));
  const index = Math.max(0, steps.findLastIndex(start => p >= start));
  const fraction = Math.max(0, Math.min(1, (p - steps[index]) / ((steps[index + 1] ?? 1) - steps[index])));
  return {index, fraction};
}
