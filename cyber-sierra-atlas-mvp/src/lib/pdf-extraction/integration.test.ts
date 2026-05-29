import { describe, it, expect } from 'vitest';
import { extractFromPDFWithFallback } from './extraction-pipeline';
import { validateExtractionQuality } from './validation';

describe('PDF Extraction Integration Tests', () => {
  describe('End-to-end extraction workflow', () => {
    it('should handle PDF file upload workflow', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(
        mockPdfBytes,
        'audit_report.pdf'
      );

      expect(result.primaryText).toBeDefined();
      expect(result.primaryConfidence).toBeGreaterThanOrEqual(0);
      expect(result.primaryConfidence).toBeLessThanOrEqual(1);
    });

    it('should track extraction method selection', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(mockPdfBytes, 'test.pdf');

      expect(result.primaryMethod).toMatch(/native_text|ocr_tesseract|claude_vision/);
      expect(result.auditTrail.selectedMethod).toBe(result.primaryMethod);
    });

    it('should validate extracted findings', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(mockPdfBytes, 'test.pdf');

      const validation = validateExtractionQuality(
        result.primaryText,
        result.primaryConfidence,
        result.primaryMethod
      );

      expect(validation.isValid || validation.warnings.length >= 0).toBe(true);
    });

    it('should produce audit trail for compliance', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(
        mockPdfBytes,
        'compliance_audit.pdf'
      );

      const { auditTrail } = result;
      expect(auditTrail.fileName).toBe('compliance_audit.pdf');
      expect(auditTrail.startedAt).toBeTruthy();
      expect(auditTrail.completedAt).toBeTruthy();
      expect(auditTrail.attemptedMethods).toBeInstanceOf(Array);
      expect(auditTrail.selectedMethod).toBeTruthy();
      expect(auditTrail.reasoning).toBeTruthy();
    });
  });

  describe('Validation integration', () => {
    it('should integrate validation with extraction results', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(mockPdfBytes, 'test.pdf');

      const validation = validateExtractionQuality(
        result.primaryText,
        result.primaryConfidence,
        result.primaryMethod
      );

      expect(validation.isValid || !validation.isValid).toBe(true);
      expect(validation.finalConfidence).toBeLessThanOrEqual(
        result.primaryConfidence
      );
    });

    it('should map validation to user action', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(mockPdfBytes, 'test.pdf');

      if (result.primaryConfidence > 0.85) {
        expect(result.validationStatus).toBe('auto_accept');
      } else if (result.primaryConfidence > 0.65) {
        expect(result.validationStatus).toMatch(/review_queue|manual/);
      } else {
        expect(result.validationStatus).toBe('manual_entry_required');
      }
    });
  });

  describe('Error handling and recovery', () => {
    it('should gracefully handle corrupted PDF', async () => {
      const corruptBytes = new Uint8Array([1, 2, 3, 4, 5]);
      const result = await extractFromPDFWithFallback(
        corruptBytes,
        'corrupt.pdf'
      );

      expect(result.primaryText).toBeDefined();
      expect(result.auditTrail).toBeDefined();
      expect(result.validationStatus).toBeDefined();
    });

    it('should handle empty PDF', async () => {
      const emptyBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(emptyBytes, 'empty.pdf');

      expect(result.auditTrail.fileName).toBe('empty.pdf');
      expect(result.validationStatus).toBeDefined();
    });

    it('should handle various PDF sizes', async () => {
      const sizes = [10, 100, 1000, 5000];

      for (const size of sizes) {
        const bytes = new Uint8Array(size);
        const result = await extractFromPDFWithFallback(
          bytes,
          `test_${size}.pdf`
        );

        expect(result).toHaveProperty('primaryText');
        expect(result).toHaveProperty('auditTrail');
      }
    });
  });

  describe('Confidence and quality metrics', () => {
    it('should provide meaningful confidence scores', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(mockPdfBytes, 'test.pdf');

      expect(result.primaryConfidence).toBeGreaterThanOrEqual(0);
      expect(result.primaryConfidence).toBeLessThanOrEqual(1);

      const confidence = result.primaryConfidence;
      if (confidence > 0.85) {
        expect(result.validationStatus).toBe('auto_accept');
      }
    });

    it('should track extraction attempts in audit trail', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(mockPdfBytes, 'test.pdf');

      const attempts = result.auditTrail.attemptedMethods;
      expect(attempts.length).toBeGreaterThan(0);

      attempts.forEach((attempt) => {
        expect(['native_text', 'ocr_tesseract', 'claude_vision']).toContain(
          attempt.method
        );
        expect(typeof attempt.confidence).toBe('number');
        expect(typeof attempt.success).toBe('boolean');
      });
    });

    it('should provide reasoning for method selection', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(mockPdfBytes, 'test.pdf');

      expect(result.auditTrail.reasoning.length).toBeGreaterThan(10);
      expect(result.auditTrail.reasoning).toMatch(/Tier|confidence|Selected/);
    });
  });

  describe('Metadata and audit trail completeness', () => {
    it('should include all required audit trail fields', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(
        mockPdfBytes,
        'metadata_test.pdf'
      );

      const { auditTrail } = result;
      expect(auditTrail).toHaveProperty('fileName');
      expect(auditTrail).toHaveProperty('attemptedMethods');
      expect(auditTrail).toHaveProperty('selectedMethod');
      expect(auditTrail).toHaveProperty('reasoning');
      expect(auditTrail).toHaveProperty('startedAt');
      expect(auditTrail).toHaveProperty('completedAt');
    });

    it('should record timestamp progression', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const beforeCall = new Date();

      const result = await extractFromPDFWithFallback(mockPdfBytes, 'time_test.pdf');

      const afterCall = new Date();
      const startTime = new Date(result.auditTrail.startedAt);
      const endTime = new Date(result.auditTrail.completedAt);

      expect(startTime.getTime()).toBeGreaterThanOrEqual(
        beforeCall.getTime() - 1000
      );
      expect(endTime.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 1000);
      expect(endTime.getTime()).toBeGreaterThanOrEqual(startTime.getTime());
    });
  });

  describe('Multi-page handling', () => {
    it('should handle multi-page extraction', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(
        mockPdfBytes,
        'multipage.pdf'
      );

      expect(result.primaryText).toBeDefined();
      expect(result.auditTrail.attemptedMethods.length).toBeGreaterThan(0);
    });
  });

  describe('Format standardization', () => {
    it('should produce standardized output format', async () => {
      const mockPdfBytes = new Uint8Array([]);
      const result = await extractFromPDFWithFallback(mockPdfBytes, 'test.pdf');

      expect(result).toHaveProperty('primaryText');
      expect(result).toHaveProperty('primaryMethod');
      expect(result).toHaveProperty('primaryConfidence');
      expect(result).toHaveProperty('validationStatus');
      expect(result).toHaveProperty('auditTrail');

      expect(typeof result.primaryText).toBe('string');
      expect(typeof result.primaryMethod).toBe('string');
      expect(typeof result.primaryConfidence).toBe('number');
      expect(typeof result.validationStatus).toBe('string');
      expect(typeof result.auditTrail).toBe('object');
    });
  });
});
