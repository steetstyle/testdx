import { Card, Text, Grid, TextInput } from '@mantine/core';

interface ScenarioDetailsCardProps {
  name: string;
  description: string;
  onChange: (updates: { name?: string; description?: string }) => void;
}

export function ScenarioDetailsCard({ name, description, onChange }: ScenarioDetailsCardProps) {
  return (
    <Card padding="md" radius="md" withBorder>
      <Text fw={500} mb="md" style={{ color: 'var(--color-text)' }}>Scenario Details</Text>
      <Grid>
        <Grid.Col span={6}>
          <TextInput
            label="Name"
            value={name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="My Scenario"
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput
            label="Description"
            value={description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Optional description"
          />
        </Grid.Col>
      </Grid>
    </Card>
  );
}
