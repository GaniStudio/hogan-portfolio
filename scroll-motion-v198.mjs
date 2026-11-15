// A compact reader's position wins over decorative playback time.
const compact = matchMedia('(max-width:1099px), (pointer:coarse)');
const scenes = new Set();
let lastY = scrollY, lastTime = performance.now(), fastUntil = 0, raf = 0;
function check() {
  raf = 0;
  if (!compact.matches || document.body.classList.contains('case-open')) return;
  const header = document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0;
  for (const entry of scenes) {
    if (!entry.pending || !entry.root.getClientRects().length) continue;
    const rect = entry.root.getBoundingClientRect();
    if (rect.top <= header + 24 || (performance.now() < fastUntil && rect.top < innerHeight)) {
      entry.pending = false;
      entry.finish();
      entry.root.dataset.scrollCompletion = 'complete';
    }
  }
}
const schedule = () => { if (!raf) raf = requestAnimationFrame(check); };
export function watchScene(root, finish) {
  const entry = {root, finish, pending:true};
  scenes.add(entry);
  schedule(); // Catches scenes registered after the reader has already passed them.
  return () => { entry.pending = true; delete root.dataset.scrollCompletion; };
}
addEventListener('scroll', () => {
  const now = performance.now(), distance = Math.abs(scrollY - lastY), elapsed = now - lastTime;
  if (distance > innerHeight * .35 || (elapsed < 180 && distance > 32 && distance / Math.max(1, elapsed) > 1.2)) fastUntil = now + 350;
  lastY = scrollY; lastTime = now; schedule();
}, {passive:true});
addEventListener('resize', schedule, {passive:true});
compact.addEventListener('change', schedule);
