import test from 'node:test';
import assert from 'node:assert/strict';

import * as srcCore from '../src/lib/search/search-core.js';
import * as publicCore from '../public/js/search-core.js';

test('src and public search core parseQuery outputs stay equivalent', () => {
  const query = '(spark | dbt) & model tag:data.pipeline.* from:2026-01-01 to:2026-12-31';

  const srcParsed = srcCore.parseQuery(query);
  const publicParsed = publicCore.parseQuery(query);

  assert.deepEqual(srcParsed, publicParsed);
});

test('src and public search core evaluators stay equivalent', () => {
  const query = '(spark | dbt) & model tag:data.pipeline.* from:2026-01-01 to:2026-12-31';
  const target = {
    text: 'dbt model contract and lineage',
    tags: ['data.pipeline.dbt'],
    date: '2026-05-01T10:00:00Z'
  };

  const srcParsed = srcCore.parseQuery(query);
  const publicParsed = publicCore.parseQuery(query);

  const srcEval = srcCore.evaluateQuery(srcParsed.expression, srcParsed.filters, target);
  const publicEval = publicCore.evaluateQuery(publicParsed.expression, publicParsed.filters, target);

  assert.equal(srcEval, publicEval);
  assert.equal(srcEval, true);
});
