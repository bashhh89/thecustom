'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSOWStore } from '@/stores/sow-store';
import { Send, Loader2 } from 'lucide-react';
import { SlashCommandMenu } from './slash-command-menu';

export function ChatInput() {
  const { sendMessage } = useSOWStore();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(message);
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = '36px';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);

    // Show slash menu when user types '/' at start or after space
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const lastWord = textBeforeCursor.split(/\s+/).pop() || '';
    
    setShowSlashMenu(lastWord.startsWith('/') && lastWord.length > 0);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 36), 72)}px`;
    }
  };

  const handleSlashCommandSelect = (command: string) => {
    // Replace the current slash command with the selected one
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = message.substring(0, cursorPosition);
    const textAfterCursor = message.substring(cursorPosition);
    
    // Find the start of the current slash command
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1];
    
    if (currentWord.startsWith('/')) {
      const beforeSlash = textBeforeCursor.substring(0, textBeforeCursor.length - currentWord.length);
      const newMessage = beforeSlash + command + ' ' + textAfterCursor;
      setMessage(newMessage);
      
      // Position cursor after the command
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = beforeSlash.length + command.length + 1;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
    
    setShowSlashMenu(false);
  };

  const handleSlashMenuClose = () => {
    setShowSlashMenu(false);
  };

  return (
    <div className="flex gap-2 items-center">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextareaChange}
          onKeyPress={handleKeyPress}
          placeholder="Ask me about your project or say 'hi' to get started..."
          className="w-full resize-none rounded-md border bg-background px-3 py-2 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          rows={1}
          style={{
            minHeight: '38px',
            maxHeight: '76px',
            lineHeight: '1.4',
            overflowY: message.split('\n').length > 2 ? 'auto' : 'hidden'
          }}
          disabled={isSending}
        />
        {message.trim() && (
          <div className="absolute bottom-1.5 right-1 opacity-40">
            <kbd className="px-1 py-0.5 text-xs bg-muted rounded text-muted-foreground">↵</kbd>
          </div>
        )}
        <SlashCommandMenu
          isVisible={showSlashMenu}
          onSelect={handleSlashCommandSelect}
          onClose={handleSlashMenuClose}
          filter={message.split(/\s+/).pop()?.substring(1) || ''}
        />
      </div>
      <Button
        onClick={handleSend}
        disabled={!message.trim() || isSending}
        className="px-2 py-1.5 h-[36px] rounded-md bg-primary hover:bg-primary/90 transition-colors flex-shrink-0"
        size="sm"
      >
        {isSending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
