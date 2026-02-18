import type { Meta, StoryObj } from 'storybook-astro';
import Panel from '../components/ui/Panel.astro';

const meta = {
  title: 'UI/Panel',
  component: Panel,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text'
    }
  },
  parameters: {
    layout: 'centered'
  }
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Quick Explorer'
  }
};
