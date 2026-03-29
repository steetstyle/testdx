import { useCallback } from 'react';

export function useSpanAttributes(
  attributes: Record<string, string | number | boolean>,
  onUpdate: (attributes: Record<string, string | number | boolean>) => void
) {
  const handleAttributeChange = useCallback(
    (key: string, value: string | number | boolean, isKey: boolean) => {
      const newAttrs = { ...attributes };
      if (isKey) {
        const oldKey = key;
        const entries = Object.entries(newAttrs);
        const idx = entries.findIndex(([k]) => k === oldKey);
        if (idx >= 0) {
          const [, val] = entries[idx];
          delete newAttrs[oldKey];
          newAttrs[value as string] = val;
        }
      } else {
        newAttrs[key] = value;
      }
      onUpdate(newAttrs);
    },
    [attributes, onUpdate]
  );

  const handleAddAttribute = useCallback(() => {
    const newAttrs = { ...attributes, ['']: '' };
    onUpdate(newAttrs);
  }, [attributes, onUpdate]);

  const handleRemoveAttribute = useCallback(
    (key: string) => {
      const newAttrs = { ...attributes };
      delete newAttrs[key];
      onUpdate(newAttrs);
    },
    [attributes, onUpdate]
  );

  return {
    attributes,
    handleAttributeChange,
    handleAddAttribute,
    handleRemoveAttribute,
  };
}