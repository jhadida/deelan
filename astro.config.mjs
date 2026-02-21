import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://example.local',
  output: 'static',
  outDir: '.site-deelan',
  vite: {
    optimizeDeps: {
      include: ['chart.js/auto', 'cytoscape']
    }
  }
});
