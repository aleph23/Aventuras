import type { Meta, StoryObj } from '@storybook/react-native-web-vite'
import { View } from 'react-native'

import { JSONBlock } from './json-block'

const meta: Meta<typeof JSONBlock> = {
  title: 'Primitives/JSONBlock',
  component: JSONBlock,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof JSONBlock>

const SAMPLE_OBJECT = {
  attempt: 2,
  latencyMs: 1840,
  status: 200,
  source: 'provider:anthropic-main',
}

export const Basic: Story = {
  render: () => (
    <View className="w-96 p-4">
      <JSONBlock data={SAMPLE_OBJECT} />
    </View>
  ),
}

export const NestedObject: Story = {
  render: () => (
    <View className="w-96 p-4">
      <JSONBlock
        data={{
          request: { method: 'POST', url: 'https://api.example.com/v1/messages' },
          response: { status: 200, body: { id: 'abc', tokens: 142 } },
        }}
      />
    </View>
  ),
}

export const CircularReference: Story = {
  render: () => {
    const circular: { self?: unknown; name: string } = { name: 'circular' }
    circular.self = circular
    return (
      <View className="w-96 p-4">
        <JSONBlock data={circular} />
      </View>
    )
  },
}

export const EmptyObject: Story = {
  render: () => (
    <View className="w-96 p-4">
      <JSONBlock data={{}} />
    </View>
  ),
}
