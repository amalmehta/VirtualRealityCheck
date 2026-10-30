// Pure functions: no DOM, no storage. Everything a result says is worked out here.

// Reads what people actually type or see on their phone: "4.5", "4,5", "8,214", "4h 32m", "45m".
export function parseValue(text, measure) {
  if (typeof text !== 'string') return null;
  const raw = text.trim().toLowerCase();
  if (!raw) return null;
  let value = null;
  const time = raw.match(/^(?:(\d+(?:[.,]\d+)?)\s*(?:h|hr|hrs|hour|hours))?\s*(?:(\d+)\s*(?:m|min|mins|minutes?))?$/);
  if (measure.unit === 'hours' && time && (time[1] || time[2])) {
    value = Number((time[1] || '0').replace(',', '.')) + Number(time[2] || 0) / 60;
  } else if (/^\d{1,3}(,\d{3})+$/.test(raw)) {
    value = Number(raw.replace(/,/g, ''));
  } else if (/^\d*[.,]?\d+$/.test(raw)) {
    value = Number(raw.replace(',', '.'));
  }
  if (value === null || !Number.isFinite(value)) return null;
  if (value < measure.min || value > measure.max) return null;
  return value;
}

export function formatValue(value, measure) {
  if (value === null || value === undefined) return '–';
  if (measure.unit === 'hours') {
    const totalMinutes = Math.round(value * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h === 0) return `${m} min`;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
  }
  return Math.round(value).toLocaleString('en-US');
}

const num = (v) => typeof v === 'number' && Number.isFinite(v);

export function isOver(measure, actual, line) {
  if (!num(actual) || !num(line)) return false;
  return measure.better === 'less' ? actual > line : actual < line;
}

// Relative distance. The floor stops a guess or line of 0 dividing by zero.
const relative = (a, b, measure) => Math.abs(a - b) / Math.max(Math.abs(b), measure.floor);

export const surprise = (measure, guess, actual) =>
  num(guess) && num(actual) ? relative(actual, guess, measure) : null;

export const overshoot = (measure, actual, line) =>
  isOver(measure, actual, line) ? relative(actual, line, measure) : 0;

export function partVerdict(partMeasures, run) {
  const checked = partMeasures.filter((m) => num(run.actual[m.id]));
  if (checked.length === 0) return { verdict: 'unchecked', over: 0, checked: 0 };
  const over = checked.filter((m) => isOver(m, run.actual[m.id], run.line[m.id])).length;
  const verdict = over === 0 ? 'real' : over === checked.length ? 'virtual' : 'between';
  return { verdict, over, checked: checked.length };
}

export function biggestSurprise(measures, run) {
  let best = null;
  for (const m of measures) {
    const s = surprise(m, run.guess[m.id], run.actual[m.id]);
    if (s !== null && (best === null || s > best.amount)) best = { measure: m, amount: s };
  }
  return best;
}

// Which number to act on: the one furthest past your own line.
export function furthestOver(measures, run) {
  let best = null;
  for (const m of measures) {
    const o = overshoot(m, run.actual[m.id], run.line[m.id]);
    if (o > 0 && (best === null || o > best.amount)) best = { measure: m, amount: o };
  }
  return best;
}

// Did you flatter yourself? Counts guesses that came out rosier than the real number.
export function guessTally(measures, run) {
  const tally = { checked: 0, rosy: 0, harsh: 0, close: 0 };
  for (const m of measures) {
    const s = surprise(m, run.guess[m.id], run.actual[m.id]);
    if (s === null) continue;
    tally.checked += 1;
    if (s <= 0.1) tally.close += 1;
    else if (m.better === 'less' ? run.guess[m.id] < run.actual[m.id] : run.guess[m.id] > run.actual[m.id]) tally.rosy += 1;
    else tally.harsh += 1;
  }
  return tally;
}

export function compareRuns(measures, previous, current) {
  const rows = [];
  for (const m of measures) {
    const before = previous.actual[m.id];
    const after = current.actual[m.id];
    if (!num(before) || !num(after)) continue;
    const change = relative(after, before, m);
    const direction = change <= 0.05 ? 'same' : (m.better === 'less' ? after < before : after > before) ? 'better' : 'worse';
    rows.push({ measure: m, before, after, direction });
  }
  return rows;
}

const WORDS = ['None', 'One', 'Two', 'Three', 'Four'];

export function headline(parts) {
  const checked = parts.filter((p) => p.verdict !== 'unchecked');
  const n = checked.length;
  if (n === 0) return 'You didn’t check any numbers, so there is nothing to say yet.';
  const virtual = checked.filter((p) => p.verdict === 'virtual').length;
  const mixed = checked.filter((p) => p.verdict === 'between').length;
  const whole = n === parts.length ? `${WORDS[n].toLowerCase()} parts of your week` : `${WORDS[n].toLowerCase()} part${n === 1 ? '' : 's'} you checked`;
  let first;
  if (virtual === n) first = n === 1 ? 'The one part you checked is on the virtual side.' : `All ${whole} are on the virtual side.`;
  else if (virtual === 0) first = `None of the ${whole} is fully virtual.`;
  else first = `${WORDS[virtual]} of the ${whole} ${virtual === 1 ? 'is' : 'are'} on the virtual side.`;
  if (mixed === 0) return first;
  return `${first} ${WORDS[mixed]} ${virtual === 0 ? '' : 'more '}${mixed === 1 ? 'is' : 'are'} mixed.`;
}

export function isComplete(measures, run) {
  return measures.every((m) => num(run.guess[m.id]) && num(run.line[m.id]));
}
