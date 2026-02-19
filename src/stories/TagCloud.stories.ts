import type { Meta, StoryObj } from 'storybook-astro';
import TagCloudDemo from '../components/TagCloudDemo.astro';

const meta = {
  title: 'UI/TagCloud',
  component: TagCloudDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded'
  }
} satisfies Meta<typeof TagCloudDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    tags: ['data.lake.partitioning', 'python.pandas.groupby', 'reliability.monitoring']
  }
};
