const { test } = require('node:test');
const assert = require('node:assert/strict');
const { windowError, offerReturn, istInputToIso } = require('../../apps/web/lib/when.ts');
const now = Date.parse('2026-10-25T04:00:00Z');

test('cleared, invalid, past and too-short windows are rejected without throwing', () => {
  assert.match(windowError('', '', now), /Choose/);
  assert.match(windowError('2026-99-01T09:00', '2026-10-28T09:00', now), /Choose/);
  assert.match(windowError('2026-10-24T09:00', '2026-10-28T09:00', now), /has passed/);
  assert.match(windowError('2026-10-26T09:00', '2026-10-26T11:00', now), /4 hours/);
  assert.equal(windowError('2026-10-26T09:00', '2026-10-26T13:00', now), null);
  assert.equal(istInputToIso(''), '');
});

test('offer durations preserve IST time across months', () => {
  assert.equal(offerReturn('2026-10-30T14:30', 7), '2026-11-06T14:30');
  assert.equal(offerReturn('2026-10-30T14:30', 28), '2026-11-27T14:30');
  assert.equal(offerReturn('', 7), '');
});
