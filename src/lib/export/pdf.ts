import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

export async function exportPdf(htmlPath: string, outDir: string): Promise<string> {
  const absoluteHtmlPath = path.resolve(htmlPath);
  const exportDir = path.dirname(absoluteHtmlPath);
  const itemId = path.basename(exportDir);
  const pdfPath = path.resolve(outDir, itemId, `${itemId}.pdf`);

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
    await page.goto(pathToFileURL(absoluteHtmlPath).href, { waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(async () => {
      const mathJax = (window as unknown as { MathJax?: { typesetPromise?: () => Promise<void> } }).MathJax;
      if (mathJax?.typesetPromise) {
        await mathJax.typesetPromise();
      }
    });

    await page.pdf({
      path: pdfPath,
      printBackground: true,
      format: 'A4',
      margin: {
        top: '16mm',
        right: '14mm',
        bottom: '16mm',
        left: '14mm'
      }
    });

    return pdfPath;
  } finally {
    await browser.close();
  }
}
