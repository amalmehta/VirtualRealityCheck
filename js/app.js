// Screens and input. Routes live in the hash so the phone's Back button works; no answers ever go in the URL.
import { MEASURES, PARTS, SOURCES, WHY_GUESS, LIMITS, SAMPLE_NOTE } from './measures.js';
import * as scoring from './scoring.js';
import * as store from './store.js';
import { strip, legend } from './chart.js';
import { SAMPLE_RUNS } from './sample.js';

const main = document.getElementById('main');
let state = store.load(MEASURES);
let storageOk = store.save(state);

const persist = () => { storageOk = store.save(state); };

function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'class') node.className = v;
    else if (k === 'value') node.value = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  node.append(...children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false));
  return node;
}

// Render straight away rather than waiting for hashchange, so a fast Next never lands on the old screen.
let renderedHash = null;
const go = (hash) => { location.hash = hash; route(); };
const fmt = (m, v) => `${scoring.formatValue(v, m)}${m.short ? ` ${m.short}` : ''}`;
const dateText = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function show(...children) {
  const screen = h('div', { class: 'screen' }, children);
  if (!storageOk) screen.prepend(h('p', { class: 'notice' }, 'This browser is blocking storage, so nothing will be kept after you close this page.'));
  main.replaceChildren(screen);
  window.scrollTo(0, 0);
}

function sourceLink(id) {
  const s = SOURCES[id];
  return h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.short);
}

function sourcesFold(open) {
  return h('details', { open },
    h('summary', {}, 'Sources'),
    h('div', {}, h('ol', { class: 'sources' }, Object.values(SOURCES).map((s) =>
      h('li', {}, `${s.cite} `, h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, 'Link'))))));
}

/* Home */

function renderHome() {
  const current = state.current;
  const guessed = current ? MEASURES.filter((m) => typeof current.line[m.id] === 'number').length : 0;
  const looking = current && Object.keys(current.actual).length > 0;
  const sample = SAMPLE_RUNS[0];
  const previewMeasure = MEASURES[0];

  show(
    h('h1', {}, 'Are you living in a virtual world, or the real one?'),
    h('p', { class: 'lede' }, 'Guess eight numbers about your last seven days, then look them up. The gap between what you think and what happened is the answer.'),
    h('div', { class: 'row home-actions' },
      current
        ? [h('button', { class: 'button primary', type: 'button', onclick: () => go(resumeHash(current)) }, 'Continue your check'),
           h('button', { class: 'button ghost', type: 'button', onclick: discard }, 'Start over')]
        : h('button', { class: 'button primary', type: 'button', onclick: start }, 'Start'),
      h('button', { class: 'button', type: 'button', onclick: () => go('#/sample') }, 'See a sample result')),
    h('p', { class: 'quiet need' }, current
      ? (looking ? 'You’ve started looking numbers up.' : `${guessed} of ${MEASURES.length} guessed so far.`)
      : 'About 10 minutes. Keep your phone nearby. Everything stays in this browser.'),
    h('ol', { class: 'steps' },
      h('li', {}, h('b', {}, 'Guess'), 'From memory, plus the number that would bother you.'),
      h('li', {}, h('b', {}, 'Check'), 'Look up the real number on your phone.'),
      h('li', {}, h('b', {}, 'Change one thing'), 'See where you stand, write down one change, and retake it later.')),
    h('section', { class: 'preview', 'aria-label': 'Example' },
      h('p', { class: 'small preview-head' }, 'What a result looks like. Sample numbers, not yours.'),
      measureNumbers(previewMeasure, sample),
      strip(previewMeasure, valuesOf(sample, previewMeasure)),
      legend()),
    state.runs.length ? h('section', { class: 'history' },
      h('h2', {}, 'Your checks'),
      h('ul', { class: 'history-list' }, state.runs.map((run, i) => ({ run, i })).reverse().map(({ run, i }) =>
        h('li', {}, h('button', { type: 'button', onclick: () => go(`#/result/${i}`) },
          h('span', {}, dateText(run.finishedAt)),
          h('span', { class: 'small' }, scoring.headline(partResults(run))))))))
      : null,
    h('div', { class: 'folds' },
      h('details', {}, h('summary', {}, 'Why guess first?'), h('div', {}, WHY_GUESS.map((p) => h('p', {}, p)))),
      h('details', {}, h('summary', {}, 'What this can’t tell you'), h('div', {}, LIMITS.map((p) => h('p', {}, p))))),
  );
}

function resumeHash(run) {
  if (Object.keys(run.actual).length) {
    const next = MEASURES.findIndex((m) => run.actual[m.id] === undefined);
    return `#/check/${Math.max(next, 0)}`;
  }
  const next = MEASURES.findIndex((m) => typeof run.guess[m.id] !== 'number' || typeof run.line[m.id] !== 'number');
  return next === -1 ? '#/look' : `#/guess/${next}`;
}

function start() {
  state.current = store.newRun();
  persist();
  go('#/guess/0');
}

function discard() {
  if (!confirm('Throw away this check and start over?')) return;
  state.current = null;
  persist();
  renderHome();
}

/* Guess and check */

function progress(step, label) {
  const m = MEASURES[step];
  const part = PARTS.find((p) => p.id === m.part);
  return [
    h('div', { class: 'progress', 'aria-hidden': 'true' }, MEASURES.map((_, i) => h('i', { class: i <= step ? 'done' : '' }))),
    h('p', { class: 'eyebrow' }, `${label} ${step + 1} of ${MEASURES.length} · ${part.name}`),
  ];
}

function numberField({ id, label, hint, measure, value, onValue, enterKey }) {
  const error = h('p', { class: 'error', id: `${id}-error`, role: 'status' });
  const input = h('input', {
    id, type: 'text', inputmode: measure.unit === 'hours' ? 'text' : 'decimal', autocomplete: 'off', enterkeyhint: 'next',
    value: typeof value === 'number' ? String(Math.round(value * 100) / 100) : '',
    'aria-describedby': `${id}-error`,
  });
  input.addEventListener('input', () => {
    const v = scoring.parseValue(input.value, measure);
    input.removeAttribute('aria-invalid');
    error.textContent = '';
    onValue(v);
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); enterKey(); } });
  const check = () => {
    const v = scoring.parseValue(input.value, measure);
    if (v !== null) return true;
    input.setAttribute('aria-invalid', 'true');
    error.textContent = input.value.trim() ? measure.badInput : 'A number here, please. A rough one is fine.';
    input.focus();
    return false;
  };
  return {
    input, check,
    node: h('div', { class: 'field' },
      h('label', { for: id }, label, hint ? h('span', { class: 'hint' }, hint) : null),
      h('div', { class: 'input-wrap' }, input, h('span', { class: 'quiet' }, measure.unitLabel)),
      error),
  };
}

function renderGuess(i) {
  const run = state.current;
  if (!run) return go('#/');
  if (Object.keys(run.actual).length) return go(resumeHash(run)); // Guesses lock once you've started looking.
  const m = MEASURES[i];
  const next = () => {
    if (!guess.check() || !line.check()) return;
    go(i + 1 < MEASURES.length ? `#/guess/${i + 1}` : '#/look');
  };
  const guess = numberField({
    id: 'guess', label: 'Your guess', hint: 'From memory. Don’t look yet.', measure: m, value: run.guess[m.id],
    onValue: (v) => { if (v === null) delete run.guess[m.id]; else run.guess[m.id] = v; persist(); },
    enterKey: () => { if (guess.check()) line.input.focus(); },
  });
  const line = numberField({
    id: 'line', label: m.lineAsk, hint: 'Your own line, decided before you see the number.', measure: m, value: run.line[m.id],
    onValue: (v) => { if (v === null) delete run.line[m.id]; else run.line[m.id] = v; persist(); },
    enterKey: next,
  });
  show(
    progress(i, 'Guess'),
    h('h1', { class: 'question' }, m.ask),
    h('div', { class: 'fields' }, guess.node, line.node),
    h('div', { class: 'nav' },
      h('button', { class: 'button primary', type: 'button', onclick: next }, 'Next'),
      h('button', { class: 'button ghost', type: 'button', onclick: () => go(i ? `#/guess/${i - 1}` : '#/') }, 'Back')),
  );
  guess.input.focus({ preventScroll: true });
}

function renderLook() {
  const run = state.current;
  if (!run) return go('#/');
  if (!scoring.isComplete(MEASURES, run)) return go(resumeHash(run));
  show(
    h('h1', {}, 'Guesses locked. Now go and look.'),
    h('p', { class: 'lede' }, 'You’ll need your phone’s Screen Time or Digital Wellbeing, your calendar, your messages and your health app. If you’re on the phone now, everything you type is saved as you go, so switching apps loses nothing.'),
    h('div', { class: 'nav' }, h('button', { class: 'button primary', type: 'button', onclick: () => go('#/check/0') }, 'Start checking')),
  );
}

function renderCheck(i) {
  const run = state.current;
  if (!run) return go('#/');
  if (!scoring.isComplete(MEASURES, run)) return go(resumeHash(run));
  const m = MEASURES[i];
  const advance = () => {
    if (i + 1 < MEASURES.length) return go(`#/check/${i + 1}`);
    finish();
  };
  const next = () => { if (actual.check()) advance(); };
  const actual = numberField({
    id: 'actual', label: 'The real number', measure: m, value: run.actual[m.id],
    onValue: (v) => { if (v === null) delete run.actual[m.id]; else run.actual[m.id] = v; persist(); },
    enterKey: next,
  });
  const skip = () => { delete run.actual[m.id]; persist(); advance(); };
  show(
    progress(i, 'Check'),
    h('h1', { class: 'question' }, m.ask),
    h('div', { class: 'where' }, m.where.map(([who, how]) => h('p', {}, h('b', {}, `${who}: `), how))),
    h('div', { class: 'fields' }, actual.node),
    h('div', { class: 'nav' },
      h('button', { class: 'button primary', type: 'button', onclick: next }, i + 1 < MEASURES.length ? 'Next' : 'See my result'),
      h('button', { class: 'button', type: 'button', onclick: skip }, 'Can’t check this'),
      h('button', { class: 'button ghost', type: 'button', onclick: () => go(i ? `#/check/${i - 1}` : '#/look') }, 'Back')),
  );
  actual.input.focus({ preventScroll: true });
}

function finish() {
  const run = state.current;
  run.finishedAt = new Date().toISOString();
  state.runs.push(run);
  state.current = null;
  persist();
  go(`#/result/${state.runs.length - 1}`);
}

/* Result */

const valuesOf = (run, m) => ({ guess: run.guess[m.id], line: run.line[m.id], actual: run.actual[m.id] });

const partResults = (run) => PARTS.map((p) => ({
  part: p,
  ...scoring.partVerdict(MEASURES.filter((m) => m.part === p.id), run),
}));

const VERDICTS = {
  real: { label: 'Real', icon: 'M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1z' },
  between: { label: 'Between', icon: 'M8 1a7 7 0 0 0 0 14zM8 1v2a5 5 0 0 1 0 10v2A7 7 0 0 0 8 1z' },
  virtual: { label: 'Virtual', icon: 'M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z' },
  unchecked: { label: 'Not checked', icon: 'M3 7h10v2H3z' },
};

function verdictBadge(verdict) {
  const v = VERDICTS[verdict];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', v.icon);
  svg.append(path);
  return h('span', { class: `verdict verdict-${verdict}` }, svg, v.label);
}

function measureNumbers(m, run) {
  const { guess, line, actual } = valuesOf(run, m);
  const over = scoring.isOver(m, actual, line);
  return h('div', {},
    h('div', { class: 'measure-name' }, h('b', {}, m.label), over ? h('span', { class: 'small' }, 'Past your line') : null),
    h('p', { class: 'numbers' },
      `Guess ${scoring.formatValue(guess, m)} · Line ${scoring.formatValue(line, m)} · `,
      typeof actual === 'number' ? h('strong', {}, `Actual ${fmt(m, actual)}`) : 'Not checked'));
}

function surpriseText(run) {
  const top = scoring.biggestSurprise(MEASURES, run);
  if (!top) return null;
  const m = top.measure;
  const percent = Math.round(top.amount * 100);
  if (top.amount <= 0.1) {
    return { big: 'You knew all of this. Every guess was within 10%.', small: 'So this told you nothing new about your week. Whether it’s the week you want is still your call.' };
  }
  return {
    big: `Biggest surprise: ${m.label.toLowerCase()}. You guessed ${fmt(m, run.guess[m.id])}. It was ${fmt(m, run.actual[m.id])}.`,
    small: `Off by ${percent}% of your guess.`,
  };
}

function tallyText(run) {
  const t = scoring.guessTally(MEASURES, run);
  if (!t.checked) return null;
  return `Of the ${t.checked} you checked: ${t.rosy} guess${t.rosy === 1 ? ' was' : 'es were'} rosier than the truth, ${t.harsh} harsher, ${t.close} within 10%.`;
}

function changeSection(run, sample) {
  const top = scoring.furthestOver(MEASURES, run);
  const saved = h('p', { class: 'saved', role: 'status' });
  const area = h('textarea', { id: 'my-change', maxlength: 500, placeholder: 'For the next two weeks, I will…', value: run.change });
  area.addEventListener('input', () => {
    run.change = area.value;
    if (sample) return;
    persist();
    saved.textContent = storageOk ? 'Saved in this browser.' : 'Could not save.';
  });
  const suggestion = top ? top.measure.change : null;
  return h('section', { class: 'change' },
    h('h2', {}, 'One change'),
    top
      ? h('div', { class: 'suggest' },
          h('p', { class: 'small' }, `Furthest past your line: ${top.measure.label.toLowerCase()}. A suggestion, not a prescription.`),
          h('p', {}, h('b', {}, suggestion.do)),
          h('p', { class: 'quiet' }, `Rests on: ${suggestion.restsOn}`),
          h('p', { class: 'quiet' }, `Proved wrong if: ${suggestion.check}`),
          h('div', { class: 'row' }, h('button', { class: 'button', type: 'button', onclick: () => { area.value = suggestion.do; area.dispatchEvent(new Event('input')); area.focus(); } }, 'Use this')))
      : h('div', { class: 'suggest' }, h('p', {}, 'Nothing you checked crossed your line. Either your week is fine, or your lines were loose. Look at the known numbers below each measure, and ask whether you’d set the same lines again.')),
    h('p', { class: 'quiet change-label' }, h('label', { for: 'my-change' }, 'What will you actually do? Your words beat mine.')),
    area,
    saved,
    h('p', { class: 'small' }, 'Retake it in about two weeks. One check is a snapshot; drift only shows between two.'));
}

function renderResult(run, previous, sample) {
  const parts = partResults(run);
  const finding = surpriseText(run);
  const tally = tallyText(run);
  const comparison = previous ? scoring.compareRuns(MEASURES, previous, run) : [];
  const byMeasure = new Map(comparison.map((row) => [row.measure.id, row]));

  const formula = document.getElementById('surprise-formula').content.cloneNode(true);

  show(
    sample ? h('p', { class: 'sample-note' }, SAMPLE_NOTE) : null,
    h('p', { class: 'small as-of' }, `Your last 7 days, as of ${dateText(run.finishedAt)}`),
    h('h1', {}, scoring.headline(parts)),
    finding ? h('div', { class: 'finding' }, h('p', { class: 'big' }, finding.big), h('p', { class: 'quiet' }, finding.small)) : null,
    tally ? h('p', { class: 'quiet tally' }, tally) : null,
    previous ? h('p', { class: 'quiet' }, `Compared with your check on ${dateText(previous.finishedAt)}: ${comparison.filter((r) => r.direction === 'better').length} better, ${comparison.filter((r) => r.direction === 'worse').length} worse, ${comparison.filter((r) => r.direction === 'same').length} about the same.`) : null,
    legend(),
    h('div', { class: 'parts' }, parts.map(({ part, verdict }) =>
      h('section', { class: 'part' },
        h('div', { class: 'part-head' }, h('h2', {}, part.name), verdictBadge(verdict)),
        h('p', { class: 'small' }, part.blurb),
        MEASURES.filter((m) => m.part === part.id).map((m) => {
          const delta = byMeasure.get(m.id);
          return h('div', { class: 'measure-row' },
            measureNumbers(m, run),
            strip(m, valuesOf(run, m)),
            delta ? h('p', { class: `delta delta-${delta.direction}` }, `Last time ${fmt(m, delta.before)}: `, h('b', {}, delta.direction === 'same' ? 'about the same' : delta.direction)) : null,
            h('details', { class: 'known' }, h('summary', {}, 'Is there a known number?'), h('div', {}, h('p', {}, m.reference.text, ' ', m.reference.source ? sourceLink(m.reference.source) : null))));
        })))),
    changeSection(run, sample),
    h('div', { class: 'nav' },
      sample ? h('button', { class: 'button primary', type: 'button', onclick: start }, 'Start my own') : h('button', { class: 'button primary', type: 'button', onclick: () => { state.current ? go(resumeHash(state.current)) : start(); } }, 'New check'),
      h('button', { class: 'button ghost', type: 'button', onclick: () => go('#/') }, 'Home')),
    h('div', { class: 'folds' },
      h('details', {}, h('summary', {}, 'How this is worked out'), h('div', {},
        h('p', {}, 'Each part gets a label from one rule: nothing past your line is Real, everything past it is Virtual, anything else is Between. I invented this rule and it has not been validated. There is deliberately no overall score.'),
        h('p', {}, 'Surprise measures how far off your guess was:'),
        formula,
        h('dl', { class: 'symbols' },
          h('dt', {}, 'a'), h('dd', {}, 'the real number, in that measure’s unit'),
          h('dt', {}, 'g'), h('dd', {}, 'your guess, same unit'),
          h('dt', {}, 'f'), h('dd', {}, 'a small floor, also an invented value, so a guess of 0 can’t divide by zero')),
        h('p', {}, 'In words: how far off you were, as a share of what you guessed. Guess 4 hours, find 6, and that’s 50%.'))),
      h('details', {}, h('summary', {}, 'What this can’t tell you'), h('div', {}, LIMITS.map((p) => h('p', {}, p)))),
      sourcesFold(false)),
  );
}

/* Router */

function route() {
  renderedHash = location.hash;
  const [, screen, arg] = location.hash.replace(/^#/, '').split('/');
  const i = Number(arg);
  const validStep = Number.isInteger(i) && i >= 0 && i < MEASURES.length;
  if (screen === 'guess' && validStep) return renderGuess(i);
  if (screen === 'look') return renderLook();
  if (screen === 'check' && validStep) return renderCheck(i);
  if (screen === 'result' && state.runs[i]) return renderResult(state.runs[i], state.runs[i - 1], false);
  if (screen === 'sample') return renderResult(structuredClone(SAMPLE_RUNS[1]), SAMPLE_RUNS[0], true);
  return renderHome();
}

window.addEventListener('hashchange', () => { if (location.hash !== renderedHash) route(); });

/* Settings, feedback, data */

const settings = document.getElementById('settings');
const feedback = document.getElementById('feedback');
const dataMessage = document.getElementById('data-message');

function openSettings() {
  document.querySelector(`input[name="theme"][value="${state.theme}"]`).checked = true;
  const n = state.runs.length;
  document.getElementById('data-summary').textContent = `Right now that’s ${n} finished check${n === 1 ? '' : 's'}${state.current ? ' and one in progress' : ''}.`;
  if (!settings.open) settings.showModal();
}

document.getElementById('open-settings').addEventListener('click', () => { dataMessage.textContent = ''; openSettings(); });
document.getElementById('open-feedback').addEventListener('click', () => feedback.showModal());
document.getElementById('brand').addEventListener('click', () => { if (location.hash && location.hash !== '#/') go('#/'); });
for (const dialog of [settings, feedback]) {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
}

window.addEventListener('keydown', (e) => {
  if (e.metaKey && e.key === ',') { e.preventDefault(); dataMessage.textContent = ''; openSettings(); }
});

for (const radio of document.querySelectorAll('input[name="theme"]')) {
  radio.addEventListener('change', () => {
    state.theme = radio.value;
    if (state.theme === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = state.theme;
    persist();
  });
}

document.getElementById('export-data').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: 'Virtual Reality Check.json' });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  dataMessage.textContent = 'Exported. The file is not encrypted, so keep it somewhere private.';
});

document.getElementById('delete-data').addEventListener('click', () => {
  if (!confirm('Delete every check saved in this browser? This can’t be undone.')) return;
  store.erase();
  const theme = state.theme;
  state = store.load(MEASURES);
  state.theme = theme;
  persist();
  dataMessage.textContent = 'Everything is deleted.';
  openSettings();
  route();
});

async function importFile(file) {
  openSettings();
  try {
    if (file.size > 1_000_000) throw new Error('too big');
    const incoming = store.cleanState(JSON.parse(await file.text()), MEASURES);
    const known = new Set(state.runs.map((r) => r.id));
    const fresh = incoming.runs.filter((r) => !known.has(r.id));
    if (!fresh.length) { dataMessage.textContent = 'Nothing new in that file, so nothing changed.'; return; }
    state.runs = [...state.runs, ...fresh].sort((a, b) => a.finishedAt.localeCompare(b.finishedAt));
    persist();
    dataMessage.textContent = `Added ${fresh.length} check${fresh.length === 1 ? '' : 's'}.`;
    openSettings();
    route();
  } catch {
    dataMessage.textContent = 'That file isn’t a Virtual Reality Check export, so nothing changed.';
  }
}

const importInput = document.getElementById('import-file');
document.getElementById('import-data').addEventListener('click', () => importInput.click());
importInput.addEventListener('change', () => { if (importInput.files[0]) importFile(importInput.files[0]); importInput.value = ''; });
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => { e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f) importFile(f); });
window.addEventListener('paste', (e) => { const f = e.clipboardData?.files?.[0]; if (f) { e.preventDefault(); importFile(f); } });

route();
