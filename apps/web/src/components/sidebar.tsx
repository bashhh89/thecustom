'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSOWStore } from '@/stores/sow-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Folder, Settings, DollarSign, Cpu, Trash2, CheckSquare, Square } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { FolderItem } from './sidebar/folder-item';
import { Edit2 } from 'lucide-react';

export function Sidebar() {
  const {
    sows,
    folders,
    isLoading,
    fetchFolders,
    createFolder,
    createSow,
    selectSow,
    renameFolder,
    deleteFolder,
    renameSow,
    deleteSow,
    moveSow,
    activeSow,
    toggleChatPanel
  } = useSOWStore();

  const [mounted, setMounted] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingSowId, setEditingSowId] = useState<string | null>(null);
  const [editSowName, setEditSowName] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchFolders();
  }, [fetchFolders]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size > 0) {
      // Deselect all
      setSelectedItems(new Set());
    } else {
      // Select all visible items
      const allItemIds = new Set<string>();

      // Add all folder IDs
      folders.forEach(folder => {
        allItemIds.add(`folder-${folder.id}`);
        folder.children.forEach(child => {
          allItemIds.add(`folder-${child.id}`);
        });
      });

      // Add all SOW IDs
      sows.forEach(sow => {
        allItemIds.add(`sow-${sow.id}`);
      });

      setSelectedItems(allItemIds);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    const folderIds: string[] = [];
    const sowIds: string[] = [];

    selectedItems.forEach(itemId => {
      if (itemId.startsWith('folder-')) {
        folderIds.push(itemId.replace('folder-', ''));
      } else if (itemId.startsWith('sow-')) {
        sowIds.push(itemId.replace('sow-', ''));
      }
    });

    // Delete folders first (they may contain SOWs)
    for (const folderId of folderIds) {
      await deleteFolder(folderId);
    }

    // Delete SOWs
    for (const sowId of sowIds) {
      await deleteSow(sowId);
    }

    // Clear selection and exit bulk mode
    setSelectedItems(new Set());
    setBulkMode(false);
    await fetchFolders();
  };



  // Determine logo based on theme - mounted prevents hydration mismatch
  const logoSrc = !mounted ? '/footer-logo.png' : (document.documentElement.classList.contains('dark') ? '/footer-logo.png' : '/header-logo.png');

  return (
    <div className="w-64 border-r bg-card">
      <div className="p-4 border-b space-y-4">
        <div className="flex justify-center">
          <Image
            src={logoSrc}
            alt="Social Garden Logo"
            width={150}
            height={40}
            className="h-auto w-auto max-w-full"
            style={{ maxHeight: '40px' }}
            priority
          />
        </div>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-center w-full">SOW Workbench</h2>
        </div>
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        <Button
          onClick={async () => {
            const newSow = await createSow();
            await fetchFolders();
            await selectSow(newSow.id);
            toggleChatPanel();
          }}
          className="w-full bg-gradient-to-r from-[#0e2e33] to-[#20e28f] hover:from-[#0e2e33] hover:to-[#1a8c6b] text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 px-4 py-3"
          size="default"
        >
          <Plus className="h-5 w-5 mr-2" />
          New SOW
        </Button>

        {/* Bulk Select Controls */}
        <div className="flex gap-2">
          <Button
            onClick={() => setBulkMode(!bulkMode)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {bulkMode ? 'Cancel' : 'Select'}
          </Button>
          {bulkMode && (
            <Button
              onClick={toggleSelectAll}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {selectedItems.size > 0 ? (
                <>
                  <Square className="h-3 w-3 mr-1" />
                  Deselect
                </>
              ) : (
                <>
                  <CheckSquare className="h-3 w-3 mr-1" />
                  Select All
                </>
              )}
            </Button>
          )}
        </div>

        {/* Bulk Delete Button */}
        {selectedItems.size > 0 && (
          <Button
            onClick={handleBulkDelete}
            variant="destructive"
            size="sm"
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete {selectedItems.size} items
          </Button>
        )}
      </div>

      <div className="p-2 max-h-[calc(100vh-180px)] overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <div className="space-y-2">
            {/* Folder Management */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-sm font-medium text-muted-foreground">Folders</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => createFolder('New Folder')}
                  className="h-6 w-6 p-0 hover:bg-muted"
                  title="Create new folder"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* RenderFolder Hierarchy */}
              {folders.map((folder) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  isExpanded={expandedFolders.has(folder.id)}
                  onToggle={() => toggleFolder(folder.id)}
                  onCreateSubfolder={(parentId) => createFolder('New Folder', parentId)}
                  onRenameFolder={renameFolder}
                  onDeleteFolder={deleteFolder}
                  onSelectSow={selectSow}
                  onMoveSow={moveSow}
                  activeSowId={activeSow?.id}
                  bulkMode={bulkMode}
                  selectedItems={selectedItems}
                  onToggleItemSelection={toggleItemSelection}
                />
              ))}
            </div>

            {folders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No folders yet</p>
                <p className="text-xs">Create folders to organize your SOWs</p>
              </div>
            )}

            {/* Unorganized SOWs */}
            <>
              {(() => {
                // Get all SOW IDs that are in folders
                const organizedSowIds = new Set(
                  folders.flatMap(folder =>
                    folder.sows.map(sow => sow.id).concat(
                      folder.children.flatMap(child => child.sows.map(sow => sow.id))
                    )
                  )
                );

                // Find unorganized SOWs
                const unorganizedSows = sows.filter(sow => !organizedSowIds.has(sow.id));

                if (unorganizedSows.length > 0) {
                  return (
                    <div className="space-y-1">
                      <div className="px-2 py-1">
                        <span className="text-xs font-medium text-muted-foreground">Unorganized</span>
                      </div>
                      {unorganizedSows.map((sow) => (
                        <Card
                          key={sow.id}
                          className={`m-0 transition-colors cursor-pointer ${
                            activeSow?.id === sow.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                          }`}
                          draggable={!bulkMode}
                          onDragStart={(e) => e.dataTransfer.setData('text/plain', sow.id)}
                          onClick={() => !bulkMode && selectSow(sow.id)}
                        >
                          <CardContent className="p-2 group">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center flex-1 min-w-0">
                                {bulkMode && (
                                  <Checkbox
                                    checked={selectedItems.has(`sow-${sow.id}`)}
                                    onCheckedChange={() => toggleItemSelection(`sow-${sow.id}`)}
                                    className="mr-2"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  {editingSowId === sow.id ? (
                                    <Input
                                      value={editSowName}
                                      onChange={(e) => setEditSowName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          renameSow(sow.id, editSowName.trim() || 'Untitled SOW');
                                          setEditingSowId(null);
                                        }
                                        if (e.key === 'Escape') {
                                          setEditingSowId(null);
                                          setEditSowName('');
                                        }
                                      }}
                                      onBlur={() => {
                                        renameSow(sow.id, editSowName.trim() || 'Untitled SOW');
                                        setEditingSowId(null);
                                      }}
                                      className="text-sm h-6 px-2"
                                      autoFocus
                                    />
                                  ) : (
                                    <div>
                                      <h4 className="font-medium text-sm truncate">{sow.name}</h4>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(sow.updatedAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {!bulkMode && (
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingSowId(sow.id);
                                      setEditSowName(sow.name);
                                    }}
                                    className="h-6 w-6 p-0 hover:bg-muted"
                                    title="Rename SOW"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteSow(sow.id);
                                    }}
                                    className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                    title="Delete SOW"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Drag target for removing from folders */}
              <div
                className="min-h-[2rem] border-2 border-dashed border-muted-foreground/30 rounded-md p-2 mt-2"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const sowId = e.dataTransfer.getData('text/plain');
                  if (sowId) {
                    moveSow(sowId, null); // Remove from folder
                  }
                }}
              >
                <p className="text-xs text-muted-foreground text-center">
                  Drag SOWs here to remove from folders
                </p>
              </div>
            </>
          </div>
        )}
      </div>

      {/* Settings Links */}
      <div className="p-2 border-t mt-2 space-y-1 bg-muted/20">
        <Button
          variant="ghost"
          className="w-full justify-start"
          size="sm"
          asChild
        >
          <a href="/settings/ai">
            <Cpu className="h-4 w-4 mr-2" />
            AI Engine
          </a>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          size="sm"
          asChild
        >
          <a href="/settings/rate-card">
            <DollarSign className="h-4 w-4 mr-2" />
            Rate Card
          </a>
        </Button>
      </div>
    </div>
  );
}
