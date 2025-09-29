import React from 'react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface ChatModeSelectorProps {
  mode: 'plan' | 'build';
  onModeChange: (mode: 'plan' | 'build') => void;
  className?: string;
}

export function ChatModeSelector({ mode, onModeChange, className }: ChatModeSelectorProps) {
  return (
    <div className={cn('flex space-x-2 p-2 bg-muted rounded-lg', className)}>
      <Button
        variant={mode === 'plan' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('plan')}
        className="flex-1"
      >
        <span className="mr-2">💭</span>
        Plan SOW
      </Button>
      <Button
        variant={mode === 'build' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('build')}
        className="flex-1"
      >
        <span className="mr-2">⚡</span>
        Act
      </Button>
    </div>
  );
}
