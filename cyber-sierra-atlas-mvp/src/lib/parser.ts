import * as pdfjsLib from 'pdfjs-dist';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { parseFindingsWithLLM } from './llm';
import { Finding } from './schema';
import { extractFromPDFWithFallback } from './pdf-extraction';
import { extractFindingsFromFile, ExtractionResult } from './report-extractors';
import { detectReportTypeFromBoth } from './report-detector';
import { standardizeExtractedFindings, standardizeManualFinding } from './audit-standardizer';
import { ManualFindingInput } from './audit-types';
import { shouldPreprocessFile, convertToMarkdown } from './markitdown-converter';

/**
 * PDF.js worker configuration.
 */
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Detects the file type and extracts the raw text content.
 * Now supports PDF, CSV, JSON, TXT, DOCX, and XLSX.
 */
export async function detectAndParseFile(file: File): Promise<Finding[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  let text = '';

  try {
    if (ext === 'pdf') {
      text = await extractTextFromPDF(file);
    } else if (ext === 'csv') {
      text = await extractTextFromCSV(file);
    } else if (ext === 'json') {
      text = await extractTextFromJSON(file);
    } else if (ext === 'docx') {
      text = await extractTextFromWord(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      text = await extractTextFromExcel(file);
    } else {
      // Default to plain text reading
      text = await file.text();
    }

    if (!text || text.trim().length === 0) {
      throw new Error('The uploaded file appears to be empty');
    }

    return await parseFindingsWithLLM(text, file.name);
  } catch (error) {
    console.error(`[File Parser Error] Failed to process ${file.name}:`, error);
    throw error;
  }
}

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfBytes = new Uint8Array(arrayBuffer);

  const result = await extractFromPDFWithFallback(pdfBytes, file.name);

  console.log(`[Parser] PDF extraction completed:`, {
    method: result.primaryMethod,
    confidence: result.primaryConfidence,
    validationStatus: result.validationStatus,
    fileName: file.name,
  });

  return result.primaryText;
}

async function extractTextFromCSV(file: File): Promise<string> {
  const text = await file.text();
  const results = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
  });

  return results.data.map((row: any) => {
    return Object.entries(row)
      .map(([key, val]) => `${key}: ${val}`)
      .join(' | ');
  }).join('\n');
}

async function extractTextFromJSON(file: File): Promise<string> {
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    return JSON.stringify(data, null, 2);
  } catch (e) {
    throw new Error('Invalid JSON file format');
  }
}

/**
 * Extracts text from .docx files using mammoth.
 */
async function extractTextFromWord(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Extracts text from .xlsx/.xls files using SheetJS.
 * Iterates through all sheets and converts them to semi-structured text.
 */
async function extractTextFromExcel(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
  let allSheetsText = '';

  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet);

    allSheetsText += `\nSheet: ${sheetName}\n`;
    allSheetsText += json.map((row: any) => {
      return Object.entries(row)
        .map(([key, val]) => `${key}: ${val}`)
        .join(' | ');
    }).join('\n');
  });

  return allSheetsText;
}

/**
 * Phase 4: Extract audit findings from file with automatic type detection and standardization
 * Supports: PDF, Excel, JSON, DOCX with confidence scoring and audit trail
 * Phase 5: Includes preprocessing for multi-format files (JSON, CSV, HTML → Markdown)
 */
export async function extractAuditFindings(file: File): Promise<Finding[]> {
  const arrayBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(arrayBuffer);
  const ext = file.name.split('.').pop()?.toLowerCase();

  try {
    // Get raw text for report type detection
    let rawText = await extractTextForDetection(file);

    // Preprocess file if needed (convert formats to Markdown)
    rawText = await preprocessFile(file.name, rawText);

    // Detect report type from filename + content
    const reportType = detectReportTypeFromBoth(rawText, file.name);
    if (!reportType) {
      throw new Error(`Could not detect audit report type for ${file.name}`);
    }

    console.log(`[Audit Parser] Detected report type: ${reportType} for ${file.name}`);

    // Extract findings using format-specific extractor
    const extractionResult = await extractFindingsFromFile(fileBytes, file.name, file.type);

    console.log(`[Audit Parser] Extracted ${extractionResult.findings.length} findings with confidence ${extractionResult.metadata.extractedAt}`);

    // Standardize to Finding schema
    const standardizedFindings = standardizeExtractedFindings(
      extractionResult.findings,
      extractionResult.metadata,
      reportType
    );

    return standardizedFindings;
  } catch (error) {
    console.error(`[Audit Parser Error] Failed to extract audit findings from ${file.name}:`, error);
    throw error;
  }
}

/**
 * Convert manual finding entry to standardized Finding schema
 */
export function parseManualFinding(input: ManualFindingInput): Finding {
  try {
    return standardizeManualFinding(input);
  } catch (error) {
    console.error('[Manual Finding Parser Error]', error);
    throw error;
  }
}

/**
 * Preprocess file content if needed (convert formats to Markdown)
 * @param filename The filename
 * @param content The raw file content
 * @returns Preprocessed content (converted to Markdown if needed)
 */
export async function preprocessFile(filename: string, content: string): Promise<string> {
  if (shouldPreprocessFile(filename)) {
    console.log(`[Preprocessor] Converting ${filename} to Markdown format`);
    try {
      const converted = convertToMarkdown(content, filename);
      console.log(`[Preprocessor] Successfully converted ${filename}`);
      return converted;
    } catch (error) {
      console.warn(`[Preprocessor] Conversion failed for ${filename}, using original content:`, error);
      return content;
    }
  }
  return content;
}

/**
 * Helper to extract raw text for report type detection
 */
async function extractTextForDetection(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  try {
    if (ext === 'pdf') {
      return await extractTextFromPDF(file);
    } else if (ext === 'csv') {
      return await extractTextFromCSV(file);
    } else if (ext === 'json') {
      return await extractTextFromJSON(file);
    } else if (ext === 'docx') {
      return await extractTextFromWord(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      return await extractTextFromExcel(file);
    } else {
      return await file.text();
    }
  } catch (error) {
    console.warn(`[Parser] Could not extract text from ${file.name} for detection:`, error);
    return file.name; // Fallback to filename for detection
  }
}
