'use client';

import { useState, useEffect } from 'react';
import { useSOWStore } from '@/stores/sow-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AIModelSelector } from '@/components/ui/ai-model-selector';
import { MessageSquare, Download, FileText, Save, Menu, X, Loader2, Bot, Sparkles, Mic, CheckCircle, MessageCircle, Edit3, Eye, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Workbench } from './workbench/workbench';
import { MessageList } from './chat/message-list';
import { ChatInput } from './chat/chat-input';
import { exportToPDF, exportToXLSX } from '@/lib/export-utils';

export function MainContent() {
  const {
    activeSow,
    updateActiveSowName,
    isSaving,
    toggleSidebar,
    toggleChatPanel,
    sidebarVisible
  } = useSOWStore();

  const [activeTab, setActiveTab] = useState<'editor' | 'conversation'>('editor');

  const handleSOWNameChange = (newName: string) => {
    if (activeSow && newName.trim()) {
      updateActiveSowName(newName);
    }
  };

  const handleExportPDF = async () => {
    if (!activeSow) return;
    try {
      await exportToPDF(activeSow);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  const handleExportXLSX = () => {
    if (!activeSow) return;
    try {
      exportToXLSX(activeSow);
    } catch (error) {
      console.error('Failed to export XLSX:', error);
    }
  };

  // Clean, static layout - no animations
  return (
    <div className="flex-1 flex h-screen">
      {/* Workbench Mode - Temporarily simplified */}
      <>
          {activeSow ? (
            <>
              {/* Main Content Area (Workbench) */}
              <div className="flex-1 flex flex-col">
              {/* Clean, Professional Tabs */}
              <div className="flex border-b px-4 py-2 items-center justify-between">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSidebar}
                    className="mr-2 p-2"
                    title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
                  >
                    {sidebarVisible ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
                  </Button>
                  <button
                    onClick={() => setActiveTab('conversation')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 ${
                      activeTab === 'conversation'
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  Conversation
                </button>
                  <button
                    onClick={() => setActiveTab('editor')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 ${
                      activeTab === 'editor'
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                    Editor
                  </button>
                </div>
              </div>                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto">
                  {activeTab === 'editor' ? (
                    <Workbench />
                  ) : (
                    <div className="h-full flex flex-col">
                      {/* Conversation Header */}
                      <div className="p-4 border-b bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Bot className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">Conversation History</h3>
                            <p className="text-xs text-muted-foreground">Review your project planning discussion</p>
                          </div>
                        </div>
                      </div>

                      {/* Conversation Messages - Read Only */}
                      <div className="flex-1 overflow-hidden">
                        <div className="h-full overflow-y-auto">
                          <MessageList readOnly={true} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Sidebar: AI Companion - Always visible in workbench mode */}
              <div className="w-96 border-l bg-card flex flex-col">
                <ChatPanelComponent forceVisible={true} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No SOW Selected</h2>
                <p className="text-muted-foreground mb-4">
                  Select an existing SOW from the sidebar or create a new one to get started.
                </p>
              </div>
            </div>
          )}
        </>
    </div>
  );
}

function ConversationalChat() {
  const { isLoading, toggleSidebar, activeSow, sendMessage } = useSOWStore();
  const [selectedModel, setSelectedModel] = useState('');
  const [isReadyToGenerate, setIsReadyToGenerate] = useState(false);

  useEffect(() => {
    loadSelectedModel();
    // Check if we have enough conversation to generate SOW
    checkReadinessForGeneration();
  }, [activeSow?.messages]);

  const loadSelectedModel = async () => {
    try {
      const response = await fetch('/api/settings/selectedModel');
      if (response.ok) {
        const data = await response.json();
        setSelectedModel(data.value || '');
      }
    } catch (error) {
      console.log('Using default model');
    }
  };

  const saveSelectedModel = async (modelId: string) => {
    try {
      await fetch('/api/settings/selectedModel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: modelId }),
      });
      setSelectedModel(modelId);
    } catch (error) {
      console.error('Failed to save selected model:', error);
    }
  };

  const checkReadinessForGeneration = () => {
    // Check if we have at least 2 messages (greeting + response) and some project discussion
    const messages = activeSow?.messages || [];
    const hasEnoughConversation = messages.length >= 4; // Greeting + response + at least 2 exchanges
    const hasProjectDiscussion = messages.some(msg =>
      msg.content.toLowerCase().includes('project') ||
      msg.content.toLowerCase().includes('scope') ||
      msg.content.toLowerCase().includes('timeline') ||
      msg.content.toLowerCase().includes('budget') ||
      msg.content.toLowerCase().includes('requirements')
    );

    setIsReadyToGenerate(hasEnoughConversation && hasProjectDiscussion);
  };

  const handleGenerateSOW = async () => {
    if (!activeSow) return;

    try {
      // Send a message to generate the SOW
      await sendMessage("Please generate a complete SOW based on our conversation above.");
      // Small delay to ensure the SOW data is processed
      setTimeout(() => {
        // transitionToWorkbench(); // TODO: Implement or remove
      }, 500);
    } catch (error) {
      console.error('Failed to generate SOW:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Clean Header */}
      <div className="flex-shrink-0 border-b bg-card">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSidebar}
                className="mr-2 hover:bg-accent transition-colors"
                title="Toggle Sidebar"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <AIModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                onSave={() => saveSelectedModel(selectedModel)}
                showSaveButton={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Chat Content Area - Fixed Height with Scrolling */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">AI Architect is thinking...</p>
                <p className="text-sm text-muted-foreground">Analyzing your project requirements</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <MessageList />
          </div>
        )}
      </div>

      {/* Enhanced Footer/Input Area */}
      <div className="flex-shrink-0 border-t bg-card/80 backdrop-blur-sm">
        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            <ChatInput />
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd>
              Send message
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Shift+Enter</kbd>
              New line
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatPanelComponent({ forceVisible = false }: { forceVisible?: boolean }) {
  const { chatPanelVisible, toggleChatPanel, isLoading } = useSOWStore();

  if (!forceVisible && !chatPanelVisible) return null;

  return (
    <div className="w-full border-l bg-card flex flex-col h-full shadow-xl">
      {/* Enhanced Header */}
      <div className="flex-shrink-0 border-b bg-card/95 backdrop-blur-sm">
        <div className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#20e28f] to-[#1bc47d] flex items-center justify-center shadow-md">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border border-background animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AI Assistant</h3>
                <p className="text-xs text-muted-foreground">Project planning & SOW generation</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleChatPanel}
              className="hover:bg-accent transition-colors"
              title="Close chat panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Chat Content Area - Fixed Height with Scrolling */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#20e28f] to-[#1bc47d] flex items-center justify-center shadow-md">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#20e28f] to-[#1bc47d] animate-ping opacity-20"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">AI Assistant is thinking...</p>
                <p className="text-xs text-muted-foreground">Processing your request</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <MessageList />
          </div>
        )}
      </div>

      {/* Enhanced Footer/Input Area */}
      <div className="flex-shrink-0 border-t bg-card p-2">
        <ChatInput />
        <div className="flex items-center justify-between text-xs text-muted-foreground/60 mt-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd>
              Send
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted rounded text-xs">/buildsow</kbd>
              Generate
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button className="text-xs hover:text-foreground px-1 py-0.5 rounded hover:bg-muted">
              New Chat
            </button>
            <span>•</span>
            <button className="text-xs hover:text-foreground px-1 py-0.5 rounded hover:bg-muted">
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
