'use client';

import { useSOWStore } from '@/stores/sow-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface SOWData {
  projectTitle?: string;
  clientName?: string;
  projectOverview?: string;
  projectOutcomes?: string[];
  scopes?: any[];
  budgetNote?: string;
}

export function ProjectSummary() {
  const { activeSow, updateActiveSowData } = useSOWStore();
  const sowData = activeSow?.sowData as SOWData || {};

  const handleFieldUpdate = (field: string, value: string) => {
    const newSOWData = { ...sowData, [field]: value };
    updateActiveSowData(newSOWData);
  };

  if (!activeSow) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Project Title</label>
            <Input
              value={sowData.projectTitle || ''}
              onChange={(e) => handleFieldUpdate('projectTitle', e.target.value)}
              placeholder="Project Title"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Client Name</label>
            <Input
              value={sowData.clientName || ''}
              onChange={(e) => handleFieldUpdate('clientName', e.target.value)}
              placeholder="Client Name"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Project Overview</label>
          <Input
            value={sowData.projectOverview || ''}
            onChange={(e) => handleFieldUpdate('projectOverview', e.target.value)}
            placeholder="Brief project description"
          />
        </div>
      </CardContent>
    </Card>
  );
}
