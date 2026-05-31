import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateStoreData, exportStore, importStore, downloadFile } from '../../src/lib/data-export';
import { Store, Finding, Asset } from '../../src/lib/schema';

describe('Data Export Utils', () => {
  const mockFinding = (overrides?: Partial<Finding>): Finding => ({
    id: 'F1',
    title: 'Test Finding',
    description: 'Test Description',
    severity: 'Critical',
    status: 'Open',
    source_document: {
      filename: 'test.pdf',
      upload_date: new Date().toISOString(),
      parser_confidence: 0.95,
    },
    asset_id: 'A1',
    asset_name: 'Test Asset',
    control_framework: 'ISO 27001',
    control_clause: 'A.5.1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    related_findings: [],
    ...overrides,
  });

  const mockAsset = (overrides?: Partial<Asset>): Asset => ({
    id: 'A1',
    name: 'Test Asset',
    type: 'application',
    criticality: 'High',
    dependencies: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  });

  const mockStore: Store = {
    findings: [mockFinding()],
    assets: [mockAsset()],
    controls: [
      {
        framework: 'ISO 27001',
        clause: 'A.5.1',
        description: 'Test Control',
      },
    ],
    lastSaved: new Date().toISOString(),
  };

  describe('validateStoreData', () => {
    it('should validate a correct store', () => {
      const result = validateStoreData(mockStore);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-object data', () => {
      const result = validateStoreData(null);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('must be a valid object');
    });

    it('should reject missing findings array', () => {
      const invalid = { ...mockStore, findings: undefined };
      const result = validateStoreData(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('findings must be an array'))).toBe(true);
    });

    it('should reject missing assets array', () => {
      const invalid = { ...mockStore, assets: 'not-an-array' };
      const result = validateStoreData(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('assets must be an array'))).toBe(true);
    });

    it('should reject missing controls array', () => {
      const invalid = { ...mockStore, controls: undefined };
      const result = validateStoreData(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('controls must be an array'))).toBe(true);
    });

    it('should reject findings with missing id', () => {
      const finding = mockFinding({ id: undefined as any });
      const invalid = { ...mockStore, findings: [finding] };
      const result = validateStoreData(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('missing or invalid id'))).toBe(true);
    });

    it('should reject findings with invalid severity', () => {
      const finding = mockFinding({ severity: 'Invalid' as any });
      const invalid = { ...mockStore, findings: [finding] };
      const result = validateStoreData(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('invalid severity'))).toBe(true);
    });

    it('should reject findings with missing source_document', () => {
      const finding = mockFinding({ source_document: undefined as any });
      const invalid = { ...mockStore, findings: [finding] };
      const result = validateStoreData(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('invalid source_document'))).toBe(true);
    });

    it('should reject assets with invalid type', () => {
      const asset = mockAsset({ type: 'invalid-type' as any });
      const invalid = { ...mockStore, assets: [asset] };
      const result = validateStoreData(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('invalid type'))).toBe(true);
    });

    it('should reject controls with missing framework', () => {
      const invalid = {
        ...mockStore,
        controls: [{ framework: undefined, clause: 'A.5.1', description: 'Test' }],
      };
      const result = validateStoreData(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('invalid framework'))).toBe(true);
    });

    it('should reject invalid lastSaved timestamp', () => {
      const invalid = { ...mockStore, lastSaved: 'not-a-date' };
      const result = validateStoreData(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('lastSaved must be a valid ISO8601 timestamp'))).toBe(true);
    });
  });

  describe('exportStore', () => {
    it('should export store with metadata', () => {
      const exported = exportStore(mockStore);
      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported);
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.metadata.findingCount).toBe(1);
      expect(parsed.metadata.assetCount).toBe(1);
      expect(parsed.metadata.controlCount).toBe(1);
      expect(parsed.data).toEqual(mockStore);
    });

    it('should include correct item counts', () => {
      const storeWithMultiple: Store = {
        findings: [mockFinding(), mockFinding({ id: 'F2' })],
        assets: [mockAsset(), mockAsset({ id: 'A2' }), mockAsset({ id: 'A3' })],
        controls: [
          { framework: 'ISO 27001', clause: 'A.5.1', description: 'Control 1' },
          { framework: 'NIST CSF', clause: 'PR-AC-1', description: 'Control 2' },
        ],
        lastSaved: new Date().toISOString(),
      };

      const exported = exportStore(storeWithMultiple);
      const parsed = JSON.parse(exported);

      expect(parsed.metadata.findingCount).toBe(2);
      expect(parsed.metadata.assetCount).toBe(3);
      expect(parsed.metadata.controlCount).toBe(2);
    });

    it('should produce valid JSON', () => {
      const exported = exportStore(mockStore);
      expect(() => JSON.parse(exported)).not.toThrow();
    });
  });

  describe('importStore', () => {
    it('should import valid exported data', () => {
      const exported = exportStore(mockStore);
      const result = importStore(exported);

      expect(result.success).toBe(true);
      expect(result.store).toBeDefined();
      expect(result.errors).toHaveLength(0);
      expect(result.store?.findings).toHaveLength(1);
      expect(result.store?.assets).toHaveLength(1);
      expect(result.store?.controls).toHaveLength(1);
    });

    it('should import raw store JSON', () => {
      const rawJson = JSON.stringify(mockStore);
      const result = importStore(rawJson);

      expect(result.success).toBe(true);
      expect(result.store).toBeDefined();
    });

    it('should reject invalid JSON', () => {
      const result = importStore('not valid json');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid JSON');
    });

    it('should reject malformed store data', () => {
      const invalid = JSON.stringify({ findings: 'not-array' });
      const result = importStore(invalid);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should provide descriptive error messages', () => {
      const invalid = JSON.stringify({
        findings: [],
        assets: [],
        controls: [],
        lastSaved: 'invalid-date',
      });

      const result = importStore(invalid);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('lastSaved'))).toBe(true);
    });

    it('should handle empty arrays', () => {
      const emptyStore: Store = {
        findings: [],
        assets: [],
        controls: [],
        lastSaved: new Date().toISOString(),
      };

      const exported = exportStore(emptyStore);
      const result = importStore(exported);

      expect(result.success).toBe(true);
      expect(result.store?.findings).toHaveLength(0);
      expect(result.store?.assets).toHaveLength(0);
    });
  });

  describe('downloadFile', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      // Mock DOM methods
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create and download a file', () => {
      const content = 'test content';
      const filename = 'test.json';

      // Should not throw
      expect(() => downloadFile(content, filename)).not.toThrow();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should use correct filename for exports', () => {
      const content = JSON.stringify(mockStore);
      const filename = 'backup-2026-05-31T12-00-00.json';

      // The filename should be used when creating the download link
      expect(() => downloadFile(content, filename)).not.toThrow();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should accept custom mime type', () => {
      const content = 'test content';
      const filename = 'test.json';
      const mimeType = 'application/json';

      // Should not throw with custom mime type
      expect(() => downloadFile(content, filename, mimeType)).not.toThrow();
    });

    it('should default to application/json mime type', () => {
      const content = 'test content';
      const filename = 'test.json';

      // Should not throw and use default mime type
      expect(() => downloadFile(content, filename)).not.toThrow();
    });

    it('should clean up blob URL after download', () => {
      const content = 'test content';
      const filename = 'test.json';

      downloadFile(content, filename);

      // URL.revokeObjectURL should be called to clean up
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should throw error when createObjectURL fails', () => {
      const content = 'test content';
      const filename = 'test.json';

      // Mock createObjectURL to throw
      global.URL.createObjectURL = vi.fn(() => {
        throw new Error('Blob creation failed');
      });

      expect(() => downloadFile(content, filename)).toThrow('Failed to download file');
    });
  });
});
