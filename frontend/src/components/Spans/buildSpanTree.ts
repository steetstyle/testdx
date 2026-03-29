import { SpanConfig as SpanConfigType } from '../../types';

export interface SpanTreeNode {
  id: string;
  span: SpanConfigType;
  children: SpanTreeNode[];
}

export function buildSpanTree(spans: SpanConfigType[]): SpanTreeNode[] {
  const spanMap = new Map<string, SpanTreeNode>();
  const rootNodes: SpanTreeNode[] = [];

  spans.forEach((span) => {
    spanMap.set(span.id || span.name, {
      id: span.id || span.name,
      span,
      children: [],
    });
  });

  spans.forEach((span) => {
    const node = spanMap.get(span.id || span.name)!;
    if (span.parentSpanId && spanMap.has(span.parentSpanId)) {
      const parent = spanMap.get(span.parentSpanId)!;
      parent.children.push(node);
    } else {
      rootNodes.push(node);
    }
  });

  return rootNodes;
}