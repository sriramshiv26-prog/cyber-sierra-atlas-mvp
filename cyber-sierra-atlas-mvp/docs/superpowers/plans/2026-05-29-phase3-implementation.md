# Phase 3 Implementation Plan: Compliance Heat Map + Remediation Sankey

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Framework Compliance Heat Map and Remediation Flow Sankey Diagram for operational compliance and remediation velocity tracking.

**Architecture:** 
- Framework mapping algorithm (static 3 frameworks: ISO 27001, NIST CSF, CIS Controls)
- Sankey transform algorithm (finding counts by remediation status)
- Two new React components integrated into dashboard
- TDD approach: tests first, then implementation

**Tech Stack:** React 18, TypeScript, Recharts (Sankey), Tailwind, localStorage persistence

---

## Task 1: Schema Updates - Framework Controls + Remediation Status

**Files:**
- Modify: `src/lib/schema.ts`

- [ ] **Step 1: Add framework_controls field to Finding interface**

```typescript
// In src/lib/schema.ts, add to Finding interface:
export interface Finding {
  // ... existing fields ...
  framework_controls?: string[];  // e.g., ['ISO27001_A.5.1', 'NIST_AC-2', 'CIS_5.1']
}
```

- [ ] **Step 2: Add remediation_status field to Finding interface**

```typescript
// Add to Finding interface:
export interface Finding {
  // ... existing fields ...
  remediation_status?: 'open' | 'in_progress' | 'scheduled' | 'closed';  // default: 'open'
}
```

- [ ] **Step 3: Update schema comment documenting new fields**

```typescript
// Add comment before new fields:
// Phase 3 additions: framework compliance tracking and remediation workflow status
```

- [ ] **Step 4: Commit schema changes**

```bash
git add src/lib/schema.ts
git commit -m "schema: Add Phase 3 fields (framework_controls, remediation_status)"
```

---

## Task 2: Framework Constants - Define 3 Compliance Frameworks

**Files:**
- Create: `src/lib/framework-constants.ts`

- [ ] **Step 1: Create framework constants file with all frameworks and controls**

```typescript
// src/lib/framework-constants.ts

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

export const FRAMEWORK_CONTROL_MAP = {
  // Framework ID → array of control IDs
  iso27001: ['A.5.1', 'A.5.2', 'A.5.3', 'A.5.4', 'A.6.1', 'A.6.2', 'A.6.3', 'A.6.4', 'A.6.5', 'A.7.1', 'A.7.2', 'A.8.1', 'A.8.2', 'A.8.3'],
  nist_csf: ['ID-AM', 'ID-IM', 'PR-AC', 'PR-AT', 'DE-AE'],
  cis_controls: ['1.1', '1.2', '2.1', '2.2', '3.1', '3.2'],
};

export const SEVERITY_COLORS = {
  critical: '#DC2626',  // Red
  high: '#EA580C',      // Orange
  medium: '#2563EB',    // Blue
  low: '#16A34A',       // Green
};
```

- [ ] **Step 2: Commit constants**

```bash
git add src/lib/framework-constants.ts
git commit -m "feat: Add framework definitions (ISO 27001, NIST CSF, CIS Controls)"
```

---

## Task 3: Framework Mapping Algorithm - Finding to Control Mapping

**Files:**
- Create: `src/lib/framework-mapping.ts`
- Create: `src/lib/framework-mapping.test.ts`

- [ ] **Step 1: Write failing test for framework mapping**

```typescript
// src/lib/framework-mapping.test.ts

import { mapFindingToControls, calculateFrameworkCoverage } from './framework-mapping';
import { Finding } from './schema';

describe('Framework Mapping', () => {
  const mockFinding: Finding = {
    id: '1',
    title: 'Missing MFA on admin accounts',
    severity: 'high',
    finding_type: 'Access Control',
  };

  test('mapFindingToControls returns array of control IDs', () => {
    const result = mapFindingToControls(mockFinding, 'iso27001');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('mapFindingToControls returns empty array for unrelated findings', () => {
    const unrelatedFinding: Finding = { ...mockFinding, finding_type: 'Unknown Type' };
    const result = mapFindingToControls(unrelatedFinding, 'iso27001');
    expect(result).toEqual([]);
  });

  test('calculateFrameworkCoverage returns percentage 0-100', () => {
    const findings = [mockFinding, { ...mockFinding, id: '2' }];
    const coverage = calculateFrameworkCoverage(findings, 'iso27001');
    expect(coverage).toBeGreaterThanOrEqual(0);
    expect(coverage).toBeLessThanOrEqual(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/lib/framework-mapping.test.ts
```

Expected: FAIL with "module not found"

- [ ] **Step 3: Implement framework mapping algorithm**

```typescript
// src/lib/framework-mapping.ts

import { Finding } from './schema';
import { FRAMEWORK_CONTROL_MAP } from './framework-constants';

// Map finding types to control IDs
const FINDING_TYPE_TO_CONTROLS: Record<string, Record<string, string[]>> = {
  iso27001: {
    'Access Control': ['A.6.1', 'A.6.2'],
    'Authentication': ['A.6.2'],
    'Password Policy': ['A.6.3'],
    'Encryption': ['A.8.1', 'A.8.2'],
    'Patch Management': ['A.8.3'],
    'Asset Management': ['A.5.1', 'A.5.2'],
    'Configuration': ['A.5.3'],
    'Data Protection': ['A.8.2'],
    'Vulnerability Management': ['A.8.3'],
  },
  nist_csf: {
    'Access Control': ['ID-AM', 'PR-AC'],
    'Authentication': ['PR-AC'],
    'Asset Management': ['ID-AM'],
    'Vulnerability Management': ['ID-IM'],
    'Patch Management': ['PR-AT'],
  },
  cis_controls: {
    'Access Control': ['2.1', '2.2'],
    'Authentication': ['2.1'],
    'Asset Management': ['1.1'],
    'Inventory': ['1.1', '1.2'],
    'Patch Management': ['3.1', '3.2'],
  },
};

export function mapFindingToControls(
  finding: Finding,
  frameworkId: 'iso27001' | 'nist_csf' | 'cis_controls'
): string[] {
  if (!finding.finding_type) return [];
  
  const typeToControls = FINDING_TYPE_TO_CONTROLS[frameworkId];
  if (!typeToControls) return [];
  
  const controls = typeToControls[finding.finding_type] || [];
  return controls;
}

export function calculateFrameworkCoverage(
  findings: Finding[],
  frameworkId: 'iso27001' | 'nist_csf' | 'cis_controls'
): number {
  const frameworkControls = FRAMEWORK_CONTROL_MAP[frameworkId] || [];
  if (frameworkControls.length === 0) return 0;

  const coveredControls = new Set<string>();
  findings.forEach(finding => {
    mapFindingToControls(finding, frameworkId).forEach(control => {
      coveredControls.add(control);
    });
  });

  return Math.round((coveredControls.size / frameworkControls.length) * 100);
}

export function getFrameworkGaps(
  findings: Finding[],
  frameworkId: 'iso27001' | 'nist_csf' | 'cis_controls'
): string[] {
  const frameworkControls = FRAMEWORK_CONTROL_MAP[frameworkId] || [];
  const coveredControls = new Set<string>();
  
  findings.forEach(finding => {
    mapFindingToControls(finding, frameworkId).forEach(control => {
      coveredControls.add(control);
    });
  });

  return frameworkControls.filter(control => !coveredControls.has(control));
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/lib/framework-mapping.test.ts
```

Expected: PASS (3/3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/framework-mapping.ts src/lib/framework-mapping.test.ts
git commit -m "feat: Implement framework mapping algorithm for control detection"
```

---

## Task 4: Store Actions - Update Remediation Status

**Files:**
- Modify: `src/hooks/useStore.tsx`

- [ ] **Step 1: Add remediation status action type to StoreAction union**

```typescript
// In src/hooks/useStore.tsx, add to StoreAction type:
| {
    type: 'UPDATE_REMEDIATION_STATUS';
    findingId: string;
    status: 'open' | 'in_progress' | 'scheduled' | 'closed';
  }
```

- [ ] **Step 2: Implement reducer case**

```typescript
// Add to reducer function:
case 'UPDATE_REMEDIATION_STATUS': {
  const newFindings = state.findings.map(f =>
    f.id === action.findingId
      ? { ...f, remediation_status: action.status }
      : f
  );
  return {
    ...state,
    findings: newFindings,
    lastSaved: new Date().toISOString(),
  };
}
```

- [ ] **Step 3: Add action helper export**

```typescript
// Add to exported helpers:
export const updateRemediationStatus = (
  dispatch: Dispatch<StoreAction>,
  findingId: string,
  status: 'open' | 'in_progress' | 'scheduled' | 'closed'
) => {
  dispatch({ type: 'UPDATE_REMEDIATION_STATUS', findingId, status });
};
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useStore.tsx
git commit -m "feat: Add remediation status update action to store"
```

---

## Task 5: Sankey Transform Algorithm - Build Remediation Flow Data

**Files:**
- Create: `src/lib/sankey-transform.ts`
- Create: `src/lib/sankey-transform.test.ts`

- [ ] **Step 1: Write failing test for Sankey data transform**

```typescript
// src/lib/sankey-transform.test.ts

import { buildSankeyData, countByStatus } from './sankey-transform';
import { Finding } from './schema';

describe('Sankey Transform', () => {
  const mockFindings: Finding[] = [
    { id: '1', title: 'Finding 1', severity: 'high', remediation_status: 'open' },
    { id: '2', title: 'Finding 2', severity: 'medium', remediation_status: 'open' },
    { id: '3', title: 'Finding 3', severity: 'high', remediation_status: 'in_progress' },
    { id: '4', title: 'Finding 4', severity: 'low', remediation_status: 'scheduled' },
    { id: '5', title: 'Finding 5', severity: 'critical', remediation_status: 'closed' },
  ];

  test('countByStatus returns correct counts', () => {
    const counts = countByStatus(mockFindings);
    expect(counts.open).toBe(2);
    expect(counts.in_progress).toBe(1);
    expect(counts.scheduled).toBe(1);
    expect(counts.closed).toBe(1);
  });

  test('buildSankeyData returns valid Sankey structure', () => {
    const data = buildSankeyData(mockFindings);
    expect(data.nodes).toHaveLength(4);
    expect(data.links).toBeDefined();
    expect(Array.isArray(data.links)).toBe(true);
  });

  test('buildSankeyData nodes are in correct order', () => {
    const data = buildSankeyData(mockFindings);
    expect(data.nodes[0].name).toBe('Open');
    expect(data.nodes[3].name).toBe('Closed');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/lib/sankey-transform.test.ts
```

Expected: FAIL with "module not found"

- [ ] **Step 3: Implement Sankey transform algorithm**

```typescript
// src/lib/sankey-transform.ts

import { Finding } from './schema';

const STATUS_ORDER = ['open', 'in_progress', 'scheduled', 'closed'];
const STATUS_LABELS = {
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
  source: number;  // node index
  target: number;  // node index
  value: number;   // count
  stroke?: string; // color
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
    counts[status as keyof typeof counts]++;
  });

  return counts;
}

export function buildSankeyData(findings: Finding[]): SankeyData {
  const nodes: SankeyNode[] = STATUS_ORDER.map(status => ({
    name: STATUS_LABELS[status as keyof typeof STATUS_LABELS],
  }));

  const links: SankeyLink[] = [];
  
  // For now, assume linear flow: open → in_progress → scheduled → closed
  for (let i = 0; i < STATUS_ORDER.length - 1; i++) {
    const currentStatus = STATUS_ORDER[i];
    const nextStatus = STATUS_ORDER[i + 1];
    
    const findingsInCurrent = findings.filter(f => (f.remediation_status || 'open') === currentStatus);
    const countMoving = Math.max(1, Math.floor(findingsInCurrent.length * 0.3));
    
    links.push({
      source: i,
      target: i + 1,
      value: countMoving,
    });
  }

  return { nodes, links };
}

export function buildSankeyDataBySeverity(
  findings: Finding[]
): SankeyData {
  // Extended version that colors flows by severity
  const severityColors: Record<string, string> = {
    critical: '#DC2626',
    high: '#EA580C',
    medium: '#2563EB',
    low: '#16A34A',
  };

  const data = buildSankeyData(findings);
  
  // Color links by average severity of findings in transition
  data.links = data.links.map(link => {
    const sourceStatus = STATUS_ORDER[link.source];
    const findingsInSource = findings.filter(f => (f.remediation_status || 'open') === sourceStatus);
    const avgSeverity = findingsInSource.length > 0
      ? findingsInSource.reduce((sum, f) => sum + (f.severity === 'critical' ? 4 : f.severity === 'high' ? 3 : f.severity === 'medium' ? 2 : 1), 0) / findingsInSource.length
      : 2;
    
    const color = avgSeverity >= 3.5 ? severityColors.critical : avgSeverity >= 2.5 ? severityColors.high : avgSeverity >= 1.5 ? severityColors.medium : severityColors.low;
    
    return { ...link, stroke: color };
  });

  return data;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/lib/sankey-transform.test.ts
```

Expected: PASS (4/4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/sankey-transform.ts src/lib/sankey-transform.test.ts
git commit -m "feat: Implement Sankey data transform for remediation flow visualization"
```

---

## Task 6: Framework Compliance Heat Map Component

**Files:**
- Create: `src/components/ComplianceHeatMap.jsx`

- [ ] **Step 1: Create heat map component**

```jsx
// src/components/ComplianceHeatMap.jsx

import React, { useMemo } from 'react';
import { FRAMEWORKS, FRAMEWORK_CONTROL_MAP } from '../lib/framework-constants';
import { calculateFrameworkCoverage, getFrameworkGaps } from '../lib/framework-mapping';

export default function ComplianceHeatMap({ findings, selectedFramework = 'iso27001' }) {
  const coverage = useMemo(() => {
    if (!findings || findings.length === 0) return 0;
    return calculateFrameworkCoverage(findings, selectedFramework);
  }, [findings, selectedFramework]);

  const framework = FRAMEWORKS[selectedFramework.toUpperCase().replace('_', '')];
  const controls = FRAMEWORK_CONTROL_MAP[selectedFramework] || [];

  const getCoverageColor = (pct) => {
    if (pct >= 66) return 'bg-green-100 dark:bg-green-900/20';
    if (pct >= 33) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const getCoverageText = (pct) => {
    if (pct >= 66) return 'text-green-700 dark:text-green-300';
    if (pct >= 33) return 'text-yellow-700 dark:text-yellow-300';
    return 'text-red-700 dark:text-red-300';
  };

  if (!findings || findings.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No findings to analyze
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {framework?.name || selectedFramework} Coverage
        </h3>
        <div className={`text-2xl font-bold ${getCoverageText(coverage)}`}>
          {coverage}%
        </div>
      </div>

      <div className={`p-3 rounded mb-4 ${getCoverageColor(coverage)}`}>
        <p className="text-sm">
          {coverage >= 66
            ? '✓ Good coverage'
            : coverage >= 33
            ? '⚠ Partial coverage'
            : '✗ Limited coverage'}
          — {controls.length} controls, {findings.length} findings
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {framework?.domains?.map(domain => (
          <div
            key={domain.id}
            className="p-3 border border-gray-200 dark:border-gray-700 rounded text-sm"
          >
            <div className="font-medium text-gray-700 dark:text-gray-300">{domain.id}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{domain.name}</div>
            <div className="text-lg font-semibold mt-1 text-blue-600 dark:text-blue-400">
              {domain.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Test component renders**

```bash
npm test -- src/components/ComplianceHeatMap
```

Expected: Component renders without errors

- [ ] **Step 3: Commit**

```bash
git add src/components/ComplianceHeatMap.jsx
git commit -m "feat: Create Framework Compliance Heat Map component"
```

---

## Task 7: Remediation Sankey Diagram Component

**Files:**
- Create: `src/components/RemediationSankey.jsx`

- [ ] **Step 1: Create Sankey diagram component**

```jsx
// src/components/RemediationSankey.jsx

import React, { useMemo } from 'react';
import { Sankey, Sink, Source, Link as SankeyLink, Node, Tooltip } from 'recharts';
import { buildSankeyDataBySeverity } from '../lib/sankey-transform';

export default function RemediationSankey({ findings }) {
  const sankeyData = useMemo(() => {
    if (!findings || findings.length === 0) {
      return { nodes: [], links: [] };
    }
    return buildSankeyDataBySeverity(findings);
  }, [findings]);

  const CustomNode = (props) => {
    const { x, y, width, height, index, payload } = props;
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="#3B82F6"
          className="dark:fill-blue-700"
          fillOpacity={0.8}
        />
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={12}
          fontWeight="bold"
        >
          {payload.name}
        </text>
      </g>
    );
  };

  if (!findings || findings.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No remediation data available
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Remediation Flow
      </h3>
      <div className="overflow-x-auto">
        <Sankey
          width={600}
          height={300}
          data={sankeyData}
          node={<CustomNode />}
          link={{ strokeOpacity: 0.5, stroke: '#8884d8' }}
          nodePadding={50}
        >
          <Tooltip />
        </Sankey>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Test component renders**

```bash
npm test -- src/components/RemediationSankey
```

Expected: Component renders without errors

- [ ] **Step 3: Commit**

```bash
git add src/components/RemediationSankey.jsx
git commit -m "feat: Create Remediation Sankey Diagram component"
```

---

## Task 8: Dashboard Integration - Add Heat Map and Sankey

**Files:**
- Modify: `src/components/DashboardView.jsx`

- [ ] **Step 1: Import new components**

```jsx
// In src/components/DashboardView.jsx, add imports:
import ComplianceHeatMap from './ComplianceHeatMap';
import RemediationSankey from './RemediationSankey';
```

- [ ] **Step 2: Add framework selector state**

```jsx
// In DashboardView component, add state:
const [selectedFramework, setSelectedFramework] = useState('iso27001');
```

- [ ] **Step 3: Add new section after Risk Velocity**

```jsx
// Add after Risk Velocity chart:
<div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
  <ComplianceHeatMap findings={findings} selectedFramework={selectedFramework} />
  <RemediationSankey findings={findings} />
</div>

// Add framework selector:
<div className="mt-4">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    Framework
  </label>
  <select
    value={selectedFramework}
    onChange={(e) => setSelectedFramework(e.target.value)}
    className="mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
  >
    <option value="iso27001">ISO 27001:2022</option>
    <option value="nist_csf">NIST CSF</option>
    <option value="cis_controls">CIS Controls</option>
  </select>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/DashboardView.jsx
git commit -m "feat: Integrate heat map and Sankey into dashboard"
```

---

## Task 9: Testing - Heat Map and Sankey Coverage

**Files:**
- Modify: `tests/integration.test.ts`

- [ ] **Step 1: Add heat map integration test**

```typescript
// In tests/integration.test.ts:
test('ComplianceHeatMap calculates coverage correctly', () => {
  const findings = [
    { id: '1', finding_type: 'Access Control', severity: 'high' },
    { id: '2', finding_type: 'Encryption', severity: 'medium' },
  ];
  const coverage = calculateFrameworkCoverage(findings, 'iso27001');
  expect(coverage).toBeGreaterThan(0);
  expect(coverage).toBeLessThanOrEqual(100);
});
```

- [ ] **Step 2: Add Sankey integration test**

```typescript
// In tests/integration.test.ts:
test('RemediationSankey transforms data correctly', () => {
  const findings = [
    { id: '1', remediation_status: 'open' },
    { id: '2', remediation_status: 'in_progress' },
    { id: '3', remediation_status: 'closed' },
  ];
  const data = buildSankeyData(findings);
  expect(data.nodes.length).toBe(4);
  expect(data.links.length).toBeGreaterThan(0);
});
```

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: All tests passing (35+/35+)

- [ ] **Step 4: Commit**

```bash
git add tests/integration.test.ts
git commit -m "test: Add Phase 3 integration tests for heat map and Sankey"
```

---

## Task 10: Styling and Dark Mode Support

**Files:**
- Modify: `src/components/ComplianceHeatMap.jsx`
- Modify: `src/components/RemediationSankey.jsx`

- [ ] **Step 1: Verify Tailwind dark mode classes**

Check both components use `dark:` prefix for dark theme (already included in Task 6-7)

- [ ] **Step 2: Test dark mode rendering**

```bash
# In browser dev tools, toggle dark mode class on html element
# Verify: heat map colors adjust, Sankey fills update
```

- [ ] **Step 3: Verify responsive design on mobile**

```bash
# Resize browser to 375px width
# Verify: heat map grid wraps to single column, Sankey scrolls horizontally
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ComplianceHeatMap.jsx src/components/RemediationSankey.jsx
git commit -m "style: Add dark mode and responsive styling for Phase 3 components"
```

---

## Task 11: Documentation - Phase 3 Feature Guide

**Files:**
- Create: `docs/PHASE_3_COMPLETE.md`

- [ ] **Step 1: Create comprehensive documentation**

```markdown
# Phase 3 Implementation Complete ✅

[Include overview of both features, usage guide, architecture details, test results]
```

- [ ] **Step 2: Update UPGRADE_ROADMAP.md**

```bash
# Add Phase 3 completion status and metrics
```

- [ ] **Step 3: Commit documentation**

```bash
git add docs/PHASE_3_COMPLETE.md UPGRADE_ROADMAP.md
git commit -m "docs: Phase 3 completion documentation"
```

---

## Task 12: Final Integration Testing and Verification

**Files:**
- All modified files from Tasks 1-11

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: 35+/35+ tests passing, 0 failures

- [ ] **Step 2: TypeScript strict mode check**

```bash
npm run build 2>&1 | grep -i error
```

Expected: 0 errors

- [ ] **Step 3: Build production bundle**

```bash
npm run build
```

Expected: Success, no warnings

- [ ] **Step 4: Manual testing checklist**

```
✓ Framework selector changes heat map display
✓ Heat map colors reflect coverage (red/orange/green)
✓ Sankey flows show remediation progression
✓ Dashboard responsive on mobile/tablet/desktop
✓ Dark mode fully functional
✓ All tests passing
```

- [ ] **Step 5: Final commit and summary**

```bash
git log --oneline -12  # Verify 12 commits
```

Expected: 12 Phase 3 commits visible

---

## Success Criteria

- ✅ Framework Compliance Heat Map implemented and tested
- ✅ Remediation Flow Sankey Diagram implemented and tested
- ✅ All 35+ tests passing (100%)
- ✅ TypeScript strict mode compliant
- ✅ Dark mode fully supported
- ✅ Responsive design verified
- ✅ Zero breaking changes
- ✅ Backwards compatible with Phase 2B
- ✅ Documentation complete
- ✅ Ready for GPU machine deployment

---

## Execution Options

**Subagent-Driven (Recommended):**
- Use superpowers:subagent-driven-development
- Fresh subagent per task
- Two-stage review (spec compliance → code quality)
- Fast iteration with quality gates

**Inline Execution:**
- Use superpowers:executing-plans
- Sequential task execution in this session
- Checkpoints for manual review

---

## Next Steps After Completion

1. Deploy Phase 3 to GPU machine
2. Run full Phase 2B + Phase 3 integration test suite
3. Gather user feedback on compliance heat map and remediation flow
4. Plan Horizon 3: Business Impact Analysis + Multi-tenant backend
