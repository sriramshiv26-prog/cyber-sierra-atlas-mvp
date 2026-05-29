export { extractNativeTextFromPDF } from './tier1-native';
export type { ExtractionResult } from './tier1-native';

export { extractWithOCR } from './tier2-ocr';
export type { OCRExtractionResult } from './tier2-ocr';

export { extractWithClaudeVision } from './tier3-vision';
export type { VisionExtractionResult } from './tier3-vision';

export {
  validateExtractionQuality,
  calculateExtractionConfidence,
} from './validation';
export type { ValidationResult } from './validation';

export { extractFromPDFWithFallback } from './extraction-pipeline';
export type { PipelineResult } from './extraction-pipeline';
