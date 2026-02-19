import type { Meta, StoryObj } from 'storybook-astro';
import ThemeToggle from '../components/ThemeToggle.astro';

const meta = {
  title: 'UI/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  argTypes: {
    currentTheme: {
      control: 'inline-radio',
      options: ['light', 'dark']
    }
  },
  parameters: {
    layout: 'centered'
  }
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LightMode: Story = {
  args: {
    currentTheme: 'light',
    id: 'theme-toggle-story-light'
  }
};

export const DarkMode: Story = {
  args: {
    currentTheme: 'dark',
    id: 'theme-toggle-story-dark'
  }
};
