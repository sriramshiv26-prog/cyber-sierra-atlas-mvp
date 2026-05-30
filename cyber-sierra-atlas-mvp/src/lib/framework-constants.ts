export const FRAMEWORKS = {
  ISO27001: {
    name: 'ISO 27001:2022',
    id: 'iso27001',
    controlCount: 14,
    domains: [
      { id: 'A.5', name: 'Organizational Controls', count: 4 },
      { id: 'A.6', name: 'People Controls', count: 5 },
      { id: 'A.7', name: 'Physical Controls', count: 2 },
      { id: 'A.8', name: 'Technical Controls', count: 3 },
    ],
  },
  NIST_CSF: {
    name: 'NIST Cybersecurity Framework',
    id: 'nist_csf',
    controlCount: 5,
    domains: [
      { id: 'Identify', name: 'Asset Management', count: 2 },
      { id: 'Protect', name: 'Access Control', count: 2 },
      { id: 'Detect', name: 'Threat Detection', count: 1 },
      { id: 'Respond', name: 'Incident Response', count: 0 },
      { id: 'Recover', name: 'Recovery Planning', count: 0 },
    ],
  },
  CIS_CONTROLS: {
    name: 'CIS Critical Security Controls v8',
    id: 'cis_controls',
    controlCount: 6,
    domains: [
      { id: 'IG1', name: 'Basic', count: 2 },
      { id: 'IG2', name: 'Foundational', count: 2 },
      { id: 'IG3', name: 'Optimized', count: 2 },
    ],
  },
};

export const FRAMEWORK_CONTROL_MAP: Record<string, string[]> = {
  iso27001: ['A.5.1', 'A.5.2', 'A.5.3', 'A.5.4', 'A.6.1', 'A.6.2', 'A.6.3', 'A.6.4', 'A.6.5', 'A.7.1', 'A.7.2', 'A.8.1', 'A.8.2', 'A.8.3'],
  nist_csf: ['ID-AM', 'ID-IM', 'PR-AC', 'PR-AT', 'DE-AE'],
  cis_controls: ['1.1', '1.2', '2.1', '2.2', '3.1', '3.2'],
};

export const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#DC2626',  // Red
  High: '#EA580C',      // Orange
  Medium: '#2563EB',    // Blue
  Low: '#16A34A',       // Green
  Informational: '#6B7280', // Gray
};

export const FRAMEWORK_IDS = ['iso27001', 'nist_csf', 'cis_controls'] as const;
export type FrameworkId = typeof FRAMEWORK_IDS[number];

export function getFrameworkName(id: string): string {
  const frameworks = Object.values(FRAMEWORKS);
  return frameworks.find(f => f.id === id)?.name || 'Unknown Framework';
}

export function getFrameworkControls(id: string): string[] {
  return FRAMEWORK_CONTROL_MAP[id] || [];
}
