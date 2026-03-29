import { useState, useCallback } from 'react';
import { Box, Group, Text, Button, Badge, Stack } from '@mantine/core';
import { Plus, GitBranch } from 'lucide-react';
import { SpanConfig as SpanConfigType } from '../types';
import { buildSpanTree, SpanTreeNode } from './Spans/buildSpanTree';
import { TreeNode } from './Spans/TreeNode';

interface SpanTreeEditorProps {
  spans: SpanConfigType[];
  selectedSpanId: string | null;
  onSelectSpan: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onAddSibling: (siblingId: string) => void;
  onDeleteSpan: (id: string) => void;
  onUpdateSpan: (id: string, updates: Partial<SpanConfigType>) => void;
}

export function SpanTreeEditor({
  spans,
  selectedSpanId,
  onSelectSpan,
  onAddChild,
  onDeleteSpan,
}: SpanTreeEditorProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const tree = buildSpanTree(spans);

  const handleAddRoot = () => {
    onAddChild('');
  };

  return (
    <Box
      style={{
        backgroundColor: 'var(--color-bg-muted)',
        borderRadius: 8,
        border: '1px solid var(--color-border)',
        minHeight: 300,
      }}
    >
      <Group p="sm" justify="space-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <Group gap="xs">
          <GitBranch size={16} />
          <Text size="sm" fw={500}>Span Tree</Text>
          <Badge size="sm" variant="light">{spans.length} spans</Badge>
        </Group>
        <Button
          size="xs"
          variant="subtle"
          leftSection={<Plus size={12} />}
          onClick={handleAddRoot}
        >
          Add Root
        </Button>
      </Group>

      <Box p="sm" style={{ maxHeight: 400, overflow: 'auto' }}>
        {tree.length === 0 ? (
          <Stack align="center" justify="center" py="xl">
            <Text size="sm" c="dimmed">No spans configured</Text>
            <Button size="xs" variant="light" leftSection={<Plus size={12} />} onClick={handleAddRoot}>
              Add First Span
            </Button>
          </Stack>
        ) : (
          tree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              selectedId={selectedSpanId}
              onSelect={onSelectSpan}
              onAddChild={(id) => onAddChild(id)}
              onDelete={onDeleteSpan}
              expandedNodes={expandedNodes}
              onToggleExpand={toggleExpand}
            />
          ))
        )}
      </Box>
    </Box>
  );
}

export default SpanTreeEditor;