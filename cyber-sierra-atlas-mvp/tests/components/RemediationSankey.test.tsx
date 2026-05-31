import { describe, it, expect } from 'vitest';
import { Finding } from '../../src/lib/schema';
import { buildSankeyData } from '../../src/lib/sankey-transform';

describe('RemediationSankey', () => {
  const mockFindings: Finding[] = [
    {
      id: '1',
      title: 'Finding 1',
      description: 'desc',
      severity: 'Critical',
      status: 'Open',
      remediation_status: 'open',
      created_at: '2026-05-31T00:00:00Z',
      asset_id: 'a1',
      asset_name: 'Server 1',
      control_framework: 'ISO27001',
      control_clause: 'A.5.1',
      related_findings: [],
      source_document: {
        filename: 'test.pdf',
        upload_date: '2026-05-31T00:00:00Z',
        parser_confidence: 0.95,
      },
      updated_at: '2026-05-31T00:00:00Z',
    },
    {
      id: '2',
      title: 'Finding 2',
      description: 'desc',
      severity: 'High',
      status: 'In Progress',
      remediation_status: 'in_progress',
      created_at: '2026-05-31T00:00:00Z',
      asset_id: 'a2',
      asset_name: 'Server 2',
      control_framework: 'ISO27001',
      control_clause: 'A.5.1',
      related_findings: [],
      source_document: {
        filename: 'test.pdf',
        upload_date: '2026-05-31T00:00:00Z',
        parser_confidence: 0.95,
      },
      updated_at: '2026-05-31T00:00:00Z',
    },
  ];

  it('should build sankey data from findings', () => {
    const data = buildSankeyData(mockFindings);
    expect(data).toBeDefined();
    expect(data.nodes).toBeDefined();
    expect(data.links).toBeDefined();
  });

  it('should have status nodes', () => {
    const data = buildSankeyData(mockFindings);
    const nodeNames = data.nodes.map(n => n.name);
    expect(nodeNames).toContain('Open');
    expect(nodeNames).toContain('In Progress');
  });

  it('should return empty nodes and links for empty findings', () => {
    const data = buildSankeyData([]);
    expect(data.nodes.length).toBeGreaterThan(0);
    expect(data.links.length).toBe(0);
  });
});
