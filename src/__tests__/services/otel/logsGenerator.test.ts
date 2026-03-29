jest.mock('../../../services/otel/sender', () => {
  return {
    Sender: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue(undefined),
      testConnection: jest.fn().mockResolvedValue(true),
    })),
  };
});

jest.mock('../../../services/otel/idGenerator', () => ({
  generateTraceId: jest.fn().mockReturnValue('mocked-trace-id'),
  generateSpanId: jest.fn().mockReturnValue('mocked-span-id'),
}));

const { generateLogs } = require('../../../services/otel/logsGenerator');
const { Sender } = require('../../../services/otel/sender');

describe('logsGenerator', () => {
  let mockSender: { send: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSender = new Sender() as unknown as { send: jest.Mock };
  });

  describe('generateLogs', () => {
    it('should generate logs without trace ID', async () => {
      const result = await generateLogs(mockSender, {
        logs: [
          {
            body: 'Test log message',
            severityNumber: 9,
            severityText: 'Info',
            attributes: {},
          },
        ],
        count: 3,
        includeTraceId: false,
        attributes: {},
      });

      expect(result.recordsGenerated).toBe(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should generate logs with trace ID when includeTraceId is true', async () => {
      const result = await generateLogs(mockSender, {
        logs: [
          {
            body: 'Test log message',
            severityNumber: 9,
            severityText: 'Info',
            attributes: {},
          },
        ],
        count: 2,
        includeTraceId: true,
        attributes: {},
      });

      expect(result.recordsGenerated).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
      let callCount = 0;
      mockSender.send.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(undefined);
      });

      const result = await generateLogs(mockSender, {
        logs: [
          {
            body: 'Test log message',
            severityNumber: 17,
            severityText: 'Error',
            attributes: {},
          },
        ],
        count: 3,
        includeTraceId: false,
        attributes: {},
      });

      expect(result.recordsGenerated).toBe(2);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Log error');
    });

    it('should generate logs in historical mode with time range', async () => {
      const startDate = new Date('2026-03-26T10:00:00Z');
      const endDate = new Date('2026-03-26T12:00:00Z');

      const result = await generateLogs(mockSender, {
        logs: [
          {
            body: 'Historical log',
            severityNumber: 9,
            severityText: 'Info',
            attributes: {},
          },
        ],
        count: 4,
        includeTraceId: false,
        attributes: {},
        historicalMode: true,
        timeRange: { start: startDate, end: endDate },
      });

      expect(result.recordsGenerated).toBe(4);
      expect(result.errors).toHaveLength(0);
    });

    it('should use custom service name', async () => {
      await generateLogs(mockSender, {
        logs: [
          {
            body: 'Test log',
            severityNumber: 9,
            severityText: 'Info',
            attributes: {},
          },
        ],
        count: 1,
        includeTraceId: false,
        attributes: {},
        serviceName: 'custom-logs-service',
      });

      expect(mockSender.send).toHaveBeenCalledTimes(1);
      const sentData = JSON.parse(mockSender.send.mock.calls[0][0].toString());
      expect(sentData.resourceLogs[0].resource.attributes.find(
        (attr: { key: string }) => attr.key === 'service.name'
      ).value.stringValue).toBe('custom-logs-service');
    });

    it('should send logs to /v1/logs endpoint', async () => {
      await generateLogs(mockSender, {
        logs: [
          {
            body: 'Test log',
            severityNumber: 9,
            severityText: 'Info',
            attributes: {},
          },
        ],
        count: 1,
        includeTraceId: false,
        attributes: {},
      });

      expect(mockSender.send).toHaveBeenCalledWith(expect.any(Buffer), '/v1/logs');
    });

    it('should include trace_id in log attributes when includeTraceId is true', async () => {
      await generateLogs(mockSender, {
        logs: [
          {
            body: 'Test log with trace',
            severityNumber: 9,
            severityText: 'Info',
            attributes: { 'custom.attr': 'value' },
          },
        ],
        count: 1,
        includeTraceId: true,
        attributes: {},
      });

      expect(mockSender.send).toHaveBeenCalledTimes(1);
      const sentData = JSON.parse(mockSender.send.mock.calls[0][0].toString());
      const logRecord = sentData.resourceLogs[0].scopeLogs[0].logRecords[0];
      expect(logRecord.attributes).toContainEqual(
        expect.objectContaining({ key: 'trace_id' })
      );
    });

    it('should not include trace_id when includeTraceId is false', async () => {
      await generateLogs(mockSender, {
        logs: [
          {
            body: 'Test log without trace',
            severityNumber: 9,
            severityText: 'Info',
            attributes: {},
          },
        ],
        count: 1,
        includeTraceId: false,
        attributes: {},
      });

      expect(mockSender.send).toHaveBeenCalledTimes(1);
      const sentData = JSON.parse(mockSender.send.mock.calls[0][0].toString());
      const logRecord = sentData.resourceLogs[0].scopeLogs[0].logRecords[0];
      const hasTraceId = logRecord.attributes.some(
        (attr: { key: string }) => attr.key === 'trace_id'
      );
      expect(hasTraceId).toBe(false);
    });

    it('should handle zero count', async () => {
      const result = await generateLogs(mockSender, {
        logs: [
          {
            body: 'Test log',
            severityNumber: 9,
            severityText: 'Info',
            attributes: {},
          },
        ],
        count: 0,
        includeTraceId: false,
        attributes: {},
      });

      expect(result.recordsGenerated).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockSender.send).not.toHaveBeenCalled();
    });

    it('should handle custom attributes', async () => {
      await generateLogs(mockSender, {
        logs: [
          {
            body: 'Test log',
            severityNumber: 9,
            severityText: 'Info',
            attributes: {},
          },
        ],
        count: 1,
        includeTraceId: false,
        attributes: { 'resource.attr': 'resource-value' },
      });

      expect(mockSender.send).toHaveBeenCalledTimes(1);
      const sentData = JSON.parse(mockSender.send.mock.calls[0][0].toString());
      expect(sentData.resourceLogs[0].resource.attributes).toContainEqual(
        expect.objectContaining({ key: 'resource.attr', value: { stringValue: 'resource-value' } })
      );
    });

    it('should handle different severity levels', async () => {
      const result = await generateLogs(mockSender, {
        logs: [
          { body: 'Debug log', severityNumber: 5, severityText: 'Debug', attributes: {} },
          { body: 'Info log', severityNumber: 9, severityText: 'Info', attributes: {} },
          { body: 'Warn log', severityNumber: 11, severityText: 'Warn', attributes: {} },
          { body: 'Error log', severityNumber: 17, severityText: 'Error', attributes: {} },
        ],
        count: 1,
        includeTraceId: false,
        attributes: {},
      });

      expect(result.recordsGenerated).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should preserve log body and severity', async () => {
      await generateLogs(mockSender, {
        logs: [
          { body: 'Important error occurred', severityNumber: 17, severityText: 'Error', attributes: {} },
        ],
        count: 1,
        includeTraceId: false,
        attributes: {},
      });

      expect(mockSender.send).toHaveBeenCalledTimes(1);
      const sentData = JSON.parse(mockSender.send.mock.calls[0][0].toString());
      const logRecord = sentData.resourceLogs[0].scopeLogs[0].logRecords[0];
      expect(logRecord.body.stringValue).toBe('Important error occurred');
      expect(logRecord.severityText).toBe('Error');
    });
  });
});