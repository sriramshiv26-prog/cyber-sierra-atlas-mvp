import { Finding, Duplicate } from './schema';

/**
 * Deduplication Engine
 * 
 * In enterprise security/audit contexts, the same finding often appears across multiple reports
 * (e.g., an automated scan vs. a manual penetration test).
 * We use a tiered approach: Exact Matches $\rightarrow$ Semantic Matches.
 */

/**
 * Finds findings that are identical in terms of CVE and Asset.
 * This is a high-confidence match.
 */
export function findExactDuplicates(findings: Finding[]): Duplicate[] {
  const duplicates: Duplicate[] = [];

  for (let i = 0; i < findings.length; i++) {
    for (let j = i + 1; j < findings.length; j++) {
      const f1 = findings[i];
      const f2 = findings[j];

      // Tier 1: CVE + Asset ID (Highest confidence)
      if (f1.cve && f1.cve === f2.cve && f1.asset_id === f2.asset_id) {
        duplicates.push({
          finding1: f1.id,
          finding2: f2.id,
          reason: `EXACT MATCH: Same CVE (${f1.cve}) and Asset`,
          confidence: 1.0,
          action: 'merge',
        });
      }

      // Tier 2: Exact Title + Asset + Same Source Document
      if (
        f1.title.toLowerCase() === f2.title.toLowerCase() &&
        f1.asset_id === f2.asset_id &&
        f1.source_document.filename === f2.source_document.filename
      ) {
        duplicates.push({
          finding1: f1.id,
          finding2: f2.id,
          reason: 'EXACT MATCH: Duplicate entry in same source document',
          confidence: 1.0,
          action: 'merge',
        });
      }
    }
  }

  return duplicates;
}

/**
 * Finds findings that are semantically similar based on title and asset.
 * Uses a simple Cosine Similarity on tokens for MVP.
 */
export function findSemanticDuplicates(findings: Finding[]): Duplicate[] {
  const duplicates: Duplicate[] = [];
  const SIMILARITY_THRESHOLD = 0.85;

  for (let i = 0; i < findings.length; i++) {
    for (let j = i + 1; j < findings.length; j++) {
      const f1 = findings[i];
      const f2 = findings[j];

      // Only compare if they are on the same asset
      if (f1.asset_id === f2.asset_id) {
        const similarity = calculateCosineSimilarity(f1.title, f2.title);
        
        if (similarity >= SIMILARITY_THRESHOLD) {
          duplicates.push({
            finding1: f1.id,
            finding2: f2.id,
            reason: `SEMANTIC MATCH: ${Math.round(similarity * 100)}% title similarity`,
            confidence: similarity,
            action: 'user_review',
          });
        }
      }
    }
  }

  return duplicates;
}

/**
 * Calculates cosine similarity between two strings.
 * Tokenizes text and measures the cosine of the angle between two vectors.
 */
function calculateCosineSimilarity(a: string, b: string): number {
  const tokenize = (text: string) => 
    text.toLowerCase().split(/\W+/).filter(t => t.length > 2);

  const tokensA = tokenize(a);
  const tokensB = tokenize(b);

  const vocab = new Set([...tokensA, ...tokensB]);
  const vecA = Array.from(vocab).map(w => tokensA.includes(w) ? 1 : 0);
  const vecB = Array.from(vocab).map(w => tokensB.includes(w) ? 1 : 0);

  const dotProduct = vecA.reduce((sum, v, i) => sum + v * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(vecB.reduce((sum, v) => sum + v * v, 0));

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

/**
 * Merges two findings into one.
 * Logic: The most conservative (highest) severity is always preserved.
 */
export function mergeFindings(primary: Finding, secondary: Finding): Finding {
  const severityRank = { Critical: 5, High: 4, Medium: 3, Low: 2, Informational: 1 };
  
  const prioritySeverity = severityRank[primary.severity] >= severityRank[secondary.severity]
    ? primary.severity
    : secondary.severity;

  return {
    ...primary,
    severity: prioritySeverity,
    related_findings: [...new Set([...primary.related_findings, secondary.id])],
    deduped_with: secondary.id,
    updated_at: new Date().toISOString(),
  };
}
