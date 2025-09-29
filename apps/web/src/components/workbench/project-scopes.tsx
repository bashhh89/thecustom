'use client';

import { useSOWStore } from '@/stores/sow-store';
import { Scope, Role, SOWData } from '@sow-workbench/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { Trash2, Plus } from 'lucide-react';
import { ScopeDiagram } from './scope-diagram';

export function ProjectScopes() {
  const { activeSow, rateCard, updateActiveSowData, updateRoleHours, recalculateAllTotals } = useSOWStore();

  if (!activeSow?.sowData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No scopes yet. Add a scope below.
      </div>
    );
  }

  const sowData = activeSow.sowData as unknown as SOWData;

  // Ensure sowData has the proper structure
  const safeSowData = {
    projectTitle: sowData?.projectTitle || '',
    clientName: sowData?.clientName || '',
    projectOverview: sowData?.projectOverview || '',
    projectOutcomes: Array.isArray(sowData?.projectOutcomes) ? sowData.projectOutcomes : [],
    scopes: Array.isArray(sowData?.scopes) ? sowData.scopes : [],
    budgetNote: sowData?.budgetNote || ''
  };

  const updateScopes = (scopes: Scope[]) => {
    const updatedSowData = { ...safeSowData, scopes };
    updateActiveSowData(updatedSowData);
  };

  const addScope = () => {
    const currentScopes = Array.isArray(safeSowData.scopes) ? safeSowData.scopes : [];
    const newScope: Scope = {
      scopeName: 'New Scope',
      scopeOverview: '',
      deliverables: [],
      assumptions: [],
      roles: [],
      subtotal: 0
    };
    updateScopes([...currentScopes, newScope]);
  };

  const deleteScope = (index: number) => {
    const updatedScopes = sowData.scopes.filter((_, i) => i !== index);
    updateScopes(updatedScopes);
  };

  const updateScope = (index: number, field: keyof Scope, value: any) => {
    const updatedScopes = [...sowData.scopes];
    updatedScopes[index] = { ...updatedScopes[index], [field]: value };

    // Recalculate subtotal for this scope
    if (field === 'roles') {
      const total = updatedScopes[index].roles.reduce((sum, role) => sum + role.total, 0);
      updatedScopes[index].subtotal = total;
    }

    updateScopes(updatedScopes);
  };

  const updateDeliverables = (scopeIndex: number, value: string) => {
    const updatedDeliverables = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    updateScope(scopeIndex, 'deliverables', updatedDeliverables);
  };

  const updateAssumptions = (scopeIndex: number, value: string) => {
    const updatedAssumptions = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    updateScope(scopeIndex, 'assumptions', updatedAssumptions);
  };

  const addRole = (scopeIndex: number) => {
    const newRole: Role = {
      name: '',
      description: '',
      hours: 0,
      rate: 0,
      total: 0
    };
    const scope = sowData.scopes[scopeIndex];
    const updatedRoles = [...scope.roles, newRole];
    updateScope(scopeIndex, 'roles', updatedRoles);
  };

  const selectRoleAndSetRate = (scopeIndex: number, roleIndex: number, selectedRoleName: string) => {
    const selectedRate = rateCard.find(r => r.name === selectedRoleName);
    if (!selectedRate) return;

    console.log('Selecting role:', selectedRate.name, 'with rate:', selectedRate.rate);

    // Use the store's updateRole functions instead of trying to manipulate state directly
    // This is cleaner and uses the existing logic
    updateRole(scopeIndex, roleIndex, 'name', selectedRate.name);
    updateRole(scopeIndex, roleIndex, 'rate', selectedRate.rate);
  };

  // Add the missing updateRole function that the dropdown calls
  const updateRole = (scopeIndex: number, roleIndex: number, field: keyof Role, value: any) => {
    if (!activeSow?.sowData) return;

    const sowData = activeSow.sowData as any;
    if (!sowData.scopes || !Array.isArray(sowData.scopes)) return;

    const updatedScopes = sowData.scopes.map((scope: any, si: number) => {
      if (si === scopeIndex) {
        const updatedRoles = scope.roles.map((role: any, ri: number) => {
          if (ri === roleIndex) {
            const processedValue = (field === 'hours' || field === 'rate') ? parseFloat(value) || 0 : value;
            return { ...role, [field]: processedValue };
          }
          return role;
        });
        return { ...scope, roles: updatedRoles };
      }
      return scope;
    });

    const updatedSowData = { ...sowData, scopes: updatedScopes };
    updateActiveSowData(updatedSowData);

    // After setting the role/rate, recalculate everything
    if (field === 'rate' || field === 'name') {
      setTimeout(() => recalculateAllTotals(), 0);
    }
  };

  const deleteRole = (scopeIndex: number, roleIndex: number) => {
    const scope = sowData.scopes[scopeIndex];
    const updatedRoles = scope.roles.filter((_, i) => i !== roleIndex);
    updateScope(scopeIndex, 'roles', updatedRoles);
  };

  const selectRole = (scopeIndex: number, roleIndex: number, roleName: string) => {
    const selectedRate = rateCard.find(r => r.name === roleName);
    if (!selectedRate) return;

    updateRole(scopeIndex, roleIndex, 'name', selectedRate.name);
    updateRole(scopeIndex, roleIndex, 'rate', selectedRate.rate);
  };

  if (!sowData.scopes || !Array.isArray(sowData.scopes) || sowData.scopes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Project Scopes</h3>
          <Button
            onClick={addScope}
            className="bg-gradient-to-r from-[#0e2e33] to-[#20e28f] hover:from-[#0e2e33] hover:to-[#1a8c6b] text-white font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Scope
          </Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          No scopes yet. Click "Add Scope" to get started.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Project Scopes</h3>
        <Button
          onClick={addScope}
          className="bg-gradient-to-r from-[#0e2e33] to-[#20e28f] hover:from-[#0e2e33] hover:to-[#1a8c6b] text-white font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Scope
        </Button>
      </div>

      {sowData.scopes.map((scope: Scope, scopeIndex: number) => (
        <Card key={scopeIndex}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{scope.scopeName || 'Unnamed Scope'}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteScope(scopeIndex)}
                className="text-destructive hover:bg-red-500 hover:text-white border-red-300/20 hover:border-red-500 hover:shadow-lg transition-all duration-200"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Scope Name */}
            <div>
              <Label>Scope Name</Label>
              <Input
                value={scope.scopeName}
                onChange={(e) => updateScope(scopeIndex, 'scopeName', e.target.value)}
              />
            </div>

            {/* Scope Overview */}
            <div>
              <Label>Scope Overview</Label>
              <Textarea
                value={scope.scopeOverview}
                onChange={(e) => updateScope(scopeIndex, 'scopeOverview', e.target.value)}
                placeholder="Brief description of what this scope covers..."
              />
            </div>

            {/* Deliverables */}
            <div>
              <Label className="mb-2 block">Deliverables</Label>
              <Textarea
                value={scope.deliverables.join(', ')}
                onChange={(e) => updateDeliverables(scopeIndex, e.target.value)}
                placeholder="Enter deliverables separated by commas (e.g., Professional PDF export, Multi-sheet Excel reports, Customizable templates)..."
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">Separate multiple deliverables with commas</p>
            </div>

            {/* Assumptions */}
            <div>
              <Label className="mb-2 block">Assumptions</Label>
              <Textarea
                value={scope.assumptions.join(', ')}
                onChange={(e) => updateAssumptions(scopeIndex, e.target.value)}
                placeholder="Enter assumptions separated by commas (e.g., Client provides branding guidelines, Browser compatibility requirements met, Performance expectations defined)..."
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">Separate multiple assumptions with commas</p>
            </div>

            {/* Roles & Pricing */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Roles & Pricing</Label>
                <Button size="sm" onClick={() => addRole(scopeIndex)}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Role
                </Button>
              </div>
              {scope.roles.map((role, roleIndex) => (
                <div key={roleIndex} className="border rounded p-3 mb-3 space-y-3">
                  {/* Role Selection */}
                  <div>
                    <Label className="text-sm">Role</Label>
                    <select
                      value={role.name}
                      onChange={(e) => {
                        const selectedRole = rateCard.find(r => r.name === e.target.value);
                        if (selectedRole) {
                          updateRole(scopeIndex, roleIndex, 'name', selectedRole.name);
                          updateRole(scopeIndex, roleIndex, 'rate', selectedRole.rate);
                        }
                      }}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select role from rate card...</option>
                      {rateCard.map((rateItem) => (
                        <option key={rateItem.id} value={rateItem.name}>
                          {rateItem.name} - ${rateItem.rate}/hr
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Role Details Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-sm">Hours</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={role.hours || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                          updateRoleHours(scopeIndex, roleIndex, value);
                        }}
                        placeholder="0"
                        className="font-medium bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Rate ($/hr)</Label>
                      <Input
                        type="number"
                        value={role.rate || ''}
                        onChange={(e) => {
                          const newRate = parseFloat(e.target.value) || 0;
                          updateRole(scopeIndex, roleIndex, 'rate', newRate);
                        }}
                        placeholder="0"
                        className="font-medium bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Total ($)</Label>
                      <div className="h-10 px-3 py-2 border rounded-md font-bold flex items-center text-green-600 dark:text-green-400">
                        ${role.total.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">
                      Selected: {role.name}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRole(scopeIndex, roleIndex)}
                      className="text-destructive hover:text-destructive hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Subtotal */}
              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">Scope Subtotal: </span>
                  <span className="text-lg font-bold">${scope.subtotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Grand Total */}
      {sowData.scopes && sowData.scopes.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-end">
              <div className="text-right">
                <span className="text-sm text-muted-foreground">Project Total: </span>
                <span className="text-2xl font-bold text-[#20e28f]">
                  ${sowData.scopes.reduce((total, scope) => total + scope.subtotal, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


    </div>
  );
}
