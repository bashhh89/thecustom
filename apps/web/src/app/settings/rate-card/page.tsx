'use client';

import { useEffect, useState } from 'react';
import { useSOWStore } from '@/stores/sow-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Plus, Search, Trash2, Edit3 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function RateCardPage() {
  const {
    rateCard,
    fetchRateCard,
    createRateCardItem,
    updateRateCardItem,
    deleteRateCardItem,
    isLoading
  } = useSOWStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ name: '', rate: '' });

  useEffect(() => {
    fetchRateCard();
  }, [fetchRateCard]);

  const filteredRateCard = rateCard.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl font-bold">Rate Card Management</h1>
        </div>
        <ThemeToggle />
      </div>

      <div className="p-6 max-w-6xl mx-auto space-y-6">
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
            <CardTitle>All Rate Card Items</CardTitle>
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
            <ScrollArea className="h-[600px]">
              {isLoading ? (
                <div className="text-center py-8">Loading rate card...</div>
              ) : filteredRateCard.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No items found matching your search.' : 'No rate card items found.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRateCard.map((item) => (
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
                  ))}
                </div>
              )}
            </ScrollArea>
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
