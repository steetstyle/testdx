import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Box, Group, Title, Text, Button, ActionIcon, Stack, Loader, Modal, TextInput, Textarea, Divider, Grid } from '@mantine/core';
import { Plus, Folder, Server } from 'lucide-react';
import { projectApi, serviceApi } from '../../services/api';
import { OTelConfigForm } from '../../components/OTelConfigForm';
import { ServiceCard } from '../../components/ServiceCard';
import { useStaleRef } from '../../hooks';
import type { Project, Service } from '../../types';
import type { GlobalVariables } from '../../services/variables/types';

export function ServicesPage() {
  const { projectId: projectIdParam } = useParams<{ projectId: string }>();
  const projectId = projectIdParam || '';
  const [services, setServices] = useState<Service[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const editingServiceRef = useStaleRef(editingService);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    otelSdkConfig: null as any,
  });

  const loadData = async () => {
    try {
      const [projectData, servicesData] = await Promise.all([
        projectApi.getProject(projectId),
        serviceApi.getServices(projectId),
      ]);
      setProject(projectData);
      setServices(servicesData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  useEffect(() => {
    editingServiceRef.current = editingService;
  }, [editingService]);

  const handleCreateService = async () => {
    try {
      await serviceApi.createService({
        projectId,
        name: newService.name,
        description: newService.description,
        otelSdkConfig: newService.otelSdkConfig,
      });
      await loadData();
      setShowServiceModal(false);
      setNewService({ name: '', description: '', otelSdkConfig: null });
    } catch (err) {
      console.error('Failed to create service:', err);
    }
  };

  const handleUpdateService = async () => {
    const current = editingServiceRef.current;
    if (!current) return;
    try {
      await serviceApi.updateService(current._id, {
        name: current.name,
        description: current.description,
        otelSdkConfig: current.otelSdkConfig,
      });
      await loadData();
      setShowEditModal(false);
      setEditingService(null);
    } catch (err) {
      console.error('Failed to update service:', err);
    }
  };

  const handleServiceVariablesSave = async (id: string, variables: GlobalVariables) => {
    try {
      await serviceApi.updateService(id, { serviceVariables: variables } as any);
      await loadData();
    } catch (err) {
      console.error('Failed to save service variables:', err);
    }
  };

  const openEditModal = (service: Service) => {
    setEditingService({ ...service });
    setShowEditModal(true);
  };

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-body)' }}>
      <Box
        component="header"
        style={{
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-header)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Group justify="space-between" p="md" maw={1200} mx="auto">
          <Group>
            <ActionIcon variant="subtle" component={Link} to="/synthetic" size="lg">
              <Folder size={20} />
            </ActionIcon>
            <div>
              <Title order={3} style={{ color: 'var(--color-text)' }}>
                {project?.name || 'Services'}
              </Title>
              <Text size="sm" c="dimmed">
                {project?.otelCollectorEndpoint}
              </Text>
            </div>
          </Group>
          <Button
            variant="primary"
            leftSection={<Plus size={16} />}
            onClick={() => setShowServiceModal(true)}
          >
            New Service
          </Button>
        </Group>
      </Box>

      <Box p="md" maw={1200} mx="auto">
        {loading ? (
          <Stack align="center" py="xl">
            <Loader color="green" />
          </Stack>
        ) : services.length === 0 ? (
          <Stack align="center" py="xl">
            <Box style={{ padding: 16, borderRadius: '50%', backgroundColor: 'var(--color-bg-muted)' }}>
              <Server size={32} style={{ color: 'var(--color-text-muted)' }} />
            </Box>
            <Title order={4} style={{ color: 'var(--color-text)' }}>No services yet</Title>
            <Text c="dimmed" mb="md">Create a service to configure OTel SDK settings</Text>
            <Button
              variant="primary"
              leftSection={<Plus size={16} />}
              onClick={() => setShowServiceModal(true)}
            >
              Create Service
            </Button>
          </Stack>
        ) : (
          <Grid>
            {services.map(service => (
              <Grid.Col key={service._id} span={{ base: 12, md: 6, lg: 4 }}>
                <ServiceCard
                  service={service}
                  onEdit={openEditModal}
                  onVariablesSave={handleServiceVariablesSave}
                  inheritedProjectVariables={project?.projectVariables}
                />
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Box>

      <Modal
        opened={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        title="Create New Service"
        centered
        size="xl"
      >
        <Stack>
          <TextInput
            label="Service Name"
            value={newService.name}
            onChange={(e) => setNewService({ ...newService, name: e.target.value })}
            placeholder="my-service"
            required
          />
          <Textarea
            label="Description"
            value={newService.description}
            onChange={(e) => setNewService({ ...newService, description: e.target.value })}
            placeholder="Optional description"
            rows={2}
          />
          <Divider label="OTel SDK Configuration" labelPosition="center" my="sm" />
          <OTelConfigForm
            value={newService.otelSdkConfig}
            onChange={(config) => setNewService({ ...newService, otelSdkConfig: config })}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="secondary" onClick={() => setShowServiceModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateService}>
              Create Service
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Service"
        centered
        size="xl"
      >
        {editingService && (
          <Stack>
            <TextInput
              label="Service Name"
              value={editingService.name}
              onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
            />
            <Textarea
              label="Description"
              value={editingService.description}
              onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
              rows={2}
            />
            <Divider label="OTel SDK Configuration" labelPosition="center" my="sm" />
            <OTelConfigForm
              value={editingService.otelSdkConfig}
              onChange={(config) => setEditingService({ ...editingService, otelSdkConfig: config })}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdateService}>
                Save Changes
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
}
