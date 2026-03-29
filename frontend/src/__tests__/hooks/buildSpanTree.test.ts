import { describe, it, expect } from 'vitest';
import { buildSpanTree, SpanTreeNode } from '../../components/Spans/buildSpanTree';
import { SpanConfig, SpanKind, StatusCode } from '../../types';

describe('buildSpanTree', () => {
  const createSpan = (overrides: Partial<SpanConfig> = {}): SpanConfig => ({
    id: 'span-1',
    name: 'Root Span',
    kind: SpanKind.INTERNAL,
    statusCode: StatusCode.OK,
    durationMs: 100,
    attributes: {},
    events: [],
    links: [],
    ...overrides,
  });

  it('returns empty array for empty input', () => {
    expect(buildSpanTree([])).toEqual([]);
  });

  it('creates a single root node for a single span', () => {
    const spans = [createSpan({ id: 'span-1', name: 'Root' })];
    const tree = buildSpanTree(spans);
    
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('span-1');
    expect(tree[0].span.name).toBe('Root');
    expect(tree[0].children).toEqual([]);
  });

  it('creates root node with children when spans have parentSpanId', () => {
    const spans = [
      createSpan({ id: 'span-1', name: 'Root' }),
      createSpan({ id: 'span-2', name: 'Child', parentSpanId: 'span-1' }),
    ];
    const tree = buildSpanTree(spans);
    
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('span-1');
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].id).toBe('span-2');
  });

  it('handles multiple root spans', () => {
    const spans = [
      createSpan({ id: 'span-1', name: 'Root 1' }),
      createSpan({ id: 'span-2', name: 'Root 2' }),
    ];
    const tree = buildSpanTree(spans);
    
    expect(tree).toHaveLength(2);
  });

  it('handles deeply nested spans', () => {
    const spans = [
      createSpan({ id: 'span-1', name: 'Level 1' }),
      createSpan({ id: 'span-2', name: 'Level 2', parentSpanId: 'span-1' }),
      createSpan({ id: 'span-3', name: 'Level 3', parentSpanId: 'span-2' }),
    ];
    const tree = buildSpanTree(spans);
    
    expect(tree).toHaveLength(1);
    expect(tree[0].children[0].id).toBe('span-2');
    expect(tree[0].children[0].children[0].id).toBe('span-3');
  });

  it('spans with invalid parentSpanId become root nodes', () => {
    const spans = [
      createSpan({ id: 'span-1', name: 'Root' }),
      createSpan({ id: 'span-2', name: 'Orphan', parentSpanId: 'non-existent' }),
    ];
    const tree = buildSpanTree(spans);
    
    expect(tree).toHaveLength(2);
    expect(tree.find(n => n.id === 'span-2')).toBeDefined();
  });
});