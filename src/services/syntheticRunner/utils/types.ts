import { RunMode } from '../../../models/scenario';

export interface RunResult {
  success: boolean;
  recordsGenerated: number;
  tracesGenerated: number;
  metricsGenerated: number;
  logsGenerated: number;
  error?: string;
}

export interface RunHistoryEntry {
  timestamp: string;
  status: 'success' | 'failed' | 'running';
  mode: RunMode;
  recordsGenerated: number;
  tracesGenerated: number;
  metricsGenerated: number;
  logsGenerated: number;
  error?: string;
}

export interface RunProgress {
  startedAt: string;
  mode: RunMode;
  rate: number;
  duration?: number;
  tracesGenerated: number;
  metricsGenerated: number;
  logsGenerated: number;
  totalRecords: number;
  totalExpected: number;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  error?: string;
}

export interface GeneratorOptions {
  endpoint: string;
  serviceName: string;
  headers?: Record<string, string>;
}