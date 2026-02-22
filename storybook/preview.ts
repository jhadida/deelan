import '../src/styles/global.css';
import { themes } from 'storybook/theming';

const preview = {
  parameters: {
    layout: 'padded',
    controls: {
      expanded: true
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'light', value: '#f5f4ef' },
        { name: 'dark', value: '#101312' }
      ]
    },
    docs: {
      theme: themes.dark
    }
  },
  globalTypes: {
    theme: {
      description: 'Theme for CSS variables',
      defaultValue: 'dark',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' }
        ],
        dynamicTitle: true
      }
    },
    accentHue: {
      description: 'Accent hue CSS variable',
      defaultValue: '156',
      toolbar: {
        title: 'Hue',
        icon: 'paintbrush',
        items: [
          { value: '156', title: 'Green (156)' },
          { value: '210', title: 'Blue (210)' },
          { value: '280', title: 'Violet (280)' },
          { value: '18', title: 'Orange (18)' },
          { value: '50', title: 'Gold (50)' }
        ],
        dynamicTitle: true
      }
    }
  },
  decorators: [
    (Story: () => unknown, context: { globals: { theme?: string; accentHue?: string } }) => {
      const theme = context.globals.theme ?? 'dark';
      const accentHue = context.globals.accentHue ?? '156';
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.setProperty('--accent-hue', accentHue);
        document.body?.setAttribute('data-theme', theme);
      }
      return Story();
    }
  ]
};

export default preview;
