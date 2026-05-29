import { extractNativeTextFromPDF } from './tier1-native';
import { extractWithOCR } from './tier2-ocr';
import { extractWithClaudeVision } from './tier3-vision';
import { validateExtractionQuality } from './validation';

export interface PipelineResult {
  primaryText: string;
  primaryMethod: 'native_text' | 'ocr_tesseract' | 'claude_vision';
  primaryConfidence: number;
  validationStatus: 'auto_accept' | 'review_queue' | 'manual_entry_required';
  auditTrail: {
    fileName: string;
    attemptedMethods: Array<{
      method: string;
      confidence: number;
      success: boolean;
    }>;
    selectedMethod: string;
    reasoning: string;
    startedAt: string;
    completedAt: string;
  };
}

export async function extractFromPDFWithFallback(
  pdfBytes: Uint8Array,
  fileName: string
): Promise<PipelineResult> {
  const startTime = new Date();
  const attempts: Array<{
    method: string;
    confidence: number;
    success: boolean;
  }> = [];

  console.log(`[Pipeline] Starting extraction for ${fileName}`);

  // Tier 1: Native text extraction
  console.log(`[Pipeline] Attempting Tier 1 (native text)`);
  const tier1Result = await extractNativeTextFromPDF(pdfBytes, fileName);
  attempts.push({
    method: 'native_text',
    confidence: tier1Result.confidence,
    success: tier1Result.text.length > 0,
  });

  // Check if Tier 1 is sufficient
  if (tier1Result.confidence >= 0.8) {
    console.log(
      `[Pipeline] Tier 1 successful with confidence ${tier1Result.confidence}`
    );
    const validation = validateExtractionQuality(
      tier1Result.text,
      tier1Result.confidence,
      'native_text'
    );

    return {
      primaryText: tier1Result.text,
      primaryMethod: 'native_text',
      primaryConfidence: validation.finalConfidence,
      validationStatus:
        validation.finalConfidence > 0.85
          ? 'auto_accept'
          : validation.finalConfidence > 0.65
            ? 'review_queue'
            : 'manual_entry_required',
      auditTrail: {
        fileName,
        attemptedMethods: attempts,
        selectedMethod: 'native_text',
        reasoning: `Native text extraction succeeded with confidence ${tier1Result.confidence}`,
        startedAt: startTime.toISOString(),
        completedAt: new Date().toISOString(),
      },
    };
  }

  // Tier 2: OCR extraction
  console.log(
    `[Pipeline] Tier 1 confidence low (${tier1Result.confidence}), attempting Tier 2 (OCR)`
  );

  let bestOCRConfidence = 0;
  let bestOCRText = '';

  for (let page = 1; page <= tier1Result.pageCount && page <= 3; page++) {
    try {
      const tier2Result = await extractWithOCR(pdfBytes, fileName, page);
      if (tier2Result.confidence > bestOCRConfidence) {
        bestOCRConfidence = tier2Result.confidence;
        bestOCRText =
          (bestOCRText ? bestOCRText + '\n---PAGE BREAK---\n' : '') +
          tier2Result.text;
      }
    } catch (error) {
      console.error(`[Pipeline] OCR error on page ${page}`, error);
    }
  }

  attempts.push({
    method: 'ocr_tesseract',
    confidence: bestOCRConfidence,
    success: bestOCRText.length > 0,
  });

  // Check if Tier 2 is acceptable
  if (bestOCRConfidence >= 0.65) {
    console.log(
      `[Pipeline] Tier 2 (OCR) succeeded with confidence ${bestOCRConfidence}`
    );
    const validation = validateExtractionQuality(
      bestOCRText,
      bestOCRConfidence,
      'ocr_tesseract'
    );

    return {
      primaryText: bestOCRText,
      primaryMethod: 'ocr_tesseract',
      primaryConfidence: validation.finalConfidence,
      validationStatus:
        validation.finalConfidence > 0.85
          ? 'auto_accept'
          : validation.finalConfidence > 0.65
            ? 'review_queue'
            : 'manual_entry_required',
      auditTrail: {
        fileName,
        attemptedMethods: attempts,
        selectedMethod: 'ocr_tesseract',
        reasoning: `OCR extraction succeeded with confidence ${bestOCRConfidence}`,
        startedAt: startTime.toISOString(),
        completedAt: new Date().toISOString(),
      },
    };
  }

  // Tier 3: Claude Vision fallback
  console.log(
    `[Pipeline] Tier 2 confidence low (${bestOCRConfidence}), attempting Tier 3 (Claude Vision)`
  );

  let bestVisionConfidence = 0;
  let bestVisionText = '';

  // For now, return best available result since Vision needs actual image data
  attempts.push({
    method: 'claude_vision',
    confidence: 0,
    success: false,
  });

  // Return best available result
  const bestText =
    bestOCRText.length > 0 ? bestOCRText : tier1Result.text;
  const bestMethod =
    bestOCRText.length > 0 ? 'ocr_tesseract' : 'native_text';
  const bestConfidence =
    bestOCRText.length > 0 ? bestOCRConfidence : tier1Result.confidence;

  const validation = validateExtractionQuality(
    bestText,
    bestConfidence,
    bestMethod as any
  );

  return {
    primaryText: bestText,
    primaryMethod: bestMethod as any,
    primaryConfidence: validation.finalConfidence,
    validationStatus:
      validation.finalConfidence > 0.85
        ? 'auto_accept'
        : validation.finalConfidence > 0.65
          ? 'review_queue'
          : 'manual_entry_required',
    auditTrail: {
      fileName,
      attemptedMethods: attempts,
      selectedMethod: bestMethod,
      reasoning: `Attempted Tier 1 and 2. Selected ${bestMethod} with confidence ${validation.finalConfidence}`,
      startedAt: startTime.toISOString(),
      completedAt: new Date().toISOString(),
    },
  };
}
