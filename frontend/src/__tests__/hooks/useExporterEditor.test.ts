import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExporterEditor } from '../../components/OTelConfig/useExporterEditor';
import { ExporterType, OtelProtocol, CompressionType, ExporterConfig } from '../../types';

let mockOpened = false;
const mockOpen = vi.fn(() => { mockOpened = true; });
const mockClose = vi.fn(() => { mockOpened = false; });

vi.mock('@mantine/hooks', () => ({
  useDisclosure: (initialState = false) => {
    mockOpened = initialState;
    const handlers = {
      open: mockOpen,
      close: mockClose,
      toggle: vi.fn(() => { mockOpened = !mockOpened; }),
    };
    return [mockOpened, handlers];
  },
}));

describe('useExporterEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOpened = false;
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useExporterEditor());
    
    expect(result.current.editingIdx).toBeNull();
    expect(result.current.expandedExporters).toEqual(new Set());
    expect(result.current.opened).toBe(false);
    expect(result.current.currentExporter.type).toBe(ExporterType.OTLP);
  });

  describe('getEmptyExporter', () => {
    it('returns OTLP exporter with trace endpoint for trace signal', () => {
      const { result } = renderHook(() => useExporterEditor());
      const exporter = result.current.getEmptyExporter('trace');
      
      expect(exporter.type).toBe(ExporterType.OTLP);
      expect(exporter.endpoint).toContain('/v1/traces');
      expect(exporter.protocol).toBe(OtelProtocol.HTTP);
    });

    it('returns OTLP exporter with metrics endpoint for metric signal', () => {
      const { result } = renderHook(() => useExporterEditor());
      const exporter = result.current.getEmptyExporter('metric');
      
      expect(exporter.endpoint).toContain('/v1/metrics');
    });

    it('returns OTLP exporter with logs endpoint for log signal', () => {
      const { result } = renderHook(() => useExporterEditor());
      const exporter = result.current.getEmptyExporter('log');
      
      expect(exporter.endpoint).toContain('/v1/logs');
    });
  });

  describe('open/close', () => {
    it('open() sets opened to true', () => {
      const { result } = renderHook(() => useExporterEditor());
      
      act(() => {
        result.current.open();
      });
      
      expect(mockOpen).toHaveBeenCalled();
    });

    it('close() sets opened to false', () => {
      const { result } = renderHook(() => useExporterEditor());
      
      act(() => {
        result.current.open();
        result.current.close();
      });
      
      expect(mockClose).toHaveBeenCalled();
    });

    it('handleAdd() calls open()', () => {
      const { result } = renderHook(() => useExporterEditor());
      
      act(() => {
        result.current.handleAdd();
      });
      
      expect(mockOpen).toHaveBeenCalled();
      expect(result.current.editingIdx).toBeNull();
    });
  });

  describe('handleEdit', () => {
    it('sets editingIdx', () => {
      const { result } = renderHook(() => useExporterEditor());
      
      act(() => {
        result.current.handleEdit(2);
      });
      
      expect(result.current.editingIdx).toBe(2);
    });
  });

  describe('handleSave', () => {
    it('adds new exporter when editingIdx is null', () => {
      const { result } = renderHook(() => useExporterEditor());
      const exporters: ExporterConfig[] = [];
      const onUpdate = vi.fn();
      
      act(() => {
        result.current.handleSave(exporters, onUpdate);
      });
      
      expect(onUpdate).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ type: ExporterType.OTLP })
      ]));
    });

    it('updates existing exporter when editingIdx is set', () => {
      const { result } = renderHook(() => useExporterEditor());
      const existingExporters: ExporterConfig[] = [
        { type: ExporterType.OTLP, endpoint: 'http://old.localhost:4318', protocol: OtelProtocol.HTTP, timeout: 1000, compression: CompressionType.NONE, headers: {}, tlsConfig: { insecure: true } },
        { type: ExporterType.OTLP, endpoint: 'http://existing.localhost:4318', protocol: OtelProtocol.HTTP, timeout: 2000, compression: CompressionType.GZIP, headers: {}, tlsConfig: { insecure: false } },
      ];
      const onUpdate = vi.fn();
      
      act(() => {
        result.current.handleEdit(1);
      });
      
      act(() => {
        result.current.handleSave(existingExporters, onUpdate);
      });
      
      expect(onUpdate).toHaveBeenCalled();
      const calledWith = onUpdate.mock.calls[0][0];
      expect(calledWith[1].endpoint).toBe('http://localhost:4318/v1/traces');
    });
  });

  describe('handleDelete', () => {
    it('removes exporter at specified index', () => {
      const { result } = renderHook(() => useExporterEditor());
      const exporters = [
        { type: ExporterType.OTLP, endpoint: 'http://first.localhost:4318', protocol: OtelProtocol.HTTP, timeout: 1000, compression: CompressionType.NONE, headers: {}, tlsConfig: { insecure: true } },
        { type: ExporterType.OTLP, endpoint: 'http://second.localhost:4318', protocol: OtelProtocol.HTTP, timeout: 2000, compression: CompressionType.GZIP, headers: {}, tlsConfig: { insecure: true } },
        { type: ExporterType.OTLP, endpoint: 'http://third.localhost:4318', protocol: OtelProtocol.HTTP, timeout: 3000, compression: CompressionType.ZSTD, headers: {}, tlsConfig: { insecure: true } },
      ];
      const onUpdate = vi.fn();
      
      act(() => {
        result.current.handleDelete(1, exporters, onUpdate);
      });
      
      expect(onUpdate).toHaveBeenCalledWith([
        exporters[0],
        exporters[2],
      ]);
    });
  });

  describe('toggleExpand', () => {
    it('adds index to expandedExporters when not present', () => {
      const { result } = renderHook(() => useExporterEditor());
      
      act(() => {
        result.current.toggleExpand(1);
      });
      
      expect(result.current.expandedExporters.has(1)).toBe(true);
    });

    it('removes index from expandedExporters when already present', () => {
      const { result } = renderHook(() => useExporterEditor());
      
      act(() => {
        result.current.toggleExpand(1);
      });
      act(() => {
        result.current.toggleExpand(1);
      });
      
      expect(result.current.expandedExporters.has(1)).toBe(false);
    });
  });

  describe('setCurrentExporter', () => {
    it('updates currentExporter directly', () => {
      const { result } = renderHook(() => useExporterEditor());
      const newExporter = {
        type: ExporterType.OTLP,
        endpoint: 'http://custom.endpoint:4318',
        protocol: OtelProtocol.GRPC,
        timeout: 60000,
        compression: CompressionType.ZSTD,
        headers: { 'X-Custom': 'value' },
        tlsConfig: { insecure: false },
      };
      
      act(() => {
        result.current.setCurrentExporter(newExporter);
      });
      
      expect(result.current.currentExporter.endpoint).toBe('http://custom.endpoint:4318');
      expect(result.current.currentExporter.protocol).toBe(OtelProtocol.GRPC);
    });
  });

  it('returns all required methods', () => {
    const { result } = renderHook(() => useExporterEditor());
    
    expect(result.current).toHaveProperty('editingIdx');
    expect(result.current).toHaveProperty('expandedExporters');
    expect(result.current).toHaveProperty('currentExporter');
    expect(result.current).toHaveProperty('opened');
    expect(result.current).toHaveProperty('open');
    expect(result.current).toHaveProperty('close');
    expect(result.current).toHaveProperty('handleAdd');
    expect(result.current).toHaveProperty('handleEdit');
    expect(result.current).toHaveProperty('handleSave');
    expect(result.current).toHaveProperty('handleDelete');
    expect(result.current).toHaveProperty('toggleExpand');
    expect(result.current).toHaveProperty('setCurrentExporter');
    expect(result.current).toHaveProperty('getEmptyExporter');
  });
});