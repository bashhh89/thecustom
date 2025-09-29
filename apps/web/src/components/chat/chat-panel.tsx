'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { ChatModeSelector } from './chat-mode-selector';
import { ChatContextSummary } from './chat-context-summary';
import { useSOWStore } from '@/stores/sow-store';
import { Loader2, X, Bot } from 'lucide-react';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const { isLoading, resetChat, newChat } = useSOWStore();
  const [mode, setMode] = useState<'plan' | 'build'>('plan');
  const [contextItems, setContextItems] = useState<Array<{ topic: string; details: string }>>([]);
  
  if (!isOpen) return null;

  return (
    <div className="w-96 border-l bg-card flex flex-col h-full rounded-l-lg shadow-xl">
      <div className="p-4 border-b space-y-4 rounded-tl-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetChat}
              title="Reset Chat"
              className="text-xs px-2"
            >
              Reset
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={newChat}
              title="New Chat"
              className="text-xs px-2"
            >
              New
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Mode Selector */}
        <ChatModeSelector
          mode={mode}
          onModeChange={setMode}
          className="w-full"
        />
      </div>

      {/* Message area with proper flexbox layout */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                The AI Assistant is thinking...
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <MessageList />
          </div>
        )}
      </div>

      {/* Chat input fixed at bottom */}
      <div className="flex-shrink-0">
        <ChatInput mode={mode} />
      </div>
    </div>
  );
}
