import type { Meta, StoryObj } from 'storybook-astro';
import SearchShellDemo from '../components/SearchShellDemo.astro';

const meta = {
  title: 'UI/SearchShell',
  component: SearchShellDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded'
  }
} satisfies Meta<typeof SearchShellDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {}
};
