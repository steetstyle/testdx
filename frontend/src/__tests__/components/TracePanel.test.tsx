import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithMantine } from '../../test/setup';
import { TracePanel } from '../../components/OTelConfig/TracePanel';
import { defaultOTelConfig } from '../../components/OTelConfig/useOTelConfig';
import type { OtelSdkConfig } from '../../types';
import {
  OtelProtocol,
  CompressionType,
  SamplerType,
  SpanProcessorType,
} from '../../types';

vi.mock('../../components/OTelConfig/ExporterEditor', () => ({
  ExporterEditor: ({ exporters, onUpdate, signalName }: any) => (
    <div data-testid="exporter-editor" data-exporters={JSON.stringify(exporters)} data-signal={signalName}>
      <button data-testid="add-exporter" onClick={() => onUpdate([...exporters, { type: 'otlp', endpoint: 'http://localhost:4318' }])}>
        Add Exporter
      </button>
    </div>
  ),
}));

describe('TracePanel', () => {
  const mockUpdateNested = vi.fn();
  let config: OtelSdkConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    config = JSON.parse(JSON.stringify(defaultOTelConfig)) as OtelSdkConfig;
  });

  const renderPanel = () => {
    return renderWithMantine(<TracePanel config={config} updateNested={mockUpdateNested} />);
  };

  describe('Enabled Switch', () => {
    it('renders with enabled switch checked when trace is enabled', () => {
      config.trace!.enabled = true;
      renderPanel();
      
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toBeChecked();
    });

    it('renders with enabled switch unchecked when trace is disabled', () => {
      config.trace!.enabled = false;
      renderPanel();
      
      const switchEl = screen.getByRole('switch');
      expect(switchEl).not.toBeChecked();
    });

    it('calls updateNested when switch is toggled from enabled', () => {
      config.trace!.enabled = true;
      renderPanel();
      
      const switchEl = screen.getByRole('switch');
      fireEvent.click(switchEl);
      
      expect(mockUpdateNested).toHaveBeenCalledWith('trace', 'enabled', false);
    });

    it('calls updateNested when switch is toggled from disabled', () => {
      config.trace!.enabled = false;
      renderPanel();
      
      const switchEl = screen.getByRole('switch');
      fireEvent.click(switchEl);
      
      expect(mockUpdateNested).toHaveBeenCalledWith('trace', 'enabled', true);
    });
  });

  describe('Basic Settings - TextInputs', () => {
    describe('Service Name', () => {
      it('renders with current service name value', () => {
        config.trace!.serviceName = 'my-custom-service';
        renderPanel();
        
        const input = screen.getByLabelText('Service Name') as HTMLInputElement;
        expect(input.value).toBe('my-custom-service');
      });

      it('renders with default service name', () => {
        renderPanel();
        
        const input = screen.getByLabelText('Service Name') as HTMLInputElement;
        expect(input.value).toBe('synthetic-service');
      });

      it('calls updateNested when service name changes', () => {
        renderPanel();
        
        const input = screen.getByLabelText('Service Name');
        fireEvent.change(input, { target: { value: 'new-service-name' } });
        
        expect(mockUpdateNested).toHaveBeenCalledWith('trace', 'serviceName', 'new-service-name');
      });
    });

    describe('Instrumentation Scope', () => {
      it('renders with current instrumentation scope value', () => {
        config.trace!.instrumentationScopeName = 'my-instrumentation';
        renderPanel();
        
        const input = screen.getByLabelText('Instrumentation Scope') as HTMLInputElement;
        expect(input.value).toBe('my-instrumentation');
      });

      it('calls updateNested when instrumentation scope changes', () => {
        renderPanel();
        
        const input = screen.getByLabelText('Instrumentation Scope');
        fireEvent.change(input, { target: { value: 'new-scope' } });
        
        expect(mockUpdateNested).toHaveBeenCalledWith('trace', 'instrumentationScopeName', 'new-scope');
      });
    });

    describe('Endpoint', () => {
      it('renders with current endpoint value', () => {
        config.trace!.endpoint = 'http://custom.endpoint:4317';
        renderPanel();
        
        const input = screen.getByLabelText('Endpoint') as HTMLInputElement;
        expect(input.value).toBe('http://custom.endpoint:4317');
      });

      it('renders with default endpoint', () => {
        renderPanel();
        
        const input = screen.getByLabelText('Endpoint') as HTMLInputElement;
        expect(input.value).toBe('http://localhost:4318');
      });

      it('calls updateNested when endpoint changes', () => {
        renderPanel();
        
        const input = screen.getByLabelText('Endpoint');
        fireEvent.change(input, { target: { value: 'http://new.endpoint:4318' } });
        
        expect(mockUpdateNested).toHaveBeenCalledWith('trace', 'endpoint', 'http://new.endpoint:4318');
      });
    });
  });

  describe('Basic Settings - NumberInputs', () => {
    describe('Timeout', () => {
      it('renders with default timeout value', () => {
        renderPanel();
        
        const input = screen.getByLabelText('Timeout (ms)') as HTMLInputElement;
        expect(input.value).toBe('30000');
      });

      it('renders with custom timeout value', () => {
        config.trace!.timeout = 60000;
        renderPanel();
        
        const input = screen.getByLabelText('Timeout (ms)') as HTMLInputElement;
        expect(input.value).toBe('60000');
      });

      it('calls updateNested when timeout changes', () => {
        renderPanel();
        
        const input = screen.getByLabelText('Timeout (ms)');
        fireEvent.change(input, { target: { value: '60000' } });
        
        expect(mockUpdateNested).toHaveBeenCalledWith('trace', 'timeout', 60000);
      });
    });
  });

  describe('Sampling - NumberInputs', () => {
    describe('Sampler Param', () => {
      it('renders with default sampler param value', () => {
        renderPanel();
        
        const input = screen.getByLabelText('Sampler Param') as HTMLInputElement;
        expect(input.value).toBe('1');
      });

      it('renders with custom sampler param value', () => {
        config.trace!.samplerParam = 0.5;
        renderPanel();
        
        const input = screen.getByLabelText('Sampler Param') as HTMLInputElement;
        expect(input.value).toBe('0.5');
      });

      it('calls updateNested when sampler param changes', () => {
        renderPanel();
        
        const input = screen.getByLabelText('Sampler Param');
        fireEvent.change(input, { target: { value: '0.5' } });
        
        expect(mockUpdateNested).toHaveBeenCalledWith('trace', 'samplerParam', 0.5);
      });

      it('calls updateNested with 0 for zero sampler param', () => {
        renderPanel();
        
        const input = screen.getByLabelText('Sampler Param');
        fireEvent.change(input, { target: { value: '0' } });
        
        expect(mockUpdateNested).toHaveBeenCalledWith('trace', 'samplerParam', 0);
      });
    });
  });

  describe('Span Processing - Batch Config', () => {
    describe('Shows Batch Config when BATCH processor selected', () => {
      it('renders batch config fields when BATCH processor is selected', () => {
        config.trace!.spanProcessor = SpanProcessorType.BATCH;
        renderPanel();
        
        expect(screen.getByLabelText('Max Queue Size')).toBeInTheDocument();
        expect(screen.getByLabelText('Max Export Batch')).toBeInTheDocument();
        expect(screen.getByLabelText('Scheduled Delay (ms)')).toBeInTheDocument();
        expect(screen.getByLabelText('Export Timeout (ms)')).toBeInTheDocument();
      });

      it('does not render batch config fields when SIMPLE processor is selected', () => {
        config.trace!.spanProcessor = SpanProcessorType.SIMPLE;
        renderPanel();
        
        expect(screen.queryByLabelText('Max Queue Size')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Max Export Batch')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Scheduled Delay (ms)')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Export Timeout (ms)')).not.toBeInTheDocument();
      });
    });

    describe('Max Queue Size', () => {
      it('renders with default value', () => {
        config.trace!.spanProcessor = SpanProcessorType.BATCH;
        renderPanel();
        
        const input = screen.getByLabelText('Max Queue Size') as HTMLInputElement;
        expect(input.value).toBe('2048');
      });

      it('calls updateNested when value changes', () => {
        config.trace!.spanProcessor = SpanProcessorType.BATCH;
        renderPanel();
        
        const input = screen.getByLabelText('Max Queue Size');
        fireEvent.change(input, { target: { value: '4096' } });
        
        expect(mockUpdateNested).toHaveBeenCalledWith('trace', 'batchConfig', {
          maxQueueSize: 4096,
          maxExportBatchSize: 512,
          scheduledDelay: 5000,
          exportTimeout: 30000,
        });
      });
    });

    describe('Max Export Batch', () => {
      it('renders with default value', () => {
        config.trace!.spanProcessor = SpanProcessorType.BATCH;
        renderPanel();
        
        const input = screen.getByLabelText('Max Export Batch') as HTMLInputElement;
        expect(input.value).toBe('512');
      });

      it('calls updateNested when value changes', () => {
        config.trace!.spanProcessor = SpanProcessorType.BATCH;
        renderPanel();
        
        const input = screen.getByLabelText('Max Export Batch');
        fireEvent.change(input, { target: { value: '1024' } });
        
        expect(mockUpdateNested).toHaveBeenCalledWith('trace', 'batchConfig', {
          maxQueueSize: 2048,
          maxExportBatchSize: 1024,
          scheduledDelay: 5000,
          exportTimeout: 30000,
        });
      });
    });

    describe('Scheduled Delay', () => {
      it('renders with default value', () => {
        config.trace!.spanProcessor = SpanProcessorType.BATCH;
        renderPanel();
        
        const input = screen.getByLabelText('Scheduled Delay (ms)') as HTMLInputElement;
        expect(input.value).toBe('5000');
      });

      it('calls updateNested when value changes', () => {
        config.trace!.spanProcessor = SpanProcessorType.BATCH;
        renderPanel();
        
        const input = screen.getByLabelText('Scheduled Delay (ms)');
        fireEvent.change(input, { target: { value: '10000' } });
        
        expect(mockUpdateNested).toHaveBeenCalledWith('trace', 'batchConfig', {
          maxQueueSize: 2048,
          maxExportBatchSize: 512,
          scheduledDelay: 10000,
          exportTimeout: 30000,
        });
      });
    });

    describe('Export Timeout', () => {
      it('renders with default value', () => {
        config.trace!.spanProcessor = SpanProcessorType.BATCH;
        renderPanel();
        
        const input = screen.getByLabelText('Export Timeout (ms)') as HTMLInputElement;
        expect(input.value).toBe('30000');
      });

      it('calls updateNested when value changes', () => {
        config.trace!.spanProcessor = SpanProcessorType.BATCH;
        renderPanel();
        
        const input = screen.getByLabelText('Export Timeout (ms)');
        fireEvent.change(input, { target: { value: '60000' } });
        
        expect(mockUpdateNested).toHaveBeenCalledWith('trace', 'batchConfig', {
          maxQueueSize: 2048,
          maxExportBatchSize: 512,
          scheduledDelay: 5000,
          exportTimeout: 60000,
        });
      });
    });
  });

  describe('Span Limits', () => {
    it('renders all span limit fields', () => {
      renderPanel();
      
      expect(screen.getByLabelText('Max Attributes')).toBeInTheDocument();
      expect(screen.getByLabelText('Max Attributes Per Span')).toBeInTheDocument();
      expect(screen.getByLabelText('Max Attribute Value Length')).toBeInTheDocument();
      expect(screen.getByLabelText('Max Events')).toBeInTheDocument();
      expect(screen.getByLabelText('Max Links')).toBeInTheDocument();
    });

    it('renders Max Attributes with default value', () => {
      renderPanel();
      
      const input = screen.getByLabelText('Max Attributes') as HTMLInputElement;
      expect(input.value).toBe('1000');
    });

    it('calls updateNested when Max Attributes changes', () => {
      renderPanel();
      
      const input = screen.getByLabelText('Max Attributes');
      fireEvent.change(input, { target: { value: '500' } });
      
      expect(mockUpdateNested).toHaveBeenCalledWith('trace', 'spanLimits', {
        maxNumberOfAttributes: 500,
        maxNumberOfAttributesPerSpan: 128,
        maxNumberOfEvents: 100,
        maxNumberOfLinks: 100,
        maxNumberOfAttributesPerEvent: 32,
        maxNumberOfAttributesPerLink: 32,
        maxAttributeValueLength: 4096,
      });
    });

    it('calls updateNested when Max Attributes Per Span changes', () => {
      renderPanel();
      
      const input = screen.getByLabelText('Max Attributes Per Span');
      fireEvent.change(input, { target: { value: '256' } });
      
      expect(mockUpdateNested).toHaveBeenCalledWith('trace', 'spanLimits', {
        maxNumberOfAttributes: 1000,
        maxNumberOfAttributesPerSpan: 256,
        maxNumberOfEvents: 100,
        maxNumberOfLinks: 100,
        maxNumberOfAttributesPerEvent: 32,
        maxNumberOfAttributesPerLink: 32,
        maxAttributeValueLength: 4096,
      });
    });

    it('calls updateNested when Max Attribute Value Length changes', () => {
      renderPanel();
      
      const input = screen.getByLabelText('Max Attribute Value Length');
      fireEvent.change(input, { target: { value: '8192' } });
      
      expect(mockUpdateNested).toHaveBeenCalledWith('trace', 'spanLimits', {
        maxNumberOfAttributes: 1000,
        maxNumberOfAttributesPerSpan: 128,
        maxNumberOfEvents: 100,
        maxNumberOfLinks: 100,
        maxNumberOfAttributesPerEvent: 32,
        maxNumberOfAttributesPerLink: 32,
        maxAttributeValueLength: 8192,
      });
    });

    it('calls updateNested when Max Events changes', () => {
      renderPanel();
      
      const input = screen.getByLabelText('Max Events');
      fireEvent.change(input, { target: { value: '200' } });
      
      expect(mockUpdateNested).toHaveBeenCalledWith('trace', 'spanLimits', {
        maxNumberOfAttributes: 1000,
        maxNumberOfAttributesPerSpan: 128,
        maxNumberOfEvents: 200,
        maxNumberOfLinks: 100,
        maxNumberOfAttributesPerEvent: 32,
        maxNumberOfAttributesPerLink: 32,
        maxAttributeValueLength: 4096,
      });
    });

    it('calls updateNested when Max Links changes', () => {
      renderPanel();
      
      const input = screen.getByLabelText('Max Links');
      fireEvent.change(input, { target: { value: '50' } });
      
      expect(mockUpdateNested).toHaveBeenCalledWith('trace', 'spanLimits', {
        maxNumberOfAttributes: 1000,
        maxNumberOfAttributesPerSpan: 128,
        maxNumberOfEvents: 100,
        maxNumberOfLinks: 50,
        maxNumberOfAttributesPerEvent: 32,
        maxNumberOfAttributesPerLink: 32,
        maxAttributeValueLength: 4096,
      });
    });
  });

  describe('Exporters Section', () => {
    it('renders ExporterEditor component', () => {
      renderPanel();
      
      expect(screen.getByTestId('exporter-editor')).toBeInTheDocument();
    });

    it('passes signal name to ExporterEditor', () => {
      renderPanel();
      
      const editor = screen.getByTestId('exporter-editor');
      expect(editor).toHaveAttribute('data-signal', 'trace');
    });
  });
});