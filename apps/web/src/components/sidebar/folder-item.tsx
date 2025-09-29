'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Edit2, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

// Temporary Folder interface until Prisma client is updated
interface Folder {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  parentId?: string;
  children: Folder[];
  sows: Array<{
    id: string;
    name: string;
    updatedAt: Date;
  }>;
  _count: {
    sows: number;
    children: number;
  };
}

interface FolderItemProps {
  folder: Folder;
  isExpanded: boolean;
  onToggle: () => void;
  onCreateSubfolder: (parentId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onSelectSow: (sowId: string) => void;
  onMoveSow: (sowId: string, folderId: string | null) => void;
  activeSowId?: string;
  bulkMode?: boolean;
  selectedItems?: Set<string>;
  onToggleItemSelection?: (itemId: string) => void;
}

export function FolderItem({
  folder,
  isExpanded,
  onToggle,
  onCreateSubfolder,
  onRenameFolder,
  onDeleteFolder,
  onSelectSow,
  onMoveSow,
  activeSowId,
  bulkMode = false,
  selectedItems = new Set(),
  onToggleItemSelection
}: FolderItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);

  const handleRename = () => {
    if (editName.trim() && editName.trim() !== folder.name) {
      onRenameFolder(folder.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(folder.name);
    setIsEditing(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const sowId = e.dataTransfer.getData('text/plain');
    if (sowId) {
      onMoveSow(sowId, folder.id);
    }
  };

  const handleDragStart = (e: React.DragEvent, sowId: string) => {
    e.dataTransfer.setData('text/plain', sowId);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center group">
        {bulkMode && (
          <Checkbox
            checked={selectedItems.has(`folder-${folder.id}`)}
            onCheckedChange={() => onToggleItemSelection?.(`folder-${folder.id}`)}
            className="mr-2"
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-6 w-6 p-0 mr-1 hover:bg-muted flex-shrink-0"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>

        {isExpanded ? (
          <FolderOpen className="h-4 w-4 mr-2 text-[#0e2e33] flex-shrink-0" />
        ) : (
          <Folder className="h-4 w-4 mr-2 text-[#0e2e33] flex-shrink-0" />
        )}

        {isEditing ? (
          <div className="flex items-center flex-1 min-w-0">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              className="text-sm h-6 px-2 flex-1 min-w-0"
              autoFocus
              onBlur={handleRename}
            />
          </div>
        ) : (
          <>
            <span className="text-sm font-medium truncate flex-1 min-w-0">
              {folder.name}
            </span>
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCreateSubfolder(folder.id)}
                className="h-5 w-5 p-0 hover:bg-muted hover:shadow-md hover:scale-105 transition-all duration-200"
                title="Create subfolder"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-5 w-5 p-0 hover:bg-muted hover:shadow-md hover:scale-105 transition-all duration-200"
                title="Rename folder"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteFolder(folder.id)}
                className="h-5 w-5 p-0 hover:bg-red-500 hover:text-white border border-red-300/20 hover:border-red-500 hover:shadow-lg hover:scale-105 transition-all duration-200"
                title="Delete folder"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </div>

      {isExpanded && (
        <div
          className="ml-4 space-y-2 min-h-[2rem] border-l border-border pl-4"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Render subfolders */}
          {folder.children.map((childFolder) => (
            <FolderItem
              key={childFolder.id}
              folder={childFolder}
              isExpanded={false}
              onToggle={() => {}}
              onCreateSubfolder={onCreateSubfolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onSelectSow={onSelectSow}
              onMoveSow={onMoveSow}
              activeSowId={activeSowId}
            />
          ))}

          {/* Render SOWs */}
          {folder.sows.map((sow) => (
            <Card
              key={sow.id}
              className={`m-0 transition-colors ${
                activeSowId === sow.id ? 'ring-2 ring-primary' : ''
              }`}
              draggable={!bulkMode}
              onDragStart={(e) => handleDragStart(e, sow.id)}
            >
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    {bulkMode && (
                      <Checkbox
                        checked={selectedItems.has(`sow-${sow.id}`)}
                        onCheckedChange={() => onToggleItemSelection?.(`sow-${sow.id}`)}
                        className="mr-2"
                      />
                    )}
                    <div
                      className="flex-1 min-w-0"
                      onClick={() => !bulkMode && onSelectSow(sow.id)}
                    >
                      <h4 className="font-medium text-sm truncate">{sow.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sow.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Empty state */}
          {folder.children.length === 0 && folder.sows.length === 0 && (
            <div className="text-xs text-muted-foreground py-2">
              No SOWs yet. Drag and drop SOWs here.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
