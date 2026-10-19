import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const dir = resolve(root, 'dist');
const html = await readFile(resolve(dir, 'index.html'), 'utf8');
const css = await readFile(resolve(dir, 'styles.css'), 'utf8');
const ids = Array.from(html.matchAll(/\bid="([^"]+)"/g), m => m[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate ids');
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'One page title');
for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  const target = match[1];
  if (target.startsWith('#')) assert(ids.includes(target.slice(1)), 'Missing anchor ' + target);
  else if (!/^https?:/.test(target)) await access(resolve(dir, target));
}
for (const match of html.matchAll(/aria-labelledby="([^"]+)"/g)) {
  for (const id of match[1].split(/\s+/)) assert(ids.includes(id), 'Missing accessible heading ' + id);
}
for (const match of css.matchAll(/url\(['"]?([^)'"]+)/g)) await access(resolve(dir, match[1]));
assert.equal((css.match(/\{/g) || []).length, (css.match(/\}/g) || []).length, 'CSS block balance');
const sections = Array.from(html.matchAll(/<section\b[^>]*\bid="([^"]+)"/g), m => m[1]);
assert.deepEqual(sections, ['debut', 'programme', 'education', 'projet', 'plateforme', 'videographie', 'monnaie', 'echanges', 'harmonie', 'democratie', 'calendrier'], 'Reading order follows the latest brief');
const section = id => {
  const at = html.indexOf('id="' + id + '"');
  return html.slice(at, html.indexOf('</section>', at));
};
const opening = section('debut');
assert(opening.includes('Faire mieux.'));
assert(opening.includes('<p class="hero-lead">Préparer la France à l’arrivée de la super intelligence artificielle.</p>'), 'Exact latest opening sentence');
for (const removed of ['Romain Falanga', 'Présidentielle 2027', 'Lire le programme', 'Faites défiler', 'figure', 'data-chapter', 'journey', '<button', 'Un même mouvement']) assert(!opening.includes(removed), 'Removed opening element: ' + removed);
for (const removed of ['journey', 'scene-timeline', 'data-chapter', 'Lecture simple', 'profile-avatar', 'profile-sheet', 'retraite', 'ETF', 'candidature imaginaire', 'La curiosité ouvre le chemin', 'Anticiper la transition.', 'BABYLON']) assert(!html.includes(removed), 'Obsolete public content: ' + removed);
assert(!html.includes('Si je suis élu président'), 'Removed presidential quote must not return');
assert(!html.includes('class="section-name"'), 'Removed introductory label');
const programme = section('programme');
for (const phrase of ['Ce programme', 'capable de tout faire', 'travail ne serait plus nécessaire', 'les jeunes et l’ensemble de la population', 'garder un sens', 'se comprendre et s’améliorer', 'fin de la fonction présidentielle']) assert(programme.includes(phrase), 'Missing programme introduction: ' + phrase);
const education = section('education');
assert(education.indexOf('id="stages-ia"') < education.indexOf('class="learning-layout'), 'Internships lead the education section');
for (const phrase of ['le cœur du modèle', 'concevoir et de mettre en place les automatisations', 'Observer l’entreprise', 'Concevoir les automatisations', 'Les mettre en place', 'psychologie', 'notre manière de penser', 'notre manière d’exister dans la réalité', 'Observation et amélioration de soi', 'fonctionnement de l’Univers', 'Conserver les matières', 'groupes plus nombreux']) {
  assert(education.includes(phrase), 'Missing education requirement: ' + phrase);
}
for (const id of ['branche-soi', 'branche-reflexions', 'branche-projets', 'reseau-pensees', 'reseau-projets', 'quantification-title']) assert(ids.includes(id));
const video = section('videographie');
for (const phrase of ['Observation et', 'amélioration de soi', 'Réflexions', 'Idées et projets', 'démarche thérapeutique personnelle', 'les élèves et les adultes', 'Chaque projet possède sa propre vidéographie', 'son origine', 'les étapes', 'intelligence artificielle générale gouvernante', 'quantifier son expansion harmonieuse']) assert(video.includes(phrase), 'Missing videography requirement: ' + phrase);
for (const phrase of ['utilisables immédiatement à l’international', 'ne sont pas dépensables en France', 'Aucune conversion', 'L’avancement', 'Le nombre de personnes qui l’utilisent', 'La plateforme est le socle', 'chaque mois', 'Les ventes n’ajoutent', 'point de départ', 'septembre 2027', 'sortie de l’Union européenne', 'formule d’émission']) assert(html.includes(phrase), 'Missing programme requirement: ' + phrase);
const roadmap = section('calendrier');
for (const phrase of ['Ajouter les cours de psychologie', 'physique du fonctionnement de l’Univers', 'les élèves et les adultes', 'concevoir et de mettre en place les automatisations', '2026–2027']) assert(roadmap.includes(phrase), 'Roadmap requirement: ' + phrase);
const header = html.slice(html.indexOf('<header'), html.indexOf('</header>'));
assert(header.includes('<span>Expansion Harmonieuse</span>'), 'Single line brand');
assert(!header.includes('<br>'));
assert.equal((header.match(/<nav\b/g) || []).length, 1);
assert(css.includes('white-space:nowrap'));
assert(css.includes('--header-height:64px') && css.includes('--header-height:60px'));
assert(css.includes('prefers-reduced-motion'));
assert(!/overflow-x\s*:\s*hidden/.test(css), 'Do not hide horizontal layout failures');
assert(!/position\s*:\s*(?:fixed|sticky)/.test(css.slice(css.indexOf('.hero{'), css.indexOf('.programme{'))), 'No pinned opening');
const app = await readFile(resolve(dir, 'app.js'), 'utf8');
assert(!/addEventListener\(['"](?:wheel|touchmove|scroll)/.test(app), 'Native reading, no scroll interception');
const checked = spawnSync(process.execPath, ['--check', resolve(dir, 'app.js')], { encoding: 'utf8' });
assert.equal(checked.status, 0, checked.stderr);
assert(!html.includes('<img'), 'No rejected generated imagery');
console.log('Validated: one opening, new section order, IA internships, programme content, anchors, local assets and JavaScript.');
