import type { Meta, StoryObj } from 'storybook-astro';
import SearchShellDemo from '../components/SearchShellDemo.astro';

const meta = {
  title: 'UI/SearchShell',
  component: SearchShellDemo,
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'inline-radio',
      options: ['simple', 'advanced']
    }
  },
  parameters: {
    layout: 'padded'
  }
} satisfies Meta<typeof SearchShellDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {
  args: {
    mode: 'simple'
  }
};

export const Advanced: Story = {
  args: {
    mode: 'advanced'
  }
};
