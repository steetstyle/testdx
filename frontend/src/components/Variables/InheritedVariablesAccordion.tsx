import { Stack, Group, Text, Badge, Accordion, Box } from '@mantine/core';
import { Eye } from 'lucide-react';
import { VariablesTable } from './VariablesTable';
import type { GlobalVariables } from '../../types';

interface InheritedVariablesAccordionProps {
  inheritedProjectVariables?: GlobalVariables;
  inheritedServiceVariables?: GlobalVariables;
}

function convertToVariableEntries(vars: Record<string, unknown> | undefined): Array<{ key: string; value: unknown }> {
  if (!vars || typeof vars !== 'object') return [];
  
  const entries: Array<{ key: string; value: unknown }> = [];
  for (const [key, value] of Object.entries(vars)) {
    if (value !== undefined) {
      entries.push({ key, value });
    }
  }
  return entries;
}

export function InheritedVariablesAccordion({
  inheritedProjectVariables = {},
  inheritedServiceVariables = {},
}: InheritedVariablesAccordionProps) {
  const inheritedProjectEntries = convertToVariableEntries(inheritedProjectVariables);
  const inheritedServiceEntries = convertToVariableEntries(inheritedServiceVariables);
  const totalInherited = inheritedProjectEntries.length + inheritedServiceEntries.length;

  if (totalInherited === 0) {
    return null;
  }

  return (
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
  );
}

export { convertToVariableEntries };