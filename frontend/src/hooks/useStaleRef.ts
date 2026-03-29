import { useRef, useEffect } from 'react';

export function useStaleRef<T>(value: T): React.RefObject<T> {
  const ref = useRef<T>(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
