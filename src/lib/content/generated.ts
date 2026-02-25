import fs from 'node:fs/promises';
import path from 'node:path';

export type GeneratedStatus = 'draft' | 'published' | 'archived';
export type GeneratedType = 'post' | 'snippet';

export interface GeneratedIndexItem {
  id: string;
  type: GeneratedType;
  title: string;
  description: string | null;
  version: string | null;
  status: GeneratedStatus | null;
  tags: string[];
  tag_ancestors: string[];
  related_ids: string[];
  created_at: string | null;
  updated_at: string | null;
  file_path: string;
  content_text: string;
}

export interface GeneratedIndexFile {
  generated_at: string;
  total: number;
  items: GeneratedIndexItem[];
}

export interface GeneratedTimelineEntry {
  commit: string;
  date: string;
  author: string;
  message: string;
}

export interface GeneratedTimelineItem {
  id: string;
  type: GeneratedType;
  path: string;
  version: string | null;
  created_at_override: string | null;
  updated_at_override: string | null;
  created_at_git: string | null;
  updated_at_git: string | null;
  effective_created_at: string | null;
  effective_updated_at: string | null;
  commit_count: number;
  timeline: GeneratedTimelineEntry[];
}

export interface GeneratedTimelineFile {
  generated_at: string;
  total: number;
  items: Record<string, GeneratedTimelineItem>;
}

export interface GeneratedTagStatsItem {
  name: string;
  count_total: number;
  count_posts: number;
  count_snippets: number;
}

export interface GeneratedTagHierarchyNode {
  path: string;
  name: string;
  parent: string | null;
  depth: number;
  count_total: number;
  count_posts: number;
  count_snippets: number;
}

export interface GeneratedTagsAnalyticsFile {
  generated_at: string;
  totals: {
    items: number;
    posts: number;
    snippets: number;
    unique_tags: number;
  };
  tags: GeneratedTagStatsItem[];
  cooccurrence: Array<{ tag_a: string; tag_b: string; count: number }>;
  hierarchy: GeneratedTagHierarchyNode[];
}

export interface GeneratedRelationsAnalyticsFile {
  generated_at: string;
  totals: {
    nodes: number;
    edges: number;
    components: number;
  };
  nodes: Array<{
    id: string;
    type: GeneratedType;
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

const ROOT = process.cwd();

async function readJsonOrDefault<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function loadPostsIndex(): Promise<GeneratedIndexFile> {
  return readJsonOrDefault(path.join(ROOT, '.generated', 'search', 'posts-index.json'), {
    generated_at: new Date(0).toISOString(),
    total: 0,
    items: []
  });
}

export async function loadSnippetsIndex(): Promise<GeneratedIndexFile> {
  return readJsonOrDefault(path.join(ROOT, '.generated', 'search', 'snippets-index.json'), {
    generated_at: new Date(0).toISOString(),
    total: 0,
    items: []
  });
}

export async function loadTimeline(): Promise<GeneratedTimelineFile> {
  return readJsonOrDefault(path.join(ROOT, '.generated', 'timeline', 'versions.json'), {
    generated_at: new Date(0).toISOString(),
    total: 0,
    items: {}
  });
}

export async function loadTagsAnalytics(): Promise<GeneratedTagsAnalyticsFile> {
  return readJsonOrDefault(path.join(ROOT, '.generated', 'analytics', 'tags.json'), {
    generated_at: new Date(0).toISOString(),
    totals: { items: 0, posts: 0, snippets: 0, unique_tags: 0 },
    tags: [],
    cooccurrence: [],
    hierarchy: []
  });
}

export async function loadRelationsAnalytics(): Promise<GeneratedRelationsAnalyticsFile> {
  return readJsonOrDefault(path.join(ROOT, '.generated', 'analytics', 'relations.json'), {
    generated_at: new Date(0).toISOString(),
    totals: { nodes: 0, edges: 0, components: 0 },
    nodes: [],
    edges: []
  });
}
