import { useState } from 'react';
import { bramblerService } from '@/services/api/bramblerService';
import { hapticFeedback } from '@/utils/telegram';

interface UseNameDecryptionOptions {
  expeditionId: number;
  isOwner: boolean;
}

interface UseNameDecryptionReturn {
  showOriginalNames: boolean;
  decryptedMappings: Record<string, string>;
  decryptedItemMappings: Record<string, string>;
  isDecrypting: boolean;
  decryptError: string | null;
  handleToggleDisplay: () => void;
  getDisplayName: <T extends { pirate_name: string; original_name?: string }>(item: T) => string;
  hasOriginalName: <T extends { pirate_name: string; original_name?: string }>(item: T) => boolean;
  getDisplayItemName: <T extends { product_name?: string; encrypted_product_name?: string }>(item: T) => string;
  hasOriginalItemName: <T extends { product_name?: string; encrypted_product_name?: string }>(item: T) => boolean;
}

/**
 * Custom hook for handling name decryption in expedition tabs
 * Manages decryption state, owner key retrieval, and display toggling
 *
 * @param options - Configuration options
 * @param options.expeditionId - The expedition ID for decryption
 * @param options.isOwner - Whether the current user is the expedition owner
 * @param items - Array of items with pirate_name and optional original_name
 *
 * @returns Decryption state and utility functions
 *
 * @example
 * const { showOriginalNames, getDisplayName, handleToggleDisplay } = useNameDecryption({
 *   expeditionId: 123,
 *   isOwner: true
 * }, pirates);
 */
export const useNameDecryption = <T extends { pirate_name: string; original_name?: string }>(
  options: UseNameDecryptionOptions,
  items: T[]
): UseNameDecryptionReturn => {
  const { expeditionId, isOwner } = options;

  const [showOriginalNames, setShowOriginalNames] = useState(false);
  const [decryptedMappings, setDecryptedMappings] = useState<Record<string, string>>({});
  const [decryptedItemMappings, setDecryptedItemMappings] = useState<Record<string, string>>({});
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [ownerKey, setOwnerKey] = useState<string | null>(null);

  // Get the display name for an item (decrypted if available and showOriginalNames is true)
  const getDisplayName = <T extends { pirate_name: string; original_name?: string }>(item: T): string => {
    if (showOriginalNames) {
      // Check decrypted mappings first
      if (decryptedMappings[item.pirate_name]) {
        return decryptedMappings[item.pirate_name];
      }
      // Fall back to API-provided original name (for backward compatibility)
      if (item.original_name) {
        return item.original_name;
      }
    }
    return item.pirate_name;
  };

  // Check if item has original name (either from API or decrypted)
  const hasOriginalName = <T extends { pirate_name: string; original_name?: string }>(item: T): boolean => {
    return Boolean(item.original_name || decryptedMappings[item.pirate_name]);
  };

  // Get the display name for an item/product (decrypted if available and showOriginalNames is true)
  const getDisplayItemName = <T extends { product_name?: string; encrypted_product_name?: string }>(item: T): string => {
    const encryptedName = item.encrypted_product_name || item.product_name || '';

    if (showOriginalNames && encryptedName) {
      // Check decrypted item mappings first
      if (decryptedItemMappings[encryptedName]) {
        return decryptedItemMappings[encryptedName];
      }
    }
    // Return encrypted name or product name
    return encryptedName;
  };

  // Check if item has original item name (decrypted)
  const hasOriginalItemName = <T extends { product_name?: string; encrypted_product_name?: string }>(item: T): boolean => {
    const encryptedName = item.encrypted_product_name || item.product_name || '';
    return Boolean(encryptedName && decryptedItemMappings[encryptedName]);
  };

  // Check if any items need decryption (have no original_name from API)
  const hasEncryptedItems = items.some(item => !item.original_name);

  // Check if owner can see original names directly from API
  const hasDirectOriginalNames = items.some(item => item.original_name);

  const handleDecryptNames = async () => {
    if (!isOwner) {
      setDecryptError('Only the expedition owner can decrypt pirate names');
      return;
    }

    setIsDecrypting(true);
    setDecryptError(null);
    hapticFeedback('medium');

    try {
      // First, get the owner key if we don't have it
      let keyToUse = ownerKey;

      if (!keyToUse) {
        try {
          keyToUse = await bramblerService.getOwnerKey(expeditionId);
          setOwnerKey(keyToUse);
        } catch (error: any) {
          console.error('Failed to get owner key:', error);
          const errorMsg = error?.message || 'Failed to retrieve owner key';
          setDecryptError(`Owner key error: ${errorMsg}. Make sure you are the expedition owner.`);
          return;
        }
      }

      // Now decrypt with the owner key
      try {
        // Decrypt pirate names
        const decrypted = await bramblerService.decryptNames(expeditionId, {
          owner_key: keyToUse
        });

        setDecryptedMappings(decrypted);

        // Also decrypt item names
        try {
          const decryptedItems = await bramblerService.decryptItemNames(expeditionId, keyToUse);
          setDecryptedItemMappings(decryptedItems);
        } catch (itemError: any) {
          console.warn('Failed to decrypt item names:', itemError);
          // Don't fail the whole operation if item decryption fails
        }

        setShowOriginalNames(true);
      } catch (error: any) {
        console.error('Failed to decrypt names:', error);
        const errorMsg = error?.message || 'Decryption failed';
        setDecryptError(`Decryption error: ${errorMsg}. The owner key may be invalid or data may be corrupted.`);
      }
    } catch (error: any) {
      console.error('Unexpected decryption error:', error);
      setDecryptError('An unexpected error occurred. Please try again.');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleToggleDisplay = () => {
    hapticFeedback('light');
    if (!showOriginalNames) {
      // If there are direct original names from API (no encryption), just toggle
      if (hasDirectOriginalNames && !hasEncryptedItems) {
        setShowOriginalNames(true);
      } else if (hasEncryptedItems) {
        // Try to decrypt encrypted names
        handleDecryptNames();
      } else {
        // Fallback: just toggle
        setShowOriginalNames(true);
      }
    } else {
      // Hide original names
      setShowOriginalNames(false);
    }
  };

  return {
    showOriginalNames,
    decryptedMappings,
    decryptedItemMappings,
    isDecrypting,
    decryptError,
    handleToggleDisplay,
    getDisplayName,
    hasOriginalName,
    getDisplayItemName,
    hasOriginalItemName,
  };
};
