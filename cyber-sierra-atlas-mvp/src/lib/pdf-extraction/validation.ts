export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  finalConfidence: number;
  errors: string[];
  warnings: string[];
  requiresManualReview: boolean;
}

export function validateExtractionQuality(
  text: string,
  confidence: number,
  method: 'native_text' | 'ocr_tesseract' | 'claude_vision'
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let confidenceDeduction = 0;

  if (!text || text.trim().length === 0) {
    errors.push('Text content is empty');
    confidenceDeduction += 0.5;
  }

  if (text.trim().length < 10) {
    errors.push('Extracted text too short (< 10 characters)');
    confidenceDeduction += 0.3;
  }

  if (method === 'ocr_tesseract') {
    if (confidence < 0.65) {
      warnings.push('OCR confidence low (< 65%), recommend manual review');
      confidenceDeduction += 0.1;
    }

    const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    const letterRatio = letterCount / (totalChars || 1);

    if (letterRatio < 0.4) {
      warnings.push('OCR text appears to be gibberish (low letter ratio)');
      confidenceDeduction += 0.2;
    }

    if (text === text.toUpperCase() && text.length > 20) {
      warnings.push('Text is all uppercase, possible OCR corruption');
      confidenceDeduction += 0.15;
    }
  }

  if (method === 'claude_vision' && confidence < 0.8) {
    warnings.push('Claude Vision confidence below expected threshold');
    confidenceDeduction += 0.05;
  }

  const findingKeywords = [
    'finding',
    'severity',
    'control',
    'asset',
    'status',
    'critical',
    'high',
    'medium',
    'low',
    'open',
    'closed',
  ];
  const hasRelevantKeywords = findingKeywords.some((keyword) =>
    text.toLowerCase().includes(keyword)
  );

  if (!hasRelevantKeywords && method !== 'native_text') {
    warnings.push(
      'Extracted text lacks security/audit keywords, may be irrelevant'
    );
    confidenceDeduction += 0.1;
  }

  const finalConfidence = Math.max(0, confidence - confidenceDeduction);
  const requiresManualReview = finalConfidence < 0.65 || errors.length > 0;

  return {
    isValid: errors.length === 0,
    confidence,
    finalConfidence,
    errors,
    warnings,
    requiresManualReview,
  };
}

export function calculateExtractionConfidence(
  nativeConfidence: number,
  ocrConfidence: number | null,
  visionConfidence: number | null
): number {
  if (nativeConfidence >= 0.8) {
    return nativeConfidence;
  }

  const confidences = [nativeConfidence];
  if (ocrConfidence !== null) confidences.push(ocrConfidence);
  if (visionConfidence !== null) confidences.push(visionConfidence);

  return Math.max(...confidences);
}
