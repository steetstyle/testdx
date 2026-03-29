import { Card, Text, Grid, Select, NumberInput, Divider } from '@mantine/core';
import type { 
  DistributionConfig,
  UniformConfig,
  GaussianConfig,
  LinearRampConfig,
  ExponentialRampConfig,
  SineWaveConfig,
  SquareWaveConfig,
  TriangleWaveConfig,
  BurstConfig,
  PoissonConfig,
  ExponentialConfig,
  FixedConfig,
} from '../../../types';

const DISTRIBUTION_TYPE_OPTIONS = [
  { value: 'fixed', label: 'Fixed Rate' },
  { value: 'uniform', label: 'Uniform Random' },
  { value: 'gaussian', label: 'Gaussian (Normal)' },
  { value: 'linearRamp', label: 'Linear Ramp' },
  { value: 'exponentialRamp', label: 'Exponential Ramp' },
  { value: 'sine', label: 'Sine Wave' },
  { value: 'square', label: 'Square Wave' },
  { value: 'triangle', label: 'Triangle Wave' },
  { value: 'burst', label: 'Burst' },
  { value: 'poisson', label: 'Poisson' },
  { value: 'exponential', label: 'Exponential Decay' },
] as const;

type DistributionTypeOption = typeof DISTRIBUTION_TYPE_OPTIONS[number]['value'];

const getDefaultConfig = (type: DistributionTypeOption): DistributionConfig => {
  switch (type) {
    case 'fixed':
      return { type: 'fixed', rate: 10 };
    case 'uniform':
      return { type: 'uniform', min: 1, max: 10 };
    case 'gaussian':
      return { type: 'gaussian', mean: 10, stdDev: 2 };
    case 'linearRamp':
      return { type: 'linearRamp', start: 5, end: 20, duration: 1 };
    case 'exponentialRamp':
      return { type: 'exponentialRamp', start: 5, growth: 1.1, duration: 1 };
    case 'sine':
      return { type: 'sine', base: 10, amplitude: 5, period: 10, phase: 0 };
    case 'square':
      return { type: 'square', min: 5, max: 20, period: 10 };
    case 'triangle':
      return { type: 'triangle', min: 5, max: 20, period: 10 };
    case 'burst':
      return { type: 'burst', baseRate: 5, burstRate: 50, probability: 0.1 };
    case 'poisson':
      return { type: 'poisson', lambda: 10 };
    case 'exponential':
      return { type: 'exponential', lambda: 1 };
    default:
      return { type: 'fixed', rate: 10 };
  }
};

interface DistributionConfigProps {
  distribution: DistributionConfig;
  onChange: (updates: DistributionConfig) => void;
}

export function DistributionConfig({ distribution, onChange }: DistributionConfigProps) {
  const currentType = distribution.type;

  const handleTypeChange = (val: string | null) => {
    if (val) {
      const newConfig = getDefaultConfig(val as DistributionTypeOption);
      onChange(newConfig);
    }
  };

  const updateConfig = <K extends DistributionConfig>(updates: Partial<K>) => {
    onChange({ ...distribution, ...updates } as DistributionConfig);
  };

  return (
    <Card padding="md" radius="md" withBorder>
      <Text fw={500} mb="md" style={{ color: 'var(--color-text)' }}>Distribution Settings</Text>
      
      <Grid>
        <Grid.Col span={6}>
          <Select
            label="Distribution Type"
            data={DISTRIBUTION_TYPE_OPTIONS}
            value={currentType}
            onChange={handleTypeChange}
          />
        </Grid.Col>
      </Grid>

      <Divider my="md" />

      {currentType === 'fixed' && (
        <Grid>
          <Grid.Col span={6}>
            <NumberInput
              label="Rate (records/second)"
              value={(distribution as FixedConfig).rate}
              onChange={(val) => updateConfig<FixedConfig>({ rate: Number(val) || 10 })}
              min={1}
              description="Fixed rate for steady generation"
            />
          </Grid.Col>
        </Grid>
      )}

      {currentType === 'uniform' && (
        <Grid>
          <Grid.Col span={6}>
            <NumberInput
              label="Min Rate"
              value={(distribution as UniformConfig).min}
              onChange={(val) => updateConfig<UniformConfig>({ min: Number(val) || 1 })}
              min={1}
              description="Minimum random rate"
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              label="Max Rate"
              value={(distribution as UniformConfig).max}
              onChange={(val) => updateConfig<UniformConfig>({ max: Number(val) || 10 })}
              min={1}
              description="Maximum random rate"
            />
          </Grid.Col>
        </Grid>
      )}

      {currentType === 'gaussian' && (
        <Grid>
          <Grid.Col span={6}>
            <NumberInput
              label="Mean Rate"
              value={(distribution as GaussianConfig).mean}
              onChange={(val) => updateConfig<GaussianConfig>({ mean: Number(val) || 10 })}
              min={1}
              description="Average rate"
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              label="Std Deviation"
              value={(distribution as GaussianConfig).stdDev}
              onChange={(val) => updateConfig<GaussianConfig>({ stdDev: Number(val) || 2 })}
              min={0}
              description="Standard deviation"
            />
          </Grid.Col>
        </Grid>
      )}

      {currentType === 'linearRamp' && (
        <>
          <Grid>
            <Grid.Col span={4}>
              <NumberInput
                label="Start Rate"
                value={(distribution as LinearRampConfig).start}
                onChange={(val) => updateConfig<LinearRampConfig>({ start: Number(val) || 5 })}
                min={1}
                description="Starting rate"
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <NumberInput
                label="End Rate"
                value={(distribution as LinearRampConfig).end}
                onChange={(val) => updateConfig<LinearRampConfig>({ end: Number(val) || 20 })}
                min={1}
                description="Ending rate"
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <NumberInput
                label="Duration (% of scenario)"
                value={(distribution as LinearRampConfig).duration}
                onChange={(val) => updateConfig<LinearRampConfig>({ duration: Number(val) || 1 })}
                min={0.1}
                max={1}
                step={0.1}
                description="Duration as fraction of scenario"
              />
            </Grid.Col>
          </Grid>
        </>
      )}

      {currentType === 'exponentialRamp' && (
        <>
          <Grid>
            <Grid.Col span={4}>
              <NumberInput
                label="Start Rate"
                value={(distribution as ExponentialRampConfig).start}
                onChange={(val) => updateConfig<ExponentialRampConfig>({ start: Number(val) || 5 })}
                min={1}
                description="Starting rate"
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <NumberInput
                label="Growth Factor"
                value={(distribution as ExponentialRampConfig).growth}
                onChange={(val) => updateConfig<ExponentialRampConfig>({ growth: Number(val) || 1.1 })}
                min={1.01}
                max={10}
                step={0.1}
                description="Growth factor (default 1.1)"
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <NumberInput
                label="Duration (% of scenario)"
                value={(distribution as ExponentialRampConfig).duration}
                onChange={(val) => updateConfig<ExponentialRampConfig>({ duration: Number(val) || 1 })}
                min={0.1}
                max={1}
                step={0.1}
                description="Duration as fraction of scenario"
              />
            </Grid.Col>
          </Grid>
          <Grid mt="md">
            <Grid.Col span={6}>
              <NumberInput
                label="Max Rate (optional cap)"
                value={(distribution as ExponentialRampConfig).max ?? ''}
                onChange={(val) => updateConfig<ExponentialRampConfig>({ max: val ? Number(val) : undefined })}
                min={1}
                description="Maximum rate cap (leave empty for no cap)"
              />
            </Grid.Col>
          </Grid>
        </>
      )}

      {currentType === 'sine' && (
        <Grid>
          <Grid.Col span={3}>
            <NumberInput
              label="Base Rate"
              value={(distribution as SineWaveConfig).base ?? 10}
              onChange={(val) => updateConfig<SineWaveConfig>({ base: Number(val) || 10 })}
              min={1}
              description="Center of wave"
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <NumberInput
              label="Amplitude"
              value={(distribution as SineWaveConfig).amplitude ?? 5}
              onChange={(val) => updateConfig<SineWaveConfig>({ amplitude: Number(val) || 5 })}
              min={0}
              description="Wave height"
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <NumberInput
              label="Period (seconds)"
              value={(distribution as SineWaveConfig).period ?? 10}
              onChange={(val) => updateConfig<SineWaveConfig>({ period: Number(val) || 10 })}
              min={1}
              description="Seconds per cycle"
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <NumberInput
              label="Phase"
              value={(distribution as SineWaveConfig).phase ?? 0}
              onChange={(val) => updateConfig<SineWaveConfig>({ phase: Number(val) || 0 })}
              description="Phase offset (radians)"
            />
          </Grid.Col>
        </Grid>
      )}

      {currentType === 'square' && (
        <Grid>
          <Grid.Col span={4}>
            <NumberInput
              label="Min Rate"
              value={(distribution as SquareWaveConfig).min}
              onChange={(val) => updateConfig<SquareWaveConfig>({ min: Number(val) || 5 })}
              min={1}
              description="Low state rate"
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label="Max Rate"
              value={(distribution as SquareWaveConfig).max}
              onChange={(val) => updateConfig<SquareWaveConfig>({ max: Number(val) || 20 })}
              min={1}
              description="High state rate"
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label="Period (seconds)"
              value={(distribution as SquareWaveConfig).period}
              onChange={(val) => updateConfig<SquareWaveConfig>({ period: Number(val) || 10 })}
              min={1}
              description="Seconds per cycle"
            />
          </Grid.Col>
        </Grid>
      )}

      {currentType === 'triangle' && (
        <Grid>
          <Grid.Col span={4}>
            <NumberInput
              label="Min Rate"
              value={(distribution as TriangleWaveConfig).min}
              onChange={(val) => updateConfig<TriangleWaveConfig>({ min: Number(val) || 5 })}
              min={1}
              description="Minimum rate"
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label="Max Rate"
              value={(distribution as TriangleWaveConfig).max}
              onChange={(val) => updateConfig<TriangleWaveConfig>({ max: Number(val) || 20 })}
              min={1}
              description="Maximum rate"
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label="Period (seconds)"
              value={(distribution as TriangleWaveConfig).period}
              onChange={(val) => updateConfig<TriangleWaveConfig>({ period: Number(val) || 10 })}
              min={1}
              description="Seconds per cycle"
            />
          </Grid.Col>
        </Grid>
      )}

      {currentType === 'burst' && (
        <Grid>
          <Grid.Col span={4}>
            <NumberInput
              label="Base Rate"
              value={(distribution as BurstConfig).baseRate}
              onChange={(val) => updateConfig<BurstConfig>({ baseRate: Number(val) || 5 })}
              min={1}
              description="Normal rate"
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label="Burst Rate"
              value={(distribution as BurstConfig).burstRate}
              onChange={(val) => updateConfig<BurstConfig>({ burstRate: Number(val) || 50 })}
              min={1}
              description="Spike rate"
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <NumberInput
              label="Probability"
              value={(distribution as BurstConfig).probability ?? 0.1}
              onChange={(val) => updateConfig<BurstConfig>({ probability: Number(val) || 0.1 })}
              min={0.01}
              max={1}
              step={0.01}
              description="Burst probability"
            />
          </Grid.Col>
        </Grid>
      )}

      {currentType === 'poisson' && (
        <Grid>
          <Grid.Col span={6}>
            <NumberInput
              label="Lambda"
              value={(distribution as PoissonConfig).lambda}
              onChange={(val) => updateConfig<PoissonConfig>({ lambda: Number(val) || 10 })}
              min={0.1}
              description="Average arrivals per interval"
            />
          </Grid.Col>
        </Grid>
      )}

      {currentType === 'exponential' && (
        <Grid>
          <Grid.Col span={6}>
            <NumberInput
              label="Lambda"
              value={(distribution as ExponentialConfig).lambda}
              onChange={(val) => updateConfig<ExponentialConfig>({ lambda: Number(val) || 1 })}
              min={0.1}
              description="Decay parameter"
            />
          </Grid.Col>
        </Grid>
      )}
    </Card>
  );
}
