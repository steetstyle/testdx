import { useState } from 'react';
import {
  Box, Group, Button, Text, Stack, Card, ActionIcon,
  Grid, TextInput, Select
} from '@mantine/core';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapse } from '@mantine/core';
import { ViewConfig, AggregationType } from '../../types';

interface ViewEditorProps {
  views: ViewConfig[];
  onUpdate: (views: ViewConfig[]) => void;
}

export function ViewEditor({ views, onUpdate }: ViewEditorProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const emptyView: ViewConfig = { name: '', description: '', unit: '', attributeKeys: [], aggregation: AggregationType.HISTOGRAM };

  const handleAdd = () => {
    onUpdate([...views, { ...emptyView, name: `view_${views.length + 1}` }]);
    setExpanded(prev => new Set([...prev, views.length]));
  };

  const handleUpdate = (idx: number, updates: Partial<ViewConfig>) => {
    const newViews = [...views];
    newViews[idx] = { ...newViews[idx], ...updates };
    onUpdate(newViews);
  };

  const handleDelete = (idx: number) => {
    onUpdate(views.filter((_, i) => i !== idx));
    setExpanded(prev => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
  };

  const toggleExpand = (idx: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  return (
    <Box>
      <Group justify="space-between" mb="xs">
        <Text size="sm" fw={500}>Views</Text>
        <Button size="xs" variant="subtle" leftSection={<Plus size={12} />} onClick={handleAdd}>
          Add View
        </Button>
      </Group>
      {views.length === 0 ? (
        <Text size="sm" c="dimmed">No views configured (uses default)</Text>
      ) : (
        <Stack gap="xs">
          {views.map((view, idx) => (
            <Card key={idx} withBorder padding="xs" style={{ backgroundColor: 'var(--color-bg-muted)' }}>
              <Group justify="space-between" onClick={() => toggleExpand(idx)} style={{ cursor: 'pointer' }}>
                <Group gap="xs">
                  <ActionIcon variant="subtle" size="sm">
                    {expanded.has(idx) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </ActionIcon>
                  <Text size="sm">{view.name}</Text>
                </Group>
                <ActionIcon variant="subtle" size="sm" color="red" onClick={(e) => { e.stopPropagation(); handleDelete(idx); }}>
                  <Trash2 size={12} />
                </ActionIcon>
              </Group>
              <Collapse in={expanded.has(idx)}>
                <Grid mt="xs">
                  <Grid.Col span={6}>
                    <TextInput
                      label="Name"
                      value={view.name}
                      onChange={(e) => handleUpdate(idx, { name: e.target.value })}
                      size="sm"
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <TextInput
                      label="Description"
                      value={view.description || ''}
                      onChange={(e) => handleUpdate(idx, { description: e.target.value })}
                      size="sm"
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <TextInput
                      label="Unit"
                      value={view.unit || ''}
                      onChange={(e) => handleUpdate(idx, { unit: e.target.value })}
                      size="sm"
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Select
                      label="Aggregation"
                      data={Object.values(AggregationType).map(a => ({ value: a, label: a }))}
                      value={view.aggregation || AggregationType.HISTOGRAM}
                      onChange={(val) => handleUpdate(idx, { aggregation: val as AggregationType })}
                      size="sm"
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <TextInput
                      label="Histogram Boundaries"
                      value={(view.histogramBucketBoundaries || []).join(', ')}
                      onChange={(e) => {
                        const bounds = e.target.value.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
                        handleUpdate(idx, { histogramBucketBoundaries: bounds });
                      }}
                      size="sm"
                      placeholder="0.005, 0.01, 0.025, 0.05, 0.1"
                    />
                  </Grid.Col>
                </Grid>
              </Collapse>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}