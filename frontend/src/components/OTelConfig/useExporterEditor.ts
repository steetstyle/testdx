import { useState, useCallback } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { ExporterConfig, ExporterType, OtelProtocol, CompressionType } from '../../types';

interface UseExporterEditorReturn {
  editingIdx: number | null;
  expandedExporters: Set<number>;
  currentExporter: ExporterConfig;
  opened: boolean;
  open: () => void;
  close: () => void;
  handleAdd: () => void;
  handleEdit: (idx: number) => void;
  handleSave: (exporters: ExporterConfig[], onUpdate: (exporters: ExporterConfig[]) => void) => void;
  handleDelete: (idx: number, exporters: ExporterConfig[], onUpdate: (exporters: ExporterConfig[]) => void) => void;
  toggleExpand: (idx: number) => void;
  setCurrentExporter: (exporter: ExporterConfig) => void;
  getEmptyExporter: (signalName: 'trace' | 'metric' | 'log') => ExporterConfig;
}

export function useExporterEditor(): UseExporterEditorReturn {
  const [opened, { open, close }] = useDisclosure(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [expandedExporters, setExpandedExporters] = useState<Set<number>>(new Set());
  const [currentExporter, setCurrentExporter] = useState<ExporterConfig>({
    type: ExporterType.OTLP,
    endpoint: 'http://localhost:4318',
    protocol: OtelProtocol.HTTP,
    timeout: 30000,
    compression: CompressionType.GZIP,
    headers: {},
    tlsConfig: {
      insecure: true,
    },
  });

  const getEmptyExporter = useCallback((signalName: 'trace' | 'metric' | 'log'): ExporterConfig => {
    return {
      type: ExporterType.OTLP,
      endpoint: signalName === 'trace' ? 'http://localhost:4318/v1/traces' :
                signalName === 'metric' ? 'http://localhost:4318/v1/metrics' :
                'http://localhost:4318/v1/logs',
      protocol: OtelProtocol.HTTP,
      timeout: 30000,
      compression: CompressionType.GZIP,
      headers: {},
      tlsConfig: {
        insecure: true,
      },
    };
  }, []);

  const handleAdd = useCallback(() => {
    setCurrentExporter(getEmptyExporter('trace'));
    setEditingIdx(null);
    open();
  }, [open, getEmptyExporter]);

  const handleSave = useCallback((
    exporters: ExporterConfig[],
    onUpdate: (exporters: ExporterConfig[]) => void
  ) => {
    if (editingIdx !== null) {
      const newExporters = [...exporters];
      newExporters[editingIdx] = currentExporter;
      onUpdate(newExporters);
    } else {
      onUpdate([...exporters, currentExporter]);
    }
    close();
  }, [editingIdx, currentExporter, close]);

  const handleDelete = useCallback((
    idx: number,
    exporters: ExporterConfig[],
    onUpdate: (exporters: ExporterConfig[]) => void
  ) => {
    onUpdate(exporters.filter((_, i) => i !== idx));
  }, []);

  const toggleExpand = useCallback((idx: number) => {
    setExpandedExporters(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }, []);

  return {
    editingIdx,
    expandedExporters,
    currentExporter,
    opened,
    open: handleAdd,
    close,
    handleAdd,
    handleEdit: (idx: number) => {
      setCurrentExporter(getEmptyExporter('trace'));
      setEditingIdx(idx);
      open();
    },
    handleSave,
    handleDelete,
    toggleExpand,
    setCurrentExporter,
    getEmptyExporter,
  };
}