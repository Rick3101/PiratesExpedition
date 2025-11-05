import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertTriangle, Key } from 'lucide-react';
import { PirateCard } from '@/components/ui/PirateCard';
import { PirateButton as Button } from '@/components/ui/PirateButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { pirateColors, spacing, pirateTypography } from '@/utils/pirateTheme';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { ItemConsumption } from '@/types/expedition';
import { useConsumptionPayment } from '@/hooks/useConsumptionPayment';
import { hapticFeedback } from '@/utils/telegram';
import { bramblerService } from '@/services/api/bramblerService';

interface ConsumptionsTabProps {
  consumptions: ItemConsumption[];
  onPaymentSuccess?: () => void;
  isOwner?: boolean;
  expeditionId: number;
}

const TabContent = styled(motion.div)`
  min-height: 400px;
`;

const SectionTitle = styled.h3`
  font-family: ${pirateTypography.headings};
  font-size: 1.25rem;
  color: ${pirateColors.primary};
  margin-bottom: ${spacing.lg};
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
`;

const ConsumptionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.md};
`;

const ConsumptionCard = styled(PirateCard)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${spacing.md} ${spacing.lg};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(139, 69, 19, 0.15);
  }
`;

const ConsumptionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.md};
  flex: 1;
`;

const ConsumptionIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${pirateColors.lightGold};
  color: ${pirateColors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
`;

const ConsumptionDetails = styled.div`
  flex: 1;
`;

const ConsumptionPirate = styled.div`
  font-family: ${pirateTypography.headings};
  font-weight: ${pirateTypography.weights.bold};
  color: ${pirateColors.primary};
  margin-bottom: ${spacing.xs};
`;

const ConsumptionItem = styled.div`
  color: ${pirateColors.muted};
  font-size: ${pirateTypography.sizes.sm};
`;

const ConsumptionValue = styled.div`
  text-align: right;
`;

const ConsumptionPrice = styled.div`
  font-family: ${pirateTypography.headings};
  font-weight: ${pirateTypography.weights.bold};
  color: ${pirateColors.secondary};
  font-size: ${pirateTypography.sizes.lg};
`;

const ConsumptionDate = styled.div`
  color: ${pirateColors.muted};
  font-size: ${pirateTypography.sizes.xs};
  margin-top: ${spacing.xs};
`;

const PaymentStatusBadge = styled.span<{ $status: string }>`
  background: ${props =>
    props.$status === 'paid' ? pirateColors.success :
    props.$status === 'partial' ? pirateColors.warning :
    pirateColors.danger
  };
  color: ${pirateColors.white};
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: 12px;
  font-size: ${pirateTypography.sizes.xs};
  font-weight: ${pirateTypography.weights.bold};
  text-transform: uppercase;
  margin-top: ${spacing.xs};
`;

const PaymentActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm};
  margin-top: ${spacing.sm};
`;

const PaymentInput = styled.input`
  padding: ${spacing.sm};
  border: 2px solid ${pirateColors.lightGold};
  border-radius: 8px;
  font-family: ${pirateTypography.body};
  font-size: ${pirateTypography.sizes.sm};
  width: 120px;

  &:focus {
    outline: none;
    border-color: ${pirateColors.primary};
  }
`;

const PaymentInfo = styled.div`
  font-size: ${pirateTypography.sizes.xs};
  color: ${pirateColors.muted};
  margin-top: ${spacing.xs};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${spacing.sm};
`;

const PayButton = styled(Button)`
  margin-top: ${spacing.sm};
`;

const DecryptionSection = styled.div`
  background: linear-gradient(135deg, ${pirateColors.warning}15, ${pirateColors.secondary}10);
  border: 2px solid ${pirateColors.lightGold};
  border-radius: 12px;
  padding: ${spacing.lg};
  margin-bottom: ${spacing.lg};
`;

const DecryptionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${spacing.md};
  flex-wrap: wrap;
  gap: ${spacing.md};
`;

const DecryptionTitle = styled.h4`
  font-family: ${pirateTypography.headings};
  color: ${pirateColors.primary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
`;

const DecryptionControls = styled.div`
  display: flex;
  gap: ${spacing.sm};
  align-items: center;
  flex-wrap: wrap;
`;

const WarningBanner = styled(motion.div)`
  background: linear-gradient(135deg, ${pirateColors.warning}20, ${pirateColors.danger}10);
  border: 2px solid ${pirateColors.warning};
  border-radius: 12px;
  padding: ${spacing.md};
  margin-bottom: ${spacing.md};
  display: flex;
  align-items: center;
  gap: ${spacing.md};
`;

const WarningText = styled.p`
  color: ${pirateColors.muted};
  margin: 0;
  font-size: ${pirateTypography.sizes.sm};
  line-height: 1.5;
`;

export const ConsumptionsTab: React.FC<ConsumptionsTabProps> = ({
  consumptions,
  onPaymentSuccess,
  isOwner = false,
  expeditionId,
}) => {
  console.log('[ConsumptionsTab] Component rendering with', consumptions.length, 'consumptions');
  consumptions.forEach(c => {
    console.log(`  [ConsumptionsTab] ID ${c.id}: Status ${c.payment_status}, Paid ${c.amount_paid}/${c.total_price}`);
    console.log(`  [ConsumptionsTab] Product: encrypted="${c.encrypted_product_name}" real="${c.product_name}"`);
    console.log(`  [ConsumptionsTab] Names: pirate="${c.pirate_name}" original="${c.original_name}"`);
  });

  const [showOriginalNames, setShowOriginalNames] = useState(false);
  const [decryptedMappings, setDecryptedMappings] = useState<Record<string, string>>({});
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [ownerKey, setOwnerKey] = useState<string | null>(null);
  const {
    payingConsumptionId,
    paymentAmount,
    processing,
    startPayment,
    processPayment,
    cancelPayment,
    setPaymentAmount,
    calculatePaymentDetails,
    validatePaymentAmount,
  } = useConsumptionPayment(onPaymentSuccess);

  // Get the display name for a consumption (decrypted if available and showOriginalNames is true)
  const getDisplayName = (consumption: ItemConsumption): string => {
    if (showOriginalNames) {
      // Check decrypted mappings first
      if (decryptedMappings[consumption.pirate_name]) {
        return decryptedMappings[consumption.pirate_name];
      }
      // Fall back to API-provided original name (for backward compatibility)
      if (consumption.original_name) {
        return consumption.original_name;
      }
    }
    return consumption.pirate_name;
  };

  // Check if consumption has original name (either from API or decrypted)
  const hasOriginalName = (consumption: ItemConsumption): boolean => {
    return Boolean(consumption.original_name || decryptedMappings[consumption.pirate_name]);
  };

  // Check if any consumptions need decryption (have no original_name from API)
  const hasEncryptedConsumptions = consumptions.some(c => !c.original_name);

  // Check if owner can see original names directly from API
  const hasDirectOriginalNames = consumptions.some(c => c.original_name);

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
        const decrypted = await bramblerService.decryptNames(expeditionId, {
          owner_key: keyToUse
        });

        setDecryptedMappings(decrypted);
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
      if (hasDirectOriginalNames && !hasEncryptedConsumptions) {
        setShowOriginalNames(true);
      } else if (hasEncryptedConsumptions) {
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

  return (
    <TabContent
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Owner-only decryption section */}
      {isOwner && consumptions.length > 0 && (
        <DecryptionSection>
          <DecryptionHeader>
            <DecryptionTitle>
              <Key size={20} />
              Owner Identity Access
            </DecryptionTitle>
            <DecryptionControls>
              <Button
                variant={showOriginalNames ? 'danger' : 'secondary'}
                size="sm"
                onClick={handleToggleDisplay}
                disabled={isDecrypting}
              >
                {isDecrypting ? (
                  <>Decrypting...</>
                ) : showOriginalNames ? (
                  <><EyeOff size={16} /> Hide Original Names</>
                ) : (
                  <><Eye size={16} /> Show Original Names</>
                )}
              </Button>
            </DecryptionControls>
          </DecryptionHeader>

          {decryptError && (
            <WarningBanner
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AlertTriangle size={20} color={pirateColors.danger} />
              <WarningText style={{ color: pirateColors.danger }}>
                {decryptError}
              </WarningText>
            </WarningBanner>
          )}

          {showOriginalNames && !decryptError && (
            <WarningBanner
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AlertTriangle size={20} color={pirateColors.warning} />
              <WarningText>
                Original names are currently visible. Make sure you're in a secure environment.
              </WarningText>
            </WarningBanner>
          )}
        </DecryptionSection>
      )}

      <SectionTitle>🏴‍☠️ Recent Consumptions</SectionTitle>
      {consumptions.length === 0 ? (
        <EmptyState
          icon="🍽️"
          title="No consumptions yet"
          description="Pirates haven't started consuming items from this expedition."
        />
      ) : (
        <ConsumptionsList>
          <AnimatePresence>
            {consumptions.map(consumption => (
              <motion.div
                key={consumption.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ConsumptionCard>
                  <ConsumptionInfo>
                    <ConsumptionIcon>
                      🏴‍☠️
                    </ConsumptionIcon>
                    <ConsumptionDetails>
                      <ConsumptionPirate style={{
                        color: showOriginalNames && hasOriginalName(consumption) ? pirateColors.warning : pirateColors.primary
                      }}>
                        {showOriginalNames && hasOriginalName(consumption) && '👤 '}
                        {getDisplayName(consumption)}
                      </ConsumptionPirate>
                      <ConsumptionItem>
                        {consumption.quantity}x {consumption.encrypted_product_name || consumption.product_name}
                      </ConsumptionItem>
                      <PaymentStatusBadge $status={consumption.payment_status}>
                        {consumption.payment_status}
                      </PaymentStatusBadge>
                      {consumption.payment_status !== 'paid' && payingConsumptionId === consumption.id && (
                        <PaymentActions>
                          <PaymentInput
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={calculatePaymentDetails(consumption).remainingAmount}
                            value={paymentAmount}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              const { remainingAmount } = calculatePaymentDetails(consumption);
                              if (value > remainingAmount) {
                                setPaymentAmount(remainingAmount.toFixed(2));
                              } else {
                                setPaymentAmount(e.target.value);
                              }
                            }}
                            placeholder={`Max: ${formatCurrency(calculatePaymentDetails(consumption).remainingAmount)}`}
                          />
                          <ButtonGroup>
                            <Button
                              size="sm"
                              onClick={() => processPayment(consumption.id, parseFloat(paymentAmount))}
                              disabled={
                                processing ||
                                !validatePaymentAmount(
                                  paymentAmount,
                                  calculatePaymentDetails(consumption).remainingAmount
                                )
                              }
                            >
                              {processing ? 'Processing...' : 'Confirm'}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={cancelPayment}
                              disabled={processing}
                            >
                              Cancel
                            </Button>
                          </ButtonGroup>
                        </PaymentActions>
                      )}
                    </ConsumptionDetails>
                  </ConsumptionInfo>
                  <ConsumptionValue>
                    <ConsumptionPrice>
                      {formatCurrency(consumption.total_price)}
                    </ConsumptionPrice>
                    {consumption.amount_paid > 0 && (
                      <PaymentInfo>
                        Paid: {formatCurrency(consumption.amount_paid)} |
                        Due: {formatCurrency(consumption.total_price - consumption.amount_paid)}
                      </PaymentInfo>
                    )}
                    <ConsumptionDate>
                      {formatDateTime(consumption.consumed_at || '')}
                    </ConsumptionDate>
                    {consumption.payment_status !== 'paid' && payingConsumptionId !== consumption.id && (
                      <PayButton
                        size="sm"
                        onClick={() => startPayment(consumption)}
                      >
                        Pay
                      </PayButton>
                    )}
                  </ConsumptionValue>
                </ConsumptionCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </ConsumptionsList>
      )}
    </TabContent>
  );
};
