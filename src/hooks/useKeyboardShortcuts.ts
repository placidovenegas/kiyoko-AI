'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';

export function useKeyboardShortcuts() {
  const { toggleChat, toggleSidebar } = useUIStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + / — Toggle chat panel
      if (isMeta && e.key === '/') {
        e.preventDefault();
        toggleChat();
      }

      // Cmd/Ctrl + B — Toggle sidebar
      if (isMeta && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }

      // Escape — Close chat if open
      if (e.key === 'Escape') {
        const { chatPanelOpen, chatExpanded } = useUIStore.getState();
        if (chatExpanded) {
          useUIStore.setState({ chatExpanded: false, chatPanelOpen: true });
        } else if (chatPanelOpen) {
          useUIStore.setState({ chatPanelOpen: false });
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleChat, toggleSidebar]);
}
