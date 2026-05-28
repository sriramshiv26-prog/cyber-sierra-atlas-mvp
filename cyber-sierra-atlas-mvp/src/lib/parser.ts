import * as pdfjsLib from 'pdfjs-dist';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { parseFindingsWithLLM } from './llm';
import { Finding } from './schema';

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
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
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
