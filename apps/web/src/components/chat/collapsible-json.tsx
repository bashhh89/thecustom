'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CollapsibleJSONProps {
  content: string;
}

export function CollapsibleJSON({ content }: CollapsibleJSONProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="border rounded-md bg-slate-50 dark:bg-slate-800 p-2">
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs"
        >
          {isExpanded ? 'Hide Data' : 'View Generated SOW Data'}
          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs"
        >
          <Copy className="h-3 w-3" />
          Copy
        </Button>
      </div>
      {isExpanded && (
        <SyntaxHighlighter
          language="json"
          style={darcula}
          className="!m-0 !p-0 text-xs"
        >
          {content}
        </SyntaxHighlighter>
      )}
    </div>
  );
}
