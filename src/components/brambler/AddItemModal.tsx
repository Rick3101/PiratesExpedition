import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { PirateButton } from '@/components/ui/PirateButton';
import { pirateColors, spacing, pirateTypography } from '@/utils/pirateTheme';
import { hapticFeedback } from '@/utils/telegram';
import type { EncryptedItem } from '@/services/api/bramblerService';
import type { Product } from '@/types/expedition';

// Dummy expedition for global product name mappings
const GLOBAL_MAPPING_EXPEDITION_ID = 999999;

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (item: EncryptedItem) => void;
  masterKey: string;
}

interface AddItemFormData {
  productId: number;
  originalItemName: string;
  encryptedName: string;
  useCustomName: boolean;
  itemType: 'product' | 'custom' | 'resource';
}

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${spacing.lg};
`;

const ModalContent = styled(motion.div)`
  background: ${pirateColors.white};
  border-radius: 16px;
  padding: ${spacing.xl};
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.md};
  margin-bottom: ${spacing.lg};
`;

const ItemIcon = styled.div`
  font-size: 2.5rem;
  filter: drop-shadow(0 2px 4px rgba(139, 69, 19, 0.1));
`;

const ModalTitle = styled.h2`
  font-family: ${pirateTypography.headings};
  font-size: 1.5rem;
  color: ${pirateColors.primary};
  margin: 0;
  flex: 1;
`;

const ModalDescription = styled.p`
  color: ${pirateColors.muted};
  margin-bottom: ${spacing.lg};
  font-size: ${pirateTypography.sizes.sm};
  line-height: 1.5;
`;

const FormGroup = styled.div`
  margin-bottom: ${spacing.lg};
`;

const Label = styled.label`
  display: block;
  font-weight: ${pirateTypography.weights.medium};
  color: ${pirateColors.primary};
  margin-bottom: ${spacing.sm};
  font-size: ${pirateTypography.sizes.sm};
`;

const Select = styled.select`
  width: 100%;
  padding: ${spacing.md};
  border: 2px solid ${pirateColors.lightGold};
  border-radius: 8px;
  font-size: ${pirateTypography.sizes.base};
  font-family: ${pirateTypography.headings};
  color: ${pirateColors.primary};
  transition: all 0.3s ease;
  background: ${pirateColors.white};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${pirateColors.secondary};
    box-shadow: 0 0 0 3px rgba(218, 165, 32, 0.1);
  }

  option {
    padding: ${spacing.sm};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: ${spacing.md};
  border: 2px solid ${pirateColors.lightGold};
  border-radius: 8px;
  font-size: ${pirateTypography.sizes.base};
  font-family: ${pirateTypography.body};
  color: ${pirateColors.primary};
  transition: all 0.3s ease;
  background: ${pirateColors.white};

  &:focus {
    outline: none;
    border-color: ${pirateColors.secondary};
    box-shadow: 0 0 0 3px rgba(218, 165, 32, 0.1);
  }

  &::placeholder {
    color: ${pirateColors.muted};
    opacity: 0.6;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  cursor: pointer;
  font-size: ${pirateTypography.sizes.sm};
  color: ${pirateColors.primary};
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: ${pirateColors.secondary};
`;

const HelpText = styled.div`
  font-size: ${pirateTypography.sizes.xs};
  color: ${pirateColors.muted};
  margin-top: ${spacing.xs};
  font-style: italic;
`;

const InfoBox = styled.div`
  background: ${pirateColors.lightGold}40;
  padding: ${spacing.md};
  border-radius: 8px;
  border-left: 4px solid ${pirateColors.secondary};
  margin-bottom: ${spacing.lg};
  display: flex;
  align-items: start;
  gap: ${spacing.sm};
  font-size: ${pirateTypography.sizes.sm};
  color: ${pirateColors.primary};
  line-height: 1.5;
`;

const InfoIcon = styled.span`
  font-size: 1.2rem;
  flex-shrink: 0;
`;

const ErrorMessage = styled.div`
  color: ${pirateColors.danger};
  font-size: ${pirateTypography.sizes.sm};
  margin-top: ${spacing.xs};
  padding: ${spacing.sm};
  background: ${pirateColors.danger}10;
  border-radius: 8px;
`;

const ModalActions = styled.div`
  display: flex;
  gap: ${spacing.md};
  justify-content: flex-end;
  margin-top: ${spacing.xl};
  padding-top: ${spacing.lg};
  border-top: 1px solid ${pirateColors.lightGold};
`;

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  masterKey
}) => {
  const [formData, setFormData] = useState<AddItemFormData>({
    productId: 0,
    originalItemName: '',
    encryptedName: '',
    useCustomName: false,
    itemType: 'product'
  });
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        productId: 0,
        originalItemName: '',
        encryptedName: '',
        useCustomName: false,
        itemType: 'product'
      });
      setError(null);
      setLoading(false);

      // Load available products that don't have encrypted names yet
      loadAvailableProducts();
    }
  }, [isOpen]);

  const loadAvailableProducts = async () => {
    setLoadingProducts(true);
    try {
      const { productService } = await import('@/services/api/productService');
      const { bramblerService } = await import('@/services/api/bramblerService');

      // Get all products
      const allProducts = await productService.getAll();

      // Decrypt all items to see which product names are already encrypted
      let encryptedProductNames = new Set<string>();

      try {
        const decryptedMappings = await bramblerService.decryptAll(masterKey);
        // decryptedMappings.item_mappings is { "encrypted_name": "original_name" }
        // We need the original names (values)
        const originalNames = Object.values(decryptedMappings.item_mappings);
        encryptedProductNames = new Set(
          originalNames.map(name => name.toLowerCase())
        );
      } catch (decryptError) {
        console.warn('Could not decrypt items, showing all products:', decryptError);
        // If decryption fails, we can't filter, so show all products
      }

      // Filter out products that already have encrypted names
      const available = allProducts.filter(
        product => !encryptedProductNames.has(product.name.toLowerCase())
      );

      setAvailableProducts(available);
    } catch (err) {
      console.error('Failed to load available products:', err);
      setError('Failed to load available products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!formData.productId) {
      setError('Please select a product');
      setLoading(false);
      hapticFeedback('error');
      return;
    }

    if (formData.useCustomName && !formData.encryptedName.trim()) {
      setError('Please enter a custom encrypted name or uncheck the option');
      setLoading(false);
      hapticFeedback('error');
      return;
    }

    // Get the selected product name
    const selectedProduct = availableProducts.find(p => p.id === formData.productId);
    if (!selectedProduct) {
      setError('Selected product not found');
      setLoading(false);
      hapticFeedback('error');
      return;
    }

    try {
      const { bramblerService } = await import('@/services/api/bramblerService');

      hapticFeedback('medium');

      const result = await bramblerService.createEncryptedItem({
        expedition_id: GLOBAL_MAPPING_EXPEDITION_ID, // Dummy expedition for global mapping
        original_item_name: selectedProduct.name,
        encrypted_name: formData.useCustomName ? formData.encryptedName.trim() : undefined,
        owner_key: masterKey,
        item_type: formData.itemType
      });

      if (result.success) {
        hapticFeedback('success');
        onSuccess(result.item);
        onClose();

        // Show success message
        await import('@/utils/telegram').then(({ showAlert }) => {
          showAlert(`Item "${result.item.encrypted_item_name}" created successfully!`);
        });
      } else {
        setError('Failed to create encrypted item');
        hapticFeedback('error');
      }
    } catch (err) {
      console.error('Failed to create item:', err);
      setError(err instanceof Error ? err.message : 'Failed to create encrypted item');
      hapticFeedback('error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      hapticFeedback('light');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <ModalOverlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <ModalContent
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <ModalHeader>
            <ItemIcon>📦</ItemIcon>
            <ModalTitle>Add Encrypted Item</ModalTitle>
          </ModalHeader>

          <ModalDescription>
            Create a global encrypted name for a product. The encrypted name will be automatically
            used across all expeditions. Only products without existing encrypted names are shown.
          </ModalDescription>

          <form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>Product to Encrypt</Label>
              <Select
                value={formData.productId}
                onChange={(e) => {
                  const productId = parseInt(e.target.value);
                  const product = availableProducts.find(p => p.id === productId);
                  setFormData(prev => ({
                    ...prev,
                    productId,
                    originalItemName: product?.name || ''
                  }));
                }}
                required
                disabled={loading || loadingProducts || availableProducts.length === 0}
              >
                <option value={0}>
                  {loadingProducts
                    ? 'Loading products...'
                    : availableProducts.length === 0
                    ? 'No products available without encrypted names'
                    : 'Select a product...'}
                </option>
                {availableProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.emoji ? `${product.emoji} ` : ''}{product.name}
                  </option>
                ))}
              </Select>
              {availableProducts.length === 0 && !loadingProducts && (
                <HelpText>All products already have encrypted names</HelpText>
              )}
              {availableProducts.length > 0 && (
                <HelpText>Select a product that doesn't have an encrypted name yet</HelpText>
              )}
            </FormGroup>

            <FormGroup>
              <Label>Item Type</Label>
              <Select
                value={formData.itemType}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  itemType: e.target.value as 'product' | 'custom' | 'resource'
                }))}
                disabled={loading}
              >
                <option value="product">Product</option>
                <option value="custom">Custom</option>
                <option value="resource">Resource</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <CheckboxLabel>
                <Checkbox
                  checked={formData.useCustomName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    useCustomName: e.target.checked,
                    encryptedName: e.target.checked ? prev.encryptedName : ''
                  }))}
                  disabled={loading}
                />
                Use custom encrypted name
              </CheckboxLabel>
            </FormGroup>

            {formData.useCustomName ? (
              <FormGroup>
                <Label>Custom Encrypted Name</Label>
                <Input
                  type="text"
                  value={formData.encryptedName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    encryptedName: e.target.value
                  }))}
                  placeholder="Enter custom encrypted name..."
                  minLength={3}
                  maxLength={200}
                  disabled={loading}
                />
                <HelpText>This is the fantasy name that will be displayed</HelpText>
              </FormGroup>
            ) : (
              <InfoBox>
                <InfoIcon>✨</InfoIcon>
                <div>
                  Encrypted name will be automatically generated using fantasy names like
                  "Crystal Berries", "Dark Elixir", or "Ancient Gems"
                </div>
              </InfoBox>
            )}

            {error && (
              <ErrorMessage>{error}</ErrorMessage>
            )}

            <ModalActions>
              <PirateButton
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </PirateButton>
              <PirateButton
                variant="primary"
                onClick={(e) => {
                  e?.preventDefault();
                  handleSubmit(e as any);
                }}
                disabled={loading || loadingProducts || !formData.productId}
              >
                {loading ? 'Creating...' : loadingProducts ? 'Loading...' : 'Create Item'}
              </PirateButton>
            </ModalActions>
          </form>
        </ModalContent>
      </ModalOverlay>
    </AnimatePresence>
  );
};
