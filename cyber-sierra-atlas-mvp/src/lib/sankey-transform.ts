import { Finding } from './schema';

const STATUS_ORDER = ['open', 'in_progress', 'scheduled', 'closed'];
const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  scheduled: 'Scheduled',
  closed: 'Closed',
};

export interface SankeyNode {
  name: string;
  value?: number;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
  stroke?: string;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export function countByStatus(findings: Finding[]): Record<string, number> {
  const counts = {
    open: 0,
    in_progress: 0,
    scheduled: 0,
    closed: 0,
  };

  findings.forEach(finding => {
    const status = finding.remediation_status || 'open';
    if (status in counts) {
      counts[status as keyof typeof counts]++;
    }
  });

  return counts;
}

export function countBySeverity(findings: Finding[]): Record<string, number> {
  const counts = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Informational: 0,
  };

  findings.forEach(finding => {
    const severity = finding.severity || 'Medium';
    if (severity in counts) {
      counts[severity as keyof typeof counts]++;
    }
  });

  return counts;
}

export function buildSankeyData(findings: Finding[]): SankeyData {
  const nodes: SankeyNode[] = STATUS_ORDER.map(status => ({
    name: STATUS_LABELS[status],
  }));

  const links: SankeyLink[] = [];

  // Build flow from each status to the next
  const counts = countByStatus(findings);

  for (let i = 0; i < STATUS_ORDER.length - 1; i++) {
    const currentStatus = STATUS_ORDER[i];
    const nextStatus = STATUS_ORDER[i + 1];
    const flowCount = Math.min(counts[currentStatus] || 0, 10); // Cap at 10 for visualization

    if (flowCount > 0) {
      links.push({
        source: i,
        target: i + 1,
        value: flowCount,
        stroke: getStatusColor(currentStatus),
      });
    }
  }

  return { nodes, links };
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: '#DC2626', // Red
    in_progress: '#F59E0B', // Amber
    scheduled: '#3B82F6', // Blue
    closed: '#10B981', // Green
  };
  return colors[status] || '#6B7280';
}

export function buildSeverityDistribution(findings: Finding[]): Array<{ name: string; value: number; color: string }> {
  const counts = countBySeverity(findings);
  const colors: Record<string, string> = {
    Critical: '#DC2626',
    High: '#EA580C',
    Medium: '#2563EB',
    Low: '#16A34A',
    Informational: '#6B7280',
  };

  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([severity, count]) => ({
      name: severity,
      value: count,
      color: colors[severity] || '#6B7280',
    }));
}

export function getRemediationVelocity(findings: Finding[]): {
  openCount: number;
  closedCount: number;
  inProgressCount: number;
  closureRate: number;
} {
  const counts = countByStatus(findings);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const closureRate = total > 0 ? Math.round((counts.closed / total) * 100) : 0;

  return {
    openCount: counts.open,
    closedCount: counts.closed,
    inProgressCount: counts.in_progress + counts.scheduled,
    closureRate,
  };
}
