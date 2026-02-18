import type { StorybookConfig } from 'storybook-astro';

const config: StorybookConfig = {
  stories: ['../src/stories/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: 'storybook-astro',
    options: {}
  },
  core: {
    builder: '@storybook/builder-vite'
  }
};

export default config;
