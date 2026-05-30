import { extractFromPDFWithFallback } from '../pdf-extraction';

export interface ExtractedFinding {
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  rawText: string;
}

export interface ExtractionResult {
  findings: ExtractedFinding[];
  rawText: string;
  confidence: number;
  metadata: ExtractionMetadata;
}

export interface ExtractionMetadata {
  fileName: string;
  fileType: 'pdf' | 'excel' | 'json' | 'docx';
  extractedAt: string;
  extractionMethod?: string;
  pageCount?: number;
}

export async function extractFindingsFromPDF(
  pdfBytes: Uint8Array,
  fileName: string
): Promise<ExtractionResult> {
  const startTime = new Date().toISOString();

  try {
    // Use Phase 4b multi-tier extraction pipeline
    const pipelineResult = await extractFromPDFWithFallback(pdfBytes, fileName);

    const findings = parseTextIntoFindings(pipelineResult.primaryText);

    return {
      findings,
      rawText: pipelineResult.primaryText,
      confidence: pipelineResult.primaryConfidence,
      metadata: {
        fileName,
        fileType: 'pdf',
        extractedAt: startTime,
        extractionMethod: pipelineResult.primaryMethod,
        pageCount: pipelineResult.auditTrail?.metadata?.pageCount
      }
    };
  } catch (error) {
    // Graceful degradation: return empty findings with error metadata
    return {
      findings: [],
      rawText: '',
      confidence: 0,
      metadata: {
        fileName,
        fileType: 'pdf',
        extractedAt: startTime
      }
    };
  }
}

function parseTextIntoFindings(text: string): ExtractedFinding[] {
  if (!text || text.length === 0) return [];

  const findings: ExtractedFinding[] = [];

  // Simple heuristic: split by severity keywords
  const severityKeywords = {
    'Critical': ['CRITICAL', 'CRITICAL:', 'SEVERITY: CRITICAL', 'SEVERITY CRITICAL'],
    'High': ['HIGH', 'HIGH:', 'SEVERITY: HIGH', 'SEVERITY HIGH'],
    'Medium': ['MEDIUM', 'MEDIUM:', 'SEVERITY: MEDIUM', 'MEDIUM PRIORITY'],
    'Low': ['LOW', 'LOW:', 'SEVERITY: LOW', 'INFORMATIONAL']
  };

  // If no severity keywords found, create a generic finding
  if (!text.match(/CRITICAL|HIGH|MEDIUM|LOW|Severity/i)) {
    return [{
      title: 'Extracted Findings',
      severity: 'Medium',
      rawText: text.substring(0, 500)
    }];
  }

  // Extract segments by severity
  const lines = text.split('\n');
  let currentFinding: Partial<ExtractedFinding> | null = null;
  let currentSeverity: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for severity markers
    let matchedSeverity: string | null = null;
    for (const [severity, keywords] of Object.entries(severityKeywords)) {
      if (keywords.some(kw => trimmed.toUpperCase().includes(kw))) {
        matchedSeverity = severity;
        break;
      }
    }

    if (matchedSeverity) {
      // Save previous finding if exists
      if (currentFinding && currentFinding.title && currentSeverity) {
        findings.push({
          title: currentFinding.title,
          severity: currentSeverity as any,
          rawText: currentFinding.rawText || ''
        });
      }

      // Start new finding
      currentSeverity = matchedSeverity;
      currentFinding = {
        title: trimmed,
        severity: matchedSeverity as any,
        rawText: trimmed
      };
    } else if (currentFinding && trimmed.length > 0) {
      // Append to current finding
      currentFinding.rawText = (currentFinding.rawText || '') + '\n' + trimmed;
    }
  }

  // Add last finding
  if (currentFinding && currentFinding.title && currentSeverity) {
    findings.push({
      title: currentFinding.title,
      severity: currentSeverity as any,
      rawText: currentFinding.rawText || ''
    });
  }

  return findings.length > 0 ? findings : [{
    title: 'Extracted Content',
    severity: 'Medium',
    rawText: text.substring(0, 500)
  }];
}
