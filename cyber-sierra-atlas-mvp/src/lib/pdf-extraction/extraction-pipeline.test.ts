import { describe, it, expect } from 'vitest';
import { extractFromPDFWithFallback } from './extraction-pipeline';

describe('PDF Extraction Pipeline', () => {
  describe('Pipeline structure', () => {
    it('should return correct pipeline result structure', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(mockPdfBytes, 'test.pdf');

      expect(result).toHaveProperty('primaryText');
      expect(result).toHaveProperty('primaryMethod');
      expect(result).toHaveProperty('primaryConfidence');
      expect(result).toHaveProperty('validationStatus');
      expect(result).toHaveProperty('auditTrail');
    });

    it('should return valid primary method', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(mockPdfBytes, 'test.pdf');

      expect([
        'native_text',
        'ocr_tesseract',
        'claude_vision',
      ]).toContain(result.primaryMethod);
    });

    it('should return valid validation status', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(mockPdfBytes, 'test.pdf');

      expect([
        'auto_accept',
        'review_queue',
        'manual_entry_required',
      ]).toContain(result.validationStatus);
    });
  });

  describe('Audit trail', () => {
    it('should have complete audit trail', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(mockPdfBytes, 'test.pdf');

      const { auditTrail } = result;
      expect(auditTrail.fileName).toBe('test.pdf');
      expect(auditTrail.attemptedMethods).toBeInstanceOf(Array);
      expect(auditTrail.selectedMethod).toBeTruthy();
      expect(auditTrail.reasoning).toBeTruthy();
      expect(auditTrail.startedAt).toBeTruthy();
      expect(auditTrail.completedAt).toBeTruthy();
    });

    it('should have valid timestamps', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(mockPdfBytes, 'test.pdf');

      const { auditTrail } = result;
      const startDate = new Date(auditTrail.startedAt);
      const endDate = new Date(auditTrail.completedAt);

      expect(startDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });

    it('should track attempted methods', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(mockPdfBytes, 'test.pdf');

      const { auditTrail } = result;
      expect(auditTrail.attemptedMethods.length).toBeGreaterThan(0);

      auditTrail.attemptedMethods.forEach((attempt) => {
        expect(attempt).toHaveProperty('method');
        expect(attempt).toHaveProperty('confidence');
        expect(attempt).toHaveProperty('success');
        expect(typeof attempt.confidence).toBe('number');
        expect(typeof attempt.success).toBe('boolean');
      });
    });
  });

  describe('Confidence and validation', () => {
    it('should have valid confidence range', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(mockPdfBytes, 'test.pdf');

      expect(result.primaryConfidence).toBeGreaterThanOrEqual(0);
      expect(result.primaryConfidence).toBeLessThanOrEqual(1);
    });

    it('should have text property', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(mockPdfBytes, 'test.pdf');

      expect(typeof result.primaryText).toBe('string');
    });

    it('should map confidence to validation status', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(mockPdfBytes, 'test.pdf');

      if (result.primaryConfidence > 0.85) {
        expect(result.validationStatus).toBe('auto_accept');
      } else if (result.primaryConfidence > 0.65) {
        expect(result.validationStatus).toMatch(/review|manual/);
      }
    });
  });

  describe('Error handling', () => {
    it('should handle corrupt PDF gracefully', async () => {
      const corruptBytes = new Uint8Array([1, 2, 3, 4, 5]);
      const result = await extractFromPDFWithFallback(corruptBytes, 'corrupt.pdf');

      expect(result).toHaveProperty('primaryText');
      expect(result).toHaveProperty('auditTrail');
    });

    it('should handle empty PDF', async () => {
      const emptyBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(emptyBytes, 'empty.pdf');

      expect(result).toHaveProperty('primaryText');
      expect(result.auditTrail.fileName).toBe('empty.pdf');
    });

    it('should provide reasoning for method selection', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(mockPdfBytes, 'test.pdf');

      expect(result.auditTrail.reasoning.length).toBeGreaterThan(5);
    });
  });
});
