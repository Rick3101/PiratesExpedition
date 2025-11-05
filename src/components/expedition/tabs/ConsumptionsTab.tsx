import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { PirateCard } from '@/components/ui/PirateCard';
import { PirateButton as Button } from '@/components/ui/PirateButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { pirateColors, spacing, pirateTypography } from '@/utils/pirateTheme';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { ItemConsumption } from '@/types/expedition';
import { useConsumptionPayment } from '@/hooks/useConsumptionPayment';

interface ConsumptionsTabProps {
  consumptions: ItemConsumption[];
  onPaymentSuccess?: () => void;
  isOwner?: boolean;
  expeditionId: number;
  // Decryption props (passed from parent)
  showOriginalNames?: boolean;
  decryptedMappings?: Record<string, string>;
  isDecrypting?: boolean;
  decryptError?: string | null;
  onToggleDisplay?: () => void;
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

export const ConsumptionsTab: React.FC<ConsumptionsTabProps> = ({
  consumptions,
  onPaymentSuccess,
  expeditionId: _expeditionId,
  showOriginalNames = false,
  decryptedMappings = {},
}) => {
  console.log('[ConsumptionsTab] Component rendering with', consumptions.length, 'consumptions');
  consumptions.forEach(c => {
    console.log(`  [ConsumptionsTab] ID ${c.id}: Status ${c.payment_status}, Paid ${c.amount_paid}/${c.total_price}`);
    console.log(`  [ConsumptionsTab] Product: encrypted="${c.encrypted_product_name}" real="${c.product_name}"`);
    console.log(`  [ConsumptionsTab] Names: pirate="${c.pirate_name}" original="${c.original_name}"`);
  });

  // Helper functions for displaying names
  const getDisplayName = <T extends { pirate_name: string; original_name?: string }>(item: T): string => {
    if (showOriginalNames) {
      // Check decrypted mappings first
      if (decryptedMappings[item.pirate_name]) {
        return decryptedMappings[item.pirate_name];
      }
      // Fall back to API-provided original name
      if (item.original_name) {
        return item.original_name;
      }
    }
    return item.pirate_name;
  };

  const hasOriginalName = <T extends { pirate_name: string; original_name?: string }>(item: T): boolean => {
    return Boolean(item.original_name || decryptedMappings[item.pirate_name]);
  };

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

  return (
    <TabContent
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >

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
