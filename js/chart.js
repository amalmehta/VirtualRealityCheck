// One measure as a single strip: your guess (hollow), your line (tick), the real number (solid).
// The numbers are always written out beside it too, so the strip is never the only way to read them.
// Positions are percentages, so the strip stretches to any width without squashing the dots.
import { formatValue } from './scoring.js';

const NS = 'http://www.w3.org/2000/svg';

function el(name, attrs = {}, title) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (title) {
    const t = document.createElementNS(NS, 'title');
    t.textContent = title;
    node.append(t);
  }
  return node;
}

export function strip(measure, { guess, line, actual }) {
  const y = 14;
  const pad = 3;
  const values = [guess, line, actual].filter((v) => typeof v === 'number');
  // Always measured from zero, so a 10% gap looks like a 10% gap.
  const low = measure.min;
  const high = Math.max(...values, low + measure.floor);
  const x = (v) => pad + ((v - low) / (high - low)) * (100 - pad * 2);
  const pct = (n) => `${n}%`;

  const svg = el('svg', { class: 'strip', role: 'img', width: '100%', height: 28 });
  const fmt = (v) => `${formatValue(v, measure)} ${measure.short}`.trim();
  const said = [
    typeof guess === 'number' ? `Guess ${fmt(guess)}` : null,
    typeof line === 'number' ? `Line ${fmt(line)}` : null,
    typeof actual === 'number' ? `Actual ${fmt(actual)}` : 'Not checked',
  ].filter(Boolean).join(', ');
  svg.setAttribute('aria-label', `${measure.label}: ${said}`);

  svg.append(el('line', { x1: pct(pad), x2: pct(100 - pad), y1: y, y2: y, class: 'strip-track' }));
  if (typeof line === 'number') {
    const lx = x(line);
    const wrong = measure.better === 'less'
      ? { x: pct(lx), width: pct(100 - pad - lx) }
      : { x: pct(pad), width: pct(lx - pad) };
    svg.append(el('rect', { ...wrong, y: y - 5, height: 10, rx: 2, class: 'strip-wrong' }, 'Past your line'));
    svg.append(el('line', { x1: pct(lx), x2: pct(lx), y1: y - 10, y2: y + 10, class: 'strip-line' }, `Your line: ${fmt(line)}`));
  }
  if (typeof guess === 'number') {
    svg.append(el('circle', { cx: pct(x(guess)), cy: y, r: 5.5, class: 'strip-guess' }, `Your guess: ${fmt(guess)}`));
  }
  if (typeof actual === 'number') {
    svg.append(el('circle', { cx: pct(x(actual)), cy: y, r: 6, class: 'strip-actual' }, `Actual: ${fmt(actual)}`));
  }
  return svg;
}

export function legend() {
  const wrap = document.createElement('div');
  wrap.className = 'legend';
  for (const [cls, label] of [['guess', 'Your guess'], ['line', 'Your line'], ['actual', 'Actual']]) {
    const item = document.createElement('span');
    const mark = document.createElement('i');
    mark.className = `key key-${cls}`;
    item.append(mark, label);
    wrap.append(item);
  }
  return wrap;
}
