'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Scope } from '@sow-workbench/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface ScopeDiagramProps {
  scopes: Scope[];
  projectTitle?: string;
}

export function ScopeDiagram({ scopes, projectTitle }: ScopeDiagramProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);
  const [diagramId] = useState(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      themeVariables: {
        primaryColor: '#20e28f',
        primaryTextColor: '#0e2e33',
        primaryBorderColor: '#1bc47d',
        lineColor: '#20e28f',
        sectionBkgColor: '#f8fafc',
        altSectionBkgColor: '#ffffff',
        gridColor: '#e2e8f0',
        tertiaryColor: '#f1f5f9'
      }
    });
  }, []);

  const generateMermaidCode = () => {
    if (!scopes || scopes.length === 0) {
      return `graph TD
        A[No Scopes Defined] --> B[Add scopes to see diagram]`;
    }

    let code = `graph TD
    A[${projectTitle || 'Project'}] --> B[Project Scopes]\n`;

    scopes.forEach((scope, index) => {
      const scopeId = `S${index + 1}`;
      const scopeName = scope.scopeName || `Scope ${index + 1}`;

      code += `    B --> ${scopeId}["${scopeName}"]\n`;

      // Add deliverables as sub-nodes
      if (scope.deliverables && scope.deliverables.length > 0) {
        scope.deliverables.forEach((deliverable, dIndex) => {
          const deliverableId = `${scopeId}D${dIndex + 1}`;
          const shortDeliverable = deliverable.length > 30 ? deliverable.substring(0, 27) + '...' : deliverable;
          code += `    ${scopeId} --> ${deliverableId}["${shortDeliverable}"]\n`;
        });
      }

      // Add roles as sub-nodes
      if (scope.roles && scope.roles.length > 0) {
        scope.roles.forEach((role, rIndex) => {
          const roleId = `${scopeId}R${rIndex + 1}`;
          const roleName = role.name || `Role ${rIndex + 1}`;
          code += `    ${scopeId} --> ${roleId}["${roleName}<br/>${role.hours}h @ $${role.rate}/hr"]\n`;
        });
      }
    });

    // Add styling
    code += `
    classDef scopeClass fill:#20e28f,stroke:#1bc47d,stroke-width:2px,color:#ffffff
    classDef deliverableClass fill:#e8f5e8,stroke:#20e28f,stroke-width:1px,color:#0e2e33
    classDef roleClass fill:#f0f9f0,stroke:#1bc47d,stroke-width:1px,color:#0e2e33

    class A scopeClass
    class B scopeClass`;

    // Apply classes to nodes
    scopes.forEach((scope, index) => {
      const scopeId = `S${index + 1}`;
      code += `\n    class ${scopeId} scopeClass`;

      if (scope.deliverables && scope.deliverables.length > 0) {
        scope.deliverables.forEach((_, dIndex) => {
          code += `\n    class ${scopeId}D${dIndex + 1} deliverableClass`;
        });
      }

      if (scope.roles && scope.roles.length > 0) {
        scope.roles.forEach((_, rIndex) => {
          code += `\n    class ${scopeId}R${rIndex + 1} roleClass`;
        });
      }
    });

    return code;
  };

  const renderDiagram = async () => {
    if (!diagramRef.current || !isVisible) return;

    try {
      const code = generateMermaidCode();
      const { svg } = await mermaid.render(diagramId, code);
      diagramRef.current.innerHTML = svg;
      setIsRendered(true);
    } catch (error) {
      console.error('Failed to render mermaid diagram:', error);
      diagramRef.current.innerHTML = '<div class="text-center text-muted-foreground p-4">Failed to render diagram</div>';
    }
  };

  useEffect(() => {
    if (isVisible && !isRendered) {
      renderDiagram();
    }
  }, [isVisible, scopes, projectTitle]);

  if (!scopes || scopes.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#20e28f]" />
            Project Scope Visualization
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVisible(!isVisible)}
            className="hover:bg-[#20e28f]/10"
          >
            {isVisible ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Diagram
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Show Diagram
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {isVisible && (
        <CardContent>
          <div className="border rounded-lg p-4 bg-gradient-to-br from-slate-50 to-white">
            <div
              ref={diagramRef}
              className="flex justify-center items-center min-h-[300px]"
              id={diagramId}
            />
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#20e28f] rounded"></div>
                <span>Project Scopes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#e8f5e8] rounded border border-[#20e28f]"></div>
                <span>Deliverables</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#f0f9f0] rounded border border-[#1bc47d]"></div>
                <span>Roles & Hours</span>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
