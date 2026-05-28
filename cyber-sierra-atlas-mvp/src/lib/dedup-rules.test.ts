import { Finding } from './schema';
import { detectDuplicates, isSameFinding } from './dedup-rules';

describe('Duplicate Detection', () => {
  const finding1: Finding = {
    id: '1',
    created_at: '2026-05-28T10:00:00Z',
    updated_at: '2026-05-28T10:00:00Z',
    source: 'test.pdf',
    source_type: 'pdf',
    title: 'SQL Injection in Payment API',
    description: 'SQL injection vulnerability in /api/payments endpoint',
    severity: 'Critical',
    finding_type: 'SQL Injection',
    cwe: 'CWE-89',
    asset_id: 'payment-api',
    asset_name: 'Payment API',
    status: 'Open'
  };

  const finding2: Finding = {
    ...finding1,
    id: '2',
    created_at: '2026-05-28T11:00:00Z',
    asset_id: 'payment-api',
    asset_name: 'Payment API'
  };

  const finding3: Finding = {
    ...finding1,
    id: '3',
    created_at: '2026-05-28T12:00:00Z',
    asset_id: 'user-api',
    asset_name: 'User API'
  };

  describe('isSameFinding', () => {
    it('should match findings with same type and asset', () => {
      expect(isSameFinding(finding1, finding2)).toBe(true);
    });

    it('should NOT match findings with same type but different assets', () => {
      expect(isSameFinding(finding1, finding3)).toBe(false);
    });

    it('should NOT match findings with different types on same asset', () => {
      const finding4: Finding = {
        ...finding1,
        id: '4',
        finding_type: 'Cross-Site Scripting'
      };
      expect(isSameFinding(finding1, finding4)).toBe(false);
    });
  });

  describe('detectDuplicates', () => {
    it('should group duplicates correctly', () => {
      const findings = [finding1, finding2, finding3];
      const groups = detectDuplicates(findings);

      // Only finding1+finding2 form a duplicate group (same type + asset)
      // finding3 is alone, so it doesn't appear in the result
      expect(groups).toHaveLength(1);
      expect(groups[0]).toContain(finding1.id);
      expect(groups[0]).toContain(finding2.id);
    });

    it('should return empty array if no duplicates', () => {
      const groups = detectDuplicates([finding1, finding3]);
      expect(groups).toHaveLength(0);
    });
  });
});
