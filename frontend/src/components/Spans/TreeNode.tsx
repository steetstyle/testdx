import { Box, ActionIcon, Text, Badge, Group } from '@mantine/core';
import { ChevronRight, ChevronDown, Plus, Trash2, Circle, Square, Hexagon, Octagon, Type } from 'lucide-react';
import { Collapse } from '@mantine/core';
import { SpanKind, StatusCode } from '../../types';
import { SpanTreeNode } from './buildSpanTree';

const SpanKindIcons: Record<SpanKind, React.ReactNode> = {
  [SpanKind.SERVER]: <Circle size={14} />,
  [SpanKind.CLIENT]: <Square size={14} />,
  [SpanKind.PRODUCER]: <Hexagon size={14} />,
  [SpanKind.CONSUMER]: <Octagon size={14} />,
  [SpanKind.INTERNAL]: <Type size={14} />,
};

const StatusBadgeColors: Record<StatusCode, string> = {
  [StatusCode.OK]: 'green',
  [StatusCode.ERROR]: 'red',
  [StatusCode.UNSET]: 'gray',
};

interface TreeNodeProps {
  node: SpanTreeNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (id: string) => void;
  onDelete: (id: string) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (id: string) => void;
}

export function TreeNode({
  node,
  depth,
  selectedId,
  onSelect,
  onAddChild,
  onDelete,
  expandedNodes,
  onToggleExpand,
}: TreeNodeProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <Box>
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          paddingLeft: depth * 20 + 8,
          cursor: 'pointer',
          borderRadius: 4,
          backgroundColor: isSelected ? 'var(--color-bg-highlighted)' : 'transparent',
          borderLeft: isSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
        }}
        onClick={() => onSelect(node.id)}
      >
        <ActionIcon
          variant="subtle"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(node.id);
          }}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span style={{ width: 14 }} />
          )}
        </ActionIcon>

        <Box style={{ color: 'var(--color-primary)', marginRight: 6 }}>
          {SpanKindIcons[node.span.kind]}
        </Box>

        <Text size="sm" style={{ flex: 1, color: 'var(--color-text)' }}>
          {node.span.name || 'Unnamed Span'}
        </Text>

        <Badge size="xs" variant="light" color={StatusBadgeColors[node.span.statusCode]} mr="xs">
          {node.span.statusCode}
        </Badge>

        <Text size="xs" c="dimmed" mr="xs">
          {node.span.durationMs}ms
        </Text>

        {hasChildren && (
          <Badge size="xs" variant="outline" color="gray" mr="xs">
            {node.children.length}
          </Badge>
        )}

        <Group gap={4} onClick={(e) => e.stopPropagation()}>
          <ActionIcon
            variant="subtle"
            size="sm"
            color="gray"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(node.id);
            }}
          >
            <Plus size={12} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            size="sm"
            color="red"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            disabled={depth === 0}
          >
            <Trash2 size={12} />
          </ActionIcon>
        </Group>
      </Box>

      <Collapse in={isExpanded}>
        {node.children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedId={selectedId}
            onSelect={onSelect}
            onAddChild={onAddChild}
            onDelete={onDelete}
            expandedNodes={expandedNodes}
            onToggleExpand={onToggleExpand}
          />
        ))}
      </Collapse>
    </Box>
  );
}