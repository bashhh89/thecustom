'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CollapsibleJSON } from './collapsible-json';
import { Bot, User, Copy, Check, ArrowRight, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { useState } from 'react';
import { useSOWStore } from '@/stores/sow-store';

interface ChatMessageProps {
  message: {
    id: string;
    role: string;
    content: string;
    architectsLog?: string[];
  };
}

// Custom code component for ReactMarkdown
const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const isJSON = match && match[1] === 'json';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (isJSON) {
    return <CollapsibleJSON content={String(children).replace(/\n$/, '')} />;
  }

  return !inline ? (
    <div className="relative group">
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 p-1 rounded bg-muted/80 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy code"
      >
        {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
      </button>
      <SyntaxHighlighter
        style={darcula}
        language={match && match[1]}
        PreTag="div"
        className="!m-0 !p-3 !rounded-md !text-sm"
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  ) : (
    <code className={`${className} px-1.5 py-0.5 bg-muted rounded text-sm font-mono`} {...props}>
      {children}
    </code>
  );
};

export function ChatMessage({ message }: ChatMessageProps) {
  // const { transitionToWorkbench } = useSOWStore(); // TODO: Implement or remove
  const isUser = message.role === 'user';

  // Check if this is an AI message about generating a SOW
  const isSOWGenerationMessage = !isUser && message.content.includes("I've generated a complete SOW");

  const handleViewInEditor = () => {
    // transitionToWorkbench(); // TODO: Implement or remove
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 ${isUser ? 'order-2' : 'order-1'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-blue-600'
            : 'bg-gradient-to-br from-[#20e28f] to-[#1bc47d]'
        }`}>
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? 'order-1' : 'order-2'}`}>
        {/* Message Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm ${
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
              : 'bg-card border text-foreground rounded-bl-md'
          }`}
        >
          <div className="text-sm leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: CodeBlock,
                p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-2 ml-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-2 ml-2">{children}</ol>,
                li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                h1: ({ children }) => <h1 className="text-lg font-semibold mb-3 mt-4 text-primary border-b border-border pb-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-3 text-primary/90">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mb-2 mt-2 text-primary/80">{children}</h3>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary/30 pl-4 pr-2 py-2 italic text-muted-foreground bg-muted/20 my-3 rounded-r-md">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3">
                    <table className="min-w-full border border-border rounded-md text-xs">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
                tbody: ({ children }) => <tbody>{children}</tbody>,
                tr: ({ children }) => <tr className="border-b border-border/50">{children}</tr>,
                th: ({ children }) => <th className="px-3 py-2 text-left font-semibold text-foreground text-xs">{children}</th>,
                td: ({ children }) => <td className="px-3 py-2 text-foreground text-xs">{children}</td>,
                strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
                a: ({ children, href }: any) => (
                  <a href={href} className="text-primary underline hover:text-primary/80 font-medium" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-2">
                    <table className="min-w-full border-collapse border border-border rounded-md">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
                tbody: ({ children }) => <tbody>{children}</tbody>,
                tr: ({ children }) => <tr className="border-b border-border hover:bg-muted/20">{children}</tr>,
                th: ({ children }) => (
                  <th className="px-3 py-2 text-left text-sm font-semibold border-r border-border last:border-r-0">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 text-sm border-r border-border last:border-r-0">
                    {children}
                  </td>
                ),
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
                hr: () => <hr className="my-4 border-border" />,
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-primary hover:text-primary/80 underline underline-offset-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Architect's Log - Only for AI messages with architectsLog */}
        {!isUser && (message as any).architectsLog && (message as any).architectsLog.length > 0 && (
          <ArchitectsLogSection architectsLog={(message as any).architectsLog} />
        )}

        {/* Action Button for SOW Generation Messages */}
        {isSOWGenerationMessage && (
          <div className="mt-2 flex justify-start">
            <button
              onClick={handleViewInEditor}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#20e28f] to-[#1bc47d] hover:from-[#1bc47d] hover:to-[#20e28f] text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <ArrowRight className="w-4 h-4" />
              View in Editor
            </button>
          </div>
        )}

        {/* Message Status/Timestamp (optional - can be added later) */}
        {/* <div className={`text-xs text-muted-foreground px-2 ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div> */}
      </div>
    </div>
  );
}

// Architect's Log Section Component
function ArchitectsLogSection({ architectsLog }: { architectsLog: string[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-3 border border-border/50 rounded-lg bg-muted/20 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 text-left flex items-center justify-between text-xs font-medium text-muted-foreground hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-3 h-3" />
          <span>Architect's Log</span>
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
            {architectsLog.length} insights
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          <div className="text-[10px] text-muted-foreground/70 mb-2 italic">
            AI's reasoning and decision process:
          </div>
          {architectsLog.map((insight, index) => (
            <div key={index} className="flex items-start gap-2 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 flex-shrink-0" />
              <span className="text-foreground/80 leading-relaxed">{insight}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
