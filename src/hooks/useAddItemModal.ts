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
      console.log('[useAddItemModal] Loaded encrypted items:', items);
      console.log('[useAddItemModal] Items with product_id:', items.filter(item => item.product_id));
      console.log('[useAddItemModal] Items WITHOUT product_id:', items.filter(item => !item.product_id));
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

    // Find the selected encrypted item to get its product_id
    const selectedItem = modal.data?.find(item => item.id === selectedItemId);
    console.log('[useAddItemModal] Selected encrypted item ID:', selectedItemId);
    console.log('[useAddItemModal] Found encrypted item:', selectedItem);

    if (!selectedItem) {
      console.error('[useAddItemModal] Selected item not found in available items');
      return;
    }

    if (!selectedItem.product_id) {
      console.error('[useAddItemModal] Selected item does not have a product_id. Encrypted item:', selectedItem);
      alert('Error: This encrypted item is not linked to a product. Please contact support or select a different item.');
      return;
    }

    console.log('[useAddItemModal] Using product_id:', selectedItem.product_id, 'for encrypted item:', selectedItem.encrypted_item_name);

    setAddingItem(true);
    try {
      // Execute the add operation
      const requestData = {
        items: [{
          product_id: selectedItem.product_id, // Use product_id from the encrypted item
          quantity: itemQuantity,
          unit_cost: itemQuality ? parseFloat(itemQuality) : undefined,
        }],
      };
      console.log('[useAddItemModal] Sending request to add items:', requestData);

      await addFn(expeditionId, requestData);

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
  }, [selectedItemId, itemQuantity, itemQuality, close, modal.data]);

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
