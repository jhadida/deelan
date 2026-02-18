import type { Meta, StoryObj } from 'storybook-astro';
import MetaGrid from '../components/ui/MetaGrid.astro';

const meta = {
  title: 'UI/MetaGrid',
  component: MetaGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded'
  }
} satisfies Meta<typeof MetaGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Version', value: '1.0.0' },
      { label: 'Status', value: 'published' },
      { label: 'Tags', value: 'data.ingestion, reliability.monitoring' },
      { label: 'Created', value: '2026-02-10T08:30:00Z' },
      { label: 'Updated', value: '2026-02-12T16:20:00Z' },
      { label: 'Commits', value: '8' }
    ]
  }
};
