import test from 'node:test';
import assert from 'node:assert/strict';

import { parseQuery } from '../src/lib/search/query-parser';
import { evaluateExpression, evaluateQuery, matchesFilters } from '../src/lib/search/query-eval';

test('parseQuery extracts structured filters and expression', () => {
  const parsed = parseQuery('spark & dbt tag:data.pipeline.* from:2026-01-01 to:2026-12-31');

  assert.deepEqual(parsed.filters, {
    tags: ['data.pipeline.*'],
    from: '2026-01-01',
    to: '2026-12-31',
    titles: []
  });

  assert.ok(parsed.expression);
  assert.equal(parsed.expression?.type, 'and');
});

test('parseQuery handles parentheses precedence', () => {
  const parsed = parseQuery('(spark | dbt) & model');
  assert.ok(parsed.expression);
  assert.equal(parsed.expression?.type, 'and');

  const left = (parsed.expression as { type: 'and'; left: { type: string } }).left;
  assert.equal(left.type, 'or');
});

test('evaluateExpression applies boolean logic', () => {
  const parsed = parseQuery('(spark | dbt) & model');
  assert.equal(evaluateExpression(parsed.expression, 'dbt semantic model layer'), true);
  assert.equal(evaluateExpression(parsed.expression, 'spark streaming job'), false);
});

test('matchesFilters handles hierarchical tags', () => {
  const parsed = parseQuery('tag:data.lake.*');
  const ok = matchesFilters(parsed.filters, ['data.lake.partitioning', 'query.optimization'], null);
  const nope = matchesFilters(parsed.filters, ['python.pandas.groupby'], null);

  assert.equal(ok, true);
  assert.equal(nope, false);
});

test('matchesFilters treats to: as inclusive end-of-day', () => {
  const parsed = parseQuery('from:2026-02-17 to:2026-02-17');

  const sameDayLate = matchesFilters(parsed.filters, ['data.lake.partitioning'], '2026-02-17T21:30:00-08:00');
  const nextDay = matchesFilters(parsed.filters, ['data.lake.partitioning'], '2026-02-18T00:00:00-08:00');

  assert.equal(sameDayLate, true);
  assert.equal(nextDay, false);
});

test('evaluateQuery combines expression and structured filters', () => {
  const parsed = parseQuery('(spark | dbt) & model tag:data.pipeline.* from:2026-01-01 to:2026-12-31');

  const match = evaluateQuery(parsed.expression, parsed.filters, {
    text: 'dbt model contract and lineage',
    tags: ['data.pipeline.dbt'],
    date: '2026-05-01T10:00:00Z'
  });

  const mismatchTag = evaluateQuery(parsed.expression, parsed.filters, {
    text: 'dbt model contract and lineage',
    tags: ['python.pandas.groupby'],
    date: '2026-05-01T10:00:00Z'
  });

  const mismatchText = evaluateQuery(parsed.expression, parsed.filters, {
    text: 'airflow dag orchestration only',
    tags: ['data.pipeline.airflow'],
    date: '2026-05-01T10:00:00Z'
  });

  assert.equal(match, true);
  assert.equal(mismatchTag, false);
  assert.equal(mismatchText, false);
});
