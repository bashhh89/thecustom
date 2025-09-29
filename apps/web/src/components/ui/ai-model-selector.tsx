import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AIModel {
  id: string;
  displayName: string;
}

interface AIModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  onSave?: () => void;
  showSaveButton?: boolean;
}

export function AIModelSelector({
  selectedModel,
  onModelChange,
  onSave,
  showSaveButton = false
}: AIModelSelectorProps) {
  const [aiModels, setAiModels] = useState<AIModel[]>([]);
  const [modelSearchTerm, setModelSearchTerm] = useState('');
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadAiModels();
  }, []);

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

  const filteredAiModels = aiModels.filter(model =>
    (modelSearchTerm === '' || model.displayName.toLowerCase().includes(modelSearchTerm.toLowerCase())) &&
    (!showFreeOnly || model.id.includes(':free'))
  );

  const selectedModelDisplay = aiModels.find(m => m.id === selectedModel)?.displayName || 'Select AI model...';

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">AI Model</label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {selectedModelDisplay}
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {isOpen && (
          <div className="absolute z-50 w-full bg-background border border-input rounded-md shadow-md mt-1 p-2">
            <Input
              placeholder="Search models..."
              value={modelSearchTerm}
              onChange={(e) => setModelSearchTerm(e.target.value)}
              className="mb-2"
            />
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="free-toggle"
                checked={showFreeOnly}
                onChange={(e) => setShowFreeOnly(e.target.checked)}
              />
              <label htmlFor="free-toggle" className="text-sm">Show free models only</label>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {filteredAiModels.map((model) => (
                <button
                  key={model.id}
                  className="w-full px-2 py-1 text-left hover:bg-accent hover:text-accent-foreground rounded"
                  onClick={() => {
                    onModelChange(model.id);
                    setIsOpen(false);
                  }}
                >
                  {model.displayName}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {showSaveButton && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Currently selected: {selectedModelDisplay}
          </div>
          <Button onClick={onSave} disabled={selectedModel === ''}>
            Save Model
          </Button>
        </div>
      )}
    </div>
  );
}
