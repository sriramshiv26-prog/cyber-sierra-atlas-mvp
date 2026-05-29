import { describe, it, expect } from 'vitest';
import { extractWithOCR } from './tier2-ocr';

describe('Tier 2: Tesseract OCR Extraction', () => {
  it('should have correct return type', async () => {
    const mockPdfBytes = new Uint8Array([]);
    const result = await extractWithOCR(mockPdfBytes, 'test.pdf', 1);

    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('method');
    expect(result).toHaveProperty('ocrConfidence');
    expect(result).toHaveProperty('pageNumber');
    expect(result).toHaveProperty('metadata');
  });

  it('should set method to ocr_tesseract', async () => {
    const mockPdfBytes = new Uint8Array([]);
    const result = await extractWithOCR(mockPdfBytes, 'test.pdf', 1);

    expect(result.method).toBe('ocr_tesseract');
  });

  it('should preserve page number', async () => {
    const mockPdfBytes = new Uint8Array([]);
    const result = await extractWithOCR(mockPdfBytes, 'test.pdf', 5);

    expect(result.pageNumber).toBe(5);
  });

  it('should have confidence between 0 and 1', async () => {
    const mockPdfBytes = new Uint8Array([]);
    const result = await extractWithOCR(mockPdfBytes, 'test.pdf', 1);

    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('should have ocrConfidence between 0 and 1', async () => {
    const mockPdfBytes = new Uint8Array([]);
    const result = await extractWithOCR(mockPdfBytes, 'test.pdf', 1);

    expect(result.ocrConfidence).toBeGreaterThanOrEqual(0);
    expect(result.ocrConfidence).toBeLessThanOrEqual(1);
  });

  it('should include fileName in metadata', async () => {
    const mockPdfBytes = new Uint8Array([]);
    const result = await extractWithOCR(mockPdfBytes, 'report.pdf', 1);

    expect(result.metadata.fileName).toBe('report.pdf');
  });

  it('should set language to eng in metadata', async () => {
    const mockPdfBytes = new Uint8Array([]);
    const result = await extractWithOCR(mockPdfBytes, 'test.pdf', 1);

    expect(result.metadata.language).toBe('eng');
  });

  it('should include extractedAt timestamp', async () => {
    const mockPdfBytes = new Uint8Array([]);
    const result = await extractWithOCR(mockPdfBytes, 'test.pdf', 1);

    expect(result.metadata.extractedAt).toBeDefined();
    expect(() => new Date(result.metadata.extractedAt)).not.toThrow();
  });

  it('should return string text', async () => {
    const mockPdfBytes = new Uint8Array([]);
    const result = await extractWithOCR(mockPdfBytes, 'test.pdf', 1);

    expect(typeof result.text).toBe('string');
  });

  it('should handle errors gracefully', async () => {
    const corruptBytes = new Uint8Array([1, 2, 3, 4, 5]);
    const result = await extractWithOCR(corruptBytes, 'corrupt.pdf', 1);

    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('confidence');
    expect(result.method).toBe('ocr_tesseract');
  });
});
