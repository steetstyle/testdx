import { useState } from 'react';
import { 
  Card, Text, Group, Button, ActionIcon, Stack, 
  TextInput, Select, Code, Accordion, Box, Badge, Divider,
  Tooltip
} from '@mantine/core';
import { Plus, Trash2, Variable, ChevronDown, ChevronRight, Eye } from 'lucide-react';
import type { GlobalVariables, VariableValue } from '../types';

type VariableEntry = {
  key: string;
  value: VariableValue;
};

interface VariablesEditorProps {
  projectVariables?: GlobalVariables;
  serviceVariables?: GlobalVariables;
  scenarioVariables?: GlobalVariables;
  inheritedProjectVariables?: GlobalVariables;
  inheritedServiceVariables?: GlobalVariables;
  onProjectVariablesChange?: (vars: GlobalVariables) => void;
  onServiceVariablesChange?: (vars: GlobalVariables) => void;
  onScenarioVariablesChange?: (vars: GlobalVariables) => void;
  readOnly?: boolean;
  showInheritance?: boolean;
}

function formatVariableValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(v => typeof v === 'string' ? `"${v}"` : String(v)).join(', ')}]`;
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function VariablesTable({ 
  variables, 
  onDelete, 
  readOnly = false,
  title,
  badgeColor = 'blue'
}: { 
  variables: VariableEntry[]; 
  onDelete?: (key: string) => void;
  readOnly?: boolean;
  title?: string;
  badgeColor?: string;
}) {
  if (!variables || variables.length === 0) {
    return (
      <Box p="sm" style={{ backgroundColor: 'var(--color-bg-muted)', borderRadius: 8 }}>
        <Text size="sm" c="dimmed" ta="center">No variables defined</Text>
      </Box>
    );
  }

  return (
    <Stack gap={4}>
      {title && (
        <Group gap="xs" mt="xs">
          <Text size="sm" fw={500}>{title}</Text>
          <Badge size="sm" variant="light" color={badgeColor}>{variables.length}</Badge>
        </Group>
      )}
      {variables.map((v, idx) => (
        <Group key={idx} gap="xs" wrap="nowrap" py={4}>
          <Code style={{ flex: '0 0 120px', fontFamily: 'monospace', fontSize: 12, backgroundColor: 'var(--color-bg-muted)', padding: '2px 6px' }}>
            {v.key}
          </Code>
          <Text size="xs" c="dimmed">=</Text>
          <Code style={{ flex: 1, fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>
            {formatVariableValue(v.value)}
          </Code>
          {!readOnly && onDelete && (
            <ActionIcon size="sm" variant="subtle" color="red" onClick={() => onDelete(v.key)}>
              <Trash2 size={12} />
            </ActionIcon>
          )}
        </Group>
      ))}
    </Stack>
  );
}

function AddVariableForm({ 
  onAdd,
  readOnly = false
}: { 
  onAdd: (key: string, value: VariableValue) => void;
  readOnly?: boolean;
}) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<'string' | 'number' | 'boolean' | 'array'>('string');

  const handleAdd = () => {
    if (!key.trim()) return;
    
    let parsedValue: VariableValue;
    switch (type) {
      case 'number':
        parsedValue = Number(value) || 0;
        break;
      case 'boolean':
        parsedValue = value.toLowerCase() === 'true';
        break;
      case 'array':
        parsedValue = value.split(',').map(s => s.trim()).filter(Boolean);
        break;
      default:
        parsedValue = value;
    }
    
    onAdd(key.trim(), parsedValue);
    setKey('');
    setValue('');
  };

  if (readOnly) return null;

  return (
    <Group gap="xs" wrap="nowrap" mt="sm">
      <TextInput
        placeholder="Variable name"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        size="xs"
        style={{ flex: '0 0 120px' }}
      />
      <Select
        value={type}
        onChange={(val) => setType(val as 'string' | 'number' | 'boolean' | 'array')}
        data={[
          { value: 'string', label: 'String' },
          { value: 'number', label: 'Number' },
          { value: 'boolean', label: 'Boolean' },
          { value: 'array', label: 'Array' },
        ]}
        size="xs"
        style={{ width: 90 }}
      />
      <TextInput
        placeholder={type === 'boolean' ? 'true/false' : type === 'array' ? 'a,b,c' : 'value'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        size="xs"
        style={{ flex: 1 }}
      />
      <Button size="xs" variant="primary" onClick={handleAdd} disabled={!key.trim()}>
        <Plus size={14} />
      </Button>
    </Group>
  );
}

function convertToVariableEntries(vars: Record<string, unknown> | undefined): VariableEntry[] {
  if (!vars || typeof vars !== 'object') return [];
  
  const entries: VariableEntry[] = [];
  for (const [key, value] of Object.entries(vars)) {
    if (value !== undefined) {
      entries.push({ key, value: value as VariableValue });
    }
  }
  return entries;
}

export function VariablesEditor({
  projectVariables = {},
  serviceVariables = {},
  scenarioVariables = {},
  inheritedProjectVariables = {},
  inheritedServiceVariables = {},
  onProjectVariablesChange,
  onServiceVariablesChange,
  onScenarioVariablesChange,
  readOnly = false,
  showInheritance = true,
}: VariablesEditorProps) {
  const [expanded, setExpanded] = useState(true);
  
  const projectEntries = convertToVariableEntries(projectVariables);
  const serviceEntries = convertToVariableEntries(serviceVariables);
  const scenarioEntries = convertToVariableEntries(scenarioVariables);
  
  const inheritedProjectEntries = convertToVariableEntries(inheritedProjectVariables);
  const inheritedServiceEntries = convertToVariableEntries(inheritedServiceVariables);

  const handleDeleteProject = (key: string) => {
    if (!onProjectVariablesChange) return;
    const updated = { ...projectVariables };
    delete updated[key];
    onProjectVariablesChange(updated);
  };

  const handleDeleteService = (key: string) => {
    if (!onServiceVariablesChange) return;
    const updated = { ...serviceVariables };
    delete updated[key];
    onServiceVariablesChange(updated);
  };

  const handleDeleteScenario = (key: string) => {
    if (!onScenarioVariablesChange) return;
    const updated = { ...scenarioVariables };
    delete updated[key];
    onScenarioVariablesChange(updated);
  };

  const handleAddProject = (key: string, value: VariableValue) => {
    if (!onProjectVariablesChange) return;
    onProjectVariablesChange({ ...projectVariables, [key]: value });
  };

  const handleAddService = (key: string, value: VariableValue) => {
    if (!onServiceVariablesChange) return;
    onServiceVariablesChange({ ...serviceVariables, [key]: value });
  };

  const handleAddScenario = (key: string, value: VariableValue) => {
    if (!onScenarioVariablesChange) return;
    onScenarioVariablesChange({ ...scenarioVariables, [key]: value });
  };

  const totalVariables = projectEntries.length + serviceEntries.length + scenarioEntries.length;
  const totalInherited = inheritedProjectEntries.length + inheritedServiceEntries.length;
  const hasVariables = totalVariables > 0;
  const hasInherited = totalInherited > 0;

  if (!hasVariables && !hasInherited && readOnly) {
    return null;
  }

  return (
    <Card padding="md" radius="md" withBorder>
      <Group 
        justify="space-between" 
        mb={expanded ? 'md' : 0}
        style={{ cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <Group gap="xs">
          <Variable size={16} style={{ color: 'var(--color-primary)' }} />
          <Text fw={500} size="sm">Variables</Text>
          {hasVariables && (
            <Badge size="sm" variant="light" color="green">
              {totalVariables}
            </Badge>
          )}
        </Group>
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </Group>

      {expanded && (
        <Stack gap="md">
          {showInheritance && hasInherited && (
            <Accordion variant="contained" radius="md" style={{ backgroundColor: 'var(--color-bg-muted)' }}>
              <Accordion.Item value="inherited">
                <Accordion.Control icon={<Eye size={14} />}>
                  <Group gap="xs">
                    <Text size="sm">Inherited Variables</Text>
                    <Badge size="xs" variant="light" color="gray">
                      {totalInherited}
                    </Badge>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="md">
                    {inheritedProjectEntries.length > 0 && (
                      <VariablesTable 
                        variables={inheritedProjectEntries} 
                        readOnly 
                        title="Project-level"
                        badgeColor="blue"
                      />
                    )}
                    {inheritedServiceEntries.length > 0 && (
                      <VariablesTable 
                        variables={inheritedServiceEntries} 
                        readOnly 
                        title="Service-level"
                        badgeColor="grape"
                      />
                    )}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          )}

          <Divider label="Scenario Variables" labelPosition="center" />
          
          {!readOnly && (
            <AddVariableForm onAdd={handleAddScenario} />
          )}
          <VariablesTable 
            variables={scenarioEntries} 
            onDelete={handleDeleteScenario}
            readOnly={readOnly}
            title="Scenario-level"
            badgeColor="green"
          />

          {showInheritance && (
            <>
              <Divider label="Local Definitions" labelPosition="center" />
              
              {projectEntries.length > 0 ? (
                <Stack gap="sm">
                  <VariablesTable 
                    variables={projectEntries} 
                    onDelete={handleDeleteProject}
                    readOnly={readOnly}
                    title="Project-level"
                    badgeColor="blue"
                  />
                </Stack>
              ) : (
                <Text size="xs" c="dimmed">No project variables defined</Text>
              )}
              {!readOnly && <AddVariableForm onAdd={handleAddProject} />}

              {serviceEntries.length > 0 ? (
                <Stack gap="sm">
                  <VariablesTable 
                    variables={serviceEntries} 
                    onDelete={handleDeleteService}
                    readOnly={readOnly}
                    title="Service-level"
                    badgeColor="grape"
                  />
                </Stack>
              ) : (
                <Text size="xs" c="dimmed">No service variables defined</Text>
              )}
              {!readOnly && <AddVariableForm onAdd={handleAddService} />}
            </>
          )}
        </Stack>
      )}
    </Card>
  );
}

export function VariablesSummary({ 
  variables, 
  maxShow = 3 
}: { 
  variables: Record<string, unknown>;
  maxShow?: number;
}) {
  if (!variables || typeof variables !== 'object') return null;
  
  const entries = Object.entries(variables);
  if (entries.length === 0) return null;

  const visible = entries.slice(0, maxShow);
  const remaining = entries.length - maxShow;

  return (
    <Group gap={4}>
      {visible.map(([key, value], idx) => (
        <Tooltip key={idx} label={`${key} = ${formatVariableValue(value)}`}>
          <Badge 
            size="sm" 
            variant="light" 
            color="gray"
            style={{ fontFamily: 'monospace', fontSize: 10 }}
          >
            {key}
          </Badge>
        </Tooltip>
      ))}
      {remaining > 0 && (
        <Badge size="sm" variant="light" color="gray">
          +{remaining}
        </Badge>
      )}
    </Group>
  );
}

export default VariablesEditor;
