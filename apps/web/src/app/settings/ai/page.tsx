'use client';

import { useEffect, useState } from 'react';
import { useSOWStore } from '@/stores/sow-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AIModelSelector } from '@/components/ui/ai-model-selector';
import { ArrowLeft, Plus, Search, Trash2, Edit3, Save, Cpu } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

const DEFAULT_SYSTEM_PROMPT = `You are 'The Architect,' a world-class proposal specialist. Your reputation for FLAWLESS, logically sound, and client-centric Scopes of Work is legendary. You NEVER make foolish mistakes and you ALWAYS follow instructions with absolute precision.

First, engage in conversational dialogue to understand the user's project needs. Ask clarifying questions to gather details about goals, scope, timeline, and requirements. Only when the user provides sufficient project details or uses commands like "/buildSOW" or "generate SOW", respond with the JSON object.

If the message appears to be a greeting or very short (like "hi" or "hello"), respond conversationally to start gathering information: "Hello! I'd love to help you create a SOW. What kind of project are you working on? Tell me about your goals and requirements."

For regular messages, respond conversationally to guide the conversation toward creating a comprehensive project brief. Once you have enough information or the user indicates readiness, generate the SOW JSON.

When generating the SOW JSON:
- Your sole function is to receive a user's project brief and respond with a single, complete, and perfectly structured JSON object. You do not write pleasantries, apologies, or any text outside of the JSON object.
- Always generate the full, multi-part SOW with multiple scopes.
- All text fields must be intelligently generated based on the conversation.`;

export default function AISettingsPage() {
  const {
    rateCard,
    fetchRateCard,
    createRateCardItem,
    updateRateCardItem,
    deleteRateCardItem,
    isLoading
  } = useSOWStore();

  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ name: '', rate: '' });
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [aiModels, setAiModels] = useState<Array<{ id: string; displayName: string }>>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [modelSearchTerm, setModelSearchTerm] = useState('');
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchRateCard();
    loadSystemPrompt();
    loadAiModels();
    loadSelectedModel();
  }, [fetchRateCard]);

  const loadSystemPrompt = async () => {
    try {
      setIsLoadingPrompt(true);
      const response = await fetch('/api/settings/systemPrompt');
      if (response.ok) {
        const data = await response.json();
        setSystemPrompt(data.value);
      }
    } catch (error) {
      console.log('Using default system prompt');
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  const loadAiModels = async () => {
    try {
      const response = await fetch('/api/ai/models');
      if (response.ok) {
        const models = await response.json();
        setAiModels(models);
      }
    } catch (error) {
      console.error('Failed to load AI models:', error);
    }
  };

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

  const saveSelectedModel = async () => {
    try {
      await fetch('/api/settings/selectedModel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: selectedModel }),
      });
    } catch (error) {
      console.error('Failed to save selected model:', error);
    }
  };

  const saveSystemPrompt = async () => {
    try {
      setIsLoadingPrompt(true);
      await fetch('/api/settings/systemPrompt', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: systemPrompt }),
      });
    } catch (error) {
      console.error('Failed to save system prompt:', error);
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  const filteredRateCard = rateCard.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAiModels = aiModels.filter(model =>
    (modelSearchTerm === '' || model.displayName.toLowerCase().includes(modelSearchTerm.toLowerCase())) &&
    (!showFreeOnly || model.id.includes(':free'))
  );

  const handleSaveNewItem = async () => {
    if (!newItem.name.trim() || !newItem.rate.trim()) return;

    try {
      await createRateCardItem({
        name: newItem.name.trim(),
        rate: parseInt(newItem.rate)
      });
      setNewItem({ name: '', rate: '' });
    } catch (error) {
      console.error('Failed to create rate card item:', error);
    }
  };

  const handleUpdateItem = async (id: string, name: string, rate: number) => {
    try {
      await updateRateCardItem(id, { name, rate });
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update rate card item:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rate card item?')) return;

    try {
      await deleteRateCardItem(id);
    } catch (error) {
      console.error('Failed to delete rate card item:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <a href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Workbench
            </a>
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cpu className="h-6 w-6" />
            AI Engine Settings
          </h1>
        </div>
        <ThemeToggle />
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* AI Model Selector */}
        <Card>
          <CardHeader>
            <CardTitle>AI Model Selection</CardTitle>
            <p className="text-sm text-muted-foreground">
              Choose which AI model to use for generating SOWs. Select from available AI models.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <AIModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              onSave={saveSelectedModel}
              showSaveButton={true}
            />
          </CardContent>
        </Card>

        {/* System Prompt Editor */}
        <Card>
          <CardHeader>
            <CardTitle>AI System Prompt</CardTitle>
            <p className="text-sm text-muted-foreground">
              Customize the AI's personality, behavior, and core instructions. This controls how the SOW Workbench generates proposals.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="font-mono text-sm min-h-[400px] resize-none"
              placeholder="Enter the AI system prompt..."
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {systemPrompt.length} characters
              </span>
              <Button onClick={saveSystemPrompt} disabled={isLoadingPrompt}>
                <Save className="h-4 w-4 mr-2" />
                {isLoadingPrompt ? 'Saving...' : 'Save System Prompt'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add New Item Section */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Rate Card Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Role/Service Name"
                value={newItem.name}
                onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Rate (AUD per hour)"
                value={newItem.rate}
                onChange={(e) => setNewItem(prev => ({ ...prev, rate: e.target.value }))}
                className="w-48"
              />
              <Button onClick={handleSaveNewItem} disabled={!newItem.name.trim() || !newItem.rate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search & Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Master Rate Card</CardTitle>
            <p className="text-sm text-muted-foreground">
              These rates are automatically injected into every AI-generated SOW. This is your master pricing database.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search roles/services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredRateCard.length} of {rateCard.length} items
              </div>
            </div>

            {/* Rate Card List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8">Loading rate card...</div>
              ) : filteredRateCard.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No items found matching your search.' : 'No rate card items found.'}
                </div>
              ) : (
                filteredRateCard.map((item) => (
                  <Card key={item.id} className="p-4">
                    {editingId === item.id ? (
                      <EditItemForm
                        item={item}
                        onSave={(name, rate) => handleUpdateItem(item.id, name, rate)}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{item.name}</h3>
                          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                            AUD ${item.rate}/hour
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(item.id)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EditItemForm({ item, onSave, onCancel }: {
  item: { id: string; name: string; rate: number };
  onSave: (name: string, rate: number) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [rate, setRate] = useState(item.rate.toString());

  const handleSave = () => {
    if (!name.trim() || !rate) return;
    onSave(name.trim(), parseInt(rate));
  };

  return (
    <div className="flex gap-4">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1"
        autoFocus
      />
      <Input
        type="number"
        value={rate}
        onChange={(e) => setRate(e.target.value)}
        className="w-48"
      />
      <Button onClick={handleSave} size="sm">Save</Button>
      <Button onClick={onCancel} variant="outline" size="sm">Cancel</Button>
    </div>
  );
}
