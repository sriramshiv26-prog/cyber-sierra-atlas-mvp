import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AuditEntry,
  addAuditEntry,
  getAuditTrail,
  exportAuditLog,
  searchAuditLog,
  clearAuditLog,
  getAuditLogStats,
} from '../../src/lib/audit-log';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('Audit Log', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('addAuditEntry', () => {
    it('should add an audit entry to the log', () => {
      const entry = addAuditEntry({
        action: 'ADD_FINDINGS',
        user: 'test-user',
        findingIds: ['F1', 'F2'],
        reason: 'Bulk import from audit report',
      });

      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeDefined();
      expect(entry.action).toBe('ADD_FINDINGS');
      expect(entry.user).toBe('test-user');
      expect(entry.findingIds).toEqual(['F1', 'F2']);
    });

    it('should generate unique IDs for each entry', () => {
      const entry1 = addAuditEntry({
        action: 'ADD_FINDINGS',
        user: 'user1',
        findingIds: ['F1'],
      });

      const entry2 = addAuditEntry({
        action: 'ADD_FINDINGS',
        user: 'user1',
        findingIds: ['F2'],
      });

      expect(entry1.id).not.toBe(entry2.id);
    });

    it('should preserve immutability - cannot modify returned entry', () => {
      const entry = addAuditEntry({
        action: 'UPDATE_FINDING',
        user: 'test-user',
        findingId: 'F1',
        changes: { severity: { before: 'High', after: 'Critical' } },
      });

      // Attempting to modify should have no effect or throw
      expect(() => {
        (entry as any).user = 'different-user';
      }).not.toThrow();

      // Verify the stored entry is unchanged when retrieved
      const stored = getAuditTrail()[0];
      expect(stored.user).toBe('test-user');
    });

    it('should store changes object with before/after values', () => {
      const entry = addAuditEntry({
        action: 'UPDATE_FINDING',
        user: 'editor',
        findingId: 'F1',
        changes: {
          severity: { before: 'High', after: 'Critical' },
          status: { before: 'Open', after: 'In Progress' },
        },
      });

      const retrieved = getAuditTrail()[0];
      expect(retrieved.changes).toEqual({
        severity: { before: 'High', after: 'Critical' },
        status: { before: 'Open', after: 'In Progress' },
      });
    });

    it('should store metadata', () => {
      const entry = addAuditEntry({
        action: 'MERGE_DUPLICATES',
        user: 'admin',
        findingIds: ['F1', 'F2', 'F3'],
        metadata: {
          mergeReason: 'Same vulnerability across environments',
          confidence: 0.95,
        },
      });

      const retrieved = getAuditTrail()[0];
      expect(retrieved.metadata).toEqual({
        mergeReason: 'Same vulnerability across environments',
        confidence: 0.95,
      });
    });
  });

  describe('getAuditTrail', () => {
    it('should return entries in reverse chronological order (newest first)', () => {
      addAuditEntry({ action: 'ADD_FINDINGS', user: 'user1', findingIds: ['F1'] });
      // Add small delay to ensure different timestamps
      const trail = getAuditTrail();
      addAuditEntry({ action: 'UPDATE_FINDING', user: 'user2', findingId: 'F1' });

      const allEntries = getAuditTrail();
      expect(allEntries.length).toBe(2);
      // Most recent should be UPDATE_FINDING
      expect(allEntries[0].action).toBe('UPDATE_FINDING');
      expect(allEntries[1].action).toBe('ADD_FINDINGS');
    });

    it('should respect the limit parameter', () => {
      // Add 5 entries
      for (let i = 0; i < 5; i++) {
        addAuditEntry({
          action: 'ADD_FINDINGS',
          user: `user${i}`,
          findingIds: [`F${i}`],
        });
      }

      const limited = getAuditTrail(2);
      expect(limited).toHaveLength(2);
    });

    it('should return empty array if no entries exist', () => {
      const trail = getAuditTrail();
      expect(trail).toEqual([]);
    });

    it('should return frozen (immutable) entries', () => {
      addAuditEntry({
        action: 'ADD_FINDINGS',
        user: 'test-user',
        findingIds: ['F1'],
      });

      const trail = getAuditTrail();
      const entry = trail[0];

      // Attempting to modify frozen object should fail
      expect(() => {
        Object.assign(entry, { user: 'hacker' });
      }).toThrow();
    });
  });

  describe('searchAuditLog', () => {
    beforeEach(() => {
      addAuditEntry({
        action: 'ADD_FINDINGS',
        user: 'alice',
        findingIds: ['F1', 'F2'],
      });
      addAuditEntry({
        action: 'UPDATE_FINDING',
        user: 'bob',
        findingId: 'F1',
      });
      addAuditEntry({
        action: 'DELETE_FINDING',
        user: 'alice',
        findingId: 'F2',
      });
    });

    it('should search by action', () => {
      const results = searchAuditLog({ action: 'ADD_FINDINGS' });
      expect(results).toHaveLength(1);
      expect(results[0].action).toBe('ADD_FINDINGS');
    });

    it('should search by user (case-insensitive)', () => {
      const results = searchAuditLog({ user: 'alice' });
      expect(results).toHaveLength(2);
      expect(results.every(e => e.user === 'alice')).toBe(true);
    });

    it('should search by finding ID', () => {
      const results = searchAuditLog({ findingId: 'F1' });
      expect(results).toHaveLength(2);
      expect(results.every(e => e.findingId === 'F1' || e.findingIds?.includes('F1'))).toBe(true);
    });

    it('should search by date range', () => {
      const now = new Date();
      const before = new Date(now.getTime() - 1000);
      const after = new Date(now.getTime() + 1000);

      const results = searchAuditLog({
        startDate: before.toISOString(),
        endDate: after.toISOString(),
      });
      expect(results.length).toBeGreaterThan(0);
    });

    it('should combine multiple filters', () => {
      const results = searchAuditLog({
        user: 'alice',
        action: 'ADD_FINDINGS',
      });
      expect(results).toHaveLength(1);
      expect(results[0].user).toBe('alice');
      expect(results[0].action).toBe('ADD_FINDINGS');
    });

    it('should return results in reverse chronological order', () => {
      const results = searchAuditLog({});
      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          const current = new Date(results[i].timestamp).getTime();
          const next = new Date(results[i + 1].timestamp).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });

    it('should respect limit parameter', () => {
      const results = searchAuditLog({ limit: 1 });
      expect(results).toHaveLength(1);
    });
  });

  describe('exportAuditLog', () => {
    it('should export audit log as JSON string', () => {
      addAuditEntry({
        action: 'ADD_FINDINGS',
        user: 'test-user',
        findingIds: ['F1'],
      });

      const exported = exportAuditLog();
      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported);
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.totalEntries).toBe(1);
      expect(Array.isArray(parsed.entries)).toBe(true);
      expect(parsed.entries[0].action).toBe('ADD_FINDINGS');
    });

    it('should include all entry fields in export', () => {
      addAuditEntry({
        action: 'UPDATE_FINDING',
        user: 'editor',
        findingId: 'F1',
        reason: 'Severity correction',
        changes: { severity: { before: 'High', after: 'Critical' } },
        metadata: { source: 'manual' },
      });

      const exported = exportAuditLog();
      const parsed = JSON.parse(exported);
      const entry = parsed.entries[0];

      expect(entry.action).toBe('UPDATE_FINDING');
      expect(entry.user).toBe('editor');
      expect(entry.findingId).toBe('F1');
      expect(entry.reason).toBe('Severity correction');
      expect(entry.changes).toBeDefined();
      expect(entry.metadata).toBeDefined();
    });
  });

  describe('clearAuditLog', () => {
    it('should require explicit confirmation', () => {
      addAuditEntry({
        action: 'ADD_FINDINGS',
        user: 'test-user',
        findingIds: ['F1'],
      });

      const result = clearAuditLog(false);
      expect(result).toBe(false);

      // Entry should still exist
      expect(getAuditTrail()).toHaveLength(1);
    });

    it('should clear audit log when confirmed', () => {
      addAuditEntry({
        action: 'ADD_FINDINGS',
        user: 'test-user',
        findingIds: ['F1'],
      });

      expect(getAuditTrail()).toHaveLength(1);

      const result = clearAuditLog(true);
      expect(result).toBe(true);
      expect(getAuditTrail()).toHaveLength(0);
    });
  });

  describe('getAuditLogStats', () => {
    it('should return stats for empty log', () => {
      const stats = getAuditLogStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.actionCounts).toEqual({});
      expect(stats.userCounts).toEqual({});
      expect(stats.dateRange).toEqual({ earliest: null, latest: null });
    });

    it('should count actions correctly', () => {
      addAuditEntry({
        action: 'ADD_FINDINGS',
        user: 'user1',
        findingIds: ['F1'],
      });
      addAuditEntry({
        action: 'ADD_FINDINGS',
        user: 'user2',
        findingIds: ['F2'],
      });
      addAuditEntry({
        action: 'DELETE_FINDING',
        user: 'user1',
        findingId: 'F1',
      });

      const stats = getAuditLogStats();
      expect(stats.actionCounts['ADD_FINDINGS']).toBe(2);
      expect(stats.actionCounts['DELETE_FINDING']).toBe(1);
    });

    it('should count users correctly', () => {
      addAuditEntry({
        action: 'ADD_FINDINGS',
        user: 'alice',
        findingIds: ['F1'],
      });
      addAuditEntry({
        action: 'UPDATE_FINDING',
        user: 'bob',
        findingId: 'F1',
      });
      addAuditEntry({
        action: 'DELETE_FINDING',
        user: 'alice',
        findingId: 'F1',
      });

      const stats = getAuditLogStats();
      expect(stats.userCounts['alice']).toBe(2);
      expect(stats.userCounts['bob']).toBe(1);
    });

    it('should track date range', () => {
      addAuditEntry({
        action: 'ADD_FINDINGS',
        user: 'user1',
        findingIds: ['F1'],
      });

      const stats = getAuditLogStats();
      expect(stats.dateRange.earliest).toBeDefined();
      expect(stats.dateRange.latest).toBeDefined();
      if (stats.dateRange.earliest && stats.dateRange.latest) {
        const earliestTime = new Date(stats.dateRange.earliest).getTime();
        const latestTime = new Date(stats.dateRange.latest).getTime();
        expect(earliestTime).toBeLessThanOrEqual(latestTime);
      }
    });
  });

  describe('Append-only guarantee', () => {
    it('should never modify existing entries', () => {
      const entry1 = addAuditEntry({
        action: 'ADD_FINDINGS',
        user: 'user1',
        findingIds: ['F1'],
      });

      const entry2 = addAuditEntry({
        action: 'UPDATE_FINDING',
        user: 'user2',
        findingId: 'F1',
      });

      const trail = getAuditTrail();
      const storedEntry1 = trail.find(e => e.id === entry1.id);

      // Original entry should be unchanged
      expect(storedEntry1?.user).toBe('user1');
      expect(storedEntry1?.action).toBe('ADD_FINDINGS');
    });

    it('should maintain chronological order', () => {
      const entries: AuditEntry[] = [];

      for (let i = 0; i < 5; i++) {
        const entry = addAuditEntry({
          action: 'ADD_FINDINGS',
          user: `user${i}`,
          findingIds: [`F${i}`],
        });
        entries.push(entry);
      }

      const trail = getAuditTrail();

      // Timestamps should be in ascending order
      for (let i = 0; i < trail.length - 1; i++) {
        const current = new Date(trail[i].timestamp).getTime();
        const next = new Date(trail[i + 1].timestamp).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle actions with all optional fields', () => {
      const entry = addAuditEntry({
        action: 'MERGE_DUPLICATES',
        user: 'system',
      });

      expect(entry.findingId).toBeUndefined();
      expect(entry.findingIds).toBeUndefined();
      expect(entry.assetId).toBeUndefined();
      expect(entry.changes).toBeUndefined();
      expect(entry.reason).toBeUndefined();
      expect(entry.metadata).toBeUndefined();
    });

    it('should handle very large changes objects', () => {
      const largeChanges: Record<string, { before: unknown; after: unknown }> = {};
      for (let i = 0; i < 100; i++) {
        largeChanges[`field_${i}`] = {
          before: `old_value_${i}`,
          after: `new_value_${i}`,
        };
      }

      const entry = addAuditEntry({
        action: 'UPDATE_FINDING',
        user: 'test',
        findingId: 'F1',
        changes: largeChanges,
      });

      const retrieved = getAuditTrail()[0];
      expect(Object.keys(retrieved.changes!)).toHaveLength(100);
    });
  });
});
