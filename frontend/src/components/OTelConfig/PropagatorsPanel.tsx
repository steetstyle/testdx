import { Stack, Select } from '@mantine/core';
import { PropagatorType, LogLevel } from '../../types';

interface PropagatorsPanelProps {
  config: {
    propagators?: { propagators?: string[] };
    logLevel?: string;
  };
  updateConfig: (path: string, val: unknown) => void;
}

export function PropagatorsPanel({ config, updateConfig }: PropagatorsPanelProps) {
  return (
    <Stack>
      <Select
        label="Propagators"
        data={[
          { value: PropagatorType.W3C, label: 'W3C' },
          { value: PropagatorType.B3, label: 'B3' },
          { value: PropagatorType.B3_SINGLE, label: 'B3 Single' },
          { value: PropagatorType.JAEGER, label: 'Jaeger' },
          { value: PropagatorType.XRAY, label: 'X-Ray' },
          { value: PropagatorType.OT_TRACE, label: 'OT Trace' },
        ]}
        value={config.propagators?.propagators?.[0] || PropagatorType.W3C}
        onChange={(val) => updateConfig('propagators.propagators', [val])}
      />
      <Select
        label="Log Level"
        data={[
          { value: LogLevel.DEBUG, label: 'Debug' },
          { value: LogLevel.INFO, label: 'Info' },
          { value: LogLevel.WARN, label: 'Warn' },
          { value: LogLevel.ERROR, label: 'Error' },
        ]}
        value={config.logLevel || LogLevel.INFO}
        onChange={(val) => updateConfig('logLevel', val)}
      />
    </Stack>
  );
}