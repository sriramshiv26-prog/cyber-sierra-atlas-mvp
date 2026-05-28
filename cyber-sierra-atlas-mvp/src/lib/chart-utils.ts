import { Finding } from './schema';

export interface AgeBracket {
  label: string;
  minDays: number;
  maxDays: number;
  color: string;
}

export const AGE_BRACKETS: AgeBracket[] = [
  { label: '0-7d', minDays: 0, maxDays: 7, color: '#16a766' },
  { label: '8-14d', minDays: 8, maxDays: 14, color: '#84d791' },
  { label: '15-30d', minDays: 15, maxDays: 30, color: '#f0995f' },
  { label: '30-60d', minDays: 30, maxDays: 60, color: '#e5733a' },
  { label: '60+d', minDays: 60, maxDays: Infinity, color: '#C9432B' },
];

export const SEVERITY_LEVELS = ['Critical', 'High', 'Medium', 'Low', 'Informational'];

export function getAgeBracket(dueDate: string | null | undefined): string | null {
  if (!dueDate) return null;

  const due = new Date(dueDate);
  const now = new Date();
  const ageMs = now.getTime() - due.getTime();
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

  const bracket = AGE_BRACKETS.find(b => ageDays >= b.minDays && ageDays <= b.maxDays);
  return bracket ? bracket.label : null;
}

export function getColorForAge(ageBracket: string | null): string {
  if (!ageBracket) return '#999999';
  const bracket = AGE_BRACKETS.find(b => b.label === ageBracket);
  return bracket ? bracket.color : '#999999';
}

export interface HeatMapCell {
  severity: string;
  age: string;
  count: number;
  color: string;
}

export function buildSeverityAgeHeatMap(findings: Finding[]): HeatMapCell[] {
  const matrix: Record<string, Record<string, number>> = {};

  SEVERITY_LEVELS.forEach(severity => {
    matrix[severity] = {};
    AGE_BRACKETS.forEach(bracket => {
      matrix[severity][bracket.label] = 0;
    });
  });

  findings.forEach(f => {
    const age = getAgeBracket(f.due_date);
    if (age && matrix[f.severity]) {
      matrix[f.severity][age]++;
    }
  });

  const result: HeatMapCell[] = [];
  SEVERITY_LEVELS.forEach(severity => {
    AGE_BRACKETS.forEach(bracket => {
      const count = matrix[severity][bracket.label] || 0;
      result.push({
        severity,
        age: bracket.label,
        count,
        color: count === 0 ? '#f3f4f6' : bracket.color,
      });
    });
  });

  return result;
}

export interface RadarDimension {
  name: string;
  value: number;
  color: string;
}

export interface AssetRiskProfile {
  assetName: string;
  assetId: string;
  totalRiskScore: number;
  dimensions: RadarDimension[];
}

export function buildAssetRiskProfiles(findings: Finding[]): AssetRiskProfile[] {
  const assetMap: Record<string, Finding[]> = {};

  findings.forEach(f => {
    if (!assetMap[f.asset_id]) {
      assetMap[f.asset_id] = [];
    }
    assetMap[f.asset_id].push(f);
  });

  const profiles = Object.entries(assetMap).map(([assetId, assetFindings]) => {
    const assetName = assetFindings[0]?.asset_name || assetId;

    const findingCount = assetFindings.length;
    const maxFindings = Math.max(1, ...Object.values(assetMap).map(arr => arr.length));
    const vulnerabilityCountScore = (findingCount / maxFindings) * 100;

    const severityScore = assetFindings.reduce((sum, f) => {
      const weights: Record<string, number> = {
        Critical: 5,
        High: 4,
        Medium: 3,
        Low: 2,
        Informational: 1,
      };
      return sum + (weights[f.severity] || 0);
    }, 0);
    const maxSeverityScore = assetFindings.length * 5;
    const avgSeverityScore = (severityScore / maxSeverityScore) * 100;

    const openCount = assetFindings.filter(f => f.status === 'Open').length;
    const openScore = (openCount / Math.max(1, assetFindings.length)) * 100;

    const overdueCount = assetFindings.filter(f =>
      f.due_date && new Date(f.due_date) < new Date() && f.status !== 'Closed' && f.status !== 'Resolved'
    ).length;
    const overdueScore = (overdueCount / Math.max(1, assetFindings.length)) * 100;

    const avgControlEffectiveness = assetFindings.reduce((sum, f) => {
      return sum + ((f.control_effectiveness || 1) || 1);
    }, 0) / assetFindings.length;
    const controlScore = (1 - avgControlEffectiveness) * 100;

    const totalRiskScore =
      (vulnerabilityCountScore + avgSeverityScore + openScore + overdueScore + controlScore) / 5;

    const dimensions: RadarDimension[] = [
      {
        name: 'Vulnerability Count',
        value: Math.round(vulnerabilityCountScore),
        color: '#C9432B',
      },
      {
        name: 'Avg Severity',
        value: Math.round(avgSeverityScore),
        color: '#E5733A',
      },
      {
        name: 'Open Findings',
        value: Math.round(openScore),
        color: '#F0995F',
      },
      {
        name: 'Overdue Items',
        value: Math.round(overdueScore),
        color: '#FF8C42',
      },
      {
        name: 'Control Weakness',
        value: Math.round(controlScore),
        color: '#A74623',
      },
    ];

    return {
      assetName,
      assetId,
      totalRiskScore,
      dimensions,
    };
  });

  return profiles
    .sort((a, b) => b.totalRiskScore - a.totalRiskScore)
    .slice(0, 5);
}
