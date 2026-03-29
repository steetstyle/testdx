import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import { renderWithMantine } from '../../test/setup';
import { LogPanel } from '../../components/OTelConfig/LogPanel';
import { defaultOTelConfig } from '../../components/OTelConfig/useOTelConfig';
import type { OtelSdkConfig } from '../../types';

vi.mock('../../components/OTelConfig/ExporterEditor', () => ({
  ExporterEditor: ({ exporters, onUpdate, signalName }: any) => (
    <div data-testid="exporter-editor" data-exporters={JSON.stringify(exporters)} data-signal={signalName}>
      ExporterEditor
    </div>
  ),
}));

describe('LogPanel', () => {
  const mockUpdateNested = vi.fn();
  let config: OtelSdkConfig;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderPanel = () => {
    return renderWithMantine(<LogPanel config={config} updateNested={mockUpdateNested} />);
  };

  beforeEach(() => {
    config = JSON.parse(JSON.stringify(defaultOTelConfig)) as OtelSdkConfig;
  });

  const getSelectInput = (label: string) => {
    const inputs = screen.getAllByLabelText(label);
    return inputs.find(el => el.getAttribute('aria-haspopup') === 'listbox') as HTMLInputElement | undefined;
  };

  const getFirstSwitch = () => {
    const switches = screen.getAllByRole('switch');
    return switches[0];
  };

  describe('renders all fields', () => {
    it('renders Enabled Switch', () => {
      renderPanel();
      expect(getFirstSwitch()).toBeInTheDocument();
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

    it('renders Max Attributes input', () => {
      renderPanel();
      expect(screen.getByLabelText('Max Attributes')).toBeInTheDocument();
    });

    it('renders Max Attributes Per Log Record input', () => {
      renderPanel();
      expect(screen.getByLabelText('Max Attributes Per Log Record')).toBeInTheDocument();
    });

    it('renders Max Log Records input', () => {
      renderPanel();
      expect(screen.getByLabelText('Max Log Records')).toBeInTheDocument();
    });

    it('renders ExporterEditor', () => {
      renderPanel();
      expect(screen.getByTestId('exporter-editor')).toBeInTheDocument();
    });
  });

  describe('displays correct values', () => {
    it('shows enabled switch checked when log is enabled', () => {
      config.log!.enabled = true;
      renderPanel();
      expect(getFirstSwitch()).toBeChecked();
    });

    it('shows enabled switch unchecked when log is disabled', () => {
      config.log!.enabled = false;
      renderPanel();
      expect(getFirstSwitch()).not.toBeChecked();
    });

    it('shows custom service name', () => {
      config.log!.serviceName = 'my-log-service';
      renderPanel();
      expect((screen.getByLabelText('Service Name') as HTMLInputElement).value).toBe('my-log-service');
    });

    it('shows custom endpoint', () => {
      config.log!.endpoint = 'http://custom:4318';
      renderPanel();
      expect((screen.getByLabelText('Endpoint') as HTMLInputElement).value).toBe('http://custom:4318');
    });

    it('shows default Max Attributes value', () => {
      renderPanel();
      expect((screen.getByLabelText('Max Attributes') as HTMLInputElement).value).toBe('100');
    });

    it('shows custom Max Attributes value', () => {
      config.log!.maxNumberOfAttributes = 200;
      renderPanel();
      expect((screen.getByLabelText('Max Attributes') as HTMLInputElement).value).toBe('200');
    });
  });

  describe('passes correct props to children', () => {
    it('passes signal name to ExporterEditor', () => {
      renderPanel();
      expect(screen.getByTestId('exporter-editor')).toHaveAttribute('data-signal', 'log');
    });
  });
});