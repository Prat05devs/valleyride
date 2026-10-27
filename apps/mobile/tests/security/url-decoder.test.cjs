const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { test } = require('node:test');

// Exercise the dependency used by Expo Router, including its CommonJS/ESM boundary.
const fromRouter = createRequire(require.resolve('expo-router/package.json'));
const queryString = fromRouter('query-string');

test('app deep links preserve spaces, Unicode and escaped plus signs', () => {
  const parsed = queryString.parse('name=Valley%20Ride&city=%E0%A4%A6%E0%A5%82%E0%A4%A8&code=a%2Bb');
  assert.deepEqual({ ...parsed }, { name: 'Valley Ride', city: 'दून', code: 'a+b' });
  assert.equal(queryString.parse(queryString.stringify(parsed)).name, 'Valley Ride');
});

test('a large malformed percent-encoded deep link does not hang the app', () => {
  const malformed = '%C0%AF'.repeat(20_000);
  assert.equal(queryString.parse(`route=${malformed}`).route, malformed);
});
