'use client';

import { useEffect, useRef } from 'react';
import { useSOWStore } from '@/stores/sow-store';
import { ChatMessage } from './chat-message';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Loader2 } from 'lucide-react';

export function MessageList({ readOnly = false }: { readOnly?: boolean }) {
  const { activeSow, isTyping } = useSOWStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [activeSow?.messages]);

  // Always render the same ScrollArea container to prevent flickering
  const hasMessages = activeSow?.messages && activeSow.messages.length > 0;

  return (
    <ScrollArea
      ref={scrollAreaRef}
      className="flex-1 h-full"
    >
      <div className="p-3 space-y-3 min-h-full">
        {/* Empty State - simplified to prevent flickering */}
        {!hasMessages && (
          <div className="flex-1 flex items-center justify-center p-6 min-h-[400px]">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Start a conversation</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Ask me about your project or say "hi" to get started
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Messages - only render when there are messages */}
        {hasMessages && activeSow.messages.map((message) => (
          <div key={message.id}>
            <ChatMessage message={message} />
          </div>
        ))}

        {/* Typing Indicator - no animation to prevent flickering */}
        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                <Bot className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex flex-col gap-1 max-w-[75%]">
              <div className="bg-card border rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  <span className="text-sm text-muted-foreground ml-2">AI Architect is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>
    </ScrollArea>
  );
}
