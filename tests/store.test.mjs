import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as store from '../js/store.js';
import { MEASURES } from '../js/measures.js';

function memory(initial) {
  const data = new Map(initial ? [['virtual-reality-check', initial]] : []);
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: (k) => data.delete(k), data };
}

const good = { id: 'a', createdAt: '2026-10-01T00:00:00Z', finishedAt: '2026-10-01T00:10:00Z', guess: { phone: 3 }, line: { phone: 4 }, actual: { phone: 5 }, change: 'walk' };

test('round trip keeps a run', () => {
  const m = memory();
  const state = store.load(MEASURES, m);
  state.runs.push(store.cleanRun(good, MEASURES));
  assert.equal(store.save(state, m), true);
  assert.equal(store.load(MEASURES, m).runs[0].actual.phone, 5);
});

test('corrupt storage gives a blank state, never a crash', () => {
  for (const bad of ['{not json', 'null', '[]', '42', '{"runs":"x"}']) {
    const s = store.load(MEASURES, memory(bad));
    assert.deepEqual(s.runs, []);
    assert.equal(s.current, null);
  }
});

test('blocked storage does not throw', () => {
  const blocked = { getItem() { throw new Error('no'); }, setItem() { throw new Error('no'); }, removeItem() { throw new Error('no'); } };
  assert.deepEqual(store.load(MEASURES, blocked).runs, []);
  assert.equal(store.save({}, blocked), false);
  assert.equal(store.erase(blocked), false);
});

test('bad imports are stripped field by field', () => {
  const s = store.cleanState({
    theme: 'neon',
    __proto__: { polluted: true },
    runs: [
      { ...good, actual: { phone: 999, steps: '<script>', nope: 3, pickups: -1, feed: 2 } },
      { ...good, createdAt: 'yesterday' },
      { ...good, finishedAt: null },
      'junk',
      null,
    ],
  }, MEASURES);
  assert.equal(s.theme, 'system');
  assert.equal(s.runs.length, 1);
  assert.deepEqual(s.runs[0].actual, { feed: 2 });
});

test('long notes are cut, and non-text ones dropped', () => {
  assert.equal(store.cleanRun({ ...good, change: 'x'.repeat(9000) }, MEASURES).change.length, 500);
  assert.equal(store.cleanRun({ ...good, change: { a: 1 } }, MEASURES).change, '');
});

test('erase removes everything', () => {
  const m = memory('{"runs":[]}');
  store.erase(m);
  assert.equal(m.data.size, 0);
});
