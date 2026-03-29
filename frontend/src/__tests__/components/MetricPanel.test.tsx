import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import { renderWithMantine } from '../../test/setup';
import { MetricPanel } from '../../components/OTelConfig/MetricPanel';
import { defaultOTelConfig } from '../../components/OTelConfig/useOTelConfig';
import type { OtelSdkConfig } from '../../types';

vi.mock('../../components/OTelConfig/ExporterEditor', () => ({
  ExporterEditor: ({ exporters, onUpdate, signalName }: any) => (
    <div data-testid="exporter-editor" data-exporters={JSON.stringify(exporters)} data-signal={signalName}>
      ExporterEditor
    </div>
  ),
}));

vi.mock('../../components/OTelConfig/ViewEditor', () => ({
  ViewEditor: ({ views, onUpdate }: any) => (
    <div data-testid="view-editor" data-views={JSON.stringify(views)}>
      ViewEditor
    </div>
  ),
}));

describe('MetricPanel', () => {
  const mockUpdateNested = vi.fn();
  let config: OtelSdkConfig;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderPanel = () => {
    return renderWithMantine(<MetricPanel config={config} updateNested={mockUpdateNested} />);
  };

  beforeEach(() => {
    config = JSON.parse(JSON.stringify(defaultOTelConfig)) as OtelSdkConfig;
  });

  const getSelectInput = (label: string) => {
    const inputs = screen.getAllByLabelText(label);
    return inputs.find(el => el.getAttribute('aria-haspopup') === 'listbox') as HTMLInputElement | undefined;
  };

  describe('renders all fields', () => {
    it('renders Enabled Switch', () => {
      renderPanel();
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('renders Service Name input', () => {
      renderPanel();
      expect(screen.getByLabelText('Service Name')).toBeInTheDocument();
    });

    it('renders Instrumentation Scope input', () => {
      renderPanel();
      expect(screen.getByLabelText('Instrumentation Scope')).toBeInTheDocument();
    });

    it('renders Endpoint input', () => {
      renderPanel();
      expect(screen.getByLabelText('Endpoint')).toBeInTheDocument();
    });

    it('renders Protocol select', () => {
      renderPanel();
      expect(getSelectInput('Protocol')).toBeInTheDocument();
    });

    it('renders Temporality select', () => {
      renderPanel();
      expect(getSelectInput('Temporality')).toBeInTheDocument();
    });

    it('renders Aggregation select', () => {
      renderPanel();
      expect(getSelectInput('Aggregation')).toBeInTheDocument();
    });

    it('renders Metric Reader select', () => {
      renderPanel();
      expect(getSelectInput('Metric Reader')).toBeInTheDocument();
    });

    it('renders ViewEditor', () => {
      renderPanel();
      expect(screen.getByTestId('view-editor')).toBeInTheDocument();
    });

    it('renders ExporterEditor', () => {
      renderPanel();
      expect(screen.getByTestId('exporter-editor')).toBeInTheDocument();
    });
  });

  describe('displays correct values', () => {
    it('shows enabled switch checked when metric is enabled', () => {
      config.metric!.enabled = true;
      renderPanel();
      expect(screen.getByRole('switch')).toBeChecked();
    });

    it('shows enabled switch unchecked when metric is disabled', () => {
      config.metric!.enabled = false;
      renderPanel();
      expect(screen.getByRole('switch')).not.toBeChecked();
    });

    it('shows custom service name', () => {
      config.metric!.serviceName = 'my-metric-service';
      renderPanel();
      expect((screen.getByLabelText('Service Name') as HTMLInputElement).value).toBe('my-metric-service');
    });

    it('shows custom endpoint', () => {
      config.metric!.endpoint = 'http://custom:4318';
      renderPanel();
      expect((screen.getByLabelText('Endpoint') as HTMLInputElement).value).toBe('http://custom:4318');
    });
  });
});