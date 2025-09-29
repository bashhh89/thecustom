'use client';

import { useSOWStore } from '@/stores/sow-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProjectSummary } from './project-summary';
import { ProjectScopes } from './project-scopes';
import { Button } from '@/components/ui/button';
import { FileText, Download, FileSpreadsheet } from 'lucide-react';
import { exportToPDF, exportToXLSX } from '@/lib/export-utils';

export function Workbench() {
  const { activeSow } = useSOWStore();

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

  if (!activeSow) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No SOW Selected</h2>
          <p className="text-muted-foreground mb-4">
            Select an existing SOW from the sidebar or create a new one to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto h-full">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Export Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{activeSow.name}</h1>
            <p className="text-muted-foreground">Statement of Work Details</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleExportPDF} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button 
              onClick={handleExportXLSX} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export XLSX
            </Button>
          </div>
        </div>
        
        <ProjectSummary />
        <ProjectScopes />
        {/* Additional sections will be added here */}
      </div>
    </div>
  );
}
