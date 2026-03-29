import { useState, useEffect } from 'react';
import { Box, Group, Title, Text, Button, Stack, Loader, Modal, TextInput, Textarea, Divider, Grid, Alert, Badge, Card } from '@mantine/core';
import { Plus, FileCode, Folder, FileText } from 'lucide-react';
import { projectApi } from '../../services/api';
import { ProjectCard } from '../../components/ProjectCard';
import type { Project } from '../../types';
import type { GlobalVariables } from '../../services/variables/types';

export function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showYamlModal, setShowYamlModal] = useState(false);
  const [yamlContent, setYamlContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [importFiles, setImportFiles] = useState<Array<{ name: string; path: string; size: number }>>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({ name: '', description: '', otelCollectorEndpoint: 'http://localhost:4318' });

  const loadProjects = async () => {
    try {
      const data = await projectApi.getProjects();
      setProjects(data);
    } catch (err) {
      setError('Failed to load projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (showYamlModal) {
      loadImportFiles();
    }
  }, [showYamlModal]);

  const loadImportFiles = async () => {
    try {
      const result = await projectApi.getImportFiles();
      setImportFiles(result.files);
    } catch (err) {
      console.error('Failed to load import files:', err);
      setImportFiles([]);
    }
  };

  const handleCreateProject = async () => {
    try {
      await projectApi.createProject(newProject);
      await loadProjects();
      setShowProjectModal(false);
      setNewProject({ name: '', description: '', otelCollectorEndpoint: 'http://localhost:4318' });
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await projectApi.deleteProject(id);
      setProjects(projects.filter(p => p._id !== id));
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const handleProjectVariablesSave = async (id: string, variables: GlobalVariables) => {
    try {
      await projectApi.updateProject(id, { projectVariables: variables } as any);
      await loadProjects();
    } catch (err) {
      console.error('Failed to save project variables:', err);
    }
  };

  const handleImportFile = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setImportError(null);
    try {
      await projectApi.importFromFile(selectedFile);
      await loadProjects();
      setShowYamlModal(false);
      setSelectedFile(null);
    } catch (err: any) {
      console.error('Failed to import file:', err);
      setImportError(err?.response?.data?.error || err.message || 'Failed to import file');
    } finally {
      setImporting(false);
    }
  };

  const handleImportYaml = async () => {
    if (!yamlContent.trim()) return;
    setImporting(true);
    setImportError(null);
    try {
      await projectApi.importFullYaml(yamlContent);
      await loadProjects();
      setShowYamlModal(false);
      setYamlContent('');
    } catch (err: any) {
      console.error('Failed to import YAML:', err);
      setImportError(err?.response?.data?.error || err.message || 'Failed to import YAML');
    } finally {
      setImporting(false);
    }
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
          <div>
            <Title order={2} style={{ color: 'var(--color-text)' }}>TestDX</Title>
            <Text size="sm" c="dimmed">Synthetic monitoring with full OTel SDK configuration</Text>
          </div>
          <Group gap="sm">
            <Button
              variant="secondary"
              leftSection={<FileCode size={16} />}
              onClick={() => setShowYamlModal(true)}
            >
              Import YAML
            </Button>
            <Button
              variant="primary"
              leftSection={<Plus size={16} />}
              onClick={() => setShowProjectModal(true)}
            >
              New Project
            </Button>
          </Group>
        </Group>
      </Box>

      <Box p="md" maw={1200} mx="auto">
        {loading ? (
          <Stack align="center" py="xl">
            <Loader color="green" />
          </Stack>
        ) : error ? (
          <Text c="red" ta="center" py="xl">{error}</Text>
        ) : projects.length === 0 ? (
          <Stack align="center" py="xl">
            <Box style={{ padding: 16, borderRadius: '50%', backgroundColor: 'var(--color-bg-muted)' }}>
              <Folder size={32} style={{ color: 'var(--color-text-muted)' }} />
            </Box>
            <Title order={4} style={{ color: 'var(--color-text)' }}>No projects yet</Title>
            <Text c="dimmed" mb="md">Create your first project to get started</Text>
            <Button
              variant="primary"
              leftSection={<Plus size={16} />}
              onClick={() => setShowProjectModal(true)}
            >
              Create Project
            </Button>
          </Stack>
        ) : (
          <Grid>
            {projects.map(project => (
              <Grid.Col key={project._id} span={{ base: 12, md: 6, lg: 4 }}>
                <ProjectCard
                  project={project}
                  onDelete={handleDeleteProject}
                  onVariablesSave={handleProjectVariablesSave}
                />
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Box>

      <Modal
        opened={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        title="Create New Project"
        centered
      >
        <Stack>
          <TextInput
            label="Project Name"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            placeholder="My Project"
            required
          />
          <Textarea
            label="Description"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            placeholder="Optional description"
            rows={2}
          />
          <TextInput
            label="OTel Collector Endpoint"
            value={newProject.otelCollectorEndpoint}
            onChange={(e) => setNewProject({ ...newProject, otelCollectorEndpoint: e.target.value })}
            placeholder="http://localhost:4318"
          />
          <Group justify="flex-end" mt="md">
            <Button variant="secondary" onClick={() => setShowProjectModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateProject}>
              Create Project
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={showYamlModal}
        onClose={() => setShowYamlModal(false)}
        title="Import Configuration"
        centered
        size="lg"
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Select a predefined configuration file or paste your own YAML.
          </Text>

          {importFiles.length > 0 && (
            <Box>
              <Text size="sm" fw={500} mb="xs">Available Configuration Files:</Text>
              <Box style={{ maxHeight: 200, overflow: 'auto', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                {importFiles.map((file) => (
                  <Box
                    key={file.name}
                    p="sm"
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: selectedFile === file.name ? 'var(--mantine-color-blue-0)' : 'transparent',
                    }}
                    onClick={() => {
                      setSelectedFile(file.name);
                      setYamlContent('');
                    }}
                  >
                    <Group>
                      <FileText size={16} style={{ color: 'var(--color-primary)' }} />
                      <div style={{ flex: 1 }}>
                        <Text size="sm" fw={500}>{file.name}</Text>
                        <Text size="xs" c="dimmed">{(file.size / 1024).toFixed(1)} KB</Text>
                      </div>
                      {selectedFile === file.name && (
                        <Badge color="blue" variant="light" size="sm">Selected</Badge>
                      )}
                    </Group>
                  </Box>
                ))}
              </Box>
              <Button
                variant="primary"
                onClick={handleImportFile}
                loading={importing}
                disabled={!selectedFile}
                fullWidth
                mt="md"
              >
                Import Selected File
              </Button>
            </Box>
          )}

          <Divider label="or paste YAML manually" labelPosition="center" />

          {importError && (
            <Alert color="red" title="Import Error">
              <Text size="sm">{importError}</Text>
            </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="secondary" onClick={() => setShowYamlModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleImportYaml}
              loading={importing}
              disabled={!yamlContent.trim()}
            >
              Import YAML
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
