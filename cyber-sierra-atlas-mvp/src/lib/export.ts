import { Store, Finding } from './schema';

/**
 * Export findings as CSV format
 */
export function exportFindingsAsCSV(findings: Finding[]): string {
  const headers = [
    'ID',
    'Title',
    'Severity',
    'Status',
    'Asset',
    'Framework',
    'Control',
    'CVE',
    'Owner',
    'Due Date',
    'Description'
  ];

  const rows = findings.map(f => [
    f.id,
    `"${f.title.replace(/"/g, '""')}"`,
    f.severity,
    f.status,
    `"${f.asset_name.replace(/"/g, '""')}"`,
    f.control_framework,
    f.control_clause,
    f.cve || '',
    f.owner || '',
    f.due_date || '',
    `"${(f.description || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Export full store as JSON
 */
export function exportStoreAsJSON(store: Store): string {
  return JSON.stringify(store, null, 2);
}

/**
 * Export findings as Markdown report
 */
export function exportFindingsAsMarkdown(findings: Finding[], title: string = 'Security Findings Report'): string {
  const date = new Date().toISOString().split('T')[0];
  const lines: string[] = [];

  lines.push(`# ${title}`);
  lines.push(`*Generated: ${date}*\n`);
  lines.push(`## Summary`);
  lines.push(`- Total Findings: ${findings.length}`);
  lines.push(`- Critical: ${findings.filter(f => f.severity === 'Critical').length}`);
  lines.push(`- High: ${findings.filter(f => f.severity === 'High').length}`);
  lines.push(`- Medium: ${findings.filter(f => f.severity === 'Medium').length}`);
  lines.push(`- Low: ${findings.filter(f => f.severity === 'Low').length}\n`);

  // Findings by severity
  const bySeverity = {
    Critical: findings.filter(f => f.severity === 'Critical'),
    High: findings.filter(f => f.severity === 'High'),
    Medium: findings.filter(f => f.severity === 'Medium'),
    Low: findings.filter(f => f.severity === 'Low'),
    Informational: findings.filter(f => f.severity === 'Informational'),
  };

  Object.entries(bySeverity).forEach(([severity, items]) => {
    if (items.length === 0) return;

    lines.push(`## ${severity} Severity (${items.length})`);
    items.forEach(f => {
      lines.push(`\n### ${f.title}`);
      lines.push(`- **Status**: ${f.status}`);
      lines.push(`- **Asset**: ${f.asset_name}`);
      lines.push(`- **Framework**: ${f.control_framework} / ${f.control_clause}`);
      if (f.cve) lines.push(`- **CVE**: ${f.cve}`);
      if (f.owner) lines.push(`- **Owner**: ${f.owner}`);
      if (f.due_date) lines.push(`- **Due Date**: ${f.due_date}`);
      lines.push(`\n${f.description}`);
      if (f.remediation_notes) lines.push(`\n**Remediation Notes**: ${f.remediation_notes}`);
    });
  });

  return lines.join('\n');
}

/**
 * Trigger file download
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const element = document.createElement('a');
  element.setAttribute('href', `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
