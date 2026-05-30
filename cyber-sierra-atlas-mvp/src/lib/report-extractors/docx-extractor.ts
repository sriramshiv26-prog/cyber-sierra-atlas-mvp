import { ExtractionResult, ExtractedFinding } from './pdf-extractor';

export async function extractFindingsFromDOCX(
  fileBytes: Uint8Array,
  fileName: string
): Promise<ExtractionResult> {
  const startTime = new Date().toISOString();

  try {
    // DOCX is a ZIP archive containing XML
    // Simplified: extract text from XML content
    const text = await extractTextFromDocxZip(fileBytes);
    const findings = parseDocxText(text);

    return {
      findings,
      rawText: text,
      confidence: findings.length > 0 ? 0.80 : 0.4,
      metadata: {
        fileName,
        fileType: 'docx',
        extractedAt: startTime,
        extractionMethod: 'docx-parser'
      }
    };
  } catch (error) {
    return {
      findings: [],
      rawText: '',
      confidence: 0,
      metadata: {
        fileName,
        fileType: 'docx',
        extractedAt: startTime
      }
    };
  }
}

async function extractTextFromDocxZip(bytes: Uint8Array): Promise<string> {
  // Simplified: try to extract text from XML-like structure
  // Real implementation would use a ZIP library to read document.xml
  const text = new TextDecoder().decode(bytes);

  // Look for text between XML tags (simplified)
  const textMatches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
  const extracted = textMatches
    .map(match => match.replace(/<[^>]+>/g, ''))
    .join(' ');

  if (extracted.length > 0) return extracted;

  // Fallback: return all printable characters
  return text.replace(/[^\x20-\x7E\n]/g, '');
}

function parseDocxText(text: string): ExtractedFinding[] {
  if (!text || text.length === 0) return [];

  const findings: ExtractedFinding[] = [];
  const lines = text.split('\n').filter(line => line.trim().length > 0);

  let currentFinding: Partial<ExtractedFinding> | null = null;
  let currentSeverity: string | null = null;

  const severityMap: Record<string, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low'
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if line contains severity marker
    let foundSeverity: string | null = null;
    for (const [key, value] of Object.entries(severityMap)) {
      if (trimmed.toUpperCase().includes(key.toUpperCase())) {
        foundSeverity = value;
        break;
      }
    }

    if (foundSeverity) {
      // Save previous finding
      if (currentFinding && currentFinding.title && currentSeverity) {
        findings.push({
          title: String(currentFinding.title),
          severity: currentSeverity as any,
          rawText: String(currentFinding.rawText || '')
        });
      }

      // Start new finding
      currentSeverity = foundSeverity;
      currentFinding = {
        title: trimmed.substring(0, 100),
        severity: foundSeverity,
        rawText: trimmed
      };
    } else if (currentFinding && trimmed.length > 0) {
      // Append to current finding
      currentFinding.rawText = (currentFinding.rawText || '') + ' ' + trimmed;
    }
  }

  // Add last finding
  if (currentFinding && currentFinding.title && currentSeverity) {
    findings.push({
      title: String(currentFinding.title),
      severity: currentSeverity as any,
      rawText: String(currentFinding.rawText || '')
    });
  }

  return findings;
}
