/**
 * MarkItDown Converter Module
 * Provides preprocessing capabilities for multi-format files (JSON, CSV, HTML, etc.)
 * Converts various formats to Markdown for consistent LLM processing
 */

/**
 * Supported file formats for preprocessing
 */
export type SupportedFormat = 'pdf' | 'xlsx' | 'docx' | 'json' | 'csv' | 'html' | 'md' | 'txt';

/**
 * Detects the file type based on filename extension
 * @param filename The filename to analyze
 * @returns The detected format or null if not recognized
 */
export function getFileType(filename: string): SupportedFormat | null {
  const ext = filename.toLowerCase().split('.').pop();

  const formatMap: { [key: string]: SupportedFormat } = {
    'pdf': 'pdf',
    'xlsx': 'xlsx',
    'xls': 'xlsx',
    'docx': 'docx',
    'doc': 'docx',
    'json': 'json',
    'csv': 'csv',
    'html': 'html',
    'htm': 'html',
    'md': 'md',
    'markdown': 'md',
    'txt': 'txt',
    'text': 'txt',
  };

  return ext && formatMap[ext] ? formatMap[ext] : null;
}

/**
 * Checks if a file format is supported for preprocessing
 * @param filename The filename to check
 * @returns true if the format is supported
 */
export function isSupportedFormat(filename: string): boolean {
  return getFileType(filename) !== null;
}

/**
 * Determines if a file should be preprocessed
 * PDF and Markdown files are handled natively, others should be converted
 * @param filename The filename to check
 * @returns true if the file should be preprocessed
 */
export function shouldPreprocessFile(filename: string): boolean {
  const format = getFileType(filename);
  // Don't preprocess PDF (handled by extraction) or Markdown (already structured)
  return format !== null && format !== 'pdf' && format !== 'md';
}

/**
 * Convert JSON content to Markdown format
 * Handles both objects and arrays
 * @param jsonContent The JSON string content
 * @returns Markdown representation of the JSON
 */
export function jsonToMarkdown(jsonContent: string): string {
  try {
    const data = JSON.parse(jsonContent);
    return jsonDataToMarkdown(data);
  } catch (e) {
    // If JSON parsing fails, return wrapped content
    return '```json\n' + jsonContent + '\n```';
  }
}

/**
 * Internal helper to recursively convert JSON data to Markdown
 */
function jsonDataToMarkdown(data: any, depth: number = 0): string {
  const indent = '  '.repeat(depth);

  if (data === null || data === undefined) {
    return '';
  }

  if (typeof data === 'string') {
    return data;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return String(data);
  }

  if (Array.isArray(data)) {
    // Convert array to markdown list
    const items = data
      .map((item) => {
        if (typeof item === 'object' && item !== null) {
          const itemMarkdown = jsonDataToMarkdown(item, depth + 1);
          // For objects in arrays, include all content
          if (Array.isArray(item)) {
            return indent + '- ' + itemMarkdown;
          } else {
            return indent + '- ' + itemMarkdown.replace(/\n/g, '\n' + indent + '  ');
          }
        } else {
          return indent + '- ' + String(item);
        }
      });
    return items.join('\n');
  }

  if (typeof data === 'object') {
    // Convert object to markdown key-value format
    const lines: string[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) continue;

      if (typeof value === 'object') {
        lines.push(indent + '**' + key + ':**');
        lines.push(jsonDataToMarkdown(value, depth + 1));
      } else {
        lines.push(indent + '**' + key + ':** ' + String(value));
      }
    }
    return lines.join('\n');
  }

  return String(data);
}

/**
 * Convert CSV content to Markdown table format
 * Assumes first row is headers
 * @param csvContent The CSV string content
 * @returns Markdown table representation
 */
export function csvToMarkdown(csvContent: string): string {
  if (!csvContent || csvContent.trim().length === 0) {
    return '';
  }

  const lines = csvContent.trim().split('\n');

  if (lines.length === 0) {
    return '';
  }

  // Simple CSV parsing (handles basic case, not quoted fields with commas)
  const headers = parseCSVLine(lines[0]);

  if (lines.length === 1) {
    return createMarkdownTable(headers, []);
  }

  const rows = lines.slice(1).map(line => parseCSVLine(line));
  return createMarkdownTable(headers, rows);
}

/**
 * Parse a CSV line (simple version without quote handling)
 */
function parseCSVLine(line: string): string[] {
  return line.split(',').map(cell => cell.trim());
}

/**
 * Create a Markdown table from headers and rows
 */
function createMarkdownTable(headers: string[], rows: string[][]): string {
  const headerLine = '| ' + headers.join(' | ') + ' |';
  const separatorLine = '| ' + headers.map(() => '---').join(' | ') + ' |';

  const rowLines = rows.map(row => {
    // Ensure row has same number of columns as headers
    const paddedRow = [...row];
    while (paddedRow.length < headers.length) {
      paddedRow.push('');
    }
    return '| ' + paddedRow.slice(0, headers.length).join(' | ') + ' |';
  });

  return [headerLine, separatorLine, ...rowLines].join('\n');
}

/**
 * Convert various file formats to Markdown
 * Currently supports: JSON, CSV, HTML (basic), TXT
 * @param content The file content
 * @param filename The filename (used to determine format)
 * @returns Markdown representation of the content
 */
export function convertToMarkdown(content: string, filename: string): string {
  const format = getFileType(filename);

  switch (format) {
    case 'json':
      return jsonToMarkdown(content);
    case 'csv':
      return csvToMarkdown(content);
    case 'html':
      // Basic HTML handling: just extract text content
      return htmlToMarkdown(content);
    case 'txt':
      return content;
    case 'md':
      return content;
    default:
      return content;
  }
}

/**
 * Basic HTML to Markdown conversion
 * Extracts text and preserves basic structure
 */
function htmlToMarkdown(htmlContent: string): string {
  // Remove script and style elements
  let text = htmlContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Convert common HTML tags to Markdown
  text = text
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n')
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<a[^>]*href=["']([^"']*?)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<[^>]+>/g, ''); // Remove remaining HTML tags

  // Decode HTML entities
  text = decodeHTMLEntities(text);

  // Clean up excessive whitespace
  text = text
    .replace(/\n\n\n+/g, '\n\n')
    .trim();

  return text;
}

/**
 * Decode HTML entities
 */
function decodeHTMLEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&nbsp;': ' ',
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  // Handle numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (match, code) => {
    return String.fromCharCode(parseInt(code, 10));
  });
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, code) => {
    return String.fromCharCode(parseInt(code, 16));
  });

  return decoded;
}
