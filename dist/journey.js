(() => {
  'use strict';
  const journey = document.querySelector('.journey');
  if (!journey) return;
  const panels = Array.from(journey.querySelectorAll('.journey-panel'));
  const buttons = Array.from(journey.querySelectorAll('[data-go]'));
  const modeButton = journey.querySelector('.journey-mode');
  const canvas = journey.querySelector('canvas');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const shortScreen = window.matchMedia('(max-height: 520px)');
  let storedSimple = false;
  try { storedSimple = localStorage.getItem('expansion-reading-mode') === 'simple'; } catch {}
  let reading = reduced.matches || shortScreen.matches || storedSimple;
  let activeIndex = 0;
  let progress = 0;
  let raf = 0;
  let world = null;
  let worldPromise = null;
  let disposed = false;
  const clamp = n => Math.max(0, Math.min(1, n));

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
    const visible = rect.bottom > 80 && rect.top < innerHeight;
    document.body.classList.toggle('in-journey', visible);
    if (reading) return;
    const distance = Math.max(1, rect.height - innerHeight);
    const target = clamp(-rect.top / distance);
    progress = Math.abs(target - progress) < 0.00025 ? target : progress + (target - progress) * 0.17;
    journey.style.setProperty('--journey-progress', String(progress));
    journey.style.setProperty('--portal-scale', String(1 + progress * 6));
    journey.style.setProperty('--portal-turn', String(progress * 55) + 'deg');
    setChapter(Math.min(panels.length - 1, Math.floor(progress * panels.length)));
    if (world && visible && !document.hidden) {
      try { world.update(progress, innerWidth < 721); }
      catch { journey.classList.remove('has-world'); journey.dataset.world = 'fallback'; world.dispose(); world = null; }
    }
    if (visible && Math.abs(target - progress) > 0.00025) schedule();
  }
  function schedule() { if (!raf && !disposed) raf = requestAnimationFrame(render); }

  function loadWorld() {
    if (worldPromise || reading || disposed) return;
    worldPromise = new Promise((resolve, reject) => {
      if (window.BABYLON) { resolve(); return; }
      const script = document.createElement('script');
      script.src = './assets/vendor/babylon.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    }).then(() => {
      if (disposed) return;
      world = window.ExpansionWorld.create(window.BABYLON, canvas);
      world.update(progress, innerWidth < 721);
      journey.dataset.world = 'ready';
      journey.classList.add('has-world');
      schedule();
    }).catch(() => {
      journey.dataset.world = 'fallback';
      journey.classList.remove('has-world');
    });
  }

  function applyMode(next, preservePosition) {
    const previousChapter = activeIndex;
    reading = next;
    journey.classList.toggle('journey-reading', reading);
    journey.classList.toggle('is-enhanced', !reading);
    modeButton.textContent = reading ? 'Activer l’immersion' : 'Lecture simple';
    modeButton.setAttribute('aria-pressed', String(reading));
    setChapter(previousChapter);
    if (preservePosition) {
      requestAnimationFrame(() => {
        if (reading) panels[previousChapter].scrollIntoView({ block: 'start', behavior: 'instant' });
        else {
          const r = journey.getBoundingClientRect();
          window.scrollTo({ top: scrollY + r.top + (r.height - innerHeight) * Math.min(0.99, previousChapter / panels.length + 0.04), behavior: 'instant' });
        }
        schedule();
      });
    }
    if (!reading) {
      loadWorld();
      if (world) requestAnimationFrame(() => { world.resize(); schedule(); });
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
    if (reading) { panels[index].scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const r = journey.getBoundingClientRect();
    const p = index === 0 ? 0 : index / panels.length + 0.065;
    window.scrollTo({ top: scrollY + r.top + (r.height - innerHeight) * p, behavior: reduced.matches ? 'instant' : 'smooth' });
  }));
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => {
    if (world) world.resize();
    if (shortScreen.matches && !reading) applyMode(true, true);
    schedule();
  }, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  reduced.addEventListener('change', event => { if (event.matches) applyMode(true, true); });
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    disposed = true;
    if (raf) cancelAnimationFrame(raf);
    if (world) world.dispose();
  });
  applyMode(reading, false);
})();
