import type { Meta, StoryObj } from 'storybook-astro';
import RelatedList from '../components/RelatedList.astro';

const baseItems = [
  { id: 'post--partitioning-primer', title: 'Partitioning Primer', href: '/view/post--partitioning-primer' },
  {
    id: 'snippet--pandas-groupby-snippet',
    title: 'Pandas GroupBy Snippet',
    href: '/view/snippet--pandas-groupby-snippet'
  }
];

const meta = {
  title: 'UI/RelatedList',
  component: RelatedList,
  tags: ['autodocs'],
  argTypes: {
    showIds: { control: 'boolean' },
    emptyText: { control: 'text' }
  },
  parameters: {
    layout: 'padded'
  }
} satisfies Meta<typeof RelatedList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: baseItems,
    showIds: false,
    emptyText: 'No related items.'
  }
};

export const WithIds: Story = {
  args: {
    items: baseItems,
    showIds: true,
    emptyText: 'No related items.'
  }
};

export const Empty: Story = {
  args: {
    items: [],
    showIds: false,
    emptyText: 'No related content yet.'
  }
};
