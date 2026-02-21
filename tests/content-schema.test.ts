import test from 'node:test';
import assert from 'node:assert/strict';
import { inferContentIdentity, validateFrontmatter } from '../src/lib/content/schema';

test('inferContentIdentity derives type and id from valid post path', () => {
  const identity = inferContentIdentity('content/posts/partitioning-primer.md');
  assert.ok(identity);
  assert.equal(identity?.validFileName, true);
  assert.equal(identity?.type, 'post');
  assert.equal(identity?.id, 'post--partitioning-primer');
});

test('inferContentIdentity flags invalid filename patterns', () => {
  const identity = inferContentIdentity('content/snippets/Foo-bar.draft.md');
  assert.ok(identity);
  assert.equal(identity?.validFileName, false);
  assert.match(identity?.warning ?? '', /invalid filename/i);
});

test('validateFrontmatter accepts minimal post and injects generated id', () => {
  const result = validateFrontmatter(
    {
      title: 'Demo Post',
      tags: ['data.pipeline.dbt'],
      version: '1.0.0',
      related_ids: ['snippet--pandas-groupby']
    },
    'content/posts/demo-post.md',
    'post',
    'post--demo-post'
  );

  assert.ok(result.value);
  assert.equal(result.errors.length, 0);
  assert.equal(result.value?.id, 'post--demo-post');
  assert.equal(result.value?.type, 'post');
});

test('validateFrontmatter accepts minimal snippet and omits post-only fields', () => {
  const result = validateFrontmatter(
    {
      title: 'Demo Snippet',
      tags: ['python.pandas.groupby'],
      description: 'Useful snippet'
    },
    'content/snippets/demo-snippet.md',
    'snippet',
    'snippet--demo-snippet'
  );

  assert.ok(result.value);
  assert.equal(result.errors.length, 0);
  assert.equal(result.value?.id, 'snippet--demo-snippet');
  assert.equal(result.value?.type, 'snippet');
  assert.ok(!('version' in (result.value ?? {})));
});

test('validateFrontmatter rejects snippet with post-only fields', () => {
  const result = validateFrontmatter(
    {
      title: 'Bad Snippet',
      tags: ['python.pandas.groupby'],
      version: '1.0.0',
      status: 'published'
    },
    'content/snippets/bad-snippet.md',
    'snippet',
    'snippet--bad-snippet'
  );

  assert.equal(result.value, undefined);
  assert.match(result.errors.join('\n'), /unknown frontmatter field `version`/);
  assert.match(result.errors.join('\n'), /unknown frontmatter field `status`/);
});

test('validateFrontmatter rejects invalid related id formats', () => {
  const result = validateFrontmatter(
    {
      title: 'Bad Post',
      tags: ['data.pipeline.dbt'],
      version: '1.0.0',
      related_ids: ['partitioning-primer']
    },
    'content/posts/bad-post.md',
    'post',
    'post--bad-post'
  );

  assert.equal(result.value, undefined);
  assert.match(result.errors.join('\n'), /related_ids/);
});
