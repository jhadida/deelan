import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { createLogger } from './logger';

export type SiteTheme = 'light' | 'dark';

export interface SiteConfig {
  blog_title: string;
  footer_text: string;
  default_theme: SiteTheme;
  timezone: string;
  accent_hue: number;
  content_max_width: string;
  code_theme_light: string;
  code_theme_dark: string;
  timeline_commit_url_template: string;
  enable_posts_list_view: boolean;
}

const DEFAULT_CONFIG: SiteConfig = {
  blog_title: 'Deelan',
  footer_text: 'Built with love using Deelan',
  default_theme: 'dark',
  timezone: 'UTC',
  accent_hue: 150,
  content_max_width: '1100px',
  code_theme_light: 'github-light',
  code_theme_dark: 'github-dark',
  timeline_commit_url_template: '',
  enable_posts_list_view: false
};

const logger = createLogger('site-config');

let cached: SiteConfig | null = null;

// Resolve a config property value. If the value is absent (undefined/null) the
// default is returned silently. If it is present but fails validation, a warning
// is logged and the default is returned.
function resolve<T>(
  key: string,
  value: unknown,
  validate: (v: unknown) => T | null,
  fallback: T,
  description: string
): T {
  if (value === undefined || value === null) return fallback;
  const result = validate(value);
  if (result !== null) return result;
  logger.warn(`${key}: invalid value ${JSON.stringify(value)} (expected ${description}); using default.`);
  return fallback;
}

export async function getSiteConfig(): Promise<SiteConfig> {
  if (cached) return cached;

  const filePath = path.join(process.cwd(), 'deelan.config.yml');
  let parsed: Record<string, unknown> = {};

  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const loaded = yaml.load(raw) ?? {};
    if (typeof loaded !== 'object' || Array.isArray(loaded)) {
      logger.warn('deelan.config.yml: unexpected root structure (expected a YAML mapping); using defaults for all properties.');
    } else {
      parsed = loaded as Record<string, unknown>;
    }
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code !== 'ENOENT') {
      const detail = err instanceof Error ? err.message : String(err);
      logger.warn(`deelan.config.yml: could not be read or parsed (${detail}); using defaults for all properties.`);
    }
  }

  cached = {
    blog_title: resolve(
      'blog_title', parsed.blog_title,
      (v) => typeof v === 'string' && v.trim().length > 0 ? v.trim() : null,
      DEFAULT_CONFIG.blog_title, 'a non-empty string'
    ),
    footer_text: resolve(
      'footer_text', parsed.footer_text,
      (v) => typeof v === 'string' && v.trim().length > 0 ? v.trim() : null,
      DEFAULT_CONFIG.footer_text, 'a non-empty string'
    ),
    default_theme: resolve(
      'default_theme', parsed.default_theme,
      (v) => v === 'light' || v === 'dark' ? v : null,
      DEFAULT_CONFIG.default_theme, '"light" or "dark"'
    ),
    timezone: resolve(
      'timezone', parsed.timezone,
      (v) => typeof v === 'string' && v.trim().length > 0 ? v.trim() : null,
      DEFAULT_CONFIG.timezone, 'a non-empty string'
    ),
    accent_hue: resolve(
      'accent_hue', parsed.accent_hue,
      (v) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return null;
        return Math.max(0, Math.min(360, Math.round(n)));
      },
      DEFAULT_CONFIG.accent_hue, 'a number (0–360)'
    ),
    content_max_width: resolve(
      'content_max_width', parsed.content_max_width,
      (v) => {
        if (typeof v !== 'string') return null;
        const trimmed = v.trim();
        return /^[0-9]+(?:\.[0-9]+)?(?:px|rem|em|ch|vw|%)$/u.test(trimmed) ? trimmed : null;
      },
      DEFAULT_CONFIG.content_max_width, 'a CSS length (e.g. 1100px, 70rem)'
    ),
    code_theme_light: resolve(
      'code_theme_light', parsed.code_theme_light,
      (v) => typeof v === 'string' && v.trim().length > 0 ? v.trim() : null,
      DEFAULT_CONFIG.code_theme_light, 'a non-empty string (Shiki theme name)'
    ),
    code_theme_dark: resolve(
      'code_theme_dark', parsed.code_theme_dark,
      (v) => typeof v === 'string' && v.trim().length > 0 ? v.trim() : null,
      DEFAULT_CONFIG.code_theme_dark, 'a non-empty string (Shiki theme name)'
    ),
    timeline_commit_url_template: resolve(
      'timeline_commit_url_template', parsed.timeline_commit_url_template,
      (v) => typeof v === 'string' ? v.trim() : null,
      DEFAULT_CONFIG.timeline_commit_url_template, 'a string'
    ),
    enable_posts_list_view: resolve(
      'enable_posts_list_view', parsed.enable_posts_list_view,
      (v) => {
        if (typeof v === 'boolean') return v;
        if (typeof v === 'string') {
          const s = v.trim().toLowerCase();
          if (s === 'true') return true;
          if (s === 'false') return false;
        }
        return null;
      },
      DEFAULT_CONFIG.enable_posts_list_view, '"true" or "false"'
    )
  };

  return cached;
}
