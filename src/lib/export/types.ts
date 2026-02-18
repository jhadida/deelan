import type { ContentFrontmatter } from '../content/schema';
import type { SiteTheme } from '../site-config';

export interface ExportItem {
  filePath: string;
  body: string;
  frontmatter: ContentFrontmatter;
}

export interface ExportContext {
  item: ExportItem;
  renderedHtml: string;
  outDir: string;
  theme?: SiteTheme;
}
