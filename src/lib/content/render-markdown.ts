import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import { codeToHtml } from 'shiki';
import { getSiteConfig } from '../site-config';

let initialized = false;
let shikiLightTheme = 'github-light';
let shikiDarkTheme = 'github-dark';

function normalizeLang(lang: string | undefined): string {
  const candidate = (lang ?? 'text').trim();
  if (!candidate) return 'text';
  return candidate;
}

function unwrapNestedShiki(input: string): string {
  return input.replace(
    /<pre><code class="language-[^"]*">([\s\S]*?<pre class="shiki[\s\S]*?<\/pre>[\s\S]*?)<\/code><\/pre>/g,
    '$1'
  );
}

export async function renderMarkdown(markdown: string): Promise<string> {
  if (!initialized) {
    const config = await getSiteConfig();
    shikiLightTheme = config.code_theme_light;
    shikiDarkTheme = config.code_theme_dark;

    marked.setOptions({ gfm: true, breaks: false });
    marked.use(
      markedHighlight({
        async: true,
        highlight: async (code, lang) => {
          const language = normalizeLang(lang);
          try {
            return await codeToHtml(code, {
              lang: language,
              themes: {
                light: shikiLightTheme,
                dark: shikiDarkTheme
              },
              defaultColor: 'light'
            });
          } catch {
            return await codeToHtml(code, {
              lang: 'text',
              themes: {
                light: 'github-light',
                dark: 'github-dark'
              },
              defaultColor: 'light'
            });
          }
        }
      })
    );
    initialized = true;
  }

  const out = await marked.parse(markdown, { async: true });
  const html = typeof out === 'string' ? out : String(out);
  return unwrapNestedShiki(html);
}
