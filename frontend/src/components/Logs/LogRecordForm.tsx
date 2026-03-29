import { Grid, TextInput, Select } from '@mantine/core';
import type { LogRecord } from '../../types';

const severityOptions = [
  { value: 'Trace', label: 'Trace' },
  { value: 'Debug', label: 'Debug' },
  { value: 'Info', label: 'Info' },
  { value: 'Warn', label: 'Warn' },
  { value: 'Error', label: 'Error' },
  { value: 'Fatal', label: 'Fatal' },
];

const severityNumberMap: Record<string, number> = {
  Trace: 1,
  Debug: 5,
  Info: 9,
  Warn: 13,
  Error: 17,
  Fatal: 21,
};

interface LogRecordFormProps {
  log: LogRecord;
  onUpdate: (updates: Partial<LogRecord>) => void;
}

export function LogRecordForm({ log, onUpdate }: LogRecordFormProps) {
  const handleSeverityChange = (val: string | null) => {
    const severity = val || 'Info';
    const num = severityNumberMap[severity];
    onUpdate({ severityText: severity, severityNumber: num });
  };

  return (
    <Grid mt="sm">
      <Grid.Col span={8}>
        <TextInput
          label="Body"
          value={log.body}
          onChange={(e) => onUpdate({ body: e.target.value })}
          size="sm"
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <Select
          label="Severity"
          data={severityOptions}
          value={log.severityText}
          onChange={handleSeverityChange}
          size="sm"
        />
      </Grid.Col>
    </Grid>
  );
}