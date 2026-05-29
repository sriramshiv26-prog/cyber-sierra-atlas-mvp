import { Finding } from './schema';

/**
 * Context-aware duplicate detection: same vulnerability on same asset only.
 * Returns true if two findings represent the same issue on the same asset.
 */
export function isSameFinding(finding1: Finding, finding2: Finding): boolean {
  // Core rule: must be on same asset
  if (finding1.asset_id !== finding2.asset_id) return false;

  // Rule 1: Same CVE (if available)
  if (finding1.cve && finding2.cve && finding1.cve === finding2.cve) return true;

  // Rule 2: Same title (exact match after normalization)
  const normalize = (s: string) => s.toLowerCase().trim();
  if (normalize(finding1.title) === normalize(finding2.title)) return true;

  // Rule 3: Same control clause (same vulnerability framework requirement)
  if (finding1.control_clause && finding2.control_clause &&
      finding1.control_clause === finding2.control_clause &&
      finding1.control_framework === finding2.control_framework) return true;

  return false;
}

/**
 * Group findings by context: (CVE || Title) + Asset.
 * Returns array of duplicate groups (each group is array of finding IDs).
 * Phase 2B: Context-aware deduplication only groups same vuln + same asset.
 */
export function detectDuplicates(findings: Finding[]): string[][] {
  const groups: Record<string, string[]> = {};

  findings.forEach(finding => {
    // Skip already-marked duplicates
    if (finding.is_confirmed_unique === false && finding.duplicate_group_id) return;

    // Build key: prioritize CVE, fall back to normalized title, finally asset only
    let key: string;
    if (finding.cve) {
      key = `CVE::${finding.cve}::${finding.asset_id}`;
    } else {
      const normalizedTitle = finding.title.toLowerCase().trim();
      key = `TITLE::${normalizedTitle}::${finding.asset_id}`;
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(finding.id);
  });

  // Return only groups with 2+ findings (actual duplicates)
  return Object.values(groups).filter(group => group.length > 1);
}

/**
 * Find all findings in a duplicate group (given one finding ID).
 * Returns master + all duplicates linked to it.
 */
export function getDuplicateGroup(
  findings: Finding[],
  findingId: string
): Finding[] {
  const targetFinding = findings.find(f => f.id === findingId);
  if (!targetFinding) return [];

  // If it's a duplicate, find its master
  let masterId = findingId;
  if (targetFinding.duplicate_group_id) {
    masterId = targetFinding.duplicate_group_id;
  }

  // Return all findings linked to this master
  return findings.filter(f =>
    f.id === masterId || f.duplicate_group_id === masterId
  );
}

/**
 * Merge multiple findings into one master, marking others as duplicates.
 * The master finding is marked as confirmed unique.
 * All duplicates are linked to the master via duplicate_group_id.
 * Returns updated findings array.
 */
export function mergeDuplicates(
  findings: Finding[],
  masterFindingId: string,
  duplicateIds: string[]
): Finding[] {
  const masterFinding = findings.find(f => f.id === masterFindingId);
  if (!masterFinding) return findings;

  return findings.map(finding => {
    if (finding.id === masterFindingId) {
      // Master finding: mark as unique
      return {
        ...finding,
        is_confirmed_unique: true,
        duplicate_group_id: undefined,
        related_findings: [
          ...new Set([...(finding.related_findings || []), ...duplicateIds])
        ],
        updated_at: new Date().toISOString(),
      };
    } else if (duplicateIds.includes(finding.id)) {
      // Duplicate: link to master
      return {
        ...finding,
        is_confirmed_unique: false,
        duplicate_group_id: masterFindingId,
        updated_at: new Date().toISOString(),
      };
    }
    return finding;
  });
}

/**
 * Mark a finding as confirmed unique (override dedup suggestion).
 * Unlinks it from any duplicate group and marks as unique.
 */
export function confirmUnique(finding: Finding): Finding {
  return {
    ...finding,
    is_confirmed_unique: true,
    duplicate_group_id: undefined,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Unconfirm a duplicate marking (analyst changes their mind).
 * Reverts is_confirmed_unique and duplicate_group_id.
 */
export function unmarkDuplicate(finding: Finding): Finding {
  return {
    ...finding,
    is_confirmed_unique: undefined,
    duplicate_group_id: undefined,
    updated_at: new Date().toISOString(),
  };
}
