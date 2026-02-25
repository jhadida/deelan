/** @type {import('tailwindcss').Config} */
export default {
    corePlugins: {
    preflight: false
  },
  content: [
    './src/pages/posts/index.astro',
    './src/styles/tailwind-pilot.css'
  ]
};
