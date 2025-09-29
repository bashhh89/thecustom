'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface SOWData {
  projectTitle: string;
  clientName: string;
  projectOverview: string;
  projectOutcomes: string[];
  scopes: Array<{
    scopeName: string;
    scopeOverview: string;
    deliverables: string[];
    assumptions: string[];
    roles: Array<{
      name: string;
      description: string;
      hours: number;
      rate: string;
      total: number;
    }>;
    subtotal: number;
  }>;
  timeline?: {
    duration: string;
    phases: Array<{
      name: string;
      duration: string;
      deliverables: string[];
    }>;
  };
  budgetNote?: string;
}

export default function SharedSOWPage() {
  const params = useParams();
  const [sowData, setSowData] = useState<SOWData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSharedSOW() {
      try {
        const response = await fetch(`/api/sows/share/${params.id}`);
        if (!response.ok) {
          throw new Error('SOW not found or not shared');
        }
        const data = await response.json();
        setSowData(data.sowData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load SOW');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchSharedSOW();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SOW...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">SOW Not Found</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!sowData) {
    return null;
  }

  const totalBudget = sowData.scopes.reduce((sum, scope) => sum + scope.subtotal, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{sowData.projectTitle}</h1>
              <p className="text-lg text-gray-600 mt-2">for {sowData.clientName}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">${totalBudget.toLocaleString()}</div>
              {sowData.timeline && (
                <div className="text-sm text-gray-600">{sowData.timeline.duration}</div>
              )}
            </div>
          </div>
          
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">{sowData.projectOverview}</p>
          </div>
        </div>

        {/* Project Outcomes */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Project Outcomes</h2>
          <div className="grid gap-4">
            {sowData.projectOutcomes.map((outcome, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-medium text-white">{index + 1}</span>
                </div>
                <p className="text-gray-700">{outcome}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        {sowData.timeline && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Project Timeline</h2>
            <div className="space-y-6">
              {sowData.timeline.phases.map((phase, index) => (
                <div key={index} className="relative">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-4">
                      <span className="text-sm font-medium text-white">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{phase.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{phase.duration}</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {phase.deliverables.map((deliverable, i) => (
                          <li key={i} className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                            {deliverable}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scopes */}
        <div className="space-y-6 mb-6">
          {sowData.scopes.map((scope, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{scope.scopeName}</h2>
                  <p className="text-gray-600 mt-2">{scope.scopeOverview}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-primary">${scope.subtotal.toLocaleString()}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Deliverables</h3>
                  <ul className="space-y-2">
                    {scope.deliverables.map((deliverable, i) => (
                      <li key={i} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mr-3 mt-2"></span>
                        <span className="text-gray-700">{deliverable}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Key Assumptions</h3>
                  <ul className="space-y-2">
                    {scope.assumptions.map((assumption, i) => (
                      <li key={i} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 mt-2"></span>
                        <span className="text-gray-600 text-sm">{assumption}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {scope.roles.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-semibold text-gray-900 mb-3">Resource Allocation</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investment</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {scope.roles.map((role, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3">
                              <div>
                                <div className="font-medium text-gray-900">{role.name}</div>
                                <div className="text-sm text-gray-600">{role.description}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{role.hours}h</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">${role.total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Budget Summary */}
        {sowData.budgetNote && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Investment Summary</h2>
            <p className="text-gray-700 leading-relaxed">{sowData.budgetNote}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Generated by SOW Workbench • Social Garden Australia
          </p>
        </div>
      </div>
    </div>
  );
}