'use client';

import { useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useSOWStore } from '@/stores/sow-store';
import { Sidebar } from '@/components/sidebar';
import { MainContent } from '@/components/main-content';

export default function SOWWorkbench() {
  const {
    fetchSows,
    fetchRateCard,
    createSow,
    selectSow,
    activeSow,
    updateActiveSowData,
    sidebarVisible,
    chatPanelVisible,
    toggleChatPanel
  } = useSOWStore();



  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      await fetchSows();
      await fetchRateCard();

      // If no active SOW, create one for workbench mode
      if (!activeSow) {
        try {
          const newSow = await createSow();
          await selectSow(newSow.id);
        } catch (error) {
          console.error('Failed to create initial SOW:', error);
        }
      }
    };

    initializeApp();
  }, [fetchSows, fetchRateCard, createSow, selectSow, activeSow]);

  // Auto-save: Debounced save to backend when sowData changes
  const debouncedSave = useDebouncedCallback(
    async (sowData: any) => {
      if (sowData && activeSow) {
        console.log("Auto-saving SOW to database...");
        try {
          await updateActiveSowData(sowData);
          console.log("Auto-save successful");
        } catch (error) {
          console.error('Failed to auto-save:', error);
        }
      }
    },
    1500 // Wait 1.5 seconds after last change
  );

  // Trigger auto-save whenever sowData changes
  useEffect(() => {
    if (activeSow?.sowData) {
      debouncedSave(activeSow.sowData);
    }
  }, [activeSow?.sowData, debouncedSave]);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar - always rendered, controlled by CSS */}
      <div className={sidebarVisible ? '' : 'hidden'}>
        <Sidebar />
      </div>
      <MainContent />
    </div>
  );
}
