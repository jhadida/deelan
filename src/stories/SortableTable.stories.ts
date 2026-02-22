import type { Meta, StoryObj } from 'storybook-astro';
import SortableTableDemo from '../components/SortableTableDemo.astro';

const meta = {
  title: 'UI/SortableTable',
  component: SortableTableDemo,
  tags: ['autodocs'],
  argTypes: {
    sortedBy: {
      control: 'inline-radio',
      options: ['title', 'date']
    },
    direction: {
      control: 'inline-radio',
      options: ['asc', 'desc']
    }
  },
  parameters: {
    layout: 'padded'
  }
} satisfies Meta<typeof SortableTableDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ByDateDesc: Story = {
  args: {
    sortedBy: 'date',
    direction: 'desc'
  }
};

export const ByTitleAsc: Story = {
  args: {
    sortedBy: 'title',
    direction: 'asc'
  }
};

