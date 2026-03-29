import { Card, Text, Switch, TextInput } from '@mantine/core';
import type { ScheduleConfig } from '../../../types';

interface ScheduleConfigProps {
  schedule: ScheduleConfig;
  onChange: (updates: Partial<ScheduleConfig>) => void;
}

export function ScheduleConfig({ schedule, onChange }: ScheduleConfigProps) {
  return (
    <Card padding="md" radius="md" withBorder>
      <Text fw={500} mb="md" style={{ color: 'var(--color-text)' }}>Schedule</Text>
      <Switch
        label="Enable scheduled runs"
        checked={schedule.enabled}
        onChange={(e) => onChange({ enabled: e.currentTarget.checked })}
      />
      {schedule.enabled && (
        <TextInput
          label="Cron Expression"
          value={schedule.cronExpression || '* * * * *'}
          onChange={(e) => onChange({ cronExpression: e.target.value })}
          mt="sm"
          description="minute hour day month weekday"
        />
      )}
    </Card>
  );
}
