import type { Meta, StoryObj } from 'storybook-astro';
import Button from '../components/ui/Button.astro';

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'danger']
    },
    label: {
      control: 'text'
    },
    disabled: {
      control: 'boolean'
    }
  }
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    label: 'Save Changes',
    variant: 'primary',
    disabled: false
  }
};

export const Default: Story = {
  args: {
    label: 'Secondary Action',
    variant: 'default',
    disabled: false
  }
};

export const DangerDisabled: Story = {
  args: {
    label: 'Delete',
    variant: 'danger',
    disabled: true
  }
};
