import '../src/styles/global.css';

const preview = {
  parameters: {
    layout: 'padded',
    controls: {
      expanded: true
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f5f4ef' },
        { name: 'dark', value: '#101312' }
      ]
    }
  },
  globalTypes: {
    theme: {
      description: 'Theme for CSS variables',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' }
        ],
        dynamicTitle: true
      }
    }
  },
  decorators: [
    (Story: () => unknown, context: { globals: { theme?: string } }) => {
      const theme = context.globals.theme ?? 'light';
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
      }
      return Story();
    }
  ]
};

export default preview;
