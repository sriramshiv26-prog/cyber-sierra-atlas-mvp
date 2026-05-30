export { extractFindingsFromPDF } from './pdf-extractor';
export { extractFindingsFromExcel } from './excel-extractor';
export { extractFindingsFromJSON } from './json-extractor';
export { extractFindingsFromDOCX } from './docx-extractor';
export type { ExtractionResult, ExtractedFinding, ExtractionMetadata } from './pdf-extractor';

import { ExtractionResult } from './pdf-extractor';
import { extractFindingsFromPDF } from './pdf-extractor';
import { extractFindingsFromExcel } from './excel-extractor';
import { extractFindingsFromJSON } from './json-extractor';
import { extractFindingsFromDOCX } from './docx-extractor';

export async function extractFindingsFromFile(
  fileBytes: Uint8Array,
  fileName: string,
  mimeType?: string
): Promise<ExtractionResult> {
  // Detect format from filename or MIME type
  const lower = fileName.toLowerCase();
  const ext = lower.split('.').pop() || '';

  if (ext === 'pdf' || mimeType?.includes('pdf')) {
    return extractFindingsFromPDF(fileBytes, fileName);
  }

  if (['xlsx', 'xls', 'csv'].includes(ext) || mimeType?.includes('sheet')) {
    return extractFindingsFromExcel(fileBytes, fileName);
  }

  if (ext === 'json' || mimeType?.includes('json')) {
    return extractFindingsFromJSON(fileBytes, fileName);
  }

  if (ext === 'docx' || ext === 'doc' || mimeType?.includes('word')) {
    return extractFindingsFromDOCX(fileBytes, fileName);
  }

  // Default to text-based extraction
  throw new Error(`Unsupported file format: ${ext}`);
}

export function getSupportedFileTypes(): string[] {
  return ['.pdf', '.xlsx', '.xls', '.csv', '.json', '.docx', '.doc'];
}
