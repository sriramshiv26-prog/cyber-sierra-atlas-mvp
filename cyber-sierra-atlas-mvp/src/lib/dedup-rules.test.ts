import { Finding } from './schema';
import {
  detectDuplicates,
  isSameFinding,
  mergeDuplicates,
  confirmUnique,
  unmarkDuplicate,
  getDuplicateGroup
} from './dedup-rules';

describe('Smart Duplicate Detection (Phase 2B)', () => {
  const baseFinding = (overrides: Partial<Finding> = {}): Finding => ({
    id: '1',
    created_at: '2026-05-28T10:00:00Z',
    updated_at: '2026-05-28T10:00:00Z',
    title: 'SQL Injection in Payment API',
    description: 'SQL injection vulnerability in /api/payments endpoint',
    severity: 'Critical',
    status: 'Open',
    asset_id: 'payment-api',
    asset_name: 'Payment API',
    source_document: {
      filename: 'scan-1.pdf',
      upload_date: '2026-05-28T10:00:00Z',
      parser_confidence: 0.95,
    },
    control_framework: 'NIST CSF',
    control_clause: 'ID.1',
    related_findings: [],
    ...overrides,
  });

  describe('isSameFinding - Context-Aware Matching', () => {
    it('should match findings with same CVE on same asset', () => {
      const f1 = baseFinding({ id: '1', cve: 'CVE-2024-1234', asset_id: 'api-1' });
      const f2 = baseFinding({ id: '2', cve: 'CVE-2024-1234', asset_id: 'api-1' });
      expect(isSameFinding(f1, f2)).toBe(true);
    });

    it('should NOT match same CVE on different assets', () => {
      const f1 = baseFinding({ id: '1', cve: 'CVE-2024-1234', asset_id: 'api-1' });
      const f2 = baseFinding({ id: '2', cve: 'CVE-2024-1234', asset_id: 'api-2' });
      expect(isSameFinding(f1, f2)).toBe(false);
    });

    it('should match findings with same normalized title on same asset', () => {
      const f1 = baseFinding({
        id: '1',
        title: 'SQL Injection in Payment API',
        asset_id: 'api-1'
      });
      const f2 = baseFinding({
        id: '2',
        title: 'sql injection in payment api', // Different case
        asset_id: 'api-1'
      });
      expect(isSameFinding(f1, f2)).toBe(true);
    });

    it('should match findings with same control framework requirement', () => {
      const f1 = baseFinding({
        id: '1',
        control_framework: 'ISO 27001',
        control_clause: 'A.5.1.1',
        asset_id: 'db-1'
      });
      const f2 = baseFinding({
        id: '2',
        control_framework: 'ISO 27001',
        control_clause: 'A.5.1.1',
        asset_id: 'db-1'
      });
      expect(isSameFinding(f1, f2)).toBe(true);
    });
  });

  describe('detectDuplicates - Grouping', () => {
    it('should group CVE-based duplicates', () => {
      const f1 = baseFinding({ id: '1', cve: 'CVE-2024-1234', asset_id: 'api-1' });
      const f2 = baseFinding({ id: '2', cve: 'CVE-2024-1234', asset_id: 'api-1' });
      const f3 = baseFinding({ id: '3', cve: 'CVE-2024-5678', asset_id: 'api-1' });

      const groups = detectDuplicates([f1, f2, f3]);
      expect(groups).toHaveLength(1);
      expect(groups[0]).toContain('1');
      expect(groups[0]).toContain('2');
    });

    it('should group title-based duplicates when no CVE', () => {
      const f1 = baseFinding({ id: '1', title: 'Missing TLS', asset_id: 'api-1', cve: undefined });
      const f2 = baseFinding({ id: '2', title: 'Missing TLS', asset_id: 'api-1', cve: undefined });

      const groups = detectDuplicates([f1, f2]);
      expect(groups).toHaveLength(1);
      expect(groups[0]).toContain('1');
      expect(groups[0]).toContain('2');
    });

    it('should return empty array if no duplicates found', () => {
      const f1 = baseFinding({ id: '1', asset_id: 'api-1', cve: 'CVE-1' });
      const f2 = baseFinding({ id: '2', asset_id: 'api-2', cve: 'CVE-2' });

      const groups = detectDuplicates([f1, f2]);
      expect(groups).toHaveLength(0);
    });

    it('should skip already-marked duplicates', () => {
      const f1 = baseFinding({ id: '1', cve: 'CVE-2024-1234', asset_id: 'api-1' });
      const f2 = baseFinding({
        id: '2',
        cve: 'CVE-2024-1234',
        asset_id: 'api-1',
        is_confirmed_unique: false,
        duplicate_group_id: '1'
      });
      const f3 = baseFinding({ id: '3', cve: 'CVE-2024-1234', asset_id: 'api-1' });

      const groups = detectDuplicates([f1, f2, f3]);
      // f2 is skipped (already marked duplicate), so only f1+f3
      expect(groups.some(g => g.includes('1') && g.includes('3'))).toBe(true);
    });
  });

  describe('mergeDuplicates - Consolidation', () => {
    it('should mark master as confirmed unique', () => {
      const f1 = baseFinding({ id: '1' });
      const f2 = baseFinding({ id: '2' });

      const updated = mergeDuplicates([f1, f2], '1', ['2']);
      const master = updated.find(f => f.id === '1');

      expect(master?.is_confirmed_unique).toBe(true);
      expect(master?.duplicate_group_id).toBeUndefined();
    });

    it('should link duplicates to master', () => {
      const f1 = baseFinding({ id: '1' });
      const f2 = baseFinding({ id: '2' });

      const updated = mergeDuplicates([f1, f2], '1', ['2']);
      const dup = updated.find(f => f.id === '2');

      expect(dup?.is_confirmed_unique).toBe(false);
      expect(dup?.duplicate_group_id).toBe('1');
    });

    it('should add duplicates to master related_findings', () => {
      const f1 = baseFinding({ id: '1', related_findings: [] });
      const f2 = baseFinding({ id: '2', related_findings: [] });

      const updated = mergeDuplicates([f1, f2], '1', ['2']);
      const master = updated.find(f => f.id === '1');

      expect(master?.related_findings).toContain('2');
    });

    it('should update timestamps on merge', () => {
      const f1 = baseFinding({ id: '1', updated_at: '2026-05-28T10:00:00Z' });
      const f2 = baseFinding({ id: '2', updated_at: '2026-05-28T10:00:00Z' });

      const updated = mergeDuplicates([f1, f2], '1', ['2']);
      const master = updated.find(f => f.id === '1');

      expect(new Date(master!.updated_at!).getTime()).toBeGreaterThan(
        new Date('2026-05-28T10:00:00Z').getTime()
      );
    });
  });

  describe('confirmUnique - Analyst Override', () => {
    it('should mark finding as confirmed unique', () => {
      const f = baseFinding({ id: '1', is_confirmed_unique: undefined });
      const updated = confirmUnique(f);

      expect(updated.is_confirmed_unique).toBe(true);
      expect(updated.duplicate_group_id).toBeUndefined();
    });
  });

  describe('unmarkDuplicate - Revert Decision', () => {
    it('should clear duplicate markings', () => {
      const f = baseFinding({
        id: '1',
        is_confirmed_unique: false,
        duplicate_group_id: '2'
      });
      const updated = unmarkDuplicate(f);

      expect(updated.is_confirmed_unique).toBeUndefined();
      expect(updated.duplicate_group_id).toBeUndefined();
    });
  });

  describe('getDuplicateGroup - Group Membership', () => {
    it('should return all findings in a duplicate group', () => {
      const f1 = baseFinding({ id: '1', is_confirmed_unique: true });
      const f2 = baseFinding({ id: '2', is_confirmed_unique: false, duplicate_group_id: '1' });
      const f3 = baseFinding({ id: '3', is_confirmed_unique: false, duplicate_group_id: '1' });
      const f4 = baseFinding({ id: '4' });

      const group = getDuplicateGroup([f1, f2, f3, f4], '2');

      expect(group).toHaveLength(3);
      expect(group.map(f => f.id)).toEqual(['1', '2', '3']);
    });

    it('should return empty array for unknown finding', () => {
      const f1 = baseFinding({ id: '1' });
      const group = getDuplicateGroup([f1], '999');

      expect(group).toHaveLength(0);
    });
  });
});
