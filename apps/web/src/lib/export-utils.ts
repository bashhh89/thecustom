import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { SOW } from '@sow-workbench/db';

// Social Garden brand colors
const brandColors = {
  primary: '#0e2e33',    // Dark navy
  accent: '#20e28f',     // Green accent
  text: '#2d3748',       // Dark gray text
  lightGray: '#f8fafc',  // Light background
};

// Create professional HTML template for PDF
const createPDFTemplate = (sow: SOW): string => {
  const data = sow.sowData as any;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          line-height: 1.6;
          color: ${brandColors.text};
          background: white;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 50px;
          padding-bottom: 30px;
          border-bottom: 3px solid ${brandColors.accent};
        }
        
        .logo {
          width: 180px;
          height: auto;
        }
        
        .header-text {
          text-align: right;
        }
        
        .header-title {
          font-size: 24px;
          font-weight: 700;
          color: ${brandColors.primary};
          margin-bottom: 5px;
        }
        
        .header-subtitle {
          font-size: 14px;
          color: ${brandColors.text};
          opacity: 0.8;
        }
        
        .project-header {
          background: linear-gradient(135deg, ${brandColors.primary} 0%, #1a4a52 100%);
          color: white;
          padding: 30px;
          border-radius: 12px;
          margin-bottom: 40px;
        }
        
        .project-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 10px;
        }
        
        .project-client {
          font-size: 16px;
          opacity: 0.9;
          margin-bottom: 20px;
        }
        
        .section {
          margin-bottom: 35px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: ${brandColors.primary};
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid ${brandColors.accent};
          display: inline-block;
        }
        
        .section-content {
          font-size: 14px;
          line-height: 1.7;
        }
        
        .scope {
          background: ${brandColors.lightGray};
          border-radius: 10px;
          padding: 25px;
          margin-bottom: 25px;
          border-left: 4px solid ${brandColors.accent};
        }
        
        .scope-title {
          font-size: 20px;
          font-weight: 600;
          color: ${brandColors.primary};
          margin-bottom: 15px;
        }
        
        .scope-overview {
          font-size: 14px;
          margin-bottom: 20px;
          line-height: 1.6;
        }
        
        .roles-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .roles-table th {
          background: ${brandColors.primary};
          color: white;
          padding: 12px 15px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
        }
        
        .roles-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
        }
        
        .roles-table tr:nth-child(even) {
          background: #f9fafb;
        }
        
        .subtotal {
          text-align: right;
          font-weight: 600;
          color: ${brandColors.primary};
          font-size: 16px;
          margin-top: 15px;
          padding: 15px;
          background: white;
          border-radius: 8px;
          border: 2px solid ${brandColors.accent};
        }
        
        .deliverables, .assumptions {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin: 15px 0;
          border-left: 4px solid ${brandColors.accent};
        }
        
        .footer {
          margin-top: 60px;
          padding-top: 30px;
          border-top: 2px solid ${brandColors.accent};
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .footer-logo {
          width: 120px;
          height: auto;
          opacity: 0.8;
        }
        
        .footer-text {
          font-size: 12px;
          color: ${brandColors.text};
          opacity: 0.7;
        }
        
        @media print {
          .container { padding: 20px; }
          .project-header { break-inside: avoid; }
          .scope { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header with Logo -->
        <div class="header">
          <img src="/header-logo.png" alt="Social Garden" class="logo" />
          <div class="header-text">
            <div class="header-title">Statement of Work</div>
            <div class="header-subtitle">Professional Services Agreement</div>
          </div>
        </div>
        
        <!-- Project Header -->
        <div class="project-header">
          <div class="project-title">${data?.projectTitle || 'Untitled Project'}</div>
          <div class="project-client">Client: ${data?.clientName || 'Not specified'}</div>
        </div>
        
        <!-- Project Overview -->
        ${data?.projectOverview ? `
        <div class="section">
          <div class="section-title">Project Overview</div>
          <div class="section-content">${data.projectOverview}</div>
        </div>
        ` : ''}
        
        <!-- Project Outcomes -->
        ${data?.projectOutcomes?.length ? `
        <div class="section">
          <div class="section-title">Project Outcomes</div>
          <div class="section-content">
            ${data.projectOutcomes.map((outcome: string, index: number) => 
              `<div style="margin-bottom: 8px;">${index + 1}. ${outcome}</div>`
            ).join('')}
          </div>
        </div>
        ` : ''}
        
        <!-- Scopes -->
        ${data?.scopes?.map((scope: any, index: number) => `
        <div class="scope">
          <div class="scope-title">Scope ${index + 1}: ${scope.scopeName}</div>
          ${scope.scopeOverview ? `<div class="scope-overview">${scope.scopeOverview}</div>` : ''}
          
          ${scope.roles?.length ? `
          <table class="roles-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Hours</th>
                <th>Rate</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${scope.roles.map((role: any) => `
              <tr>
                <td>${role.name || 'Unnamed Role'}</td>
                <td>${role.hours || 0}</td>
                <td>$${role.rate || 0}</td>
                <td>$${role.total || 0}</td>
              </tr>
              `).join('')}
            </tbody>
          </table>
          ${scope.subtotal ? `<div class="subtotal">Scope Subtotal: $${scope.subtotal.toFixed(2)}</div>` : ''}
          ` : ''}
          
          ${scope.deliverables?.length ? `
          <div class="deliverables">
            <strong>Deliverables:</strong><br>
            ${scope.deliverables.join(', ')}
          </div>
          ` : ''}
          
          ${scope.assumptions?.length ? `
          <div class="assumptions">
            <strong>Assumptions:</strong><br>
            ${scope.assumptions.join(', ')}
          </div>
          ` : ''}
        </div>
        `).join('') || ''}
        
        <!-- Budget Notes -->
        ${data?.budgetNote ? `
        <div class="section">
          <div class="section-title">Budget Notes</div>
          <div class="section-content">${data.budgetNote}</div>
        </div>
        ` : ''}
        
        <!-- Footer -->
        <div class="footer">
          <img src="/footer-logo.png" alt="Social Garden" class="footer-logo" />
          <div class="footer-text">
            Generated by SOW Workbench • ${new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Create professional HTML template matching Social Garden branding
const createProfessionalHTML = (sow: SOW): string => {
  const data = sow.sowData as any;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 0.75in;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      line-height: 1.5;
      color: #333;
      background: white;
      font-size: 11px;
    }
    
    .logo-header {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .social-garden-logo {
      font-size: 36px;
      font-weight: 700;
      color: #666;
      letter-spacing: 2px;
    }
    
    .social-garden-logo .green {
      color: #20e28f;
    }
    
    .main-header {
      background: #20e28f;
      color: white;
      text-align: center;
      padding: 15px;
      margin-bottom: 20px;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
    }
    
    .project-info {
      margin-bottom: 25px;
    }
    
    .project-title {
      font-size: 18px;
      font-weight: 700;
      color: #333;
      margin-bottom: 8px;
    }
    
    .project-client {
      font-size: 14px;
      color: #666;
      margin-bottom: 15px;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 10px;
    }
    
    .items-header {
      background: #20e28f;
      color: white;
    }
    
    .items-header th {
      padding: 8px 5px;
      text-align: center;
      font-weight: 600;
      font-size: 10px;
      border: 1px solid white;
    }
    
    .items-table td {
      padding: 6px 8px;
      border: 1px solid #ddd;
      vertical-align: top;
      font-size: 9px;
      line-height: 1.4;
    }
    
    .items-table tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .section-divider {
      background: #20e28f;
      color: white;
      padding: 8px 15px;
      font-weight: 600;
      font-size: 12px;
      margin: 15px 0 10px 0;
      text-align: center;
    }
    
    .total-row {
      background: #666 !important;
      color: white;
      font-weight: bold;
    }
    
    .total-row td {
      border-color: #666;
    }
    
    .overview-section {
      background: #20e28f;
      color: white;
      text-align: center;
      padding: 12px;
      margin: 20px 0;
      font-weight: 600;
      font-size: 14px;
    }
    
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    
    .summary-table th {
      background: #20e28f;
      color: white;
      padding: 10px;
      text-align: center;
      font-weight: 600;
    }
    
    .summary-table td {
      padding: 8px;
      border: 1px solid #ddd;
      text-align: center;
      font-weight: 600;
      font-size: 12px;
    }
    
    .deliverables-section, .assumptions-section {
      background: #f8fafc;
      padding: 15px;
      margin: 15px 0;
      border-left: 4px solid #20e28f;
    }
    
    .section-heading {
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
      font-size: 12px;
    }
    
    .content-text {
      line-height: 1.6;
      font-size: 10px;
    }
    
    .footer {
      position: fixed;
      bottom: 0.5in;
      left: 0.75in;
      right: 0.75in;
      text-align: center;
      font-size: 8px;
      color: #999;
      border-top: 1px solid #ddd;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <!-- Header with Social Garden Logo -->
  <div class="logo-header">
    <div class="social-garden-logo">SOCIAL<span class="green">GARDEN</span></div>
  </div>
  
  <!-- Main Header Section -->
  <div class="main-header">
    ${data?.projectTitle || 'Marketing Automation'} | Advisory & Consultation | Services
  </div>
  
  <!-- Project Information -->
  <div class="project-info">
    <div class="project-title">${data?.projectTitle || 'Untitled Project'}</div>
    <div class="project-client">Client: ${data?.clientName || 'Not specified'}</div>
  </div>
  
  <!-- Items Table Header -->
  <table class="items-table">
    <thead class="items-header">
      <tr>
        <th style="width: 50%;">ITEMS</th>
        <th style="width: 15%;">ROLE</th>
        <th style="width: 10%;">HOURS</th>
        <th style="width: 25%;">TOTAL COST + GST</th>
      </tr>
    </thead>
    <tbody>
  
      ${data?.scopes?.map((scope: any, scopeIndex: number) => {
        let scopeRows = '';
        
        // Add scope header row
        scopeRows += `
        <tr>
          <td colspan="4" style="background: #20e28f; color: white; font-weight: 600; text-align: center; padding: 10px;">
            ${scope.scopeName}
          </td>
        </tr>`;
        
        // Add scope overview if exists
        if (scope.scopeOverview) {
          scopeRows += `
          <tr>
            <td colspan="4" style="padding: 10px; font-style: italic; background: #f8fafc;">
              ${scope.scopeOverview}
            </td>
          </tr>`;
        }
        
        // Add roles
        if (scope.roles?.length) {
          scope.roles.forEach((role: any, roleIndex: number) => {
            scopeRows += `
            <tr>
              <td>${role.description || role.name || 'Service Item'}</td>
              <td style="text-align: center;">${role.name || 'Role'}</td>
              <td style="text-align: center;">${role.hours || 0}</td>
              <td style="text-align: right;">$${(role.total || 0).toLocaleString()}</td>
            </tr>`;
          });
        }
        
        // Add deliverables
        if (scope.deliverables?.length) {
          scopeRows += `
          <tr>
            <td colspan="4" style="background: #f0f9ff; padding: 8px;">
              <strong>Deliverables:</strong><br>
              ${scope.deliverables.map((d: string) => `• ${d}`).join('<br>')}
            </td>
          </tr>`;
        }
        
        // Add assumptions
        if (scope.assumptions?.length) {
          scopeRows += `
          <tr>
            <td colspan="4" style="background: #fef7e7; padding: 8px;">
              <strong>Assumptions:</strong><br>
              ${scope.assumptions.map((a: string) => `• ${a}`).join('<br>')}
            </td>
          </tr>`;
        }
        
        return scopeRows;
      }).join('') || ''}
      
      <!-- Total Row -->
      <tr class="total-row">
        <td colspan="3" style="text-align: center; font-weight: bold;">TOTAL</td>
        <td style="text-align: right; font-weight: bold;">
          $${data?.scopes?.reduce((total: number, scope: any) => total + (scope.subtotal || 0), 0).toLocaleString() || '0'}
        </td>
      </tr>
    </tbody>
  </table>
  
  <!-- Scope & Price Overview Section -->
  <div class="overview-section">
    Scope & Price Overview
  </div>
  
  <table class="summary-table">
    <thead>
      <tr>
        <th style="width: 60%;">SCOPE</th>
        <th style="width: 20%;">ESTIMATED TOTAL HOURS</th>
        <th style="width: 20%;">TOTAL COST</th>
      </tr>
    </thead>
    <tbody>
      ${data?.scopes?.map((scope: any) => `
      <tr>
        <td style="text-align: left;">${scope.scopeName}</td>
        <td>${scope.roles?.reduce((total: number, role: any) => total + (role.hours || 0), 0) || 0}</td>
        <td>$${(scope.subtotal || 0).toLocaleString()}</td>
      </tr>
      `).join('') || ''}
      <tr style="background: #20e28f; color: white; font-weight: bold;">
        <td>TOTAL PROJECT</td>
        <td>${data?.scopes?.reduce((total: number, scope: any) => total + (scope.roles?.reduce((roleTotal: number, role: any) => roleTotal + (role.hours || 0), 0) || 0), 0) || 0}</td>
        <td>$${data?.scopes?.reduce((total: number, scope: any) => total + (scope.subtotal || 0), 0).toLocaleString() || '0'}</td>
      </tr>
    </tbody>
  </table>
  
  ${data?.projectOverview ? `
  <div class="deliverables-section">
    <div class="section-heading">Project Overview:</div>
    <div class="content-text">${data.projectOverview}</div>
  </div>
  ` : ''}
  
  ${data?.budgetNote ? `
  <div class="assumptions-section">
    <div class="section-heading">Budget Notes:</div>
    <div class="content-text">${data.budgetNote}</div>
  </div>
  ` : ''}
  
  <div class="footer">
    Social Garden • SOW Workbench • Generated ${new Date().toLocaleDateString()}
  </div>
</body>
</html>
  `;
};

export async function exportToPDF(sow: SOW): Promise<void> {
  try {
    console.log('🎨 Using NEW Weasyprint PDF export!');
    
    // Generate professional HTML
    const html = createProfessionalHTML(sow);
    console.log('📄 Generated HTML template');
    
    // Send to our API proxy (avoids CORS issues)
    console.log('🚀 Sending to PDF export API...');
    const filename = `${sow.name || 'SOW'}_Export_${new Date().toISOString().split('T')[0]}.pdf`;
    const response = await fetch('/api/export/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: html,
        filename: filename
      })
    });

    if (!response.ok) {
      console.error('❌ Weasyprint service error:', response.status, response.statusText);
      throw new Error(`Failed to generate PDF: ${response.status} ${response.statusText}`);
    }

    console.log('✅ PDF generated successfully!');

    // Download the PDF
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sow.name || 'SOW'}_Export_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('📥 PDF download initiated!');



  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
}

export function exportToXLSX(sow: SOW): void {
  try {
    const data = sow.sowData as any;
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Detailed Breakdown (matching first screenshot)
    const detailedData = [
      ['', '', '', '', '', '', ''], // Empty row for logo space
      ['', '', '', '', '', '', ''],
      ['', '', 'SOCIAL GARDEN', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['', 'Marketing Automation', 'Customer Journey Mapping', 'Services', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['ITEMS', '', '', 'ROLE', '', 'HOURS', 'TOTAL COST + GST'],
      ['', '', '', '', '', '', ''],
    ];

    // Add scope data
    if (data?.scopes && Array.isArray(data.scopes)) {
      data.scopes.forEach((scope: any, scopeIndex: number) => {
        // Scope header
        detailedData.push([scope.scopeName, '', '', '', '', '', '']);
        detailedData.push(['', '', '', '', '', '', '']);

        // Add roles for this scope
        if (scope.roles && Array.isArray(scope.roles)) {
          scope.roles.forEach((role: any) => {
            detailedData.push([
              role.description || role.name || 'Service Item',
              '', '', 
              role.name || 'Role',
              '',
              role.hours || 0,
              `$${(role.total || 0).toLocaleString()}`
            ]);
          });
        }

        // Add deliverables if exists
        if (scope.deliverables && scope.deliverables.length > 0) {
          detailedData.push(['', '', '', '', '', '', '']);
          detailedData.push(['Deliverables:', scope.deliverables.join(', '), '', '', '', '', '']);
        }

        // Add assumptions if exists
        if (scope.assumptions && scope.assumptions.length > 0) {
          detailedData.push(['', '', '', '', '', '', '']);
          detailedData.push(['Assumptions:', scope.assumptions.join(', '), '', '', '', '', '']);
        }

        detailedData.push(['', '', '', '', '', '', '']); // Spacing
      });
    }

    // Add total row
    const totalCost = data?.scopes?.reduce((total: number, scope: any) => total + (scope.subtotal || 0), 0) || 0;
    detailedData.push(['TOTAL', '', '', '', '', '', `$${totalCost.toLocaleString()}`]);

    const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
    
    // Set column widths
    detailedSheet['!cols'] = [
      { wch: 40 }, // Items column
      { wch: 10 }, // Space
      { wch: 15 }, // Space  
      { wch: 25 }, // Role column
      { wch: 5 },  // Space
      { wch: 10 }, // Hours
      { wch: 15 }  // Total cost
    ];

    XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Breakdown');

    // Sheet 2: Scope & Price Overview (matching second screenshot)
    const overviewData = [
      ['', '', '', ''], // Logo space
      ['', '', '', ''],
      ['SOCIAL GARDEN', '', '', ''],
      ['', '', '', ''],
      ['Marketing Automation | Advisory & Consultation | Services', '', '', ''],
      ['', '', '', ''],
      ['Overview:', '', '', ''],
      [data?.projectOverview || 'This scope of work details a proposed solution for Social Garden to support the client with Marketing Automation advisory and consultation services related to customer journey mapping', '', '', ''],
      ['', '', '', ''],
      ['What does the scope include?', '', '', ''],
      ['• Customer Journey Mapping', '', '', ''],
      ['', '', '', ''],
      ['Project Phases:', '', '', ''],
      ['• Discovery & Analysis', '', '', ''],
      ['• Technical Assessment & Orchestration Mapping', '', '', ''],
      ['• Final Delivery & Handover', '', '', ''],
      ['', '', '', ''],
      ['Scope & Pricing Overview', '', '', ''],
      ['', '', '', ''],
      ['PROJECT PHASES', 'TOTAL HOURS', 'AVG. HOURLY RATE', 'TOTAL COST'],
    ];

    // Add scope summary data
    if (data?.scopes && Array.isArray(data.scopes)) {
      data.scopes.forEach((scope: any) => {
        const totalHours = scope.roles?.reduce((total: number, role: any) => total + (role.hours || 0), 0) || 0;
        const avgRate = totalHours > 0 ? Math.round((scope.subtotal || 0) / totalHours) : 0;
        
        overviewData.push([
          scope.scopeName,
          totalHours.toString(),
          `$${avgRate}`,
          `$${(scope.subtotal || 0).toLocaleString()}`
        ]);
      });
    }

    // Add total row for overview
    const totalHours = data?.scopes?.reduce((total: number, scope: any) => 
      total + (scope.roles?.reduce((roleTotal: number, role: any) => roleTotal + (role.hours || 0), 0) || 0), 0) || 0;
    const totalProjectCost = data?.scopes?.reduce((total: number, scope: any) => total + (scope.subtotal || 0), 0) || 0;
    
    overviewData.push([
      'TOTAL PROJECT',
      totalHours.toString(),
      '',
      `$${totalProjectCost.toLocaleString()}`
    ]);

    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
    
    // Set column widths for overview sheet
    overviewSheet['!cols'] = [
      { wch: 40 }, // Project phases
      { wch: 15 }, // Total hours
      { wch: 15 }, // Avg hourly rate
      { wch: 15 }  // Total cost
    ];

    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Scope & Price Overview');

    // Save the workbook
    const filename = `${sow.name || 'SOW'}_SocialGarden_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);

  } catch (error) {
    console.error('Error generating XLSX:', error);
    alert('Failed to generate Excel file. Please try again.');
  }
}
