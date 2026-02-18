import type { Meta, StoryObj } from 'storybook-astro';
import TimelineListDemo from '../components/ui/TimelineListDemo.astro';

const meta = {
  title: 'UI/TimelineItem',
  component: TimelineListDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered'
  }
} satisfies Meta<typeof TimelineListDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    commit: '17ab23ef',
    date: '2026-02-18',
    message: 'Refined metadata card rhythm and panel contrast.',
    author: 'Codex Agent'
  }
};
