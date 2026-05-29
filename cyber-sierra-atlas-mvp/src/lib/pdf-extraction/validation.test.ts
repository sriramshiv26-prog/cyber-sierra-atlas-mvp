import { describe, it, expect } from 'vitest';
import {
  validateExtractionQuality,
  calculateExtractionConfidence,
} from './validation';

describe('Extraction Validation & Confidence Scoring', () => {
  describe('validateExtractionQuality', () => {
    it('should flag empty text as invalid', () => {
      const result = validateExtractionQuality('', 0.75, 'native_text');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Text content is empty');
    });

    it('should flag short text as invalid', () => {
      const result = validateExtractionQuality('short', 0.75, 'native_text');
      expect(result.isValid).toBe(false);
    });

    it('should warn about low OCR confidence', () => {
      const result = validateExtractionQuality(
        'Some text here with security keywords',
        0.55,
        'ocr_tesseract'
      );
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should accept native text with 1.0 confidence', () => {
      const result = validateExtractionQuality(
        'Security finding: Missing encryption on database',
        1.0,
        'native_text'
      );
      expect(result.isValid).toBe(true);
    });

    it('should detect garbage OCR text', () => {
      const result = validateExtractionQuality(
        'ZZZZZ XXXX QQQQ YYYY',
        0.7,
        'ocr_tesseract'
      );
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should calculate confidence reduction for warnings', () => {
      const result = validateExtractionQuality(
        'Some text',
        0.7,
        'ocr_tesseract'
      );
      expect(result.finalConfidence).toBeLessThanOrEqual(0.7);
    });

    it('should flag as requiring manual review if low confidence', () => {
      const result = validateExtractionQuality(
        'Very short',
        0.5,
        'ocr_tesseract'
      );
      expect(result.requiresManualReview).toBe(true);
    });

    it('should detect missing security keywords', () => {
      const result = validateExtractionQuality(
        'Some random text about weather',
        0.8,
        'ocr_tesseract'
      );
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should return finalConfidence >= 0', () => {
      const result = validateExtractionQuality('', 0, 'native_text');
      expect(result.finalConfidence).toBeGreaterThanOrEqual(0);
    });

    it('should have valid error and warning arrays', () => {
      const result = validateExtractionQuality(
        'Test text finding severity high',
        0.8,
        'native_text'
      );
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('calculateExtractionConfidence', () => {
    it('should return native confidence if high', () => {
      const result = calculateExtractionConfidence(0.95, 0.7, 0.9);
      expect(result).toBe(0.95);
    });

    it('should use best available confidence if native is low', () => {
      const result = calculateExtractionConfidence(0.5, 0.8, 0.9);
      expect(result).toBe(0.9);
    });

    it('should handle null ocr confidence', () => {
      const result = calculateExtractionConfidence(0.5, null, 0.85);
      expect(result).toBe(0.85);
    });

    it('should handle null vision confidence', () => {
      const result = calculateExtractionConfidence(0.5, 0.7, null);
      expect(result).toBe(0.7);
    });

    it('should handle all null values', () => {
      const result = calculateExtractionConfidence(0.6, null, null);
      expect(result).toBe(0.6);
    });
  });
});
