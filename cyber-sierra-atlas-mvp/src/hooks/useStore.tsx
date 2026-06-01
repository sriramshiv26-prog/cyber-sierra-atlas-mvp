import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Store, Finding, Asset } from '../lib/schema';
import { mergeDuplicates, confirmUnique, unmarkDuplicate, detectDuplicates } from '../lib/dedup-rules';
import { addAuditEntry } from '../lib/audit-log';
import { CapaWorkflow, ApprovalRole, EvidenceItem } from '../types/capa';

type StoreAction =
  | { type: 'ADD_FINDINGS'; payload: Finding[] }
  | { type: 'UPDATE_FINDING'; payload: Finding }
  | { type: 'DELETE_FINDING'; payload: string }
  | { type: 'ADD_ASSET'; payload: Asset }
  | { type: 'UPDATE_ASSET'; payload: Asset }
  | { type: 'DELETE_ASSET'; payload: string }
  | { type: 'LOAD_FROM_STORAGE'; payload: Store }
  | { type: 'MERGE_DUPLICATES'; payload: { masterId: string; duplicateIds: string[] } }
  | { type: 'CONFIRM_UNIQUE'; payload: string }
  | { type: 'UNMARK_DUPLICATE'; payload: string }
  | { type: 'DETECT_DUPLICATES'; payload?: void }
  | { type: 'UPDATE_REMEDIATION_STATUS'; findingId: string; status: 'open' | 'in_progress' | 'scheduled' | 'closed' }
  | { type: 'UPDATE_REMEDIATION'; payload: { id: string; status?: string; due_date?: string; owner?: string } }
  | { type: 'CREATE_CAPA'; payload: CapaWorkflow }
  | { type: 'UPDATE_CAPA'; payload: { id: string; updates: Partial<CapaWorkflow> } }
  | { type: 'CLOSE_CAPA'; payload: { id: string; closed_at: string } }
  | { type: 'APPROVE_CAPA'; payload: { id: string; role: ApprovalRole; user: string } }
  | { type: 'UNLINK_CAPA'; payload: { capa_id: string } }
  | { type: 'ADD_EVIDENCE'; payload: { capa_id: string; evidence: EvidenceItem } };

const StoreContext = createContext<{
  store: Store;
  dispatch: React.Dispatch<StoreAction>;
} | null>(null);

const initialStore: Store = {
  findings: [],
  assets: [],
  controls: [],
  lastSaved: new Date().toISOString(),
};

export function storeReducer(state: Store, action: StoreAction): Store {
  switch (action.type) {
    case 'ADD_FINDINGS': {
      const newState = {
        ...state,
        findings: [...state.findings, ...action.payload],
        lastSaved: new Date().toISOString(),
      };

      // Log to audit trail
      try {
        addAuditEntry({
          action: 'ADD_FINDINGS',
          user: 'system', // TODO: Replace with actual user context
          findingIds: action.payload.map(f => f.id),
          reason: 'Bulk import of findings',
          metadata: {
            count: action.payload.length,
          },
        });
      } catch (error) {
        console.error('Failed to log ADD_FINDINGS to audit trail:', error);
      }

      return newState;
    }
    case 'UPDATE_FINDING': {
      const oldFinding = state.findings.find(f => f.id === action.payload.id);
      const newState = {
        ...state,
        findings: state.findings.map(f => f.id === action.payload.id ? action.payload : f),
        lastSaved: new Date().toISOString(),
      };

      // Log to audit trail with before/after comparison
      try {
        const changes: Record<string, { before: unknown; after: unknown }> = {};

        if (oldFinding) {
          // Compare key fields
          const fieldsToTrack = ['severity', 'status', 'remediation_status', 'due_date', 'owner', 'remediation_suggested', 'root_cause'];
          fieldsToTrack.forEach(field => {
            const before = (oldFinding as any)[field];
            const after = (action.payload as any)[field];
            if (before !== after) {
              changes[field] = { before, after };
            }
          });
        }

        addAuditEntry({
          action: 'UPDATE_FINDING',
          user: 'system',
          findingId: action.payload.id,
          changes: Object.keys(changes).length > 0 ? changes : undefined,
          metadata: {
            changedFields: Object.keys(changes),
          },
        });
      } catch (error) {
        console.error('Failed to log UPDATE_FINDING to audit trail:', error);
      }

      return newState;
    }
    case 'DELETE_FINDING': {
      const newState = {
        ...state,
        findings: state.findings.filter(f => f.id !== action.payload),
        lastSaved: new Date().toISOString(),
      };

      // Log to audit trail
      try {
        addAuditEntry({
          action: 'DELETE_FINDING',
          user: 'system',
          findingId: action.payload,
          reason: 'Finding deleted by user',
        });
      } catch (error) {
        console.error('Failed to log DELETE_FINDING to audit trail:', error);
      }

      return newState;
    }
    case 'ADD_ASSET':
      return {
        ...state,
        assets: [...state.assets, action.payload],
        lastSaved: new Date().toISOString(),
      };
    case 'UPDATE_ASSET':
      return {
        ...state,
        assets: state.assets.map(a => a.id === action.payload.id ? action.payload : a),
        lastSaved: new Date().toISOString(),
      };
    case 'DELETE_ASSET':
      return {
        ...state,
        assets: state.assets.filter(a => a.id !== action.payload),
        lastSaved: new Date().toISOString(),
      };
    case 'LOAD_FROM_STORAGE':
      return action.payload || initialStore;
    case 'MERGE_DUPLICATES': {
      const updatedFindings = mergeDuplicates(
        state.findings,
        action.payload.masterId,
        action.payload.duplicateIds
      );
      const newState = {
        ...state,
        findings: updatedFindings,
        lastSaved: new Date().toISOString(),
      };

      // Log to audit trail
      try {
        addAuditEntry({
          action: 'MERGE_DUPLICATES',
          user: 'system',
          findingIds: [action.payload.masterId, ...action.payload.duplicateIds],
          reason: 'Merged duplicate findings into master',
          metadata: {
            masterId: action.payload.masterId,
            duplicateIds: action.payload.duplicateIds,
            count: action.payload.duplicateIds.length,
          },
        });
      } catch (error) {
        console.error('Failed to log MERGE_DUPLICATES to audit trail:', error);
      }

      return newState;
    }
    case 'CONFIRM_UNIQUE': {
      const targetFinding = state.findings.find(f => f.id === action.payload);
      if (!targetFinding) return state;
      const updatedFinding = confirmUnique(targetFinding);
      const newState = {
        ...state,
        findings: state.findings.map(f => f.id === action.payload ? updatedFinding : f),
        lastSaved: new Date().toISOString(),
      };

      // Log to audit trail
      try {
        addAuditEntry({
          action: 'CONFIRM_UNIQUE',
          user: 'system',
          findingId: action.payload,
          reason: 'Finding confirmed as unique (not a duplicate)',
        });
      } catch (error) {
        console.error('Failed to log CONFIRM_UNIQUE to audit trail:', error);
      }

      return newState;
    }
    case 'UNMARK_DUPLICATE': {
      const targetFinding = state.findings.find(f => f.id === action.payload);
      if (!targetFinding) return state;
      const updatedFinding = unmarkDuplicate(targetFinding);
      const newState = {
        ...state,
        findings: state.findings.map(f => f.id === action.payload ? updatedFinding : f),
        lastSaved: new Date().toISOString(),
      };

      // Log to audit trail
      try {
        addAuditEntry({
          action: 'UNMARK_DUPLICATE',
          user: 'system',
          findingId: action.payload,
          reason: 'Removed duplicate marking from finding',
        });
      } catch (error) {
        console.error('Failed to log UNMARK_DUPLICATE to audit trail:', error);
      }

      return newState;
    }
    case 'DETECT_DUPLICATES': {
      const duplicateGroups = detectDuplicates(state.findings);

      // Mark findings as potential duplicates (not confirmed unique yet)
      const updatedFindings = state.findings.map(finding => {
        // Skip if already marked as confirmed unique
        if (finding.is_confirmed_unique === true) return finding;

        // Find which group this finding belongs to
        const groupIndex = duplicateGroups.findIndex(group => group.includes(finding.id));

        if (groupIndex >= 0 && duplicateGroups[groupIndex].length > 1) {
          // This is a potential duplicate (but not yet confirmed/merged)
          return {
            ...finding,
            is_confirmed_unique: finding.is_confirmed_unique === false ? false : undefined,
            flags: {
              ...finding.flags,
              duplicate: true,
            },
          };
        }

        return finding;
      });

      return {
        ...state,
        findings: updatedFindings,
        lastSaved: new Date().toISOString(),
      };
    }
    case 'UPDATE_REMEDIATION_STATUS': {
      const oldFinding = state.findings.find(f => f.id === action.findingId);
      const newFindings = state.findings.map(f =>
        f.id === action.findingId
          ? { ...f, remediation_status: action.status }
          : f
      );
      const newState = {
        ...state,
        findings: newFindings,
        lastSaved: new Date().toISOString(),
      };

      // Log to audit trail
      try {
        addAuditEntry({
          action: 'UPDATE_REMEDIATION_STATUS',
          user: 'system',
          findingId: action.findingId,
          changes: oldFinding ? {
            remediation_status: {
              before: oldFinding.remediation_status,
              after: action.status,
            },
          } : undefined,
          reason: `Remediation status updated to ${action.status}`,
        });
      } catch (error) {
        console.error('Failed to log UPDATE_REMEDIATION_STATUS to audit trail:', error);
      }

      return newState;
    }
    case 'UPDATE_REMEDIATION': {
      const finding = state.findings.find(f => f.id === action.payload.id);
      if (!finding) return state;
      const updated = {
        ...finding,
        remediation_status: action.payload.status !== undefined ? action.payload.status : finding.remediation_status,
        due_date: action.payload.due_date !== undefined ? action.payload.due_date : finding.due_date,
        owner: action.payload.owner !== undefined ? action.payload.owner : finding.owner,
      };
      const newState = {
        ...state,
        findings: state.findings.map(f => f.id === action.payload.id ? updated : f),
        lastSaved: new Date().toISOString(),
      };

      // Log to audit trail with before/after
      try {
        const changes: Record<string, { before: unknown; after: unknown }> = {};

        if (action.payload.status !== undefined && action.payload.status !== finding.remediation_status) {
          changes['remediation_status'] = {
            before: finding.remediation_status,
            after: action.payload.status,
          };
        }

        if (action.payload.due_date !== undefined && action.payload.due_date !== finding.due_date) {
          changes['due_date'] = {
            before: finding.due_date,
            after: action.payload.due_date,
          };
        }

        if (action.payload.owner !== undefined && action.payload.owner !== finding.owner) {
          changes['owner'] = {
            before: finding.owner,
            after: action.payload.owner,
          };
        }

        addAuditEntry({
          action: 'UPDATE_REMEDIATION',
          user: 'system',
          findingId: action.payload.id,
          changes: Object.keys(changes).length > 0 ? changes : undefined,
          metadata: {
            changedFields: Object.keys(changes),
          },
        });
      } catch (error) {
        console.error('Failed to log UPDATE_REMEDIATION to audit trail:', error);
      }

      return newState;
    }
    case 'CREATE_CAPA': {
      const newCapa = {
        ...action.payload,
        audit_trail: [{
          action: 'created',
          user: action.payload.created_by,
          timestamp: new Date().toISOString(),
          details: { status: 'draft' },
          immutable: true as const,
        }],
      };
      return {
        ...state,
        capas: [...(state.capas || []), newCapa],
        lastSaved: new Date().toISOString(),
      };
    }
    case 'UPDATE_CAPA': {
      return {
        ...state,
        capas: (state.capas || []).map(c =>
          c.id === action.payload.id
            ? {
                ...c,
                ...action.payload.updates,
                updated_at: new Date().toISOString(),
                audit_trail: [...c.audit_trail, {
                  action: 'updated',
                  user: 'system',
                  timestamp: new Date().toISOString(),
                  details: action.payload.updates,
                  immutable: true as const,
                }],
              }
            : c
        ),
        lastSaved: new Date().toISOString(),
      };
    }
    case 'CLOSE_CAPA': {
      return {
        ...state,
        capas: (state.capas || []).map(c =>
          c.id === action.payload.id
            ? {
                ...c,
                status: 'closed' as const,
                updated_at: action.payload.closed_at,
                audit_trail: [...c.audit_trail, {
                  action: 'closed',
                  user: 'system',
                  timestamp: action.payload.closed_at,
                  details: { previous_status: c.status },
                  immutable: true as const,
                }],
              }
            : c
        ),
        lastSaved: new Date().toISOString(),
      };
    }
    case 'APPROVE_CAPA': {
      return {
        ...state,
        capas: (state.capas || []).map(c =>
          c.id === action.payload.id
            ? {
                ...c,
                approvals: c.approvals.map(a =>
                  a.role === action.payload.role
                    ? { ...a, approved: true, timestamp: new Date().toISOString(), user: action.payload.user }
                    : a
                ),
                audit_trail: [...c.audit_trail, {
                  action: 'approved',
                  user: action.payload.user,
                  timestamp: new Date().toISOString(),
                  details: { role: action.payload.role },
                  immutable: true as const,
                }],
              }
            : c
        ),
        lastSaved: new Date().toISOString(),
      };
    }
    case 'UNLINK_CAPA': {
      return {
        ...state,
        findings: (state.findings || []).map(f =>
          (f as any).capa_id === action.payload.capa_id
            ? { ...f, capa_id: undefined }
            : f
        ),
        lastSaved: new Date().toISOString(),
      };
    }
    case 'ADD_EVIDENCE': {
      return {
        ...state,
        capas: (state.capas || []).map(c =>
          c.id === action.payload.capa_id
            ? {
                ...c,
                evidence_checklist: [...c.evidence_checklist, action.payload.evidence],
                audit_trail: [...c.audit_trail, {
                  action: 'evidence_added',
                  user: 'system',
                  timestamp: new Date().toISOString(),
                  details: { item: action.payload.evidence.item },
                  immutable: true as const,
                }],
              }
            : c
        ),
        lastSaved: new Date().toISOString(),
      };
    }
    default:
      return state;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, dispatch] = useReducer(storeReducer, initialStore);

  useEffect(() => {
    const saved = localStorage.getItem('fr.store.v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsed });
      } catch (e) {
        console.error('Failed to load store:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fr.store.v3', JSON.stringify(store));
  }, [store]);

  return (
    <StoreContext.Provider value={{ store, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }

  const mergeDuplicateFinding = (masterId: string, duplicateIds: string[]) => {
    context.dispatch({
      type: 'MERGE_DUPLICATES',
      payload: { masterId, duplicateIds },
    });
  };

  const confirmFindingUnique = (findingId: string) => {
    context.dispatch({
      type: 'CONFIRM_UNIQUE',
      payload: findingId,
    });
  };

  const unmarkDuplicateFinding = (findingId: string) => {
    context.dispatch({
      type: 'UNMARK_DUPLICATE',
      payload: findingId,
    });
  };

  const detectDuplicatesAction = () => {
    context.dispatch({
      type: 'DETECT_DUPLICATES',
    });
  };

  const updateRemediationStatus = (findingId: string, status: 'open' | 'in_progress' | 'scheduled' | 'closed') => {
    context.dispatch({
      type: 'UPDATE_REMEDIATION_STATUS',
      findingId,
      status,
    });
  };

  return {
    ...context,
    mergeDuplicateFinding,
    confirmFindingUnique,
    unmarkDuplicateFinding,
    detectDuplicatesAction,
    updateRemediationStatus,
  };
}
