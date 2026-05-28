import { Finding } from './schema';

/**
 * Determines if two findings represent the same vulnerability on the same asset.
 * Context-aware: same vulnerability on different assets = different findings.
 */
export function isSameFinding(finding1: Finding, finding2: Finding): boolean {
  // Must have same vulnerability type AND same asset
  const sameType = finding1.finding_type === finding2.finding_type;
  const sameAsset = finding1.asset_id === finding2.asset_id;

  return sameType && sameAsset;
}

/**
 * Group findings by finding_type + asset_id.
 * Returns array of duplicate groups (each group is array of finding IDs).
 */
export function detectDuplicates(findings: Finding[]): string[][] {
  const groups: Record<string, string[]> = {};

  findings.forEach(finding => {
    const key = `${finding.finding_type}::${finding.asset_id}`;
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
 */
export function getDuplicateGroup(
  findings: Finding[],
  findingId: string
): Finding[] {
  const targetFinding = findings.find(f => f.id === findingId);
  if (!targetFinding) return [];

  return findings.filter(f =>
    isSameFinding(f, targetFinding) || f.duplicate_group_id === targetFinding.duplicate_group_id
  );
}

/**
 * Merge multiple findings into one master, marking others as duplicates.
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
        duplicate_group_id: undefined
      };
    } else if (duplicateIds.includes(finding.id)) {
      // Duplicate: link to master
      return {
        ...finding,
        is_confirmed_unique: false,
        duplicate_group_id: masterFindingId
      };
    }
    return finding;
  });
}

/**
 * Unmark a finding as duplicate (analyst override).
 */
export function confirmUnique(finding: Finding): Finding {
  return {
    ...finding,
    is_confirmed_unique: true,
    duplicate_group_id: undefined
  };
}
