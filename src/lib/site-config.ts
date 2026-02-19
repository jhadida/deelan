import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';

export type SiteTheme = 'light' | 'dark';

export interface SiteConfig {
  blog_title: string;
  footer_text: string;
  default_theme: SiteTheme;
  timezone: string;
  code_theme_light: string;
  code_theme_dark: string;
}

const DEFAULT_CONFIG: SiteConfig = {
  blog_title: 'DEELAN',
  footer_text: 'Built with love using DEELAN',
  default_theme: 'light',
  timezone: 'UTC',
  code_theme_light: 'github-light',
  code_theme_dark: 'github-dark'
};

let cached: SiteConfig | null = null;

function asTheme(value: unknown): SiteTheme {
  return value === 'dark' ? 'dark' : 'light';
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
      code_theme_light:
        typeof parsed.code_theme_light === 'string' && parsed.code_theme_light.trim().length > 0
          ? parsed.code_theme_light.trim()
          : DEFAULT_CONFIG.code_theme_light,
      code_theme_dark:
        typeof parsed.code_theme_dark === 'string' && parsed.code_theme_dark.trim().length > 0
          ? parsed.code_theme_dark.trim()
          : DEFAULT_CONFIG.code_theme_dark
    };

    return cached;
  } catch {
    cached = DEFAULT_CONFIG;
    return cached;
  }
}
