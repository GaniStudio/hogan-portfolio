const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const chapters = [...document.querySelectorAll('[data-v139-chapter]')];
const prose = [...document.querySelectorAll('.v139-preface,.v139-results,#reading,#ai-workflow,#vision,#motivation')];
const sheet = document.querySelector('.v139-sheet-scroll');
const story = sheet?.closest('.v139-preface');
let frame = 0;
const clamp = x => Math.min(1, Math.max(0, x));

function render() {
  frame = 0;
  for (const chapter of chapters) {
    const heading=chapter.querySelector(':scope > .words-feature-heading,:scope > .service-static > .words-feature-heading');
    if(heading){
      const rect=heading.getBoundingClientRect();
      const visibility=reduced.matches?1:Math.min(clamp((innerHeight-rect.top)/(innerHeight*.3)),clamp(rect.bottom/(innerHeight*.18)));
      heading.style.opacity=String(.25+visibility*.75);
      heading.style.filter=reduced.matches||innerWidth<700?'none':`blur(${(1-visibility)*6}px)`;
    }
    const track = chapter.querySelector('.words-scroll-track,.service-scroll-track');
    const stage = track?.querySelector('.words-scroll-stage,.service-scroll-stage');
    if (!stage) continue;
    const box = track.getBoundingClientRect();
    const entry = clamp((innerHeight - box.top) / Math.max(1, innerHeight * .55));
    const exit = clamp(box.bottom / Math.max(1, innerHeight * .65));
    const visibility = reduced.matches ? 1 : Math.min(entry, exit);
    stage.style.opacity = String(.25 + visibility * .75);
    stage.style.filter = reduced.matches || innerWidth < 700 ? 'none' : `blur(${(1 - visibility) * 6}px)`;
    // Keep transforms off the sticky ancestor so the wheel geometry is stable.
    const window = stage.querySelector('.demo-window');
    if (window) window.style.scale = reduced.matches ? '1' : String(.97 + visibility * .03);
  }
  for (const block of prose) {
    const box = block.getBoundingClientRect();
    const entry = clamp((innerHeight - box.top) / Math.max(1, innerHeight * .4));
    const exit = clamp(box.bottom / Math.max(1, innerHeight * .35));
    block.style.opacity = reduced.matches ? '1' : String(.5 + Math.min(entry, exit) * .5);
  }
  if (sheet && story && !reduced.matches) {
    const box = story.getBoundingClientRect();
    const fraction = clamp((innerHeight * .75 - box.top) / Math.max(innerHeight, box.height));
    sheet.scrollLeft = (sheet.scrollWidth - sheet.clientWidth) * fraction;
  }
}
function schedule() { if (!frame) frame = requestAnimationFrame(render); }
addEventListener('scroll', schedule, {passive: true});
addEventListener('resize', schedule, {passive: true});
reduced.addEventListener('change', schedule);
schedule();
