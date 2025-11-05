import { useState, useCallback } from 'react';
import { useModalState } from './useModalState';

export interface AddPirateModalReturn {
  isOpen: boolean;
  selectedName: string;
  open: () => void;
  close: () => void;
  handleAdd: (addFn: (name: string) => Promise<void>, onSuccess: () => Promise<void>) => Promise<void>;
  setSelectedName: (name: string) => void;
}

/**
 * Specialized hook for managing the "Add Pirate" modal state and logic
 * Encapsulates pirate selection and addition flow
 */
export const useAddPirateModal = (): AddPirateModalReturn => {
  const modal = useModalState<void>();
  const [selectedName, setSelectedName] = useState('');

  const open = useCallback(() => {
    modal.openModal();
    setSelectedName('');
  }, [modal]);

  const close = useCallback(() => {
    modal.closeModal();
    setSelectedName('');
  }, [modal]);

  const handleAdd = useCallback(async (
    addFn: (name: string) => Promise<void>,
    onSuccess: () => Promise<void>
  ) => {
    if (!selectedName.trim()) {
      return;
    }

    try {
      await addFn(selectedName);
      await onSuccess();
      close();
    } catch (error) {
      console.error('Error adding pirate:', error);
      throw error;
    }
  }, [selectedName, close]);

  return {
    isOpen: modal.isOpen,
    selectedName,
    open,
    close,
    handleAdd,
    setSelectedName,
  };
};
