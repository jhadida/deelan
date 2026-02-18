import fs from 'node:fs/promises';
import path from 'node:path';

export type GeneratedStatus = 'draft' | 'published' | 'archived';
export type GeneratedType = 'post' | 'snippet';

export interface GeneratedIndexItem {
  id: string;
  type: GeneratedType;
  title: string;
  summary: string | null;
  notes: string | null;
  version: string;
  status: GeneratedStatus;
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
  version: string;
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
