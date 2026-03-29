import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, cleanup } from '@testing-library/react';
import { renderWithMantine } from '../../test/setup';
import { PropagatorsPanel } from '../../components/OTelConfig/PropagatorsPanel';
import { PropagatorType, LogLevel } from '../../types';

describe('PropagatorsPanel', () => {
  const mockUpdateConfig = vi.fn();
  
  const defaultConfig = {
    propagators: { propagators: [PropagatorType.W3C] },
    logLevel: LogLevel.INFO,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderPanel = (config = defaultConfig) => {
    return renderWithMantine(
      <PropagatorsPanel config={config} updateConfig={mockUpdateConfig} />
    );
  };

  const getPropagatorsInput = () => {
    const inputs = screen.getAllByLabelText('Propagators');
    return inputs.find(el => el.getAttribute('aria-haspopup') === 'listbox') as HTMLInputElement | undefined;
  };

  const getLogLevelInput = () => {
    const inputs = screen.getAllByLabelText('Log Level');
    return inputs.find(el => el.getAttribute('aria-haspopup') === 'listbox') as HTMLInputElement | undefined;
  };

  describe('renders select elements', () => {
    it('renders Propagators select', () => {
      renderPanel();
      expect(getPropagatorsInput()).toBeInTheDocument();
    });

    it('renders Log Level select', () => {
      renderPanel();
      expect(getLogLevelInput()).toBeInTheDocument();
    });
  });

  describe('displays correct values', () => {
    it('displays W3C as default propagator', () => {
      renderPanel();
      expect(getPropagatorsInput()?.value).toBe('W3C');
    });

    it('displays Info as default log level', () => {
      renderPanel();
      expect(getLogLevelInput()?.value).toBe('Info');
    });

    it('displays B3 when configured', () => {
      renderPanel({ propagators: { propagators: [PropagatorType.B3] }, logLevel: LogLevel.INFO });
      expect(getPropagatorsInput()?.value).toBe('B3');
    });

    it('displays Warn when configured', () => {
      renderPanel({ propagators: { propagators: [PropagatorType.W3C] }, logLevel: LogLevel.WARN });
      expect(getLogLevelInput()?.value).toBe('Warn');
    });
  });

  describe('callbacks on selection', () => {
    it('calls updateConfig with B3 when B3 is selected', () => {
      renderPanel();
      const select = getPropagatorsInput();
      if (select) {
        fireEvent.click(select);
        fireEvent.click(screen.getByText('B3'));
      }
      expect(mockUpdateConfig).toHaveBeenCalledWith('propagators.propagators', [PropagatorType.B3]);
    });

    it('calls updateConfig with Debug when Debug is selected', () => {
      renderPanel();
      const select = getLogLevelInput();
      if (select) {
        fireEvent.click(select);
        fireEvent.click(screen.getByText('Debug'));
      }
      expect(mockUpdateConfig).toHaveBeenCalledWith('logLevel', LogLevel.DEBUG);
    });
  });

  describe('handles empty/undefined config', () => {
    it('handles empty config object', () => {
      renderPanel({} as any);
      expect(getPropagatorsInput()).toBeInTheDocument();
      expect(getLogLevelInput()).toBeInTheDocument();
    });

    it('handles undefined propagators with fallback to W3C', () => {
      renderPanel({ propagators: undefined, logLevel: LogLevel.INFO } as any);
      expect(getPropagatorsInput()?.value).toBe('W3C');
    });

    it('handles undefined logLevel with fallback to Info', () => {
      renderPanel({ propagators: { propagators: [PropagatorType.W3C] }, logLevel: undefined } as any);
      expect(getLogLevelInput()?.value).toBe('Info');
    });
  });
});