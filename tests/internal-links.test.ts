import test from 'node:test';
import assert from 'node:assert/strict';
import { extractInternalLinks, replaceInternalLinks } from '../src/lib/content/internal-links';

test('extractInternalLinks collects unique post/snippet IDs from wiki links', () => {
  const markdown = `
See [[post--alpha]] and [[snippet--beta|Snippet Beta]].
Duplicate: [[post--alpha]].
`;
  const links = extractInternalLinks(markdown).sort();
  assert.deepEqual(links, ['post--alpha', 'snippet--beta']);
});

test('replaceInternalLinks rewrites wiki links to /view URLs', () => {
  const markdown = 'Open [[post--alpha]] or [[snippet--beta|Snippet Beta]].';
  const out = replaceInternalLinks(markdown);
  assert.match(out, /\[post--alpha\]\(\/view\/post--alpha\)/);
  assert.match(out, /\[Snippet Beta\]\(\/view\/snippet--beta\)/);
});
