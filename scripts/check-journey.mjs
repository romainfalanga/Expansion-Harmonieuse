import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { frameAt, chapterPosition, CHAPTERS, clamp } from '../dist/scene-timeline.js';

const source = (await readFile(new URL('../dist/journey.js', import.meta.url), 'utf8')).replace(/^import[^\n]+\n/, '');
function setup(reducedMotion = false) {
  const queue = new Map();
  const events = new Map();
  let nextId = 0;
  let context;
  class Element {
    constructor() {
      this.attrs = new Map(); this.handlers = new Map(); this.style = { setProperty() {} };
      const classes = new Set();
      this.classList = { toggle(name, value) { if (value) classes.add(name); else classes.delete(name); }, contains: name => classes.has(name) };
    }
    addEventListener(name, fn) { this.handlers.set(name, fn); }
    setAttribute(name, value) { this.attrs.set(name, value); }
    removeAttribute(name) { this.attrs.delete(name); }
    append(child) { child.parent = this; }
    prepend(child) { child.parent = this; }
    click() { this.handlers.get('click')?.({ target: this }); }
  }
  const journey = new Element(); journey.dataset = {};
  const panels = Array.from({ length: 4 }, () => new Element());
  const scenes = Array.from({ length: 4 }, () => new Element());
  const buttons = Array.from({ length: 4 }, (_, i) => { const e = new Element(); e.dataset = { go: String(i) }; return e; });
  const host = new Element(); const mode = new Element();
  journey.querySelectorAll = selector => selector === '.journey-panel' ? panels : selector === '.journey-scene' ? scenes : buttons;
  journey.querySelector = selector => selector === '.journey-scenes' ? host : mode;
  journey.getBoundingClientRect = () => { const height = context.innerHeight * (journey.classList.contains('journey-reading') ? 3.2 : 5.2); return { top: -context.scrollY, bottom: height - context.scrollY, height }; };
  panels.forEach((panel, i) => {
    panel.getBoundingClientRect = () => ({ top: i * 600 - context.scrollY, bottom: (i + 1) * 600 - context.scrollY });
    panel.scrollIntoView = () => { context.scrollY = i * 600; events.get('scroll')?.(); };
  });
  const reduced = { matches: reducedMotion, addEventListener(name, fn) { this.change = fn; } };
  const short = { matches: false, addEventListener() {} };
  const body = new Element();
  context = {
    CHAPTERS, frameAt, chapterPosition, clamp,
    document: { querySelector: () => journey, body, hidden: false, addEventListener(name, fn) { events.set(name, fn); } },
    matchMedia: query => query.includes('reduced-motion') ? reduced : short,
    innerHeight: 750, scrollY: 0,
    localStorage: { getItem: () => null, setItem() {} },
    requestAnimationFrame(fn) { const id = ++nextId; queue.set(id, fn); return id; },
    cancelAnimationFrame(id) { queue.delete(id); },
    addEventListener(name, fn) { events.set(name, fn); },
    scrollTo({ top }) { context.scrollY = top; events.get('scroll')?.(); }
  };
  vm.runInNewContext(source, context);
  const flush = () => { let count = 0; while (queue.size && count++ < 150) { const jobs = Array.from(queue.values()); queue.clear(); jobs.forEach(fn => fn()); } assert(count < 150, 'Animation did not settle'); };
  flush();
  return { panels, scenes, buttons, mode, host, journey, context, events, flush, reduced };
}
const app = setup();
assert(app.journey.classList.contains('is-enhanced'));
assert(app.panels[0].classList.contains('is-active'));
assert(app.panels[1].inert);
app.buttons[1].click(); app.flush();
assert.equal(app.journey.dataset.chapter, '1', 'Second chapter must be collective governance');
assert.equal(app.buttons[1].attrs.get('aria-current'), 'step');
app.mode.click(); app.flush();
assert(app.journey.classList.contains('journey-reading'));
assert(app.panels.every(panel => !panel.inert && panel.attrs.get('aria-hidden') === 'false'));
assert(app.scenes.every((scene, i) => scene.parent === app.panels[i]));
app.mode.click(); app.flush();
assert(app.scenes.every(scene => scene.parent === app.host));
for (const index of [0, 2, 3]) { app.buttons[index].click(); app.flush(); assert.equal(app.journey.dataset.chapter, String(index)); }
const simple = setup(true);
assert(simple.journey.classList.contains('journey-reading'));
assert(simple.panels.every(panel => !panel.inert));
assert(!simple.journey.classList.contains('is-enhanced'));
app.events.get('pagehide')({ persisted: false });
app.events.get('pageshow')({ persisted: true }); app.flush();
console.log('Narrative chapter controls and reduced-motion reading path checked.');
