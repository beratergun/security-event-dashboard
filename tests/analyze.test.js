import test from 'node:test';
import assert from 'node:assert/strict';

import { analyze, parseJsonl, renderDashboard } from '../src/analyze.js';

test('parses and summarizes local JSONL events', () => {
  const events = parseJsonl(
    '{"timestamp":"2026-01-01T00:00:00Z","severity":"high","type":"x"}\n',
  );
  const summary = analyze(events);
  assert.equal(summary.total, 1);
  assert.equal(summary.bySeverity.high, 1);
  assert.equal(summary.byType.x, 1);
});

test('detects an inclusive real time-windowed authentication burst', () => {
  const events = [0, 60, 120, 180].map((seconds) => ({
    timestamp: new Date(Date.UTC(2026, 0, 1, 0, 0, seconds)).toISOString(),
    type: 'auth_failure',
    actor: 'alice',
  }));
  const summary = analyze(events, { windowMs: 300_000, threshold: 4 });
  assert.equal(summary.authBursts.length, 1);
  assert.equal(summary.authBursts[0].actor, 'alice');
  assert.equal(summary.authBursts[0].count, 4);
  assert.equal(summary.authBursts[0].start, '2026-01-01T00:00:00.000Z');
  assert.equal(summary.authBursts[0].end, '2026-01-01T00:03:00.000Z');
});

test('events outside the window do not form a burst', () => {
  const events = [0, 6, 12, 18].map((minutes) => ({
    timestamp: new Date(Date.UTC(2026, 0, 1, 0, minutes)).toISOString(),
    type: 'auth_failure',
    actor: 'alice',
  }));
  assert.equal(analyze(events, { windowMs: 300_000, threshold: 4 }).authBursts.length, 0);
});

test('authentication windows remain separated by actor', () => {
  const events = [0, 1, 2, 3].map((seconds, index) => ({
    timestamp: '2026-01-01T00:00:0' + seconds + 'Z',
    type: 'auth_failure',
    actor: index < 2 ? 'alice' : 'bob',
  }));
  assert.equal(analyze(events, { threshold: 3 }).authBursts.length, 0);
});

test('rejects malformed JSON, event roots, and timestamps', () => {
  assert.throws(() => parseJsonl('{bad}'), /invalid JSON at line 1/);
  assert.throws(
    () => parseJsonl('["not","an","event"]'),
    /invalid event at line 1/,
  );
  assert.throws(
    () => parseJsonl('{"timestamp":"not-a-date","type":"page_view"}'),
    /invalid timestamp at line 1/,
  );
});

test('rejects invalid time-window options', () => {
  const event = [{ timestamp: '2026-01-01T00:00:00Z', type: 'page_view' }];
  assert.throws(() => analyze(event, { windowMs: 0 }), /windowMs/);
  assert.throws(() => analyze(event, { threshold: 0 }), /threshold/);
  assert.throws(() => analyze(event, { threshold: 1.5 }), /threshold/);
});

test('escapes severity and actor values in the dashboard', () => {
  const html = renderDashboard({
    total: 1,
    bySeverity: { '<script>alert(1)</script>': 1 },
    byType: {},
    authBursts: [
      {
        actor: '<img src=x onerror=alert(1)>',
        count: 4,
        start: '2026-01-01T00:00:00.000Z',
        end: '2026-01-01T00:03:00.000Z',
      },
    ],
  });
  assert.equal(html.includes('<script>'), false);
  assert.equal(html.includes('<img'), false);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;img/);
});
