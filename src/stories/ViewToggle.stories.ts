import type { Meta, StoryObj } from 'storybook-astro';
import ViewToggleDemo from '../components/ViewToggleDemo.astro';

const meta = {
  title: 'UI/ViewToggle',
  component: ViewToggleDemo,
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'inline-radio',
      options: ['table', 'list']
    }
  },
  parameters: {
    layout: 'centered'
  }
} satisfies Meta<typeof ViewToggleDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Table: Story = {
  args: {
    mode: 'table'
  }
};

export const List: Story = {
  args: {
    mode: 'list'
  }
};
