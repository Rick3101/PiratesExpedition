import { useState, useCallback } from 'react';
import { useModalState } from './useModalState';
import { QualityGrade } from '@/types/expedition';
import { bramblerService, type EncryptedItem } from '@/services/api/bramblerService';

export interface AddItemModalReturn {
  isOpen: boolean;
  availableItems: EncryptedItem[];
  selectedItemId: number | null;
  itemQuantity: number;
  itemQuality: QualityGrade | '';
  addingItem: boolean;
  open: () => Promise<void>;
  close: () => void;
  handleAdd: (
    expeditionId: number,
    addFn: (expeditionId: number, items: any) => Promise<void>,
    onSuccess: () => Promise<void>
  ) => Promise<void>;
  setSelectedItemId: (id: number | null) => void;
  setItemQuantity: (quantity: number) => void;
  setItemQuality: (quality: QualityGrade | '') => void;
}

/**
 * Specialized hook for managing the "Add Item" modal state and logic
 * Encapsulates encrypted item selection, quantity/quality configuration, and item addition flow
 */
export const useAddItemModal = (): AddItemModalReturn => {
  const modal = useModalState<EncryptedItem[]>();
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemQuality, setItemQuality] = useState<QualityGrade | ''>('');
  const [addingItem, setAddingItem] = useState(false);

  const open = useCallback(async () => {
    try {
      const items = await bramblerService.getAllEncryptedItems();
      modal.openModal(items);
      setSelectedItemId(null);
      setItemQuantity(1);
      setItemQuality('');
    } catch (error) {
      console.error('Error loading encrypted items:', error);
      throw error;
    }
  }, [modal]);

  const close = useCallback(() => {
    modal.closeModal();
    setSelectedItemId(null);
    setItemQuantity(1);
    setItemQuality('');
  }, [modal]);

  const handleAdd = useCallback(async (
    expeditionId: number,
    addFn: (expeditionId: number, items: any) => Promise<void>,
    onSuccess: () => Promise<void>
  ) => {
    if (!selectedItemId || itemQuantity <= 0) {
      return;
    }

    setAddingItem(true);
    try {
      // Execute the add operation
      await addFn(expeditionId, {
        items: [{
          product_id: selectedItemId,
          quantity: itemQuantity,
          unit_cost: itemQuality ? parseFloat(itemQuality) : undefined,
        }],
      });

      // Wait for the refresh to complete before closing
      await onSuccess();

      // Now close the modal with fresh data loaded
      close();
    } catch (error) {
      console.error('Error adding item:', error);
      throw error;
    } finally {
      setAddingItem(false);
    }
  }, [selectedItemId, itemQuantity, itemQuality, close]);

  return {
    isOpen: modal.isOpen,
    availableItems: modal.data || [],
    selectedItemId,
    itemQuantity,
    itemQuality,
    addingItem,
    open,
    close,
    handleAdd,
    setSelectedItemId,
    setItemQuantity,
    setItemQuality,
  };
};
