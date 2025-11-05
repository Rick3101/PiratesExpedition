import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Users, Key } from 'lucide-react';
import { PirateButton } from '@/components/ui/PirateButton';
import { PirateCard } from '@/components/ui/PirateCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { pirateColors, spacing, pirateTypography } from '@/utils/pirateTheme';
import { formatCurrency } from '@/utils/formatters';
import { hapticFeedback } from '@/utils/telegram';

interface PirateStats {
  total_items: number;
  items_consumed: number;
  total_spent: number;
  total_paid: number;
  debt: number;
}

interface RecentItem {
  name: string;
  emoji: string;
  quantity: number;
  consumed_at: string | null;
}

interface PirateName {
  id: number;
  pirate_name: string;
  original_name?: string;
  stats: PirateStats;
  recent_items: RecentItem[];
}

interface PiratesTabProps {
  pirateNames: PirateName[];
  onAddPirate: () => void;
  expeditionId: number;
  isOwner: boolean;
  ownerChatId: number;
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

const OriginalNameBadge = styled.div`
  background: ${pirateColors.warning}20;
  border: 1px solid ${pirateColors.warning};
  color: ${pirateColors.warning};
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: 8px;
  font-size: ${pirateTypography.sizes.xs};
  font-weight: ${pirateTypography.weights.bold};
  margin-top: ${spacing.xs};
  display: flex;
  align-items: center;
  gap: ${spacing.xs};
`;

export const PiratesTab: React.FC<PiratesTabProps> = ({
  pirateNames,
  onAddPirate,
  expeditionId: _expeditionId,
  showOriginalNames = false,
  decryptedMappings = {},
}) => {
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

  return (
    <TabContent
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
        <SectionTitle style={{ marginBottom: 0 }}>🏴‍☠️ Pirate Crew</SectionTitle>
        <PirateButton
          variant="primary"
          size="sm"
          onClick={() => {
            hapticFeedback('medium');
            onAddPirate();
          }}
        >
          <Users size={16} /> Add Pirate
        </PirateButton>
      </div>

      {pirateNames.length === 0 ? (
        <EmptyState
          icon="🏴‍☠️"
          title="No pirates yet"
          description="No pirates have joined this expedition yet."
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: spacing.lg
        }}>
          {pirateNames.map(pirate => {
            // Use stats directly from API response
            const { stats, recent_items } = pirate;
            const hasPaid = stats.total_paid > 0;
            const hasPending = stats.debt > 0;

            return (
              <motion.div
                key={pirate.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <PirateCard>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                    marginBottom: spacing.lg
                  }}>
                    <ConsumptionIcon style={{ width: '50px', height: '50px', fontSize: '1.5rem' }}>
                      {showOriginalNames && hasOriginalName(pirate) ? '👤' : '🏴‍☠️'}
                    </ConsumptionIcon>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontFamily: pirateTypography.headings,
                        color: showOriginalNames && hasOriginalName(pirate) ? pirateColors.warning : pirateColors.primary,
                        margin: 0,
                        fontSize: pirateTypography.sizes.lg
                      }}>
                        {getDisplayName(pirate)}
                      </h4>
                      {showOriginalNames && hasOriginalName(pirate) && (
                        <OriginalNameBadge>
                          <Key size={12} />
                          Decrypted Identity
                        </OriginalNameBadge>
                      )}
                      {!showOriginalNames && !pirate.original_name && (
                        <div style={{
                          fontSize: pirateTypography.sizes.xs,
                          color: pirateColors.muted,
                          marginTop: spacing.xs,
                          fontStyle: 'italic'
                        }}>
                          🔒 Original name encrypted
                        </div>
                      )}
                      <div style={{
                        fontSize: pirateTypography.sizes.sm,
                        color: pirateColors.muted,
                        marginTop: spacing.xs
                      }}>
                        {stats.total_items} consumption{stats.total_items !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: spacing.md,
                    marginBottom: spacing.md
                  }}>
                    <div>
                      <div style={{
                        fontSize: pirateTypography.sizes.xs,
                        color: pirateColors.muted,
                        marginBottom: spacing.xs
                      }}>
                        Total Spent
                      </div>
                      <div style={{
                        fontFamily: pirateTypography.headings,
                        fontSize: pirateTypography.sizes.lg,
                        color: pirateColors.secondary,
                        fontWeight: pirateTypography.weights.bold
                      }}>
                        {formatCurrency(stats.total_spent)}
                      </div>
                    </div>

                    <div>
                      <div style={{
                        fontSize: pirateTypography.sizes.xs,
                        color: pirateColors.muted,
                        marginBottom: spacing.xs
                      }}>
                        Items Consumed
                      </div>
                      <div style={{
                        fontFamily: pirateTypography.headings,
                        fontSize: pirateTypography.sizes.lg,
                        color: pirateColors.primary,
                        fontWeight: pirateTypography.weights.bold
                      }}>
                        {stats.items_consumed}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: spacing.sm,
                    flexWrap: 'wrap'
                  }}>
                    {hasPaid && (
                      <PaymentStatusBadge $status="paid">
                        ✓ Paid {formatCurrency(stats.total_paid)}
                      </PaymentStatusBadge>
                    )}
                    {hasPending && (
                      <PaymentStatusBadge $status="pending">
                        ⏳ Debt {formatCurrency(stats.debt)}
                      </PaymentStatusBadge>
                    )}
                  </div>

                  <div style={{
                    marginTop: spacing.md,
                    paddingTop: spacing.md,
                    borderTop: `1px solid ${pirateColors.lightGold}`
                  }}>
                    <div style={{
                      fontSize: pirateTypography.sizes.xs,
                      color: pirateColors.muted,
                      marginBottom: spacing.xs
                    }}>
                      Recent Items
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: spacing.xs
                    }}>
                      {recent_items.map((item, index) => (
                        <span
                          key={index}
                          style={{
                            background: pirateColors.lightGold,
                            color: pirateColors.primary,
                            padding: `${spacing.xs} ${spacing.sm}`,
                            borderRadius: '12px',
                            fontSize: pirateTypography.sizes.xs,
                            fontWeight: pirateTypography.weights.medium
                          }}
                        >
                          {item.emoji} {item.name} x{item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                </PirateCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </TabContent>
  );
};
