import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Text, Badge, Group, Button, ActionIcon, Box, Modal, Stack } from '@mantine/core';
import { Trash2, Variable } from 'lucide-react';
import { VariablesEditor, VariablesSummary } from './VariablesEditor';
import { useDeleteConfirm, useVariablesEditor } from '../hooks';
import type { Project } from '../types';
import type { GlobalVariables } from '../services/variables/types';

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
  onVariablesSave: (id: string, variables: GlobalVariables) => void;
}

const DELETE_TITLE = 'Delete Project?';
const DELETE_MESSAGE = 'This will delete all services and scenarios in this project. This action cannot be undone.';

export function ProjectCard({ project, onDelete, onVariablesSave }: ProjectCardProps) {
  const deleteConfirm = useDeleteConfirm({
    title: DELETE_TITLE,
    message: DELETE_MESSAGE,
    onConfirm: async () => {
      await onDelete(project._id);
    },
  });

  const [localVars, setLocalVars] = useState<GlobalVariables>(project.projectVariables || {});
  const [showVarsModal, setShowVarsModal] = useState(false);

  const handleOpenVariables = () => {
    setLocalVars(project.projectVariables || {});
    setShowVarsModal(true);
  };

  const handleSaveVariables = async () => {
    await onVariablesSave(project._id, localVars);
    setShowVarsModal(false);
  };

  return (
    <>
      <Card padding="md" radius="md" withBorder>
        <Group justify="space-between" mb="xs">
          <Box style={{ minWidth: 0, flex: 1 }}>
            <Text fw={500} truncate style={{ color: 'var(--color-text)' }}>
              {project.name}
            </Text>
            <Text size="sm" c="dimmed" truncate>
              {project.description || 'No description'}
            </Text>
          </Box>
          <Badge variant="light" color="green" size="sm">
            {project.otelCollectorEndpoint}
          </Badge>
        </Group>

        {Object.keys(project.projectVariables || {}).length > 0 && (
          <Box mb="sm">
            <VariablesSummary variables={project.projectVariables || {}} />
          </Box>
        )}

        <Group gap="xs">
          <Button
            size="xs"
            variant="secondary"
            component={Link}
            to={`/synthetic/${project._id}`}
          >
            View Services
          </Button>
          <Button
            size="xs"
            variant="subtle"
            leftSection={<Variable size={12} />}
            onClick={handleOpenVariables}
          >
            Variables
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
        title={`Project Variables: ${project.name}`}
        centered
        size="lg"
      >
        <VariablesEditor
          projectVariables={localVars}
          onProjectVariablesChange={setLocalVars}
          showInheritance={false}
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
