import { describe, it, expect, vi } from 'vitest';
import { extractFindingsFromPDF } from '../src/lib/report-extractors/pdf-extractor';

describe('PDF Extractor', () => {
  describe('PDF extraction', () => {
    it('should extract findings from PDF bytes', async () => {
      const mockPdfBytes = new Uint8Array([
        37, 80, 68, 70, // %PDF
        ...Array(100).fill(0) // padding
      ]);

      const result = await extractFindingsFromPDF(mockPdfBytes, 'test-report.pdf');

      expect(result).toBeDefined();
      expect(result.findings).toBeDefined();
      expect(Array.isArray(result.findings)).toBe(true);
      expect(result.rawText).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should extract confidence score', async () => {
      const mockPdfBytes = new Uint8Array([
        37, 80, 68, 70, ...Array(100).fill(0)
      ]);

      const result = await extractFindingsFromPDF(mockPdfBytes, 'test.pdf');

      expect(typeof result.confidence).toBe('number');
      expect(result.confidence >= 0 && result.confidence <= 1).toBe(true);
    });

    it('should extract metadata', async () => {
      const mockPdfBytes = new Uint8Array([
        37, 80, 68, 70, ...Array(100).fill(0)
      ]);

      const result = await extractFindingsFromPDF(mockPdfBytes, 'audit-report.pdf');

      expect(result.metadata).toBeDefined();
      expect(result.metadata.fileName).toBe('audit-report.pdf');
      expect(result.metadata.fileType).toBe('pdf');
      expect(result.metadata.extractedAt).toBeDefined();
    });

    it('should handle invalid PDF gracefully', async () => {
      const invalidBytes = new Uint8Array([1, 2, 3, 4, 5]);

      const result = await extractFindingsFromPDF(invalidBytes, 'invalid.pdf');

      expect(result).toBeDefined();
      expect(result.findings).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty PDF', async () => {
      const emptyBytes = new Uint8Array([]);

      const result = await extractFindingsFromPDF(emptyBytes, 'empty.pdf');

      expect(result).toBeDefined();
      expect(result.rawText || result.findings.length >= 0).toBe(true);
    });
  });

  describe('Finding extraction', () => {
    it('should return standardized finding format', async () => {
      const mockPdfBytes = new Uint8Array([
        37, 80, 68, 70, ...Array(100).fill(0)
      ]);

      const result = await extractFindingsFromPDF(mockPdfBytes, 'test.pdf');

      result.findings.forEach(finding => {
        expect(finding).toHaveProperty('title');
        expect(finding).toHaveProperty('severity');
        expect(finding).toHaveProperty('rawText');
      });
    });
  });

  describe('Error handling', () => {
    it('should not throw on processing errors', async () => {
      const mockPdfBytes = new Uint8Array([255, 255, 255, 255]);

      const result = await extractFindingsFromPDF(mockPdfBytes, 'test.pdf');

      expect(result).toBeDefined();
      expect(result.findings).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
    });

    it('should provide metadata even on extraction failure', async () => {
      const bytes = new Uint8Array([1, 2, 3]);

      const result = await extractFindingsFromPDF(bytes, 'report.pdf');

      expect(result.metadata).toBeDefined();
      expect(result.metadata.fileName).toBe('report.pdf');
      expect(result.metadata.fileType).toBe('pdf');
      expect(result.metadata.extractedAt).toBeTruthy();
    });
  });
});
