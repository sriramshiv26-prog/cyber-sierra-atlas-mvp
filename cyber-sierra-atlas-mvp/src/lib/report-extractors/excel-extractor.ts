import { ExtractionResult, ExtractedFinding, ExtractionMetadata } from './pdf-extractor';

export async function extractFindingsFromExcel(
  fileBytes: Uint8Array,
  fileName: string
): Promise<ExtractionResult> {
  const startTime = new Date().toISOString();

  try {
    // Parse Excel using a simple approach (cells contain findings)
    // For full implementation, would use XLSX library
    const findings = parseExcelBytes(fileBytes);

    return {
      findings,
      rawText: findings.map(f => f.rawText).join('\n'),
      confidence: findings.length > 0 ? 0.85 : 0.3,
      metadata: {
        fileName,
        fileType: 'excel',
        extractedAt: startTime,
        extractionMethod: 'excel-parser'
      }
    };
  } catch (error) {
    return {
      findings: [],
      rawText: '',
      confidence: 0,
      metadata: {
        fileName,
        fileType: 'excel',
        extractedAt: startTime
      }
    };
  }
}

function parseExcelBytes(bytes: Uint8Array): ExtractedFinding[] {
  // Simplified: look for common audit patterns in bytes
  // Real implementation would use XLSX library to parse structure
  const text = new TextDecoder().decode(bytes).replace(/\0/g, '');

  if (!text || text.length < 10) return [];

  // Extract severity patterns from text
  const severities = ['Critical', 'High', 'Medium', 'Low'];
  const findings: ExtractedFinding[] = [];

  // Split by rows (heuristic: \n or common separators)
  const rows = text.split(/[\n\r]+/).filter(row => row.trim().length > 0);

  for (const row of rows) {
    for (const severity of severities) {
      if (row.toUpperCase().includes(severity.toUpperCase())) {
        findings.push({
          title: row.substring(0, 100).trim(),
          severity: severity as any,
          rawText: row.trim()
        });
        break;
      }
    }
  }

  return findings.length > 0 ? findings : [];
}
