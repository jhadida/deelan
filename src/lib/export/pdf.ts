import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

export async function exportPdf(htmlPath: string, outDir: string, options?: { scale?: number }): Promise<string> {
  const absoluteHtmlPath = path.resolve(htmlPath);
  const exportDir = path.dirname(absoluteHtmlPath);
  const itemId = path.basename(exportDir);
  const pdfPath = path.resolve(outDir, itemId, `${itemId}.pdf`);
  const scale = options?.scale ?? 1;

  let browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to launch Chromium for PDF export. ${message}\nRun: npx playwright install chromium`
    );
  }

  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(absoluteHtmlPath).href, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => undefined);
    await page.emulateMedia({ media: 'print' });
    await page
      .evaluate(async () => {
        const mathJax = (window as unknown as { MathJax?: { typesetPromise?: () => Promise<void> } }).MathJax;
        if (mathJax?.typesetPromise) {
          await Promise.race([
            mathJax.typesetPromise(),
            new Promise((resolve) => setTimeout(resolve, 10000))
          ]);
        }
      })
      .catch(() => undefined);

    await page.pdf({
      path: pdfPath,
      printBackground: true,
      format: 'A4',
      preferCSSPageSize: true,
      scale,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      }
    });

    return pdfPath;
  } finally {
    await browser.close();
  }
}
