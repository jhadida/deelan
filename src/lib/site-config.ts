import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';

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
}

const DEFAULT_CONFIG: SiteConfig = {
  blog_title: 'DEELAN',
  footer_text: 'Built with love using DEELAN',
  default_theme: 'light',
  timezone: 'UTC',
  accent_hue: 150,
  content_max_width: '1100px',
  code_theme_light: 'github-light',
  code_theme_dark: 'github-dark',
  timeline_commit_url_template: ''
};

let cached: SiteConfig | null = null;

function asTheme(value: unknown): SiteTheme {
  return value === 'dark' ? 'dark' : 'light';
}

function asAccentHue(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_CONFIG.accent_hue;
  const clamped = Math.max(0, Math.min(360, Math.round(parsed)));
  return clamped;
}

function asCssLength(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_CONFIG.content_max_width;
  const trimmed = value.trim();
  if (!trimmed) return DEFAULT_CONFIG.content_max_width;
  if (!/^[0-9]+(?:\.[0-9]+)?(?:px|rem|em|ch|vw|%)$/u.test(trimmed)) {
    return DEFAULT_CONFIG.content_max_width;
  }
  return trimmed;
}

export async function getSiteConfig(): Promise<SiteConfig> {
  const filePath = path.join(process.cwd(), 'deelan.config.yml');

  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = (yaml.load(raw) ?? {}) as Record<string, unknown>;

    cached = {
      blog_title:
        typeof parsed.blog_title === 'string' && parsed.blog_title.trim().length > 0
          ? parsed.blog_title.trim()
          : DEFAULT_CONFIG.blog_title,
      footer_text:
        typeof parsed.footer_text === 'string' && parsed.footer_text.trim().length > 0
          ? parsed.footer_text.trim()
          : DEFAULT_CONFIG.footer_text,
      default_theme: asTheme(parsed.default_theme),
      timezone:
        typeof parsed.timezone === 'string' && parsed.timezone.trim().length > 0
          ? parsed.timezone.trim()
          : DEFAULT_CONFIG.timezone,
      accent_hue: asAccentHue(parsed.accent_hue),
      content_max_width: asCssLength(parsed.content_max_width),
      code_theme_light:
        typeof parsed.code_theme_light === 'string' && parsed.code_theme_light.trim().length > 0
          ? parsed.code_theme_light.trim()
          : DEFAULT_CONFIG.code_theme_light,
      code_theme_dark:
        typeof parsed.code_theme_dark === 'string' && parsed.code_theme_dark.trim().length > 0
          ? parsed.code_theme_dark.trim()
          : DEFAULT_CONFIG.code_theme_dark,
      timeline_commit_url_template:
        typeof parsed.timeline_commit_url_template === 'string'
          ? parsed.timeline_commit_url_template.trim()
          : DEFAULT_CONFIG.timeline_commit_url_template
    };

    return cached;
  } catch {
    cached = DEFAULT_CONFIG;
    return cached;
  }
}
