import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTimestamp } from '../src/lib/time';

test('formatTimestamp renders deterministic timezone-local timestamp without suffix', () => {
  const value = '2026-02-21T12:00:00Z';
  assert.equal(formatTimestamp(value, 'UTC'), '2026-02-21 12:00:00');
  assert.equal(formatTimestamp(value, 'America/Los_Angeles'), '2026-02-21 04:00:00');
  assert.match(formatTimestamp(value, 'America/Los_Angeles'), /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
});

test('formatTimestamp falls back to UTC when timezone identifier is invalid', () => {
  const value = '2026-02-21T12:00:00Z';
  assert.equal(formatTimestamp(value, 'Bad/Timezone'), '2026-02-21 12:00:00');
});

test('formatTimestamp handles null/invalid values', () => {
  assert.equal(formatTimestamp(null, 'UTC'), 'N/A');
  assert.equal(formatTimestamp(undefined, 'UTC'), 'N/A');
  assert.equal(formatTimestamp('not-a-date', 'UTC'), 'not-a-date');
});
