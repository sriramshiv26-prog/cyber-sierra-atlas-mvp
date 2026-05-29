import { describe, it, expect } from 'vitest';
import { extractNativeTextFromPDF } from './tier1-native';

describe('Tier 1: Native PDF Extraction', () => {
  it('should have correct return type structure', async () => {
    const mockPdfBytes = new Uint8Array([]);
    const result = await extractNativeTextFromPDF(mockPdfBytes, 'test.pdf');

    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('textDensity');
    expect(result).toHaveProperty('pageCount');
    expect(result).toHaveProperty('method');
    expect(result).toHaveProperty('metadata');
  });

  it('should set method to native_text', async () => {
    const mockPdfBytes = new Uint8Array([]);
    const result = await extractNativeTextFromPDF(mockPdfBytes, 'test.pdf');

    expect(result.method).toBe('native_text');
  });

  it('should have valid confidence range 0-1', async () => {
    const mockPdfBytes = new Uint8Array([]);
    const result = await extractNativeTextFromPDF(mockPdfBytes, 'test.pdf');

    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('should have valid text density range 0-1', async () => {
    const mockPdfBytes = new Uint8Array([]);
    const result = await extractNativeTextFromPDF(mockPdfBytes, 'test.pdf');

    expect(result.textDensity).toBeGreaterThanOrEqual(0);
    expect(result.textDensity).toBeLessThanOrEqual(1);
  });

  it('should include fileName in metadata', async () => {
    const mockPdfBytes = new Uint8Array([]);
    const result = await extractNativeTextFromPDF(mockPdfBytes, 'report.pdf');

    expect(result.metadata.fileName).toBe('report.pdf');
  });

  it('should include extractedAt timestamp in metadata', async () => {
    const mockPdfBytes = new Uint8Array([]);
    const result = await extractNativeTextFromPDF(mockPdfBytes, 'test.pdf');

    expect(result.metadata.extractedAt).toBeDefined();
    expect(() => new Date(result.metadata.extractedAt)).not.toThrow();
  });

  it('should return pageCount >= 0', async () => {
    const mockPdfBytes = new Uint8Array([]);
    const result = await extractNativeTextFromPDF(mockPdfBytes, 'test.pdf');

    expect(result.pageCount).toBeGreaterThanOrEqual(0);
  });

  it('should handle empty PDF gracefully', async () => {
    const mockPdfBytes = new Uint8Array([]);
    const result = await extractNativeTextFromPDF(mockPdfBytes, 'empty.pdf');

    expect(result).toHaveProperty('text');
    expect(typeof result.text).toBe('string');
  });

  it('should have text as string type', async () => {
    const mockPdfBytes = new Uint8Array([]);
    const result = await extractNativeTextFromPDF(mockPdfBytes, 'test.pdf');

    expect(typeof result.text).toBe('string');
  });

  it('should have metadata with extractedAt as ISO string', async () => {
    const mockPdfBytes = new Uint8Array([]);
    const result = await extractNativeTextFromPDF(mockPdfBytes, 'test.pdf');

    const date = new Date(result.metadata.extractedAt);
    expect(date.toISOString()).toBeTruthy();
  });
});
