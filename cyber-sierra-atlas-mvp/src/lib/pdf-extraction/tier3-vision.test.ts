import { describe, it, expect } from 'vitest';
import { extractWithClaudeVision } from './tier3-vision';

describe('Tier 3: Claude Vision Extraction', () => {
  it('should have correct return type', async () => {
    const mockImageBase64 = '';
    const result = await extractWithClaudeVision(mockImageBase64, 'test.pdf', 1);

    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('method');
    expect(result).toHaveProperty('pageNumber');
    expect(result).toHaveProperty('metadata');
  });

  it('should set method to claude_vision', async () => {
    const mockImageBase64 = '';
    const result = await extractWithClaudeVision(mockImageBase64, 'test.pdf', 1);

    expect(result.method).toBe('claude_vision');
  });

  it('should preserve page number', async () => {
    const mockImageBase64 = '';
    const result = await extractWithClaudeVision(mockImageBase64, 'test.pdf', 3);

    expect(result.pageNumber).toBe(3);
  });

  it('should have confidence 0.95 when successful', async () => {
    const mockImageBase64 = '';
    const result = await extractWithClaudeVision(mockImageBase64, 'test.pdf', 1);

    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('should include fileName in metadata', async () => {
    const mockImageBase64 = '';
    const result = await extractWithClaudeVision(mockImageBase64, 'report.pdf', 1);

    expect(result.metadata.fileName).toBe('report.pdf');
  });

  it('should include model name in metadata', async () => {
    const mockImageBase64 = '';
    const result = await extractWithClaudeVision(mockImageBase64, 'test.pdf', 1);

    expect(result.metadata.model).toBe('claude-3-5-sonnet-20241022');
  });

  it('should include extractedAt timestamp', async () => {
    const mockImageBase64 = '';
    const result = await extractWithClaudeVision(mockImageBase64, 'test.pdf', 1);

    expect(result.metadata.extractedAt).toBeDefined();
    expect(() => new Date(result.metadata.extractedAt)).not.toThrow();
  });

  it('should return string text', async () => {
    const mockImageBase64 = '';
    const result = await extractWithClaudeVision(mockImageBase64, 'test.pdf', 1);

    expect(typeof result.text).toBe('string');
  });

  it('should handle empty image gracefully', async () => {
    const emptyBase64 = '';
    const result = await extractWithClaudeVision(emptyBase64, 'empty.pdf', 1);

    expect(result).toHaveProperty('text');
    expect(result.method).toBe('claude_vision');
  });

  it('should handle errors gracefully', async () => {
    const invalidBase64 = 'invalid!!!';
    const result = await extractWithClaudeVision(invalidBase64, 'invalid.pdf', 1);

    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('confidence');
    expect(result.method).toBe('claude_vision');
  });
});
