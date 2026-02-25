import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://example.local',
  output: 'static',
  outDir: '.site-deelan',
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['chart.js/auto', 'cytoscape']
    }
  }
});
