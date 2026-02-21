import { validateTags } from '@/lib/tags/validate';
import { toPosixPath } from '@/lib/util';

export type ContentType = 'post' | 'snippet';

const ALLOWED_TYPES: ReadonlySet<string> = new Set(['post', 'snippet']);
const ALLOWED_STATUS: ReadonlySet<string> = new Set(['draft', 'published', 'archived']);
const ID_REGEX = /^(post|snippet)--[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FILE_NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;

interface ContentFrontmatterBase {
  id: string;
  type: ContentType;
  title: string;
  tags: string[];
  description?: string;
  related_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface PostFrontmatter extends ContentFrontmatterBase {
  type: 'post';
  version: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface SnippetFrontmatter extends ContentFrontmatterBase {
  type: 'snippet';
}

export type ContentFrontmatter = PostFrontmatter | SnippetFrontmatter;

export interface ValidatedContent {
  filePath: string;
  body: string;
  frontmatter: ContentFrontmatter;
}

interface ValidationResult {
  value?: ContentFrontmatter;
  errors: string[];
}

export interface ContentIdentity {
  type: ContentType;
  id: string;
  fileName: string;
  validFileName: boolean;
  warning?: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoDate(value: string): boolean {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

function ensureStringArray(value: unknown, field: string, errors: string[]): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    errors.push(`field \`${field}\` must be an array of strings.`);
    return undefined;
  }
  const nonStrings = value.filter((item) => typeof item !== 'string');
  if (nonStrings.length > 0) {
    errors.push(`field \`${field}\` must only contain strings.`);
    return undefined;
  }
  return value;
}

export function validateFrontmatter(
  data: unknown,
  filePath: string,
  expectedType: ContentType,
  generatedId: string
): ValidationResult {
  const errors: string[] = [];

  if (!isObject(data)) {
    return { errors: ['frontmatter must be a YAML object.'] };
  }

  const allowedFields =
    expectedType === 'post'
      ? new Set([
          'type',
          'title',
          'tags',
          'version',
          'description',
          'related_ids',
          'created_at',
          'updated_at',
          'status'
        ])
      : new Set(['type', 'title', 'tags', 'description', 'related_ids', 'created_at', 'updated_at']);

  for (const key of Object.keys(data)) {
    if (!allowedFields.has(key)) {
      errors.push(`unknown frontmatter field \`${key}\`.`);
    }
  }

  const type = data.type;
  if (type !== undefined) {
    if (typeof type !== 'string' || !ALLOWED_TYPES.has(type)) {
      errors.push('field `type` must be `post` or `snippet` when provided.');
    } else if (type !== expectedType) {
      errors.push(`field \`type\` must be \`${expectedType}\` for this path.`);
    }
  }

  const title = data.title;
  if (typeof title !== 'string' || title.trim().length === 0) {
    errors.push('field `title` is required and must be a non-empty string.');
  }

  if (expectedType === 'post') {
    const version = data.version;
    if (typeof version !== 'string' || version.trim().length === 0) {
      errors.push('field `version` is required for posts and must be a non-empty string.');
    }
  }

  const tags = ensureStringArray(data.tags, 'tags', errors);
  if (!tags || tags.length === 0) {
    errors.push('field `tags` is required and must be a non-empty array.');
  } else {
    const invalidTags = validateTags(tags);
    if (invalidTags.length > 0) {
      errors.push(
        `field \`tags\` contains invalid hierarchical tag(s): ${invalidTags.join(', ')}.`
      );
    }
  }

  const relatedIds = ensureStringArray(data.related_ids, 'related_ids', errors);
  if (relatedIds) {
    const invalidRelatedIds = relatedIds.filter((value) => !ID_REGEX.test(value));
    if (invalidRelatedIds.length > 0) {
      errors.push(
        `field \`related_ids\` contains invalid id(s): ${invalidRelatedIds.join(', ')}.`
      );
    }
  }

  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push('field `description` must be a string when provided.');
  }

  if (data.created_at !== undefined) {
    if (typeof data.created_at !== 'string' || !isIsoDate(data.created_at)) {
      errors.push('field `created_at` must be an ISO-compatible datetime string when provided.');
    }
  }

  if (data.updated_at !== undefined) {
    if (typeof data.updated_at !== 'string' || !isIsoDate(data.updated_at)) {
      errors.push('field `updated_at` must be an ISO-compatible datetime string when provided.');
    }
  }

  if (data.status !== undefined) {
    if (typeof data.status !== 'string' || !ALLOWED_STATUS.has(data.status)) {
      errors.push('field `status` must be one of `draft`, `published`, `archived` when provided.');
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  if (expectedType === 'post') {
    return {
      errors,
      value: {
        id: generatedId,
        type: 'post',
        title: title as string,
        tags: tags as string[],
        version: (data.version as string).trim(),
        description: data.description as string | undefined,
        related_ids: relatedIds,
        created_at: data.created_at as string | undefined,
        updated_at: data.updated_at as string | undefined,
        status: data.status as 'draft' | 'published' | 'archived' | undefined
      }
    };
  }

  return {
    errors,
    value: {
      id: generatedId,
      type: 'snippet',
      title: title as string,
      tags: tags as string[],
      description: data.description as string | undefined,
      related_ids: relatedIds,
      created_at: data.created_at as string | undefined,
      updated_at: data.updated_at as string | undefined
    }
  };
}

export function inferTypeFromPath(filePath: string): ContentType | null {
  const normalized = toPosixPath(filePath);
  if (normalized.includes('/content/posts/') || normalized.startsWith('content/posts/')) return 'post';
  if (normalized.includes('/content/snippets/') || normalized.startsWith('content/snippets/')) return 'snippet';
  return null;
}

export function inferContentIdentity(filePath: string): ContentIdentity | null {
  const type = inferTypeFromPath(filePath);
  if (!type) return null;

  const normalized = toPosixPath(filePath);
  const fileName = normalized.split('/').at(-1) ?? '';
  if (!FILE_NAME_REGEX.test(fileName)) {
    return {
      type,
      id: '',
      fileName,
      validFileName: false,
      warning:
        'invalid filename. Expected lowercase kebab-case with a single .md extension (e.g. my-item.md).'
    };
  }

  const slug = fileName.slice(0, -3);
  return {
    type,
    id: `${type}--${slug}`,
    fileName,
    validFileName: true
  };
}
