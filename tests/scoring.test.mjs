import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as s from '../js/scoring.js';
import { MEASURES, PARTS, SOURCES } from '../js/measures.js';
import { SAMPLE_RUNS } from '../js/sample.js';

const hours = MEASURES.find((m) => m.unit === 'hours');
const steps = MEASURES.find((m) => m.id === 'steps');
const threads = MEASURES.find((m) => m.id === 'threads');
const run = (actual, guess = {}, line = {}) => ({ actual, guess, line });

test('parseValue reads what phones and people write', () => {
  assert.equal(s.parseValue('4.5', hours), 4.5);
  assert.equal(s.parseValue('4,5', hours), 4.5);
  assert.equal(s.parseValue('4h 30m', hours), 4.5);
  assert.equal(s.parseValue('45m', hours), 0.75);
  assert.equal(s.parseValue(' 2 hours ', hours), 2);
  assert.equal(s.parseValue('8,214', steps), 8214);
  assert.equal(s.parseValue('0', steps), 0);
});

test('parseValue refuses junk and out-of-range values', () => {
  for (const bad of ['', '   ', 'abc', '-3', '4h 30m 2s', '1e5', 'Infinity', '<img>', '25']) {
    assert.equal(s.parseValue(bad, hours), null, bad);
  }
  assert.equal(s.parseValue('11', threads), null);
  assert.equal(s.parseValue(5, hours), null);
});

test('formatValue writes hours the way Screen Time does', () => {
  assert.equal(s.formatValue(5.2, hours), '5 h 12 min');
  assert.equal(s.formatValue(0.5, hours), '30 min');
  assert.equal(s.formatValue(3, hours), '3 h');
  assert.equal(s.formatValue(8214, steps), '8,214');
  assert.equal(s.formatValue(null, steps), '–');
});

test('over the line follows each measure’s direction', () => {
  assert.equal(s.isOver(hours, 5, 4), true);
  assert.equal(s.isOver(hours, 4, 4), false);
  assert.equal(s.isOver(steps, 5000, 7000), true);
  assert.equal(s.isOver(steps, 7000, 7000), false);
  assert.equal(s.isOver(steps, undefined, 7000), false);
});

test('surprise is a share of the guess and survives a guess of zero', () => {
  assert.equal(s.surprise(hours, 4, 6), 0.5);
  assert.ok(Number.isFinite(s.surprise(threads, 0, 3)));
  assert.equal(s.surprise(hours, 4, undefined), null);
});

test('verdicts: real, between, virtual, unchecked', () => {
  const pair = [hours, steps];
  const line = { [hours.id]: 4, [steps.id]: 7000 };
  assert.equal(s.partVerdict(pair, run({ [hours.id]: 3, [steps.id]: 8000 }, {}, line)).verdict, 'real');
  assert.equal(s.partVerdict(pair, run({ [hours.id]: 5, [steps.id]: 8000 }, {}, line)).verdict, 'between');
  assert.equal(s.partVerdict(pair, run({ [hours.id]: 5, [steps.id]: 1000 }, {}, line)).verdict, 'virtual');
  assert.equal(s.partVerdict(pair, run({}, {}, line)).verdict, 'unchecked');
  // A skipped measure doesn't count against you, or for you.
  assert.equal(s.partVerdict(pair, run({ [hours.id]: 5 }, {}, line)).verdict, 'virtual');
});

test('headline counts parts and reads as English', () => {
  const p = (...v) => v.map((verdict) => ({ verdict }));
  assert.equal(s.headline(p('real', 'real', 'real', 'real')), 'None of the four parts of your week is fully virtual.');
  assert.equal(s.headline(p('between', 'between', 'between', 'real')), 'None of the four parts of your week is fully virtual. Three are mixed.');
  assert.equal(s.headline(p('virtual', 'real', 'real', 'real')), 'One of the four parts of your week is on the virtual side.');
  assert.equal(s.headline(p('virtual', 'virtual', 'between', 'real')), 'Two of the four parts of your week are on the virtual side. One more is mixed.');
  assert.equal(s.headline(p('virtual', 'virtual', 'virtual', 'virtual')), 'All four parts of your week are on the virtual side.');
  assert.equal(s.headline(p('virtual', 'between', 'real', 'unchecked')), 'One of the three parts you checked is on the virtual side. One more is mixed.');
  assert.equal(s.headline(p('virtual', 'unchecked', 'unchecked', 'unchecked')), 'The one part you checked is on the virtual side.');
  assert.match(s.headline(p('unchecked', 'unchecked', 'unchecked', 'unchecked')), /didn’t check/);
});

test('sample run: known answer', () => {
  const [first, second] = SAMPLE_RUNS;
  const parts = PARTS.map((p) => s.partVerdict(MEASURES.filter((m) => m.part === p.id), first).verdict);
  assert.deepEqual(parts, ['virtual', 'virtual', 'virtual', 'virtual']);
  assert.equal(s.furthestOver(MEASURES, first).measure.id, 'phoneFree');
  const rows = s.compareRuns(MEASURES, first, second);
  assert.equal(rows.length, MEASURES.length);
  assert.equal(rows.find((r) => r.measure.id === 'feed').direction, 'better');
  assert.equal(rows.find((r) => r.measure.id === 'outdoors').direction, 'worse');
});

test('nothing over the line means nothing to act on', () => {
  const line = Object.fromEntries(MEASURES.map((m) => [m.id, m.better === 'less' ? m.max : m.min]));
  const actual = Object.fromEntries(MEASURES.map((m) => [m.id, 1]));
  assert.equal(s.furthestOver(MEASURES, run(actual, {}, line)), null);
});

test('guess tally separates rosy from harsh by direction', () => {
  const guess = { [hours.id]: 2, [steps.id]: 9000 };
  const actual = { [hours.id]: 4, [steps.id]: 5000 };
  const t = s.guessTally([hours, steps], run(actual, guess));
  assert.deepEqual(t, { checked: 2, rosy: 2, harsh: 0, close: 0 });
});

test('content: every measure is complete and every source exists', () => {
  assert.equal(MEASURES.length, 8);
  for (const m of MEASURES) {
    for (const key of ['id', 'part', 'label', 'ask', 'lineAsk', 'unitLabel', 'badInput']) assert.ok(m[key], `${m.id} ${key}`);
    assert.ok(['less', 'more'].includes(m.better));
    assert.ok(m.where.length >= 1, m.id);
    assert.ok(m.change.do && m.change.restsOn && m.change.check, m.id);
    assert.ok(m.reference, `${m.id} must state a reference, or say no agreed number exists`);
    if (m.reference.source) assert.ok(SOURCES[m.reference.source], m.id);
    assert.ok(PARTS.some((p) => p.id === m.part));
  }
  for (const src of Object.values(SOURCES)) assert.match(src.url, /^https:\/\//);
});
