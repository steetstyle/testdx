import { useState } from 'react';
import { Card, Group, Text, Badge, Divider, Accordion } from '@mantine/core';
import { Variable, ChevronDown, ChevronRight } from 'lucide-react';
import { VariablesTable } from './VariablesTable';
import { AddVariableForm } from './AddVariableForm';
import { InheritedVariablesAccordion, convertToVariableEntries } from './InheritedVariablesAccordion';
import type { GlobalVariables, VariableValue } from '../../types';

export interface VariablesEditorProps {
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
  const hasVariables = totalVariables > 0;

  if (!hasVariables && readOnly) {
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
        <VariablesEditorContent
          projectEntries={projectEntries}
          serviceEntries={serviceEntries}
          scenarioEntries={scenarioEntries}
          inheritedProjectVariables={inheritedProjectVariables}
          inheritedServiceVariables={inheritedServiceVariables}
          readOnly={readOnly}
          showInheritance={showInheritance}
          onDeleteProject={handleDeleteProject}
          onDeleteService={handleDeleteService}
          onDeleteScenario={handleDeleteScenario}
          onAddProject={handleAddProject}
          onAddService={handleAddService}
          onAddScenario={handleAddScenario}
        />
      )}
    </Card>
  );
}

interface VariablesEditorContentProps {
  projectEntries: Array<{ key: string; value: unknown }>;
  serviceEntries: Array<{ key: string; value: unknown }>;
  scenarioEntries: Array<{ key: string; value: unknown }>;
  inheritedProjectVariables?: GlobalVariables;
  inheritedServiceVariables?: GlobalVariables;
  readOnly: boolean;
  showInheritance: boolean;
  onDeleteProject: (key: string) => void;
  onDeleteService: (key: string) => void;
  onDeleteScenario: (key: string) => void;
  onAddProject: (key: string, value: VariableValue) => void;
  onAddService: (key: string, value: VariableValue) => void;
  onAddScenario: (key: string, value: VariableValue) => void;
}

function VariablesEditorContent({
  projectEntries,
  serviceEntries,
  scenarioEntries,
  inheritedProjectVariables,
  inheritedServiceVariables,
  readOnly,
  showInheritance,
  onDeleteProject,
  onDeleteService,
  onDeleteScenario,
  onAddProject,
  onAddService,
  onAddScenario,
}: VariablesEditorContentProps) {
  const inheritedProjectEntries = convertToVariableEntries(inheritedProjectVariables);
  const inheritedServiceEntries = convertToVariableEntries(inheritedServiceVariables);
  const totalInherited = inheritedProjectEntries.length + inheritedServiceEntries.length;
  const hasInherited = totalInherited > 0;

  return (
    <>
      {showInheritance && hasInherited && (
        <InheritedVariablesAccordion
          inheritedProjectVariables={inheritedProjectVariables}
          inheritedServiceVariables={inheritedServiceVariables}
        />
      )}

      <Divider label="Scenario Variables" labelPosition="center" />
      
      {!readOnly && (
        <AddVariableForm onAdd={onAddScenario} />
      )}
      <VariablesTable 
        variables={scenarioEntries} 
        onDelete={onDeleteScenario}
        readOnly={readOnly}
        title="Scenario-level"
        badgeColor="green"
      />

      {showInheritance && (
        <>
          <Divider label="Local Definitions" labelPosition="center" />
          
          {projectEntries.length > 0 ? (
            <>
              <VariablesTable 
                variables={projectEntries} 
                onDelete={onDeleteProject}
                readOnly={readOnly}
                title="Project-level"
                badgeColor="blue"
              />
            </>
          ) : (
            <Text size="xs" c="dimmed" mb="xs">No project variables defined</Text>
          )}
          {!readOnly && <AddVariableForm onAdd={onAddProject} />}

          {serviceEntries.length > 0 ? (
            <>
              <VariablesTable 
                variables={serviceEntries} 
                onDelete={onDeleteService}
                readOnly={readOnly}
                title="Service-level"
                badgeColor="grape"
              />
            </>
          ) : (
            <Text size="xs" c="dimmed" mb="xs">No service variables defined</Text>
          )}
          {!readOnly && <AddVariableForm onAdd={onAddService} />}
        </>
      )}
    </>
  );
}

export default VariablesEditor;