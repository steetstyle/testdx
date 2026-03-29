const { parseYamlConfig } = require('../controllers/import');

describe('yamlConfig', () => {
  describe('parseYamlConfig', () => {
    it('should parse a single scenario', () => {
      const yaml = `
name: "test-scenario"
telemetryType: "traces"
serviceName: "test-service"
`;
      const result = parseYamlConfig(yaml);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-scenario');
      expect(result[0].telemetryType).toBe('traces');
    });

    it('should parse an array of scenarios', () => {
      const yaml = `
- name: "scenario-1"
  telemetryType: "traces"
- name: "scenario-2"
  telemetryType: "metrics"
`;
      const result = parseYamlConfig(yaml);
      expect(result).toHaveLength(2);
    });

    it('should throw on invalid YAML', () => {
      expect(() => parseYamlConfig('invalid: yaml: content:')).toThrow();
    });
  });
});