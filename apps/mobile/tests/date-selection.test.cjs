const { test } = require('node:test');
const assert = require('node:assert/strict');
const { selectDay, offerWindow } = require('../src/lib/date-selection.ts');

const day = (n) => new Date(2026, 9, n).getTime();

test('choosing a pickup then return completes the range instead of continually clearing it', () => {
  let s = { start: day(26), end: day(29), picking: 'start' };
  s = selectDay(s, day(27));
  assert.deepEqual(s, { start: day(27), end: null, picking: 'end' });
  s = selectDay(s, day(30));
  assert.deepEqual(s, { start: day(27), end: day(30), picking: 'start' });
});

test('a return-day tap preserves pickup and an earlier day starts a new range', () => {
  const s = { start: day(26), end: day(29), picking: 'end' };
  assert.equal(selectDay(s, day(30)).start, day(26));
  assert.deepEqual(selectDay(s, day(25)), { start: day(25), end: null, picking: 'end' });
});

test('same-day ranges can be completed and validated by pickup/return times', () => {
  assert.equal(selectDay({ start: day(26), end: null, picking: 'end' }, day(26)).end, day(26));
});

for (const days of [3, 7, 28]) {
  test(`${days}-day offer preserves pickup time and crosses month boundaries`, () => {
    const start = new Date(2026, 9, 30, 14);
    const result = offerWindow(start, days, new Date(2026, 9, 25));
    assert.equal(result.startAt.getTime(), start.getTime());
    const expected = new Date(2026, 9, 30 + days, 14);
    assert.equal(result.endAt.getTime(), expected.getTime());
    assert.equal(start.getDate(), 30);
  });
}

test('an expired pickup is renewed before applying an offer', () => {
  const result = offerWindow(new Date(2026, 9, 24), 7, new Date(2026, 9, 25, 16));
  assert.equal(result.startAt.getTime(), new Date(2026, 9, 26, 9).getTime());
  assert.equal(result.endAt.getTime(), new Date(2026, 10, 2, 9).getTime());
});
