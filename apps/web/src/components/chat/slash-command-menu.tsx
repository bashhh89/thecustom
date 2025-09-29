'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Command, Zap, Plus, DollarSign, Sparkles } from 'lucide-react';

interface SlashCommand {
  id: string;
  command: string;
  description: string;
  icon: React.ReactNode;
  example: string;
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'buildsow',
    command: '/buildsow',
    description: 'Generate complete SOW from conversation',
    icon: <Sparkles className="w-4 h-4" />,
    example: '/buildsow'
  },
  {
    id: 'newscope',
    command: '/newScope',
    description: 'Add a new scope to current SOW',
    icon: <Plus className="w-4 h-4" />,
    example: '/newScope Website Design'
  },
  {
    id: 'addrole',
    command: '/addRole',
    description: 'Add role to specific scope',
    icon: <Command className="w-4 h-4" />,
    example: '/addRole to 1 Designer 40'
  },
  {
    id: 'setbudget',
    command: '/setBudget',
    description: 'Set project budget target',
    icon: <DollarSign className="w-4 h-4" />,
    example: '/setBudget 25000'
  }
];

interface SlashCommandMenuProps {
  isVisible: boolean;
  onSelect: (command: string) => void;
  onClose: () => void;
  filter: string;
}

export function SlashCommandMenu({ isVisible, onSelect, onClose, filter }: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredCommands = SLASH_COMMANDS.filter(cmd =>
    cmd.command.toLowerCase().includes(filter.toLowerCase()) ||
    cmd.description.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex].command);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, selectedIndex, filteredCommands, onSelect, onClose]);

  if (!isVisible || filteredCommands.length === 0) {
    return null;
  }

  return (
    <Card 
      ref={menuRef}
      className="absolute bottom-full left-0 mb-2 w-80 max-h-64 overflow-y-auto shadow-lg border bg-popover z-50"
    >
      <div className="p-2">
        <div className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">
          Slash Commands
        </div>
        {filteredCommands.map((cmd, index) => (
          <Button
            key={cmd.id}
            variant={index === selectedIndex ? "secondary" : "ghost"}
            className="w-full justify-start h-auto p-3 mb-1"
            onClick={() => onSelect(cmd.command)}
          >
            <div className="flex items-start gap-3 w-full">
              <div className="flex-shrink-0 mt-0.5">
                {cmd.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">{cmd.command}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {cmd.description}
                </div>
                <div className="text-xs text-muted-foreground/60 mt-1 font-mono">
                  {cmd.example}
                </div>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </Card>
  );
}