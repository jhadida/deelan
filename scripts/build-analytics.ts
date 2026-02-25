import path from 'node:path';
import cytoscape from 'cytoscape';
import type { GeneratedIndexItem, GeneratedIndexFile } from '../src/lib/content/generated';
import { createLogger } from '../src/lib/logger';
import { readJsonFile, uniqueSorted, writeJsonFile } from '../src/lib/util';

const ROOT = process.cwd();
const ANALYTICS_DIR = path.join(ROOT, '.generated', 'analytics');
const POSTS_INDEX_PATH = path.join(ROOT, '.generated', 'search', 'posts-index.json');
const SNIPPETS_INDEX_PATH = path.join(ROOT, '.generated', 'search', 'snippets-index.json');
const logger = createLogger('build-analytics');

interface TagStats {
  name: string;
  count_total: number;
  count_posts: number;
  count_snippets: number;
}

interface HierarchyNode {
  path: string;
  name: string;
  parent: string | null;
  depth: number;
  count_total: number;
  count_posts: number;
  count_snippets: number;
}

interface TagsAnalyticsFile {
  generated_at: string;
  totals: {
    items: number;
    posts: number;
    snippets: number;
    unique_tags: number;
  };
  tags: TagStats[];
  cooccurrence: Array<{ tag_a: string; tag_b: string; count: number }>;
  hierarchy: HierarchyNode[];
}

interface RelationsAnalyticsFile {
  generated_at: string;
  totals: {
    nodes: number;
    edges: number;
    components: number;
  };
  nodes: Array<{
    id: string;
    type: 'post' | 'snippet';
    title: string;
    href: string;
    degree: number;
    degree_normalized: number;
    closeness: number;
    betweenness: number;
    betweenness_normalized: number;
    pagerank: number;
    component_id: number;
    component_size: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    kind: 'related';
  }>;
}

interface RelationNodeRecord {
  id: string;
  type: 'post' | 'snippet';
  title: string;
  href: string;
  degree: number;
  degree_normalized: number;
  closeness: number;
  betweenness: number;
  betweenness_normalized: number;
  pagerank: number;
  component_id: number;
  component_size: number;
}

function addTagCount(item: GeneratedIndexItem, tag: string, bucket: Map<string, TagStats>): void {
  const current = bucket.get(tag) ?? {
    name: tag,
    count_total: 0,
    count_posts: 0,
    count_snippets: 0
  };
  current.count_total += 1;
  if (item.type === 'post') current.count_posts += 1;
  else current.count_snippets += 1;
  bucket.set(tag, current);
}

function buildTagStats(items: GeneratedIndexItem[]): TagStats[] {
  const bucket = new Map<string, TagStats>();
  for (const item of items) {
    for (const tag of item.tags) {
      addTagCount(item, tag, bucket);
    }
  }
  return Array.from(bucket.values()).sort(
    (a, b) => b.count_total - a.count_total || a.name.localeCompare(b.name)
  );
}

function buildCooccurrence(items: GeneratedIndexItem[]): Array<{ tag_a: string; tag_b: string; count: number }> {
  const pairCounts = new Map<string, number>();
  for (const item of items) {
    const tags = uniqueSorted(item.tags);
    for (let i = 0; i < tags.length; i += 1) {
      for (let j = i + 1; j < tags.length; j += 1) {
        const key = `${tags[i]}|||${tags[j]}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }

  return Array.from(pairCounts.entries())
    .map(([key, count]) => {
      const [tag_a, tag_b] = key.split('|||');
      return { tag_a, tag_b, count };
    })
    .sort((a, b) => b.count - a.count || a.tag_a.localeCompare(b.tag_a) || a.tag_b.localeCompare(b.tag_b));
}

function buildHierarchy(tagStats: TagStats[]): HierarchyNode[] {
  const nodes = new Map<string, HierarchyNode>();

  function ensureNode(pathKey: string, parent: string | null, depth: number): HierarchyNode {
    const existing = nodes.get(pathKey);
    if (existing) return existing;
    const parts = pathKey.split('.');
    const node: HierarchyNode = {
      path: pathKey,
      name: parts[parts.length - 1] ?? pathKey,
      parent,
      depth,
      count_total: 0,
      count_posts: 0,
      count_snippets: 0
    };
    nodes.set(pathKey, node);
    return node;
  }

  for (const tag of tagStats) {
    const parts = tag.name.split('.');
    for (let depth = 1; depth <= parts.length; depth += 1) {
      const pathKey = parts.slice(0, depth).join('.');
      const parent = depth === 1 ? null : parts.slice(0, depth - 1).join('.');
      const node = ensureNode(pathKey, parent, depth);
      node.count_total += tag.count_total;
      node.count_posts += tag.count_posts;
      node.count_snippets += tag.count_snippets;
    }
  }

  return Array.from(nodes.values()).sort(
    (a, b) => a.depth - b.depth || b.count_total - a.count_total || a.path.localeCompare(b.path)
  );
}

function buildRelations(items: GeneratedIndexItem[]): RelationsAnalyticsFile {
  const nodeMap = new Map<string, RelationNodeRecord>(
    items.map((item) => [
      item.id,
      {
        id: item.id,
        type: item.type,
        title: item.title,
        href: `/view/${item.id}`,
        degree: 0,
        degree_normalized: 0,
        closeness: 0,
        betweenness: 0,
        betweenness_normalized: 0,
        pagerank: 0,
        component_id: 0,
        component_size: 1
      }
    ])
  );

  const edgeKeys = new Set<string>();
  const edges: Array<{ source: string; target: string; kind: 'related' }> = [];
  for (const item of items) {
    for (const related of item.related_ids) {
      if (!nodeMap.has(related) || related === item.id) continue;
      const [a, b] = [item.id, related].sort((x, y) => x.localeCompare(y));
      const key = `${a}|||${b}`;
      if (edgeKeys.has(key)) continue;
      edgeKeys.add(key);
      edges.push({ source: a, target: b, kind: 'related' });
    }
  }

  for (const edge of edges) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (source) source.degree += 1;
    if (target) target.degree += 1;
  }

  const adjacency = new Map<string, Set<string>>();
  for (const id of nodeMap.keys()) adjacency.set(id, new Set<string>());
  for (const edge of edges) {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }

  const componentByNode = new Map<string, number>();
  const componentSizes: number[] = [];
  let componentIndex = 0;
  for (const id of nodeMap.keys()) {
    if (componentByNode.has(id)) continue;
    const queue = [id];
    componentByNode.set(id, componentIndex);
    let size = 0;
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      size += 1;
      for (const next of adjacency.get(current) ?? []) {
        if (componentByNode.has(next)) continue;
        componentByNode.set(next, componentIndex);
        queue.push(next);
      }
    }
    componentSizes[componentIndex] = size;
    componentIndex += 1;
  }

  const cy = cytoscape({
    headless: true,
    elements: [
      ...Array.from(nodeMap.values()).map((node) => ({
        data: {
          id: node.id,
          type: node.type,
          title: node.title,
          href: node.href
        }
      })),
      ...edges.map((edge) => ({
        data: {
          id: `${edge.source}--${edge.target}`,
          source: edge.source,
          target: edge.target
        }
      }))
    ]
  });
  const all = cy.elements();
  const degreeNormalized = all.degreeCentralityNormalized({ directed: false, alpha: 0 });
  const closenessNormalized = all.closenessCentralityNormalized({ directed: false, harmonic: true });
  const betweenness = all.betweennessCentrality({ directed: false });
  const pageRank = all.pageRank({ dampingFactor: 0.85 });

  function metric(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.round(value * 1_000_000) / 1_000_000;
  }

  for (const node of nodeMap.values()) {
    const ele = cy.$id(node.id);
    node.degree = Math.round(node.degree);
    node.degree_normalized = metric(degreeNormalized.degree(ele));
    node.closeness = metric(closenessNormalized.closeness(ele));
    node.betweenness = metric(betweenness.betweenness(ele));
    node.betweenness_normalized = metric(betweenness.betweennessNormalized(ele));
    node.pagerank = metric(pageRank.rank(ele));
    const compId = componentByNode.get(node.id) ?? 0;
    node.component_id = compId;
    node.component_size = componentSizes[compId] ?? 1;
  }
  cy.destroy();

  return {
    generated_at: new Date().toISOString(),
    totals: { nodes: nodeMap.size, edges: edges.length, components: componentIndex },
    nodes: Array.from(nodeMap.values()).sort((a, b) => a.id.localeCompare(b.id)),
    edges
  };
}

async function main(): Promise<void> {
  const postsIndex = await readJsonFile<GeneratedIndexFile>(POSTS_INDEX_PATH);
  const snippetsIndex = await readJsonFile<GeneratedIndexFile>(SNIPPETS_INDEX_PATH);
  const items = [...postsIndex.items, ...snippetsIndex.items];
  const generatedAt = new Date().toISOString();

  const tagStats = buildTagStats(items);
  const tagsFile: TagsAnalyticsFile = {
    generated_at: generatedAt,
    totals: {
      items: items.length,
      posts: postsIndex.total,
      snippets: snippetsIndex.total,
      unique_tags: tagStats.length
    },
    tags: tagStats,
    cooccurrence: buildCooccurrence(items),
    hierarchy: buildHierarchy(tagStats)
  };

  const relationsFile = buildRelations(items);
  relationsFile.generated_at = generatedAt;

  await Promise.all([
    writeJsonFile(path.join(ANALYTICS_DIR, 'tags.json'), tagsFile),
    writeJsonFile(path.join(ANALYTICS_DIR, 'relations.json'), relationsFile)
  ]);

  logger.debug(
    `complete: ${tagsFile.tags.length} tags, ${relationsFile.totals.nodes} nodes, ${relationsFile.totals.edges} edges.`
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  logger.error(`failed: ${message}`);
  process.exitCode = 1;
});
