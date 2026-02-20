import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTENT_GLOB,
  buildContentGlobs,
  getIncludedSubfolders,
  isTopLevelContentMarkdownPath
} from '../src/lib/content/files';

test('CONTENT_GLOB scans only top-level markdown under posts/snippets', () => {
  assert.deepEqual(CONTENT_GLOB, ['content/posts/*.md', 'content/snippets/*.md']);
});

test('isTopLevelContentMarkdownPath accepts only top-level markdown files', () => {
  assert.equal(isTopLevelContentMarkdownPath('content/posts/demo.md'), true);
  assert.equal(isTopLevelContentMarkdownPath('content/snippets/demo.md'), true);
  assert.equal(isTopLevelContentMarkdownPath('content/posts/synthetic/demo.md'), false);
  assert.equal(isTopLevelContentMarkdownPath('content/posts/assets/image.png'), false);
  assert.equal(isTopLevelContentMarkdownPath('content/posts/foo/bar.md'), false);
});

test('getIncludedSubfolders supports repeated flags and nested values', () => {
  const selected = getIncludedSubfolders([
    '--include-subfolder',
    'synthetic',
    '--include-subfolder=foo/bar',
    '--include-subfolder',
    'synthetic'
  ]);
  assert.deepEqual(selected, ['foo/bar', 'synthetic']);
});

test('buildContentGlobs expands include-subfolder for posts and snippets', () => {
  const globs = buildContentGlobs(['--include-subfolder', 'synthetic', '--include-subfolder=foo/bar']);
  assert.deepEqual(globs, [
    'content/posts/*.md',
    'content/posts/foo/bar/*.md',
    'content/posts/synthetic/*.md',
    'content/snippets/*.md',
    'content/snippets/foo/bar/*.md',
    'content/snippets/synthetic/*.md'
  ]);
});

test('getIncludedSubfolders supports DEELAN_INCLUDE_SUBFOLDERS env', () => {
  const previous = process.env.DEELAN_INCLUDE_SUBFOLDERS;
  process.env.DEELAN_INCLUDE_SUBFOLDERS = 'synthetic,foo/bar';
  try {
    const selected = getIncludedSubfolders([]);
    assert.deepEqual(selected, ['foo/bar', 'synthetic']);
  } finally {
    process.env.DEELAN_INCLUDE_SUBFOLDERS = previous;
  }
});
