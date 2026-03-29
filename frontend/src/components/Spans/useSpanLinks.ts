import { useCallback } from 'react';
import { SpanLink } from '../../types';

export function useSpanLinks(
  links: SpanLink[],
  onUpdate: (links: SpanLink[]) => void
) {
  const handleLinkChange = useCallback(
    (idx: number, field: keyof SpanLink, value: unknown) => {
      const newLinks = [...links];
      newLinks[idx] = { ...newLinks[idx], [field]: value as SpanLink[keyof SpanLink] };
      onUpdate(newLinks);
    },
    [links, onUpdate]
  );

  const handleAddLink = useCallback(() => {
    const newLink: SpanLink = {
      traceId: '',
      spanId: '',
      attributes: {},
    };
    onUpdate([...links, newLink]);
  }, [links, onUpdate]);

  const handleRemoveLink = useCallback(
    (idx: number) => {
      const newLinks = links.filter((_, i) => i !== idx);
      onUpdate(newLinks);
    },
    [links, onUpdate]
  );

  return {
    links,
    handleLinkChange,
    handleAddLink,
    handleRemoveLink,
  };
}