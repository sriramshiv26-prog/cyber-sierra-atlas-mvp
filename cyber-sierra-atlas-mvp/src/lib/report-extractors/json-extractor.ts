import { ExtractionResult, ExtractedFinding } from './pdf-extractor';

export async function extractFindingsFromJSON(
  fileBytes: Uint8Array,
  fileName: string
): Promise<ExtractionResult> {
  const startTime = new Date().toISOString();

  try {
    const text = new TextDecoder().decode(fileBytes);
    const data = JSON.parse(text);
    const findings = parseJSONFindings(data);

    return {
      findings,
      rawText: JSON.stringify(data, null, 2),
      confidence: findings.length > 0 ? 0.95 : 0.3,
      metadata: {
        fileName,
        fileType: 'json',
        extractedAt: startTime,
        extractionMethod: 'json-parser'
      }
    };
  } catch (error) {
    return {
      findings: [],
      rawText: '',
      confidence: 0,
      metadata: {
        fileName,
        fileType: 'json',
        extractedAt: startTime
      }
    };
  }
}

function parseJSONFindings(data: any): ExtractedFinding[] {
  const findings: ExtractedFinding[] = [];

  // Handle array of findings
  if (Array.isArray(data)) {
    for (const item of data) {
      const finding = extractFinding(item);
      if (finding) findings.push(finding);
    }
  }
  // Handle object with findings array
  else if (data && typeof data === 'object') {
    // Look for common property names
    const findingsProperty = Object.keys(data).find(key =>
      ['findings', 'issues', 'vulnerabilities', 'results', 'findings'].includes(key.toLowerCase())
    );

    if (findingsProperty && Array.isArray(data[findingsProperty])) {
      for (const item of data[findingsProperty]) {
        const finding = extractFinding(item);
        if (finding) findings.push(finding);
      }
    } else {
      // Try to extract from the object directly
      const finding = extractFinding(data);
      if (finding) findings.push(finding);
    }
  }

  return findings;
}

function extractFinding(item: any): ExtractedFinding | null {
  if (!item || typeof item !== 'object') return null;

  // Map common property names to standard fields
  const titleProps = ['title', 'name', 'finding', 'issue', 'description'];
  const severityProps = ['severity', 'level', 'priority', 'severity_level'];
  const textProps = ['description', 'details', 'content', 'text', 'body'];

  let title = titleProps
    .find(prop => item[prop])
    ?.split('.')
    .reduce((o: any, p: string) => o?.[p], item);

  let severity = severityProps
    .find(prop => item[prop])
    ?.split('.')
    .reduce((o: any, p: string) => o?.[p], item);

  let text = textProps
    .find(prop => item[prop])
    ?.split('.')
    .reduce((o: any, p: string) => o?.[p], item);

  if (!title) return null;

  // Normalize severity
  const normalizedSeverity = normalizeSeverity(String(severity || 'Medium'));

  return {
    title: String(title).substring(0, 200),
    severity: normalizedSeverity as any,
    rawText: String(text || JSON.stringify(item)).substring(0, 500)
  };
}

function normalizeSeverity(severity: string): string {
  const upper = severity.toUpperCase();
  if (upper.includes('CRITICAL') || upper.includes('CRITICAL')) return 'Critical';
  if (upper.includes('HIGH')) return 'High';
  if (upper.includes('MEDIUM') || upper.includes('MED')) return 'Medium';
  if (upper.includes('LOW')) return 'Low';
  return 'Medium';
}
