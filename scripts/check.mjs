import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { frameAt, chapterPosition, CHAPTERS } from '../dist/scene-timeline.js';
import './check-journey.mjs';

const root = resolve(import.meta.dirname, '..');
const dir = resolve(root, 'dist');
const html = await readFile(resolve(dir, 'index.html'), 'utf8');
const ids = Array.from(html.matchAll(/\bid="([^"]+)"/g), m => m[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate ids');
assert.equal((html.match(/<h1\b/g) || []).length, 1);
for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  const target = match[1];
  if (target.startsWith('#')) assert(ids.includes(target.slice(1)), 'Missing anchor ' + target);
  else if (!/^https?:/.test(target)) await access(resolve(dir, target));
}
for (const match of html.matchAll(/srcset="([^"]+)"/g)) {
  for (const item of match[1].split(',')) await access(resolve(dir, item.trim().split(/\s+/)[0]));
}
const sections = ['projet', 'plateforme', 'videographie', 'monnaie', 'echanges', 'harmonie', 'democratie', 'transition', 'education', 'calendrier'];
let previous = 0;
for (const id of sections) {
  const position = html.indexOf('id="' + id + '"');
  assert(position > previous, 'Programme section order: ' + id);
  previous = position;
}
const opening = html.slice(html.indexOf('<section class="journey"'), html.indexOf('<section class="section wrap concept"'));
for (const removed of ['Romain Falanga', 'Présidentielle 2027', 'Lire le programme', 'Faites défiler', 'La curiosité ouvre le chemin']) assert(!opening.includes(removed), 'Removed opening copy reappeared');
const chapters = Array.from(opening.matchAll(/<article[^>]+data-chapter="(\d)"[^>]*>([\s\S]*?)<\/article>/g));
assert.equal(chapters.length, CHAPTERS);
assert(chapters[1][2].includes('Si je suis élu président, c’est pour qu’il n’y en ait plus.'));
assert.equal((opening.match(/data-go="/g) || []).length, CHAPTERS);
for (const obsolete of ['retraite', 'ETF', 'investis automatiquement', 'candidature imaginaire', 'Anticiper la transition.', 'BABYLON', 'world.js']) assert(!html.includes(obsolete), 'Obsolete public content: ' + obsolete);
for (const phrase of ['utilisables immédiatement à l’international', 'ne sont pas dépensables en France', 'Aucune conversion', 'leur état d’avancement', 'leur utilisation par d’autres personnes', 'La plateforme est le socle', 'La vidéographie', 'chaque mois', 'Les ventes n’ajoutent', 'point de départ', 'septembre 2027', 'groupes plus nombreux', 'stages de transition IA', 'sortie de l’Union européenne']) assert(html.includes(phrase), 'Missing programme requirement: ' + phrase);
for (const file of ['styles.css', 'programme.css', 'journey.css']) {
  const css = await readFile(resolve(dir, file), 'utf8');
  assert.equal((css.match(/\{/g) || []).length, (css.match(/\}/g) || []).length);
  for (const match of css.matchAll(/url\(['"]?([^)'"]+)/g)) await access(resolve(dir, match[1]));
}
for (const file of ['app.js', 'journey.js', 'scene-timeline.js']) {
  const checked = spawnSync(process.execPath, ['--check', resolve(dir, file)], { encoding: 'utf8' });
  assert.equal(checked.status, 0, checked.stderr);
}
const motion = await readFile(resolve(dir, 'journey.js'), 'utf8');
assert(!/addEventListener\(['"](?:wheel|touchmove)/.test(motion), 'Native scroll must remain available');
assert(motion.includes('prefers-reduced-motion'));
for (let i = 0; i < CHAPTERS; i++) assert.equal(frameAt(chapterPosition(i)).textIndex, i, 'Chapter destination selects wrong text');
assert.equal(frameAt(0).index, 0);
assert.equal(frameAt(1).index, 3);
for (const p of [-10, 0, 0.1, 0.25, 0.5, 0.75, 0.999, 1, 10, NaN]) {
  const frame = frameAt(p);
  assert(frame.index >= 0 && frame.index < CHAPTERS);
  assert(Number.isFinite(frame.local) && Number.isFinite(frame.blend));
}
assert(!html.includes('<img'), 'Generated illustrations must not remain in the page');
assert(!html.includes('assets/illustrations/'));
assert.equal((opening.match(/class="journey-visual /g) || []).length, 4);
for (const id of ['branche-soi', 'branche-reflexions', 'branche-projets', 'reseau-pensees', 'reseau-projets', 'quantification-title']) assert(ids.includes(id));
const video = html.slice(html.indexOf('id="videographie"'), html.indexOf('id="monnaie"'));
for (const phrase of ['Observation et', 'amélioration de soi', 'Réflexions', 'Idées et projets', 'démarche thérapeutique personnelle', 'les élèves et les adultes', 'Chaque projet possède sa propre vidéographie', 'Son origine', 'Ses étapes', 'Son état actuel', 'intelligence artificielle générale gouvernante', 'quantifier son expansion harmonieuse']) assert(video.includes(phrase), 'Missing videography requirement: ' + phrase);
const education = html.slice(html.indexOf('id="education"'), html.indexOf('id="calendrier"'));
for (const phrase of ['Psychologie', 'notre manière de penser', 'notre manière d’exister dans la réalité', 'Observation et amélioration de soi', 'Le fonctionnement<br>de l’Univers']) assert(education.includes(phrase), 'Missing education requirement: ' + phrase);
const roadmap = html.slice(html.indexOf('id="calendrier"'));
assert(roadmap.includes('Ajouter les cours de psychologie'));
assert(roadmap.includes('physique du fonctionnement de l’Univers'));
assert(roadmap.includes('les élèves et les adultes'));
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
assert(!pkg.dependencies?.babylonjs);
console.log('Programme, three branches, networks, school subjects, chapter navigation and local assets checked.');
