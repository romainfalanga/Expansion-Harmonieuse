import { CHAPTERS, clamp, frameAt, chapterPosition } from './scene-timeline.js';

const journey = document.querySelector('.journey');
if (journey) {
  const panels = Array.from(journey.querySelectorAll('.journey-panel'));
  const scenes = Array.from(journey.querySelectorAll('.journey-scene'));
  const sceneHost = journey.querySelector('.journey-scenes');
  const buttons = Array.from(journey.querySelectorAll('[data-go]'));
  const modeButton = journey.querySelector('.journey-mode');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const shortScreen = matchMedia('(max-height: 550px)');
  let preferred = false;
  try { preferred = localStorage.getItem('expansion-reading-mode') === 'simple'; } catch {}
  let reading = reduced.matches || shortScreen.matches || preferred;
  let activeIndex = 0;
  let progress = null;
  let raf = 0;
  let disposed = false;

  function setChapter(index) {
    activeIndex = index;
    panels.forEach((panel, i) => {
      const active = reading || i === index;
      panel.classList.toggle('is-active', active);
      panel.setAttribute('aria-hidden', String(!active));
      panel.inert = !active;
    });
    buttons.forEach((button, i) => {
      if (i === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    journey.dataset.chapter = String(index);
  }

  function render() {
    raf = 0;
    if (disposed) return;
    const rect = journey.getBoundingClientRect();
    const visible = rect.bottom > 90 && rect.top < innerHeight;
    document.body.classList.toggle('in-journey', visible);
    if (reading) {
      if (visible) {
        const middle = innerHeight * 0.48;
        const found = panels.findIndex(panel => {
          const box = panel.getBoundingClientRect();
          return box.top <= middle && box.bottom > middle;
        });
        if (found >= 0 && found !== activeIndex) setChapter(found);
      }
      return;
    }
    const target = clamp(-rect.top / Math.max(1, rect.height - innerHeight));
    if (progress === null || !visible) progress = target;
    else progress = Math.abs(target - progress) < 0.0003 ? target : progress + (target - progress) * 0.18;
    const frame = frameAt(progress);
    journey.style.setProperty('--journey-progress', String(progress));
    scenes.forEach((scene, index) => {
      const opacity = index === frame.index ? frame.blend : index === frame.index - 1 ? 1 - frame.blend : 0;
      const local = index === frame.index ? frame.local : 1;
      scene.style.opacity = String(opacity);
      scene.style.transform = 'translate3d(' + (-local * 1.4) + '%, ' + (-local * 0.5) + '%, 0) scale(' + (1.025 + local * 0.17) + ')';
    });
    if (frame.textIndex !== activeIndex) setChapter(frame.textIndex);
    if (visible && !document.hidden && Math.abs(target - progress) > 0.0003) schedule();
  }
  function schedule() { if (!raf && !disposed) raf = requestAnimationFrame(render); }

  function applyMode(next, preservePosition) {
    const previous = activeIndex;
    reading = next;
    scenes.forEach((scene, index) => {
      scene.setAttribute('aria-hidden', 'true');
      if (reading) panels[index].prepend(scene);
      else sceneHost.append(scene);
    });
    journey.classList.toggle('journey-reading', reading);
    journey.classList.toggle('is-enhanced', !reading);
    modeButton.textContent = reading ? 'Activer l’immersion' : 'Lecture simple';
    modeButton.setAttribute('aria-pressed', String(reading));
    progress = null;
    setChapter(previous);
    if (preservePosition) {
      requestAnimationFrame(() => {
        if (reading) panels[previous].scrollIntoView({ block: 'start', behavior: 'instant' });
        else {
          const rect = journey.getBoundingClientRect();
          scrollTo({ top: scrollY + rect.top + (rect.height - innerHeight) * chapterPosition(previous), behavior: 'instant' });
        }
        schedule();
      });
    }
    schedule();
  }
  modeButton.addEventListener('click', () => {
    const next = !reading;
    try { localStorage.setItem('expansion-reading-mode', next ? 'simple' : 'immersive'); } catch {}
    applyMode(next, true);
  });
  buttons.forEach(button => button.addEventListener('click', () => {
    const index = Number(button.dataset.go);
    if (reading) panels[index].scrollIntoView({ block: 'start', behavior: reduced.matches ? 'instant' : 'smooth' });
    else {
      const rect = journey.getBoundingClientRect();
      scrollTo({ top: scrollY + rect.top + (rect.height - innerHeight) * chapterPosition(index), behavior: reduced.matches ? 'instant' : 'smooth' });
    }
  }));
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => {
    if (shortScreen.matches && !reading) applyMode(true, true);
    schedule();
  }, { passive: true });
  reduced.addEventListener('change', event => { if (event.matches) applyMode(true, true); });
  document.addEventListener('visibilitychange', schedule);
  addEventListener('pagehide', event => {
    if (event.persisted) return;
    disposed = true;
    if (raf) cancelAnimationFrame(raf);
  });
  addEventListener('pageshow', event => {
    if (event.persisted) { disposed = false; schedule(); }
  });
  if (panels.length === CHAPTERS && scenes.length === CHAPTERS) applyMode(reading, false);
}
