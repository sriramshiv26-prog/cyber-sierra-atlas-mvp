/**
 * Immutable append-only audit log for compliance and tracking
 * Uses localStorage for persistence with write-once guarantees
 */

export interface AuditEntry {
  id: string;
  timestamp: string; // ISO8601
  action: 'ADD_FINDINGS' | 'UPDATE_FINDING' | 'DELETE_FINDING' | 'MERGE_DUPLICATES' | 'CONFIRM_UNIQUE' | 'UNMARK_DUPLICATE' | 'DETECT_DUPLICATES' | 'UPDATE_REMEDIATION_STATUS' | 'UPDATE_REMEDIATION' | 'ADD_ASSET' | 'UPDATE_ASSET' | 'DELETE_ASSET';
  user: string; // Username or system identifier
  findingId?: string; // For single finding operations
  findingIds?: string[]; // For bulk operations
  assetId?: string; // For asset operations
  changes?: Record<string, { before: unknown; after: unknown }>; // For UPDATE operations
  reason?: string; // Why the action was taken
  metadata?: Record<string, unknown>; // Additional context
}

// Unique counter for audit entry IDs to ensure no collisions
let auditIdCounter = 0;

/**
 * Generate a unique immutable audit entry ID
 */
function generateAuditId(): string {
  const timestamp = Date.now();
  const counter = ++auditIdCounter;
  const random = Math.random().toString(36).substring(2, 8);
  return `audit_${timestamp}_${counter}_${random}`;
}

/**
 * Add an entry to the audit log (write-once, append-only)
 * Throws if localStorage is unavailable or full
 */
export function addAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
  const auditEntry: AuditEntry = {
    ...entry,
    id: generateAuditId(),
    timestamp: new Date().toISOString(),
  };

  try {
    // Get existing audit log
    const stored = localStorage.getItem('fr.audit.log.v1');
    const existingEntries: AuditEntry[] = stored ? JSON.parse(stored) : [];

    // Append new entry (immutable write)
    const updatedLog = [...existingEntries, auditEntry];

    // Store back to localStorage
    localStorage.setItem('fr.audit.log.v1', JSON.stringify(updatedLog));

    return auditEntry;
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('Audit log quota exceeded. Unable to store new entry.', error);
    }
    throw new Error(`Failed to write audit entry: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Retrieve audit trail with optional limit (newest first)
 * Returns frozen (immutable) entries
 */
export function getAuditTrail(limit?: number): AuditEntry[] {
  try {
    const stored = localStorage.getItem('fr.audit.log.v1');
    const entries: AuditEntry[] = stored ? JSON.parse(stored) : [];

    // Return newest first
    let result = entries.reverse();

    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }

    // Freeze each entry to prevent accidental mutations
    return result.map(entry => Object.freeze(entry));
  } catch (error) {
    console.error('Failed to retrieve audit trail:', error);
    return [];
  }
}

/**
 * Export audit log as JSON for compliance/archival
 */
export function exportAuditLog(): string {
  try {
    const stored = localStorage.getItem('fr.audit.log.v1');
    const entries: AuditEntry[] = stored ? JSON.parse(stored) : [];

    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        totalEntries: entries.length,
        entries,
      },
      null,
      2
    );
  } catch (error) {
    console.error('Failed to export audit log:', error);
    return '';
  }
}

/**
 * Search audit log by action, user, or finding ID
 * Returns results in reverse chronological order (newest first)
 */
export function searchAuditLog(query: {
  action?: string;
  user?: string;
  findingId?: string;
  assetId?: string;
  startDate?: string; // ISO8601
  endDate?: string; // ISO8601
  limit?: number;
}): AuditEntry[] {
  try {
    const stored = localStorage.getItem('fr.audit.log.v1');
    let entries: AuditEntry[] = stored ? JSON.parse(stored) : [];

    // Filter by action (exact match)
    if (query.action) {
      entries = entries.filter(e => e.action === query.action);
    }

    // Filter by user (case-insensitive partial match)
    if (query.user) {
      const userLower = query.user.toLowerCase();
      entries = entries.filter(e => e.user.toLowerCase().includes(userLower));
    }

    // Filter by finding ID (for single or bulk operations)
    if (query.findingId) {
      entries = entries.filter(
        e => e.findingId === query.findingId || (e.findingIds && e.findingIds.includes(query.findingId))
      );
    }

    // Filter by asset ID
    if (query.assetId) {
      entries = entries.filter(e => e.assetId === query.assetId);
    }

    // Filter by date range
    if (query.startDate) {
      const startTime = new Date(query.startDate).getTime();
      entries = entries.filter(e => new Date(e.timestamp).getTime() >= startTime);
    }

    if (query.endDate) {
      const endTime = new Date(query.endDate).getTime();
      entries = entries.filter(e => new Date(e.timestamp).getTime() <= endTime);
    }

    // Return newest first
    let result = entries.reverse();

    if (query.limit && query.limit > 0) {
      result = result.slice(0, query.limit);
    }

    // Freeze each entry
    return result.map(entry => Object.freeze(entry));
  } catch (error) {
    console.error('Failed to search audit log:', error);
    return [];
  }
}

/**
 * Clear all audit logs (dangerous - use sparingly)
 * Requires explicit confirmation via parameter
 */
export function clearAuditLog(confirmed: boolean = false): boolean {
  if (!confirmed) {
    console.warn('clearAuditLog requires explicit confirmation. Pass true to proceed.');
    return false;
  }

  try {
    localStorage.removeItem('fr.audit.log.v1');
    return true;
  } catch (error) {
    console.error('Failed to clear audit log:', error);
    return false;
  }
}

/**
 * Get statistics about the audit log
 */
export function getAuditLogStats(): {
  totalEntries: number;
  actionCounts: Record<string, number>;
  userCounts: Record<string, number>;
  dateRange: { earliest: string | null; latest: string | null };
} {
  try {
    const stored = localStorage.getItem('fr.audit.log.v1');
    const entries: AuditEntry[] = stored ? JSON.parse(stored) : [];

    const actionCounts: Record<string, number> = {};
    const userCounts: Record<string, number> = {};
    let earliest: string | null = null;
    let latest: string | null = null;

    entries.forEach(entry => {
      // Count actions
      actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1;

      // Count users
      userCounts[entry.user] = (userCounts[entry.user] || 0) + 1;

      // Track date range
      if (!earliest || entry.timestamp < earliest) {
        earliest = entry.timestamp;
      }
      if (!latest || entry.timestamp > latest) {
        latest = entry.timestamp;
      }
    });

    return {
      totalEntries: entries.length,
      actionCounts,
      userCounts,
      dateRange: { earliest, latest },
    };
  } catch (error) {
    console.error('Failed to get audit log stats:', error);
    return {
      totalEntries: 0,
      actionCounts: {},
      userCounts: {},
      dateRange: { earliest: null, latest: null },
    };
  }
}
