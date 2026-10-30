// Everything saved lives under one localStorage key, and nothing leaves this browser.
// Storage can be blocked or full, so every call survives failure and the site still works for this visit.

const KEY = 'virtual-reality-check';
const MAX_RUNS = 200;
const MAX_CHANGE = 500;
const THEMES = ['system', 'light', 'dark'];

const blank = () => ({ version: 1, current: null, runs: [], theme: 'system' });

function cleanNumbers(input, measures) {
  const out = {};
  if (!input || typeof input !== 'object') return out;
  for (const m of measures) {
    const v = input[m.id];
    if (typeof v === 'number' && Number.isFinite(v) && v >= m.min && v <= m.max) out[m.id] = v;
  }
  return out;
}

const cleanDate = (v) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);

export function cleanRun(input, measures) {
  if (!input || typeof input !== 'object') return null;
  const createdAt = cleanDate(input.createdAt);
  if (!createdAt) return null;
  return {
    id: typeof input.id === 'string' ? input.id.slice(0, 64) : createdAt,
    createdAt,
    finishedAt: cleanDate(input.finishedAt),
    guess: cleanNumbers(input.guess, measures),
    line: cleanNumbers(input.line, measures),
    actual: cleanNumbers(input.actual, measures),
    change: typeof input.change === 'string' ? input.change.slice(0, MAX_CHANGE) : '',
  };
}

export function cleanState(input, measures) {
  const state = blank();
  if (!input || typeof input !== 'object') return state;
  if (THEMES.includes(input.theme)) state.theme = input.theme;
  if (Array.isArray(input.runs)) {
    state.runs = input.runs.slice(0, MAX_RUNS).map((r) => cleanRun(r, measures)).filter((r) => r && r.finishedAt);
  }
  state.current = cleanRun(input.current, measures);
  return state;
}

export function load(measures, storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(KEY);
    return raw ? cleanState(JSON.parse(raw), measures) : blank();
  } catch {
    return blank();
  }
}

// Returns false when the browser refused, so the app can say the run won't be kept.
export function save(state, storage = globalThis.localStorage) {
  try {
    storage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function erase(storage = globalThis.localStorage) {
  try {
    storage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}

export function newRun(now = new Date()) {
  const createdAt = now.toISOString();
  return { id: createdAt, createdAt, finishedAt: null, guess: {}, line: {}, actual: {}, change: '' };
}
