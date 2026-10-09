import assert from 'node:assert/strict';
import test from 'node:test';

import { signupAge, signupAgeError } from '../lib/auth/age.ts';

const today = new Date(2026, 9, 4);

test('accepts someone on their eighteenth birthday', () => {
  assert.equal(signupAge('2008-10-04', today), 18);
  assert.equal(signupAgeError('2008-10-04', today), null);
});

test('rejects someone one day before their eighteenth birthday', () => {
  assert.equal(signupAge('2008-10-05', today), 17);
  assert.match(signupAgeError('2008-10-05', today), /at least 18/);
});

test('rejects missing, impossible, and future dates', () => {
  assert.match(signupAgeError('', today), /valid date/);
  assert.match(signupAgeError('2010-02-30', today), /valid date/);
  assert.match(signupAgeError('2028-01-01', today), /at least 18/);
});

test('handles leap-day birthdays', () => {
  assert.equal(signupAgeError('2008-02-29', today), null);
  assert.match(signupAgeError('2012-02-29', today), /at least 18/);
});
