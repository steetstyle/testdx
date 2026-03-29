import { useState, useCallback } from 'react';
import type { GlobalVariables } from '../services/variables/types';

export interface UseVariablesEditorReturn {
  showModal: boolean;
  variables: GlobalVariables;
  openVariables: (initial: GlobalVariables) => void;
  closeVariables: () => void;
  saveVariables: (onSave: (vars: GlobalVariables) => Promise<void>) => Promise<void>;
}

export function useVariablesEditor(): UseVariablesEditorReturn {
  const [showModal, setShowModal] = useState(false);
  const [variables, setVariables] = useState<GlobalVariables>({});

  const openVariables = useCallback((initial: GlobalVariables) => {
    setVariables(initial || {});
    setShowModal(true);
  }, []);

  const closeVariables = useCallback(() => {
    setShowModal(false);
  }, []);

  const saveVariables = useCallback(async (onSave: (vars: GlobalVariables) => Promise<void>) => {
    try {
      await onSave(variables);
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save variables:', err);
      throw err;
    }
  }, [variables]);

  return {
    showModal,
    variables,
    openVariables,
    closeVariables,
    saveVariables,
  };
}
