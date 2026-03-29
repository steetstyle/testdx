import { useState, useCallback } from 'react';

export interface DeleteConfirmOptions {
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
}

export interface UseDeleteConfirmReturn {
  showDelete: boolean;
  confirmDelete: () => void;
  cancelDelete: () => void;
  handleDelete: () => Promise<void>;
}

export function useDeleteConfirm(options: DeleteConfirmOptions): UseDeleteConfirmReturn {
  const [showDelete, setShowDelete] = useState(false);

  const confirmDelete = useCallback(() => {
    setShowDelete(true);
  }, []);

  const cancelDelete = useCallback(() => {
    setShowDelete(false);
  }, []);

  const handleDelete = useCallback(async () => {
    try {
      await options.onConfirm();
      setShowDelete(false);
    } catch (err) {
      console.error('Delete failed:', err);
      throw err;
    }
  }, [options]);

  return {
    showDelete,
    confirmDelete,
    cancelDelete,
    handleDelete,
  };
}
