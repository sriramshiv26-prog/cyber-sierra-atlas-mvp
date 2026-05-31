import { Store, Finding } from './schema';

/**
 * Report summary statistics
 */
export interface ReportSummary {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  informational: number;
  overdue: number;
  unassigned: number;
  generatedAt: string;
}

/**
 * Build report summary from findings
 */
export function buildReportSummary(findings: Finding[]): ReportSummary {
  const now = new Date();

  return {
    total: findings.length,
    open: findings.filter(f => f.status === 'Open').length,
    inProgress: findings.filter(f => f.status === 'In Progress').length,
    closed: findings.filter(f => f.status === 'Closed' || f.status === 'Resolved').length,
    critical: findings.filter(f => f.severity === 'Critical').length,
    high: findings.filter(f => f.severity === 'High').length,
    medium: findings.filter(f => f.severity === 'Medium').length,
    low: findings.filter(f => f.severity === 'Low').length,
    informational: findings.filter(f => f.severity === 'Informational').length,
    overdue: findings.filter(f => {
      if (!f.due_date) return false;
      return new Date(f.due_date) < now && f.status !== 'Closed' && f.status !== 'Resolved';
    }).length,
    unassigned: findings.filter(f => !f.owner).length,
    generatedAt: now.toISOString(),
  };
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Generate HTML content for PDF export
 */
function generateReportHTML(store: Store, title: string = 'Security Findings Report'): string {
  const summary = buildReportSummary(store.findings);
  const date = summary.generatedAt.split('T')[0];

  // Group findings by severity
  const bySeverity = {
    Critical: store.findings.filter(f => f.severity === 'Critical'),
    High: store.findings.filter(f => f.severity === 'High'),
    Medium: store.findings.filter(f => f.severity === 'Medium'),
    Low: store.findings.filter(f => f.severity === 'Low'),
    Informational: store.findings.filter(f => f.severity === 'Informational'),
  };

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHTML(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .page { max-width: 8.5in; margin: 0 auto; padding: 40px; }
    h1 { font-size: 28px; margin-bottom: 8px; color: #1a365d; }
    .meta { color: #666; font-size: 13px; margin-bottom: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; }
    h2 { font-size: 18px; margin-top: 24px; margin-bottom: 12px; color: #1a365d; border-left: 4px solid #0284c7; padding-left: 12px; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .summary-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center; }
    .summary-label { color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
    .summary-value { font-size: 20px; font-weight: bold; color: #1a365d; }
    .severity-section { margin-bottom: 24px; page-break-inside: avoid; }
    .severity-header { background: #f1f5f9; padding: 8px 12px; border-left: 4px solid #666; margin-bottom: 12px; font-weight: 600; }
    .severity-critical .severity-header { border-left-color: #dc2626; background: #fef2f2; }
    .severity-high .severity-header { border-left-color: #ea580c; background: #fff7ed; }
    .severity-medium .severity-header { border-left-color: #f59e0b; background: #fffbeb; }
    .severity-low .severity-header { border-left-color: #22c55e; background: #f0fdf4; }
    .finding { border: 1px solid #e5e7eb; border-radius: 4px; padding: 12px; margin-bottom: 8px; page-break-inside: avoid; }
    .finding-title { font-weight: 600; margin-bottom: 4px; color: #1e293b; }
    .finding-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; font-size: 12px; margin-top: 8px; color: #64748b; }
    .finding-meta > div { }
    .finding-meta label { display: block; font-weight: 600; color: #475569; margin-bottom: 2px; }
    .finding-desc { font-size: 13px; color: #475569; margin-top: 8px; line-height: 1.4; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #666; text-align: center; }
    @media print { body { padding: 0; } .page { max-width: 100%; padding: 20px; } }
  </style>
</head>
<body>
  <div class="page">
    <h1>${escapeHTML(title)}</h1>
    <div class="meta">Generated on ${date}</div>

    <h2>Executive Summary</h2>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-label">Total Findings</div>
        <div class="summary-value">${summary.total}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Critical</div>
        <div class="summary-value">${summary.critical}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Open</div>
        <div class="summary-value">${summary.open}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">High Severity</div>
        <div class="summary-value">${summary.high}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">In Progress</div>
        <div class="summary-value">${summary.inProgress}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Overdue</div>
        <div class="summary-value">${summary.overdue}</div>
      </div>
    </div>

    <h2>Findings by Severity</h2>
`;

  Object.entries(bySeverity).forEach(([severity, findings]) => {
    if (findings.length === 0) return;

    const severityClass = `severity-${severity.toLowerCase()}`;
    html += `<div class="severity-section ${severityClass}">
      <div class="severity-header">${escapeHTML(severity)} Severity (${findings.length})</div>
`;

    findings.forEach(finding => {
      html += `
      <div class="finding">
        <div class="finding-title">${escapeHTML(finding.title)}</div>
        <div class="finding-meta">
          <div><label>Asset</label>${escapeHTML(finding.asset_name)}</div>
          <div><label>Status</label>${escapeHTML(finding.status)}</div>
          <div><label>Framework</label>${escapeHTML(finding.control_framework)}</div>
          <div><label>Owner</label>${escapeHTML(finding.owner || 'Unassigned')}</div>
        </div>
        ${finding.description ? `<div class="finding-desc">${escapeHTML(finding.description)}</div>` : ''}
      </div>
`;
    });

    html += `</div>`;
  });

  html += `
    <div class="footer">
      <p>This report was automatically generated by Cyber Sierra Atlas.</p>
    </div>
  </div>
</body>
</html>
`;

  return html;
}

/**
 * Generate PDF report from store
 * Returns a Blob with application/pdf MIME type
 */
export async function generatePDFReport(
  store: Store,
  title: string = 'Security Findings Report'
): Promise<Blob> {
  // Dynamically import html2pdf to keep bundle lighter
  const html2pdf = (await import('html2pdf.js')).default;

  const html = generateReportHTML(store, title);

  return new Promise((resolve, reject) => {
    try {
      const element = document.createElement('div');
      // Use textContent where safe, build structure manually
      const wrapper = document.createElement('html');
      wrapper.lang = 'en';

      const opt = {
        margin: 10,
        filename: `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      html2pdf().set(opt).from(html, 'string').toPdf().get('pdf').then((pdf: any) => {
        pdf.save(opt.filename);
        const dataUrl = pdf.output('dataurlstring');
        const blobData = atob(dataUrl.replace(/^data:application\/pdf;base64,/, ''));
        const array = new Uint8Array(blobData.length);
        for (let i = 0; i < blobData.length; i++) {
          array[i] = blobData.charCodeAt(i);
        }
        resolve(new Blob([array], { type: 'application/pdf' }));
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Excel report from store
 * Returns a Blob with application/vnd.openxmlformats-officedocument.spreadsheetml.sheet MIME type
 */
export async function generateExcelReport(store: Store): Promise<Blob> {
  // Dynamically import XLSX to keep bundle lighter
  const XLSX = (await import('xlsx')).default;

  const summary = buildReportSummary(store.findings);
  const date = summary.generatedAt.split('T')[0];

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['Security Findings Report', ''],
    ['Generated', date],
    ['', ''],
    ['Metric', 'Count'],
    ['Total Findings', summary.total],
    ['Critical', summary.critical],
    ['High', summary.high],
    ['Medium', summary.medium],
    ['Low', summary.low],
    ['Informational', summary.informational],
    ['', ''],
    ['Status', 'Count'],
    ['Open', summary.open],
    ['In Progress', summary.inProgress],
    ['Closed', summary.closed],
    ['', ''],
    ['Other', 'Count'],
    ['Overdue', summary.overdue],
    ['Unassigned', summary.unassigned],
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 20 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  // Findings sheet
  const findingsData = [
    ['ID', 'Title', 'Severity', 'Status', 'Asset', 'Framework', 'Control', 'Owner', 'Due Date', 'Description'],
    ...store.findings.map(f => [
      f.id,
      f.title,
      f.severity,
      f.status,
      f.asset_name,
      f.control_framework,
      f.control_clause,
      f.owner || '',
      f.due_date ? new Date(f.due_date).toLocaleDateString() : '',
      f.description,
    ]),
  ];

  const findingsWs = XLSX.utils.aoa_to_sheet(findingsData);
  findingsWs['!cols'] = [
    { wch: 15 },
    { wch: 25 },
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, findingsWs, 'Findings');

  // Write to file and return as Blob
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
