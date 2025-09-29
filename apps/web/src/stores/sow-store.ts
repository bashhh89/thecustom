import { create } from 'zustand';
import { SOW, Message, RateCardItem } from '@sow-workbench/db';

// Temporary Folder interface until Prisma client is updated
interface Folder {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  parentId?: string;
  children: Folder[];
  sows: Array<Pick<SOW, 'id' | 'name' | 'updatedAt'>>;
  _count: {
    sows: number;
    children: number;
  };
}

interface SOWStore {
  // State
  sows: Array<Pick<SOW, 'id' | 'name' | 'updatedAt'>>;
  activeSow: (SOW & { messages: Message[] }) | null;
  rateCard: RateCardItem[];
  folders: Folder[];
  errorMessage: string | null;

  // Chat state
  chatMode: 'plan' | 'build';
  contextItems: Array<{ topic: string; details: string }>;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;

  // UI state
  sidebarVisible: boolean;
  chatPanelVisible: boolean;

  // Actions
  fetchSows: () => Promise<void>;
  createSow: (name?: string, folderId?: string) => Promise<SOW>;
  selectSow: (sowId: string) => Promise<void>;
  renameSow: (sowId: string, name: string) => Promise<void>;
  updateActiveSowName: (name: string) => Promise<void>;
  updateActiveSowData: (sowData: any) => Promise<void>;
  deleteSow: (sowId: string) => Promise<void>;
  moveSow: (sowId: string, folderId: string | null) => Promise<void>;

  // Folder actions
  fetchFolders: () => Promise<void>;
  createFolder: (name: string, parentId?: string) => Promise<Folder>;
  renameFolder: (folderId: string, name: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;

  // AI Chat
  sendMessage: (content: string, mode?: 'plan' | 'build') => Promise<void>;
  setChatMode: (mode: 'plan' | 'build') => void;
  updateContextItems: (items: Array<{ topic: string; details: string }>) => void;
  generateSOW: () => Promise<void>;
  resetChat: () => Promise<void>;
  newChat: () => Promise<void>;
  generateShareUrl: () => string | null;

  // Rate Card
  fetchRateCard: () => Promise<void>;
  createRateCardItem: (data: { name: string; rate: number }) => Promise<void>;
  updateRateCardItem: (id: string, data: Partial<{ name: string; rate: number }>) => Promise<void>;
  deleteRateCardItem: (id: string) => Promise<void>;

  // Pricing calculations
  recalculateAllTotals: () => void;
  updateRoleHours: (scopeIndex: number, roleIndex: number, newHours: number) => void;
  updateRoleRate: (scopeIndex: number, roleIndex: number, newRate: number) => void;
  updateRole: (scopeIndex: number, roleIndex: number, field: keyof any, value: any) => void;

  // UI actions
  toggleSidebar: () => void;
  toggleChatPanel: () => void;
}

const API_BASE = typeof window !== 'undefined' 
  ? (window.location.hostname === 'localhost' ? 'http://localhost:5578' : '')
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5578';

export const useSOWStore = create<SOWStore>((set, get) => ({
  // Initial state
  sows: [],
  activeSow: null,
  rateCard: [],
  folders: [],
  errorMessage: null,
  isLoading: false,
  isSaving: false,
  sidebarVisible: true,
  chatPanelVisible: false,
  chatMode: 'plan',
  contextItems: [],
  fetchSows: async () => {
    set({ isLoading: true, errorMessage: null });
    try {
      const response = await fetch(`${API_BASE}/api/sows`);
      if (!response.ok) throw new Error('Failed to fetch SOWs');
      const sows = await response.json();
      set({ sows });
    } catch (error) {
      console.error('Error fetching SOWs:', error);
      set({ errorMessage: 'Failed to load SOWs. Please check your connection and try again.' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Create new SOW
  createSow: async (name) => {
    set({ errorMessage: null });
    try {
      const response = await fetch(`${API_BASE}/api/sows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || 'Untitled SOW',
          sowData: {
            projectTitle: '',
            clientName: '',
            projectOverview: '',
            projectOutcomes: [],
            scopes: [],
            budgetNote: ''
          }
        }),
      });
      if (!response.ok) throw new Error('Failed to create SOW');
      const sow = await response.json();

      // Update the SOWs list
      set((state) => ({
        sows: [{ id: sow.id, name: sow.name, updatedAt: sow.updatedAt }, ...state.sows],
      }));

      return sow;
    } catch (error) {
      console.error('Error creating SOW:', error);
      set({ errorMessage: 'Could not create a new SOW. Please check your connection and try again.' });
      throw error;
    }
  },

  // Select and load a SOW
  selectSow: async (sowId: string) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const response = await fetch(`${API_BASE}/api/sows/${sowId}`);
      if (!response.ok) throw new Error('Failed to fetch SOW');
      const sow = await response.json();

      // CRITICAL FIX: Sanitize rates with Master Rate Card before setting in state
      const currentRateCard = get().rateCard;
      console.log('Sanitizing loaded SOW with rate card:', currentRateCard);

      const sanitizedSowData = sow.sowData && sow.sowData.scopes ? {
        ...sow.sowData,
        scopes: sow.sowData.scopes.map((scope: any) => ({
          ...scope,
          roles: scope.roles.map((role: any) => {
            // Look up the CORRECT rate from Master Rate Card
            const masterRateItem = currentRateCard.find(rc => rc.name === role.name);
            const correctRate = masterRateItem ? masterRateItem.rate : 0;

            console.log(`Role "${role.name}": stored rate ${role.rate} → sanitized to ${correctRate}`);
            return {
              ...role,
              rate: correctRate
            };
          })
        }))
      } : sow.sowData;

      const sanitizedSow = {
        ...sow,
        sowData: sanitizedSowData
      };

      console.log('Setting sanitized SOW:', sanitizedSow);
      set({ activeSow: sanitizedSow });

      // Trigger recalculation on the sanitized data
      setTimeout(() => get().recalculateAllTotals(), 0);

    } catch (error) {
      console.error('Error selecting SOW:', error);

      // Mock fallback - find the sow from the local list (for mock sows)
      const localSow = get().sows.find(s => s.id === sowId);
      if (localSow) {
        console.log('Using mock local SOW selection');
        const mockFullSow = {
          ...localSow,
          folderId: null,
          sowData: {},
          messages: [],
          createdAt: localSow.updatedAt, // approximate
          updatedAt: localSow.updatedAt
        };
        set({ activeSow: mockFullSow });

        // Trigger recalculation
        setTimeout(() => get().recalculateAllTotals(), 0);
      } else {
        set({ errorMessage: 'Failed to load the SOW. Please check your connection and try again.' });
        throw error;
      }
    } finally {
      set({ isLoading: false });
    }
  },

  // Rename SOW (for any SOW)
  renameSow: async (sowId: string, name: string) => {
    set({ errorMessage: null });
    try {
      await fetch(`${API_BASE}/api/sows/${sowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      set((state) => ({
        sows: state.sows.map(s => s.id === sowId ? { ...s, name, updatedAt: new Date() } : s),
        activeSow: state.activeSow?.id === sowId ? { ...state.activeSow, name } : state.activeSow
      }));
    } catch (error) {
      console.error('Error renaming SOW:', error);
      set({ errorMessage: 'Failed to rename SOW. Please check your connection and try again.' });
      throw error;
    }
  },

  // Update active SOW name
  updateActiveSowName: async (name: string) => {
    const { activeSow } = get();
    if (!activeSow) return;

    await get().renameSow(activeSow.id, name);
  },

  // Update active SOW data (used for auto-save)
  updateActiveSowData: async (sowData: any) => {
    const { activeSow } = get();
    if (!activeSow) return;

    set({ isSaving: true, errorMessage: null });
    try {
      await fetch(`${API_BASE}/api/sows/${activeSow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sowData }),
      });

      const updatedActiveSow = { ...activeSow, sowData };
      set((state) => ({
        activeSow: updatedActiveSow,
        sows: state.sows.map(s => s.id === activeSow.id ? { ...s, updatedAt: new Date() } : s)
      }));
    } catch (error) {
      console.error('Error updating SOW data:', error);
      set({ errorMessage: 'Failed to save changes. Please check your connection and try again.' });
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  // Delete SOW
  deleteSow: async (sowId: string) => {
    set({ errorMessage: null });
    try {
      const response = await fetch(`${API_BASE}/api/sows/${sowId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete SOW');

      set((state) => ({
        sows: state.sows.filter(s => s.id !== sowId),
        activeSow: state.activeSow?.id === sowId ? null : state.activeSow
      }));
    } catch (error) {
      console.error('Error deleting SOW:', error);
      set({ errorMessage: 'Failed to delete SOW. Please check your connection and try again.' });
      throw error;
    }
  },

  // Move SOW to different folder
  moveSow: async (sowId: string, folderId: string | null) => {
    set({ errorMessage: null });
    try {
      const response = await fetch(`${API_BASE}/api/sows/${sowId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      });
      if (!response.ok) throw new Error('Failed to move SOW');

      // Update local state - need to refresh SOWs and folders
      await get().fetchSows();
      await get().fetchFolders();
    } catch (error) {
      console.error('Error moving SOW:', error);
      set({ errorMessage: 'Failed to move SOW. Please check your connection and try again.' });
      throw error;
    }
  },

  // Fetch folders
  fetchFolders: async () => {
    set({ errorMessage: null });
    try {
      const response = await fetch(`${API_BASE}/api/folders`);
      if (!response.ok) throw new Error('Failed to fetch folders');
      const folders = await response.json();
      set({ folders });
    } catch (error) {
      console.error('Error fetching folders:', error);
      set({ errorMessage: null }); // Don't show user error for folder load failures
      set({ folders: [] });
    }
  },

  // Create folder
  createFolder: async (name: string, parentId?: string) => {
    set({ errorMessage: null });
    try {
      const response = await fetch(`${API_BASE}/api/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Folder creation failed:', errorText);
        throw new Error(`Failed to create folder: ${errorText}`);
      }
      const folder = await response.json();

      // Refresh folders to get updated hierarchy
      await get().fetchFolders();

      return folder;
    } catch (error: any) {
      console.error('Error creating folder:', error.message);
      set({ errorMessage: `Could not create folder. ${error.message}` });
      throw error;
    }
  },

  // Rename folder
  renameFolder: async (folderId: string, name: string) => {
    set({ errorMessage: null });
    try {
      const response = await fetch(`${API_BASE}/api/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error('Failed to rename folder');

      // Refresh folders to get updated data
      await get().fetchFolders();
    } catch (error) {
      console.error('Error renaming folder:', error);
      set({ errorMessage: 'Failed to rename folder. Please check your connection and try again.' });
      throw error;
    }
  },

  // Delete folder
  deleteFolder: async (folderId: string) => {
    set({ errorMessage: null });
    try {
      const response = await fetch(`${API_BASE}/api/folders/${folderId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete folder');

      // Refresh folders to get updated data
      await get().fetchFolders();
    } catch (error) {
      console.error('Error deleting folder:', error);
      set({ errorMessage: 'Failed to delete folder. Please check your connection and try again.' });
      throw error;
    }
  },

  // Send message to AI
  sendMessage: async (message: string, mode: 'plan' | 'build' = 'plan') => {
    const { activeSow } = get();
    if (!activeSow) return;

    // Check if this is a SOW generation command
    const isGenerationCommand = message.trim().toLowerCase() === '/buildsow';
    
    // Check if this is a slash command for refinement
    const isSlashCommand = message.trim().startsWith('/') && !isGenerationCommand;

    // Add user's message immediately (optimistic update)
    const userMessage: Message = {
      id: `temp-${Math.random()}`,
      role: 'user',
      content: message,
      sowId: activeSow.id,
      createdAt: new Date(),
    };
    
    set((state) => ({
      activeSow: state.activeSow
        ? {
            ...state.activeSow,
            messages: [...(state.activeSow.messages || []), userMessage],
          }
        : null,
    }));

    set({ isLoading: true, errorMessage: null });
    
    try {
      if (isGenerationCommand) {
        // Generate SOW data
        const response = await fetch(`${API_BASE}/api/sows/${activeSow.id}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate SOW');
        }

        const { sowData, aiMessage, architectsLog } = await response.json();

        // Generate a meaningful SOW name from project title and client
        let sowName = 'Untitled SOW';
        if (sowData?.projectTitle && sowData?.clientName) {
          sowName = `${sowData.clientName} - ${sowData.projectTitle}`;
        } else if (sowData?.projectTitle) {
          sowName = sowData.projectTitle;
        } else if (sowData?.clientName) {
          sowName = `${sowData.clientName} Project`;
        }

        // Update SOW name in database
        if (sowName !== 'Untitled SOW') {
          try {
            await fetch(`${API_BASE}/api/sows/${activeSow.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: sowName }),
            });
          } catch (error) {
            console.error('Failed to update SOW name:', error);
          }
        }

        // Create AI response message 
        const aiResponseMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: aiMessage || "I've generated a complete SOW based on our conversation.",
          sowId: activeSow.id,
          createdAt: new Date(),
        };

        // Store architectsLog temporarily for display (will be shown in the chat message)
        (aiResponseMessage as any).architectsLog = architectsLog;

        // Update store with new SOW data - THE UNIFIED STATE FIX
        set((state) => ({
          activeSow: state.activeSow
            ? {
                ...state.activeSow,
                name: sowName, // Update the SOW name
                messages: [
                  ...state.activeSow.messages.filter(m => !m.id.startsWith('temp-')),
                  aiResponseMessage
                ],
                sowData: sowData, // DIRECT STATE UNIFICATION
              }
            : null,
        }));

        // Trigger pricing recalculation and refresh sidebar
        setTimeout(() => {
          get().recalculateAllTotals();
          get().fetchSows(); // Refresh sidebar to show new name
        }, 0);

      } else if (isSlashCommand) {
        // Execute slash command for SOW refinement
        const response = await fetch(`${API_BASE}/api/sows/${activeSow.id}/refine`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: message }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to execute command');
        }

        const { sowData } = await response.json();

        // Update store with refined SOW data - INSTANT COMMAND EXECUTION
        set((state) => ({
          activeSow: state.activeSow
            ? {
                ...state.activeSow,
                messages: state.activeSow.messages.filter(m => !m.id.startsWith('temp-')),
                sowData: sowData, // DIRECT STATE UNIFICATION
              }
            : null,
        }));

        // Trigger pricing recalculation
        setTimeout(() => get().recalculateAllTotals(), 0);

      } else {
        // Regular conversation
        const response = await fetch(`${API_BASE}/api/sows/${activeSow.id}/conversation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send message');
        }

        const { reply } = await response.json();

        // Update messages with AI reply
        set((state) => ({
          activeSow: state.activeSow
            ? {
                ...state.activeSow,
                messages: [...state.activeSow.messages.filter(m => !m.id.startsWith('temp-')), reply],
              }
            : null,
        }));
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      set({ errorMessage: `Error: ${error.message}` });

      // Add error message to chat
      const errorMessage: Message = {
        id: `error-${Math.random()}`,
        role: 'assistant',
        content: `I'm sorry, I encountered an issue: ${error.message}. Please try again.`,
        sowId: activeSow.id,
        createdAt: new Date(),
      };

      set((state) => ({
        activeSow: state.activeSow
          ? {
              ...state.activeSow,
              messages: [...state.activeSow.messages.filter(m => !m.id.startsWith('temp-')), errorMessage],
            }
          : null,
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  // Generate SOW directly
  generateSOW: async () => {
    await get().sendMessage('/buildsow');
  },

  // Generate share URL for current SOW
  generateShareUrl: () => {
    const { activeSow } = get();
    if (!activeSow) return null;
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/sow/share/${activeSow.id}`;
  },

  // Fetch rate card
  fetchRateCard: async () => {
    set({ errorMessage: null });
    try {
      const response = await fetch(`${API_BASE}/api/rate-card`);
      if (!response.ok) throw new Error('Failed to fetch rate card');
      const rateCard = await response.json();
      set({ rateCard });
    } catch (error) {
      console.error('Error fetching rate card:', error);
      set({ errorMessage: null }); // Don't show user error for rate card load failures
      set({ rateCard: [] });
    }
  },

  // Create rate card item
  createRateCardItem: async (data) => {
    set({ errorMessage: null });
    try {
      const response = await fetch(`${API_BASE}/api/rate-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create rate card item');
      const item = await response.json();
      set((state) => ({ rateCard: [...state.rateCard, item] }));
    } catch (error) {
      console.error('Error creating rate card item:', error);
      set({ errorMessage: 'Failed to create rate card item. Please check your connection and try again.' });
      throw error;
    }
  },

  // Update rate card item
  updateRateCardItem: async (id, data) => {
    set({ errorMessage: null });
    try {
      const response = await fetch(`${API_BASE}/api/rate-card/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update rate card item');
      const updatedItem = await response.json();
      set((state) => ({
        rateCard: state.rateCard.map(item =>
          item.id === id ? updatedItem : item
        )
      }));
    } catch (error) {
      console.error('Error updating rate card item:', error);
      set({ errorMessage: 'Failed to update rate card item. Please check your connection and try again.' });
      throw error;
    }
  },

  // Delete rate card item
  deleteRateCardItem: async (id) => {
    set({ errorMessage: null });
    try {
      const response = await fetch(`${API_BASE}/api/rate-card/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete rate card item');
      set((state) => ({
        rateCard: state.rateCard.filter(item => item.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting rate card item:', error);
      set({ errorMessage: 'Failed to delete rate card item. Please check your connection and try again.' });
      throw error;
    }
  },

  // Centralized pricing calculation engine
  recalculateAllTotals: () => {
    set((state) => {
      if (!state.activeSow?.sowData || typeof state.activeSow.sowData !== 'object') return state;

      const sowData = state.activeSow.sowData as any;
      if (!sowData.scopes || !Array.isArray(sowData.scopes)) return state;

      console.log('Recalculating totals for sowData:', sowData);

      const updatedScopes = sowData.scopes.map((scope: any) => {
        console.log('Processing scope:', scope);
        let scopeSubtotal = 0;
        const updatedRoles = scope.roles.map((role: any) => {
          console.log('Processing role:', role);
          // Ensure hours and rate are clean numbers
          const hours = Number(role.hours) || 0;
          const rate = Number(role.rate) || 0;
          console.log('Calculated hours:', hours, 'rate:', rate);
          const newTotal = hours * rate;
          console.log('New total:', newTotal);
          scopeSubtotal += newTotal;
          return { ...role, total: newTotal, hours, rate };
        });
        console.log('Scope subtotal:', scopeSubtotal);
        return { ...scope, roles: updatedRoles, subtotal: scopeSubtotal };
      });

      const newSowData = { ...sowData, scopes: updatedScopes };
      console.log('Updated sowData:', newSowData);

      return {
        activeSow: {
          ...state.activeSow!,
          sowData: newSowData
        }
      };
    });
  },

  // Clean role update functions
  updateRoleHours: (scopeIndex: number, roleIndex: number, newHours: number) => {
    console.log('updateRoleHours called:', scopeIndex, roleIndex, newHours);
    set((state) => {
      console.log('Current state activeSow:', state.activeSow);
      if (!state.activeSow?.sowData) {
        console.log('No activeSow.sowData');
        return state;
      }

      const sowData = state.activeSow.sowData as any;
      if (!sowData.scopes || !Array.isArray(sowData.scopes)) {
        console.log('No valid scopes');
        return state;
      }

      // Update the hours value
      const updatedScopes = sowData.scopes.map((scope: any, si: number) => {
        if (si === scopeIndex) {
          const updatedRoles = scope.roles.map((role: any, ri: number) => {
            if (ri === roleIndex) {
              console.log('Updating role hours from', role.hours, 'to', newHours);
              return { ...role, hours: newHours };
            }
            return role;
          });
          return { ...scope, roles: updatedRoles };
        }
        return scope;
      });

      const newSowData = { ...sowData, scopes: updatedScopes };
      console.log('State after hours update:', newSowData);

      return {
        activeSow: {
          ...state.activeSow!,
          sowData: newSowData
        }
      };
    });

    // After updating the hours, immediately trigger the full recalculation
    get().recalculateAllTotals();
  },

  updateRoleRate: (scopeIndex, roleIndex, newRate) => {
    set((state) => {
      if (!state.activeSow?.sowData) return state;
      const newSowData = JSON.parse(JSON.stringify(state.activeSow.sowData));
      newSowData.scopes[scopeIndex].roles[roleIndex].rate = newRate;
      return {
        activeSow: {
          ...state.activeSow!,
          sowData: newSowData
        }
      };
    });
    get().recalculateAllTotals();
  },

  updateRole: (scopeIndex, roleIndex, field, value) => {
    set((state) => {
      if (!state.activeSow?.sowData) return state;
      const newSowData = JSON.parse(JSON.stringify(state.activeSow.sowData));
      newSowData.scopes[scopeIndex].roles[roleIndex][field] = value;
      return {
        activeSow: {
          ...state.activeSow!,
          sowData: newSowData
        }
      };
    });
    get().recalculateAllTotals();
  },

  // UI actions
  toggleSidebar: () => {
    set((state) => ({ sidebarVisible: !state.sidebarVisible }));
  },

  toggleChatPanel: () => {
    console.log('toggleChatPanel called, current:', get().chatPanelVisible);
    set((state) => ({ chatPanelVisible: !state.chatPanelVisible }));
    console.log('toggleChatPanel after:', get().chatPanelVisible);
  },

  // Chat mode and context management
  setChatMode: (mode: 'plan' | 'build') => {
    set({ chatMode: mode });
  },

  updateContextItems: (items: Array<{ topic: string; details: string }>) => {
    set({ contextItems: items });
  },

  // Chat management
  resetChat: async () => {
    const { activeSow } = get();
    if (!activeSow) return;

    try {
      // Delete all messages for this SOW
      await fetch(`${API_BASE}/api/sows/${activeSow.id}/messages`, {
        method: 'DELETE',
      });

      // Clear messages from local state
      set((state) => ({
        activeSow: state.activeSow
          ? { ...state.activeSow, messages: [] }
          : null,
      }));
    } catch (error) {
      console.error('Error resetting chat:', error);
    }
  },

  newChat: async () => {
    // Create a new SOW and switch to it
    try {
      const newSow = await get().createSow();
      await get().selectSow(newSow.id);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  },
}));
