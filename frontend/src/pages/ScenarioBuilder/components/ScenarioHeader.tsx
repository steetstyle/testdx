import { Link } from 'react-router-dom';
import { Box, Group, Title, Text, Button, ActionIcon } from '@mantine/core';
import { ArrowLeft, Save, Play, Download } from 'lucide-react';

interface ScenarioHeaderProps {
  isEditing: boolean;
  onSave: () => void;
  onRun: () => void;
  onExport: () => void;
  saving?: boolean;
}

export function ScenarioHeader({
  isEditing,
  onSave,
  onRun,
  onExport,
  saving = false,
}: ScenarioHeaderProps) {
  return (
    <Box
      component="header"
      style={{
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-header)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Group justify="space-between" p="md" maw={1400} mx="auto">
        <Group>
          <ActionIcon variant="subtle" component={Link} to="/synthetic" size="lg">
            <ArrowLeft size={20} />
          </ActionIcon>
          <div>
            <Title order={3} style={{ color: 'var(--color-text)' }}>
              {isEditing ? 'Edit Scenario' : 'New Scenario'}
            </Title>
            <Text size="sm" c="dimmed">
              Configure telemetry generation
            </Text>
          </div>
        </Group>
        <Group>
          <Button variant="secondary" leftSection={<Download size={16} />} onClick={onExport}>
            Export
          </Button>
          <Button variant="secondary" leftSection={<Save size={16} />} onClick={onSave} loading={saving}>
            Save
          </Button>
          <Button variant="primary" leftSection={<Play size={16} />} onClick={onRun} loading={saving}>
            Run
          </Button>
        </Group>
      </Group>
    </Box>
  );
}
