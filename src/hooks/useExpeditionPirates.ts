import { useState, useEffect, useCallback } from 'react';
import { bramblerService } from '@/services/api/bramblerService';
import { hapticFeedback } from '@/utils/telegram';
import { PirateName } from '@/types/expedition';

export const useExpeditionPirates = (expeditionId: number | null) => {
  const [pirateNames, setPirateNames] = useState<PirateName[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load pirate names for this expedition
  const loadPirateNames = useCallback(async () => {
    if (!expeditionId) return;

    setLoading(true);
    try {
      const names = await bramblerService.getNames(expeditionId);
      setPirateNames(names);
    } catch (error) {
      console.error('Error loading pirate names:', error);
      setError('Failed to load pirate names');
    } finally {
      setLoading(false);
    }
  }, [expeditionId]);

  // Add a new pirate to the expedition
  const addPirate = useCallback(async (originalName: string): Promise<void> => {
    if (!expeditionId || !originalName.trim()) {
      throw new Error('Invalid expedition ID or pirate name');
    }

    try {
      await bramblerService.generateNames(expeditionId, {
        original_names: [originalName.trim()],
      });

      hapticFeedback('success');

      // Reload pirate names after adding
      await loadPirateNames();
    } catch (error) {
      hapticFeedback('error');
      throw error;
    }
  }, [expeditionId, loadPirateNames]);

  // Initial load - load pirate names only
  useEffect(() => {
    loadPirateNames();
  }, [loadPirateNames]);

  return {
    pirateNames,
    loading,
    error,
    addPirate,
    refresh: loadPirateNames,
  };
};
