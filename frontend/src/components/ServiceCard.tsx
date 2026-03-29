import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Text, Badge, Group, Button, ActionIcon, Box, Modal, Stack } from '@mantine/core';
import { Trash2, Variable, Settings } from 'lucide-react';
import { VariablesEditor, VariablesSummary } from './VariablesEditor';
import { useDeleteConfirm } from '../hooks';
import type { Service } from '../types';
import type { GlobalVariables } from '../services/variables/types';
import { serviceApi } from '../services/api';

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onVariablesSave: (id: string, variables: GlobalVariables) => void;
  inheritedProjectVariables?: GlobalVariables;
}

const DELETE_TITLE = 'Delete Service?';
const DELETE_MESSAGE = 'This will delete all scenarios in this service. This action cannot be undone.';

export function ServiceCard({
  service,
  onEdit,
  onVariablesSave,
  inheritedProjectVariables,
}: ServiceCardProps) {
  const deleteConfirm = useDeleteConfirm({
    title: DELETE_TITLE,
    message: DELETE_MESSAGE,
    onConfirm: async () => {
      await serviceApi.deleteService(service._id);
    },
  });

  const [localVars, setLocalVars] = useState<GlobalVariables>(service.serviceVariables || {});
  const [showVarsModal, setShowVarsModal] = useState(false);

  const handleOpenVariables = () => {
    setLocalVars(service.serviceVariables || {});
    setShowVarsModal(true);
  };

  const handleSaveVariables = async () => {
    await onVariablesSave(service._id, localVars);
    setShowVarsModal(false);
  };

  return (
    <>
      <Card padding="md" radius="md" withBorder>
        <Group justify="space-between" mb="xs">
          <Box style={{ minWidth: 0, flex: 1 }}>
            <Text fw={500} truncate style={{ color: 'var(--color-text)' }}>
              {service.name}
            </Text>
            <Text size="sm" c="dimmed" truncate>
              {service.description || 'No description'}
            </Text>
          </Box>
          <Group>
            {service.otelSdkConfig?.trace?.enabled && (
              <Badge variant="light" color="blue" size="xs">Traces</Badge>
            )}
            {service.otelSdkConfig?.metric?.enabled && (
              <Badge variant="light" color="grape" size="xs">Metrics</Badge>
            )}
            {service.otelSdkConfig?.log?.enabled && (
              <Badge variant="light" color="orange" size="xs">Logs</Badge>
            )}
          </Group>
        </Group>

        <Text size="xs" c="dimmed" mb="sm">
          Protocol: {service.otelSdkConfig?.trace?.protocol} | Timeout: {service.otelSdkConfig?.trace?.timeout}ms
        </Text>

        {(Object.keys(service.serviceVariables || {}).length > 0 || Object.keys(inheritedProjectVariables || {}).length > 0) && (
          <Box mb="sm">
            {Object.keys(service.serviceVariables || {}).length > 0 && (
              <VariablesSummary variables={service.serviceVariables || {}} />
            )}
            {Object.keys(inheritedProjectVariables || {}).length > 0 && (
              <Group gap={4} mt={4}>
                <Text size="xs" c="dimmed">Inherited:</Text>
                <VariablesSummary variables={inheritedProjectVariables || {}} maxShow={2} />
              </Group>
            )}
          </Box>
        )}

        <Group gap="xs">
          <Button
            size="xs"
            variant="secondary"
            leftSection={<Settings size={12} />}
            onClick={() => onEdit(service)}
          >
            Configure OTEL
          </Button>
          <Button
            size="xs"
            variant="subtle"
            leftSection={<Variable size={12} />}
            onClick={handleOpenVariables}
          >
            Variables
          </Button>
          <Button
            size="xs"
            variant="primary"
            component={Link}
            to={`/synthetic/${service.projectId}/services/${service._id}`}
          >
            View Scenarios
          </Button>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="red"
            onClick={deleteConfirm.confirmDelete}
          >
            <Trash2 size={14} />
          </ActionIcon>
        </Group>
      </Card>

      <Modal
        opened={deleteConfirm.showDelete}
        onClose={deleteConfirm.cancelDelete}
        title={DELETE_TITLE}
        centered
      >
        <Text size="sm" mb="lg" c="dimmed">
          {DELETE_MESSAGE}
        </Text>
        <Group justify="flex-end">
          <Button variant="secondary" onClick={deleteConfirm.cancelDelete}>
            Cancel
          </Button>
          <Button color="red" onClick={deleteConfirm.handleDelete}>
            Delete
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={showVarsModal}
        onClose={() => setShowVarsModal(false)}
        title={`Service Variables: ${service.name}`}
        centered
        size="lg"
      >
        <VariablesEditor
          serviceVariables={localVars}
          inheritedProjectVariables={inheritedProjectVariables}
          onServiceVariablesChange={setLocalVars}
          showInheritance={true}
        />
        <Group justify="flex-end" mt="md">
          <Button variant="secondary" onClick={() => setShowVarsModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveVariables}>
            Save Variables
          </Button>
        </Group>
      </Modal>
    </>
  );
}
