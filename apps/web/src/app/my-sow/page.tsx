'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Calculator,
  Bot,
  Download,
  Save,
  ArrowRight,
  DollarSign,
  Clock,
  CheckCircle,
  Zap,
  FileSpreadsheet
} from 'lucide-react';
import { exportToPDF, exportToXLSX } from '@/lib/export-utils';

// Mock SOW data for demonstration
const mockSOWData = {
  name: "Freelance Development Contract",
  sowData: {
    projectTitle: "SOW Workbench Platform Development",
    clientName: "Social Garden Marketing Agency",
    projectOverview: "Complete development, deployment, and maintenance of the enterprise-grade SOW (Statement of Work) management platform with AI-powered proposal generation, live calculations, professional exports, and comprehensive project management capabilities.",
    projectOutcomes: [
      "Deliver fully functional SOW Workbench platform with all specified features",
      "Ensure 24/7 uptime and reliable performance",
      "Provide comprehensive documentation and training",
      "Ensure mobile-responsive design and cross-browser compatibility"
    ],
    scopes: [
      {
        scopeName: "Platform Architecture & Setup",
        scopeOverview: "Design and implement the complete SOW Workbench platform with modern tech stack including Next.js, Express API, PostgreSQL database, and comprehensive deployment configuration.",
        roles: [
          { name: "Senior Full-Stack Developer", description: "Frontend and backend development", hours: 120, rate: 125, total: 15000 },
          { name: "DevOps Engineer", description: "Deployment and infrastructure setup", hours: 40, rate: 150, total: 6000 },
          { name: "UI/UX Designer", description: "Interface design and user experience", hours: 32, rate: 85, total: 2720 }
        ],
        subtotal: 23720,
        deliverables: [
          "Complete Next.js frontend application with professional UI",
          "Express.js API with comprehensive REST endpoints",
          "PostgreSQL database with proper schema design",
          "Docker containerization and orchestration setup",
          "CI/CD pipeline and automated deployment scripts"
        ],
        assumptions: [
          "All necessary APIs and keys will be provided",
          "Client will provide access to testing environment",
          "Regular feedback will be provided throughout development",
          "Third-party service integrations will be available"
        ]
      },
      {
        scopeName: "AI-Powered Features",
        scopeOverview: "Implement AI chat integration with Grok/OpenRouter, intelligent content generation, automatic scope creation, and smart project analysis capabilities.",
        roles: [
          { name: "AI/ML Engineer", description: "AI integration and prompt engineering", hours: 80, rate: 140, total: 11200 },
          { name: "Backend Developer", description: "API integrations and data processing", hours: 60, rate: 125, total: 7500 },
          { name: "Quality Assurance", description: "AI feature testing and validation", hours: 24, rate: 80, total: 1920 }
        ],
        subtotal: 20620,
        deliverables: [
          "Complete AI chat integration with message history",
          "Intelligent SOW generation from project descriptions",
          "Automated scope and task breakdown features",
          "AI-powered content suggestions and templates",
          "Context-aware project analysis and recommendations"
        ],
        assumptions: [
          "Valid OpenRouter API key will be provided and maintained",
          "AI model performance meets project requirements",
          "Client provides clear project description guidelines",
          "API rate limits and costs are acceptable to client"
        ]
      },
      {
        scopeName: "Professional Export System",
        scopeOverview: "Develop comprehensive export functionality including client-ready PDF generation, multi-sheet Excel reports, and professional document formatting.",
        roles: [
          { name: "Frontend Developer", description: "Export UI and document generation", hours: 64, rate: 125, total: 8000 },
          { name: "Technical Writer", description: "Documentation and user guides", hours: 16, rate: 85, total: 1360 },
          { name: "PDF Specialist", description: "PDF rendering and formatting optimization", hours: 24, rate: 110, total: 2640 }
        ],
        subtotal: 12000,
        deliverables: [
          "Professional PDF export with Social Garden branding",
          "Multi-sheet Excel export with comprehensive project data",
          "Fully customizable report templates",
          "One-click export system with error handling",
          "Download management and file organization"
        ],
        assumptions: [
          "Client provides branding guidelines and approval",
          "Browser-based PDF generation meets requirements",
          "Export performance meets user expectations",
          "Cross-platform compatibility maintained"
        ]
      },
      {
        scopeName: "Live Calculations & Project Management",
        scopeOverview: "Implement real-time pricing calculations, project timeline management, resource allocation tracking, and comprehensive financial reporting.",
        roles: [
          { name: "Senior Developer", description: "Complex calculation logic and state management", hours: 72, rate: 125, total: 9000 },
          { name: "Business Analyst", description: "Financial modeling and requirements analysis", hours: 24, rate: 100, total: 2400 },
          { name: "Project Coordinator", description: "Scope management and timeline planning", hours: 16, rate: 75, total: 1200 }
        ],
        subtotal: 12600,
        deliverables: [
          "Real-time pricing calculations with instant updates",
          "Comprehensive role and rate management system",
          "Budget forecasting and variance analysis reports",
          "Multi-scope project management with dependencies",
          "Financial reporting dashboard with export capabilities"
        ],
        assumptions: [
          "Clear pricing model and rate card structure defined",
          "Financial reporting requirements clearly documented",
          "Real-time calculation performance requirements met",
          "Integration with existing financial systems possible"
        ]
      },
      {
        scopeName: "Production Deployment & Maintenance",
        scopeOverview: "Configure production environment, deploy to VPS, set up monitoring, and provide ongoing maintenance and support services.",
        roles: [
          { name: "DevOps Engineer", description: "Production deployment and infrastructure", hours: 48, rate: 150, total: 7200 },
          { name: "Technical Support", description: "Post-launch support and maintenance", hours: 80, rate: 85, total: 6800 },
          { name: "System Administrator", description: "Server monitoring and optimization", hours: 24, rate: 110, total: 2640 }
        ],
        subtotal: 16640,
        deliverables: [
          "Complete VPS deployment with SSL certificates",
          "PM2 process management and automatic restarts",
          "Server monitoring and performance optimization",
          "Comprehensive documentation and user guides",
          "30-day post-launch support and bug fixes",
          "Database backup and recovery procedures"
        ],
        assumptions: [
          "Client provides VPS access and administrative rights",
          "Domain setup completed by client or provided",
          "SSL certificate setup requirements met",
          "Server performance meets application requirements",
          "Maintenance SLA and response times defined"
        ]
      }
    ],
    budgetNote: "This fixed-price contract totals $85,580 for complete delivery of all specified features and capabilities. All prices include development, testing, deployment, and 30 days of post-launch support."
  }
};

export default function MySOWPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleExportPDF = async () => {
    setIsLoading(true);
    try {
      await exportToPDF(mockSOWData as any);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportXLSX = () => {
    try {
      exportToXLSX(mockSOWData as any);
    } catch (error) {
      console.error('Failed to generate Excel:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-100">
                <FileText className="h-5 w-5 text-slate-100 dark:text-slate-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Freelance Development SOW
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Professional contract for your development services
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push('/workbench')}
              >
                Edit in Workbench
              </Button>
              <Button
                variant="outline"
                onClick={handleExportXLSX}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              <Button
                onClick={handleExportPDF}
                disabled={isLoading}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-blue-600" />
                  Project Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="projectTitle" className="text-sm font-medium">
                    Project Title
                  </Label>
                  <Input
                    id="projectTitle"
                    value={mockSOWData.sowData.projectTitle}
                    readOnly
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="clientName" className="text-sm font-medium">
                    Client
                  </Label>
                  <Input
                    id="clientName"
                    value={mockSOWData.sowData.clientName}
                    readOnly
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="projectOverview" className="text-sm font-medium">
                    Project Description
                  </Label>
                  <Textarea
                    id="projectOverview"
                    value={mockSOWData.sowData.projectOverview}
                    readOnly
                    className="mt-1 min-h-20"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Project Outcomes */}
            <Card>
              <CardHeader>
                <CardTitle>Project Outcomes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {mockSOWData.sowData.projectOutcomes.map((outcome, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Scopes */}
            {mockSOWData.sowData.scopes.map((scope, scopeIndex) => (
              <Card key={scopeIndex}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Scope {scopeIndex + 1}: {scope.scopeName}</span>
                    <Badge variant="secondary" className="font-mono">
                      ${scope.subtotal.toLocaleString()}
                    </Badge>
                  </CardTitle>
                  {scope.scopeOverview && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      {scope.scopeOverview}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Roles Table */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Roles & Pricing
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-slate-200 dark:border-slate-700 rounded-lg">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium">Role</th>
                            <th className="px-4 py-2 text-left font-medium">Description</th>
                            <th className="px-4 py-2 text-center font-medium">Hours</th>
                            <th className="px-4 py-2 text-center font-medium">Rate</th>
                            <th className="px-4 py-2 text-right font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {scope.roles.map((role, roleIndex) => (
                            <tr key={roleIndex}>
                              <td className="px-4 py-3 font-medium">{role.name}</td>
                              <td className="px-4 py-3">{role.description}</td>
                              <td className="px-4 py-3 text-center">{role.hours}</td>
                              <td className="px-4 py-3 text-center">${role.rate}</td>
                              <td className="px-4 py-3 text-right font-mono">
                                ${role.total.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Deliverables */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      Deliverables
                    </h4>
                    <ul className="space-y-1 ml-6">
                      {scope.deliverables.map((deliverable, index) => (
                        <li key={index} className="text-sm text-slate-700 dark:text-slate-300">
                          • {deliverable}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Assumptions */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Assumptions
                    </h4>
                    <ul className="space-y-1 ml-6">
                      {scope.assumptions.map((assumption, index) => (
                        <li key={index} className="text-sm text-slate-700 dark:text-slate-300">
                          • {assumption}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Budget Note */}
            <Card className="border-2 border-slate-900 dark:border-slate-100">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-slate-100">
                  Contract Summary
                </h3>
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  {mockSOWData.sowData.budgetNote}
                </p>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    ${mockSOWData.sowData.scopes.reduce((total, scope) => total + scope.subtotal, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Fixed Price - All Inclusive
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Project Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Scopes:</span>
                  <Badge>{mockSOWData.sowData.scopes.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Roles:</span>
                  <Badge>
                    {mockSOWData.sowData.scopes.reduce((total, scope) => total + scope.roles.length, 0)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Hours:</span>
                  <Badge>
                    {mockSOWData.sowData.scopes.reduce((total, scope) =>
                      total + scope.roles.reduce((scopeTotal, role) => scopeTotal + role.hours, 0), 0
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Generated by SOW Workbench */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
              <CardContent className="p-6">
                <div className="text-center">
                  <Bot className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Generated with AI Power
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    This professional SOW was created using the same SOW Workbench platform I built for you.
                  </p>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => router.push('/workbench')}
                  >
                    Use SOW Workbench <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
